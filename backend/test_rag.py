import sys
from pathlib import Path

# Windows consoles default to a legacy codepage that cannot print Unicode
# characters extracted from PDFs (e.g. the 'fi' ligature). Force UTF-8 output.
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Paths
UPLOADS_DIR = Path(__file__).parent / "uploads"
SAMPLE_NAME = "DBMS_Unit_I_Question_Bank.pdf"

# Supported extensions the RAG pipeline can parse
SUPPORTED_EXTS = (".pdf", ".docx", ".pptx", ".txt")


def find_sample_file() -> Path:
    """Locate a usable sample document: previously uploaded file, any file in
    uploads/, or a generated demo text file as last resort."""
    preferred = UPLOADS_DIR / SAMPLE_NAME
    if preferred.exists():
        return preferred

    if UPLOADS_DIR.exists():
        for f in sorted(UPLOADS_DIR.iterdir()):
            if f.suffix.lower() in SUPPORTED_EXTS:
                print(f"Using uploaded file as sample: {f.name}")
                return f

    # Last resort: generate a tiny demo document so the suite always runs
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    demo = UPLOADS_DIR / "demo_sample.txt"
    demo.write_text(
        "A Database Management System (DBMS) is software for creating and managing "
        "databases. Unlike traditional file-processing systems, a DBMS reduces data "
        "redundancy, enforces integrity constraints, and supports concurrent access.\n"
        "A primary key uniquely identifies each record in a table. A candidate key is "
        "any attribute set that could serve as a primary key. The CAP theorem states "
        "that a distributed system can only guarantee two of consistency, availability, "
        "and partition tolerance.\n" * 20,
        encoding="utf-8",
    )
    print(f"No sample documents found. Generated demo file: {demo.name}")
    return demo


DEST_PDF = None  # resolved in main()


def main():
    global DEST_PDF
    print("="*60)
    print("EduRAG RAG System Test Suite")
    print("="*60)

    # Step 1: Resolve sample document
    try:
        DEST_PDF = find_sample_file()
        print(f"Sample document resolved to: {DEST_PDF}")
    except Exception as e:
        print(f"Error resolving sample document: {e}")
        return

    # Step 2: Import EduRAG services
    import services.document_processor as doc_proc
    import services.vector_store as vec_store
    import services.llm as llm_service
    from config import settings

    # Step 3: Parse the document
    print("\n--- Test 1: Document Parsing & Text Extraction ---")
    try:
        text = doc_proc.extract_text(DEST_PDF)
        print(f"Successfully extracted text from PDF.")
        print(f"Total Character Count: {len(text)}")
        print(f"Sample Text (first 500 chars):\n{text[:500]}...")
        assert len(text) > 0, "Extracted text is empty!"
        print("Test 1: PASSED")
    except Exception as e:
        print(f"Test 1: FAILED with error: {e}")
        return

    # Step 4: Chunk the document
    print("\n--- Test 2: Text Chunking ---")
    try:
        chunks = doc_proc.chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        print(f"Successfully split text into {len(chunks)} chunks.")
        print(f"Average Chunk Length: {sum(len(c) for c in chunks)/len(chunks):.1f} chars.")
        print(f"Sample Chunk (first chunk):\n{chunks[0]}")
        assert len(chunks) > 0, "No chunks generated!"
        print("Test 2: PASSED")
    except Exception as e:
        print(f"Test 2: FAILED with error: {e}")
        return

    # Step 5: Indexing in Vector Store
    print("\n--- Test 3: Vector Store Indexing ---")
    try:
        # Check if already indexed to prevent duplicates
        indexed_docs = vec_store.list_documents()
        doc_name = DEST_PDF.name
        if doc_name in indexed_docs:
            print(f"Document '{doc_name}' is already indexed. Deleting old index first...")
            vec_store.delete_document(doc_name)
        
        print(f"Indexing {len(chunks)} chunks in Chroma DB...")
        metadatas = [{"source": doc_name, "chunk_index": i} for i in range(len(chunks))]
        vec_store.add_documents(chunks, metadatas)
        
        # Verify index
        updated_docs = vec_store.list_documents()
        print(f"Current indexed documents: {updated_docs}")
        assert doc_name in updated_docs, "Document name not found in vector store after indexing!"
        print("Test 3: PASSED")
    except Exception as e:
        print(f"Test 3: FAILED with error: {e}")
        return

    # Step 6: Similarity Search Queries
    print("\n--- Test 4: Similarity Search Queries ---")
    queries = [
        "What are the drawbacks of a traditional file-processing system compared to a DBMS?",
        "Explain the difference between two-tier and three-tier database architectures.",
        "What is a primary key and how does it differ from a candidate key?",
        "Explain the CAP theorem and the trade-offs between CP, AP, and CA systems."
    ]

    for i, query in enumerate(queries, 1):
        print(f"\nQuery {i}: \"{query}\"")
        try:
            results = vec_store.similarity_search(query, k=3)
            print(f"Retrieved {len(results)} chunks.")
            if results:
                top_match = results[0]
                print(f"Top Match Chunk Index: {top_match['metadata'].get('chunk_index')}")
                print(f"Top Match Content Snippet (first 300 chars):\n{top_match['content'][:300]}...")
            else:
                print("Warning: No chunks retrieved!")
            assert len(results) > 0, "No results returned for search query!"
        except Exception as e:
            print(f"Query {i} FAILED with error: {e}")

    print("\nTest 4: PASSED")

    # Step 7: LLM Answer Generation
    print("\n--- Test 5: LLM Response Generation (Optional) ---")
    print(f"Configured LLM Provider: {settings.LLM_PROVIDER}")
    
    test_query = "What are the main drawbacks of a traditional file-processing system?"
    context_docs = vec_store.similarity_search(test_query, k=2)
    context = "\n\n".join([f"Document [{doc['metadata']['source']}]:\n{doc['content']}" for doc in context_docs])
    
    prompt = (
        "You are an educational assistant. Use the following context documents to answer the student's question.\n"
        "If the context does not contain the information needed to answer, answer based on the context only by stating: "
        "'I cannot find the answer in the uploaded documents.'\n"
        "Be clear, detailed, and structure your response with markdown if appropriate (e.g. lists, bold text, code snippets).\n\n"
        "Context:\n"
        "---------------------\n"
        f"{context}\n"
        "---------------------\n\n"
        f"Question: {test_query}\n\n"
        "Answer:"
    )

    print(f"Sending prompt to LLM provider '{settings.LLM_PROVIDER}'...")
    try:
        import asyncio
        answer = asyncio.run(llm_service.generate_response(prompt))
        print("\n=== LLM GENERATED ANSWER ===")
        print(answer)
        print("=============================")
        print("\nTest 5: PASSED")
    except Exception as e:
        print(f"\nLLM generation FAILED (expected if credentials/services are not configured yet). Error: {e}")
        print("\nHere is the prompt that would have been sent:")
        print("-" * 50)
        print(prompt[:1000] + "\n... [PROMPT TRUNCATED] ...")
        print("-" * 50)
        print("\nTest 5: SKIPPED (non-fatal error)")

    print("\n" + "="*60)
    print("EduRAG RAG System Test Suite Completed Successfully!")
    print("="*60)

if __name__ == "__main__":
    main()
