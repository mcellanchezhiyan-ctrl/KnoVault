# Knovault (EduRAG)

A premium Retrieval-Augmented Generation (RAG) web application for educational contexts. Students and instructors can upload course materials (PDF, DOCX, PPTX, TXT) and interact with an AI study assistant that answers questions strictly from the uploaded documents, with inline source citations.

## Features

- **Document Upload & Indexing** — Drag-and-drop upload with automatic text extraction, chunking, and embedding into a Chroma vector database
- **Grounded Q&A** — Similarity search retrieves the most relevant chunks; an LLM synthesizes factual, markdown-formatted answers
- **Source Citations** — Every answer lists the source document and chunk references used
- **Multi-Provider LLM Support** — HuggingFace Inference API (default), Google Gemini, OpenAI, or local Ollama
- **Unified Workspace UI** — React 19 + Vite + Tailwind CSS v4 interface combining document management and chat

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, Pydantic Settings, Uvicorn |
| RAG Pipeline | LangChain, RecursiveCharacterTextSplitter, Sentence-Transformers (`BAAI/bge-small-en-v1.5`) |
| Vector Store | ChromaDB (persistent, local) |
| LLM Providers | HuggingFace Hub / Google Generative AI / OpenAI / Ollama |
| Frontend | React 19, Vite, Tailwind CSS v4, Lucide icons, react-markdown |

## Project Structure

```
EduRAG/
├── backend/
│   ├── main.py                  # FastAPI app entry point + CORS
│   ├── config.py                # Pydantic settings loaded from .env
│   ├── api/routes.py            # REST endpoints (/upload, /documents, /ask)
│   ├── services/
│   │   ├── document_processor.py # PDF/DOCX/PPTX/TXT extraction + chunking
│   │   ├── vector_store.py       # Chroma wrapper (embeddings, add/search/delete)
│   │   └── llm.py                # Async multi-provider LLM client
│   ├── test_rag.py              # End-to-end test suite for the RAG pipeline
│   └── requirements.txt
└── frontend/
    ├── src/pages/               # UnifiedWorkspace (upload + chat UI)
    ├── src/services/api.js      # Axios API client
    └── vite.config.js           # Dev proxy /api -> localhost:8000
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend Setup

```powershell
cd EduRAG/backend
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows (use source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
```

Create your environment config:

```powershell
cp .env.example .env
```

Then edit `.env` and configure a provider (HuggingFace shown; free tier works):

```env
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_your_key_here
```

> Get a free key at https://huggingface.co/settings/tokens. For Gemini/OpenAI/Ollama options, see the comments in `.env.example`.

Start the API server:

```powershell
uvicorn main:app --reload --port 8000
```

API docs are available at http://localhost:8000/docs

### 2. Frontend Setup

```powershell
cd EduRAG/frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload & index a document (multipart form, field `file`) |
| GET | `/api/documents` | List indexed document filenames |
| DELETE | `/api/documents/{filename}` | Remove a document and its embeddings |
| POST | `/api/ask` | Ask a question (`{"question": "..."}`), returns answer + sources |
| GET | `/health` | Service health check |

## Running Tests

```powershell
cd EduRAG/backend
.\venv\Scripts\Activate.ps1
python test_rag.py
```

Runs the full pipeline: text extraction, chunking, vector indexing, similarity search, and LLM generation.

## Security Notes

- `.env` is gitignored — never commit API keys
- Uploaded files and the vector DB live in `backend/uploads/` and `backend/vector_db/` (gitignored, regenerated at runtime)

## Roadmap

- [ ] User authentication & per-user document spaces
- [ ] Hybrid search (vector + BM25) with cross-encoder reranking
- [ ] Chat history context for follow-up questions
- [ ] Light/dark mode
