from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "knovault"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Embedding model
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # Vector DB
    CHROMA_PERSIST_DIR: str = str(Path(__file__).parent / "vector_db")
    CHROMA_COLLECTION_NAME: str = "edurag_documents"

    # LLM Provider (ollama | openai | gemini | huggingface)
    LLM_PROVIDER: str = "huggingface"

    # Ollama settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    # OpenAI settings
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    # Gemini settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # HuggingFace settings
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_MODEL: str = "Qwen/Qwen3-4B-Instruct-2507"

    # Upload settings
    UPLOAD_DIR: str = str(Path(__file__).parent / "uploads")
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list = [".pdf", ".ppt", ".pptx", ".doc", ".docx", ".txt"]

    # Chunking settings
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # RAG settings
    TOP_K_RESULTS: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
