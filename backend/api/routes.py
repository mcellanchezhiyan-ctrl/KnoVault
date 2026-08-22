import os
import asyncio
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from config import settings
import services.document_processor as document_processor
import services.vector_store as vector_store
import services.llm as llm

router = APIRouter(prefix="/api")


class QuestionRequest(BaseModel):
    question: str


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # 1. Validate file extension
    suffix = Path(file.filename).suffix.lower()
    if suffix not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension {suffix} not allowed. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # 2. Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = Path(settings.UPLOAD_DIR) / file.filename
    
    # 3. Save file locally
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # 4. Extract and split text (offloaded to threadpool to avoid blocking main event loop)
    try:
        text = await asyncio.to_thread(document_processor.extract_text, file_path)
        if not text or not text.strip():
            # Clean up empty file
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail="Uploaded file contains no readable text.")
            
        chunks = await asyncio.to_thread(
            document_processor.chunk_text, text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP
        )
        
        # Prepare metadata for each chunk
        metadatas = [{"source": file.filename, "chunk_index": i} for i in range(len(chunks))]
        
        # 5. Add to vector store (batched & multi-threaded)
        await asyncio.to_thread(vector_store.add_documents, chunks, metadatas)
        
        return {
            "filename": file.filename,
            "size_bytes": len(content),
            "chunks_count": len(chunks),
            "status": "success",
            "message": f"Successfully indexed {len(chunks)} chunks from {file.filename}."
        }
    except ValueError as ve:
        # Clean up file on parse failure
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Clean up file on general failure
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error indexing document: {str(e)}")


@router.get("/documents")
async def get_documents():
    """Retrieve all unique document filenames indexed in the vector store."""
    docs = vector_store.list_documents()
    return {"documents": docs}


@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    """Remove a document from the vector store and delete its local file."""
    # 1. Delete from vector store
    try:
        vector_store.delete_document(filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete index: {str(e)}")
    
    # 2. Delete local file if it exists
    file_path = Path(settings.UPLOAD_DIR) / filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            # Document index is deleted, but filesystem file delete failed (warning only)
            print(f"Warning: Failed to delete local file {file_path}: {e}")
            
    return {"status": "success", "message": f"Document '{filename}' deleted successfully."}


@router.post("/ask")
async def ask_question(request: QuestionRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    # 1. Similarity search in Chroma
    try:
        retrieved_docs = vector_store.similarity_search(question, k=settings.TOP_K_RESULTS)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector store search failed: {str(e)}")
    
    # 2. Format context
    context = ""
    sources = []
    
    if retrieved_docs:
        for idx, doc in enumerate(retrieved_docs):
            src_name = doc["metadata"].get("source", "Unknown Document")
            doc_content = doc["content"]
            context += f"Document [{src_name}]:\n{doc_content}\n\n"
            sources.append({
                "source": src_name,
                "content": doc_content,
                "chunk_index": doc["metadata"].get("chunk_index", 0)
            })
    else:
        context = "No relevant context found in database."
    
    # 3. Create context-rich prompt
    prompt = (
        "You are an educational assistant. Use the following context documents to answer the student's question.\n"
        "If the context does not contain the information needed to answer, answer based on the context only by stating: "
        "'I cannot find the answer in the uploaded documents.'\n"
        "Be clear, detailed, and structure your response with markdown if appropriate (e.g. lists, bold text, code snippets).\n\n"
        "Context:\n"
        "---------------------\n"
        f"{context}\n"
        "---------------------\n\n"
        f"Question: {question}\n\n"
        "Answer:"
    )
    
    # 4. Query LLM
    try:
        answer = await llm.generate_response(prompt)
        return {
            "answer": answer,
            "sources": sources
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")
