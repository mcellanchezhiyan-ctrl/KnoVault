import os
from pathlib import Path
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from config import settings

# Initialize HuggingFace embeddings with batching optimization
embeddings = HuggingFaceEmbeddings(
    model_name=settings.EMBEDDING_MODEL,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={
        'normalize_embeddings': True,
        'batch_size': 64  # Process embedding batches for significantly faster throughput
    }
)

# Initialize Chroma vector store
vector_store = Chroma(
    persist_directory=settings.CHROMA_PERSIST_DIR,
    embedding_function=embeddings,
    collection_name=settings.CHROMA_COLLECTION_NAME
)


def add_documents(texts: list[str], metadatas: list[dict], batch_size: int = 64) -> None:
    """Add texts and metadatas to Chroma vector database using batched processing for maximum efficiency."""
    if not texts:
        return

    # Process additions in batches to minimize memory overhead and optimize embedding speed
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_metadatas = metadatas[i:i + batch_size]
        vector_store.add_texts(texts=batch_texts, metadatas=batch_metadatas)


def similarity_search(query: str, k: int = 5) -> list[dict]:
    """Search for similar text chunks and return them with metadata."""
    docs = vector_store.similarity_search(query, k=k)
    return [
        {
            "content": doc.page_content,
            "metadata": doc.metadata
        }
        for doc in docs
    ]


def list_documents() -> list[str]:
    """List unique source filenames currently indexed in the vector store."""
    try:
        data = vector_store._collection.get(include=["metadatas"])
        if not data or not data.get("metadatas"):
            return []

        sources = set()
        for meta in data["metadatas"]:
            if meta and "source" in meta:
                sources.add(meta["source"])
        return sorted(list(sources))
    except Exception as e:
        print(f"Error listing documents from vector store: {e}")
        return []


def delete_document(filename: str) -> None:
    """Delete all chunks belonging to a given source filename from the vector store."""
    try:
        vector_store._collection.delete(where={"source": filename})
    except Exception as e:
        raise RuntimeError(f"Failed to delete document '{filename}' from vector store: {e}")
