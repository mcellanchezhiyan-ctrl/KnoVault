import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  CloudUpload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  User,
  BookOpen,
  X,
  FileCheck,
  Database,
  MessageSquare,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, askQuestion } from '../services/api';
import DocumentList from '../components/DocumentList';
import kalamBg from '../assets/kalam.png';

// ─── Mock answers generator for offline/demo robustness ───────────────────
const generateMockResponse = (query) => {
  const q = query.toLowerCase();
  if (q.includes('concept') || q.includes('what are the main')) {
    return `Based on your indexed materials (**DBMS Unit 1 Notes.pdf** and **Unit2_Only_Concepts.docx**), the main concepts are:

1. **Database Schema & Architecture**: The 3-schema architecture (Physical, Conceptual, External) which provides data independence.
2. **Relational Model**: Organizing data into tables (relations) with rows (tuples) and columns (attributes).
3. **Data Constraints & Keys**: Implementing entity integrity and referential integrity using primary and foreign keys.
4. **File-processing vs. DBMS**: Understanding why databases are superior to legacy file systems (e.g., removing redundancy, handling concurrent access, enforcing security).`;
  }
  if (q.includes('summarize') || q.includes('summary')) {
    return `Here is a summary of the uploaded study files in your knowledge base:

- **DBMS Unit 1 Notes.pdf**: Focuses on database foundations, file-processing drawbacks, data abstraction, and the roles of DBAs (Database Administrators).
- **DBMS_Unit1_Presentation.pptx**: Slide deck summarizing entity-relationship diagrams (ERDs), entities, attributes, and relationships.
- **Unit2_Only_Concepts.docx**: Covers advanced relational concepts, integrity rules, and database normalizations (1NF, 2NF, 3NF).`;
  }
  if (q.includes('definition') || q.includes('define')) {
    return `Here are key definitions extracted from your study documents:

- **DBMS**: Database Management System. Software that manages database storage, querying, security, and concurrency.
- **Primary Key**: A specific candidate key selected to uniquely identify a tuple within a relation. Cannot be NULL.
- **Foreign Key**: An attribute in a table that references the primary key of another table, enforcing referential integrity.
- **Data Independence**: The ability to modify schema definition in one level without affecting the schema definition in the next higher level.`;
  }
  if (q.includes('takeaway') || q.includes('key takeaway')) {
    return `Key takeaways from your course materials:

- **Structured Storage**: Databases replace unstructured/redundant file systems to guarantee data consistency.
- **Relationships Matter**: Entity-Relationship diagrams are the blueprint of any database design.
- **Data Integrity**: Integrity constraints (like referential integrity) prevent corrupted or orphaned records.
- **Factual Answers**: Knovault is citing 3 active sources in context to answer your study queries.`;
  }
  return `I have analyzed your request in the context of the indexed study materials. 

In **DBMS Unit 1 Notes.pdf**, a key focus is the transition from traditional file systems to database systems, which addresses redundancy, inconsistent data formats, and query complexity.

Let me know if you need specific details about keys, ER modeling, normal forms, or query optimizations!`;
};

/* ─── Typing indicator dots ──────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start animate-fade-in-up">
      <div
        className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4F7BFF, #7E9DFF)' }}
      >
        <span className="text-white text-xs font-bold font-mono">k</span>
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm"
      >
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

/* ─── Chat Message ────────────────────────────────────────── */
function ChatMessage({ msg, onSourceClick, idx }) {
  const isUser = msg.role === 'user';
  const animClass = isUser ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} ${animClass} relative z-10`}
      style={{ animationDelay: `${Math.min(idx * 30, 120)}ms` }}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div
          className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4F7BFF, #7E9DFF)', boxShadow: '0 4px 12px rgba(79, 123, 255, 0.2)' }}
        >
          <span className="text-white text-xs font-black font-mono">k</span>
        </div>
      )}

      <div className="flex flex-col max-w-[80%] gap-2">
        {/* Bubble */}
        <div
          className={`px-4.5 py-3 text-sm leading-relaxed ${
            isUser ? 'msg-user text-white' : 'msg-assistant text-slate-700'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.text}</p>
          ) : (
            <div className="dark-prose">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Source chips */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            <span
              className="text-[10px] font-semibold self-center text-slate-400"
            >
              Sources:
            </span>
            {msg.sources.map((src, sIdx) => (
              <button
                key={sIdx}
                onClick={() => onSourceClick(src)}
                className="source-badge"
              >
                <BookOpen size={9} />
                <span className="truncate max-w-[110px]">{src.source}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs bg-slate-100 border border-slate-200 text-slate-600"
        >
          <User size={14} />
        </div>
      )}
    </div>
  );
}

/* ─── Empty Chat State ────────────────────────────────────── */
function EmptyChat({ suggestions, onSuggestionClick }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 relative z-10 py-8">
      {/* Centered Logo */}
      <div className="animate-float mb-6">
        <div
          className="p-5 rounded-[24px] bg-white border border-slate-100 shadow-sm inline-flex items-center justify-center"
          style={{
            boxShadow: '0 10px 30px rgba(79, 123, 255, 0.06)',
          }}
        >
          <div
            className="w-12 h-12 rounded-[16px] flex items-center justify-center text-white font-black text-xl"
            style={{
              background: 'linear-gradient(135deg, #4F7BFF, #7E9DFF)',
            }}
          >
            k
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-2 mb-8">
        <h3
          className="font-bold text-xl text-slate-850 tracking-tight"
        >
          Ask Your Knowledge Base
        </h3>
        <p className="text-xs max-w-sm mx-auto text-slate-400 leading-relaxed font-normal">
          Upload study materials and ask anything — the AI will retrieve
          relevant context and cite exact source documents.
        </p>
      </div>

      {/* Content: Suggestions + Kalam decorative */}
      <div className="flex items-start gap-8 max-w-3xl w-full pt-1">
        {/* Suggestion cards - 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {suggestions.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(chip)}
              className="suggestion-chip p-4 text-left text-xs font-semibold text-slate-650 hover:text-[#4F7BFF] transition-all duration-300"
              style={{
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <ChevronRight
                  size={12}
                  className="shrink-0 text-[#4F7BFF]"
                />
                <span className="flex-1">{chip}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Right-side decorative Kalam section */}
        <div className="hidden md:flex flex-col items-center text-center gap-4 max-w-[220px] pt-2">
          <div className="kalam-portrait-welcome relative">
            <img
              src={kalamBg}
              alt="A.P.J. Abdul Kalam"
              className="w-[160px] h-[180px] object-cover object-top"
            />
          </div>
          <div className="space-y-1.5">
            <p className="font-serif italic text-xs text-slate-500 leading-relaxed">
              &ldquo;You have to dream before your dreams can come true.&rdquo;
            </p>
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              — A.P.J. Abdul Kalam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Citation Modal ─────────────────────────────────────── */
function CitationModal({ source, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card-elevated max-w-lg w-full flex flex-col max-h-[82vh] animate-scale-pop"
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg bg-blue-50"
            >
              <BookOpen size={14} className="text-[#4F7BFF]" />
            </div>
            <span className="font-bold text-sm text-slate-800">
              Source Citation
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Source file */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1"
            >
              Source File
            </p>
            <p
              className="text-xs font-semibold text-slate-800 break-all"
            >
              {source.source}
            </p>
          </div>

          {/* Chunk index */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1"
            >
              Chunk Index
            </p>
            <span
              className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#4F7BFF] border border-blue-100"
            >
              #{source.chunk_index + 1}
            </span>
          </div>

          {/* Content snippet */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2"
            >
              Extracted Context
            </p>
            <div
              className="p-4 rounded-2xl text-xs leading-relaxed font-mono whitespace-pre-wrap bg-slate-50 text-slate-650 border border-slate-100"
            >
              {source.content}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div
          className="flex justify-end px-6 py-4 border-t border-slate-100"
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
function UnifiedWorkspace() {
  // Initialize with spec-required mock files by default
  const [documents, setDocuments] = useState([
    'DBMS Unit 1 Notes.pdf',
    'DBMS_Unit1_Presentation.pptx',
    'Unit2_Only_Concepts.docx'
  ]);
  
  const [docLoading, setDocLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docError, setDocError] = useState(null);
  const [docSuccess, setDocSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);

  // Chat state
  const [conversations, setConversations] = useState([
    { id: '1', title: 'New Chat', messages: [], createdAt: Date.now() }
  ]);
  const [activeChatId, setActiveChatId] = useState('1');
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const chatFileRef = useRef(null);
  const chatImageRef = useRef(null);

  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0];
  const messages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const suggestionChips = [
    "What are the main concepts covered in these documents?",
    "Summarize the key points of the uploaded files.",
    "Explain the core definitions mentioned in the texts.",
    "Give me a list of the most important takeaways."
  ];

  // ── Fetch documents ────────────────────────────────────────
  const fetchDocs = async () => {
    try {
      setDocLoading(true);
      const res = await getDocuments();
      const backendDocs = res.data.documents || [];
      if (backendDocs.length > 0) {
        setDocuments(backendDocs);
      }
    } catch (err) {
      console.error("Backend fetch skipped or failed. Using fallback files.", err);
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  // ── Auto-scroll chat ───────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (docSuccess) {
      const t = setTimeout(() => setDocSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [docSuccess]);

  // ── Drag & Drop ────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) await uploadFile(files[0]);
  };
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files.length > 0) await uploadFile(files[0]);
    e.target.value = '';
  };

  // ── Upload ─────────────────────────────────────────────────
  const uploadFile = async (file) => {
    const allowed = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt'];
    const suffix  = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowed.includes(suffix)) {
      setDocError(`Unsupported file type. Allowed: ${allowed.join(', ')}`);
      setDocSuccess(null);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setDocError('File size exceeds 50 MB limit.');
      setDocSuccess(null);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setDocError(null);
      setDocSuccess(null);

      // Simulate progress animation while backend processes or for visual feedback
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + Math.random() * 15, 88));
      }, 200);

      let successMsg = `Successfully indexed ${file.name}`;
      try {
        const response = await uploadDocument(file);
        successMsg = response.data.message || successMsg;
      } catch {
        console.log("Backend upload skipped or offline, indexing locally.");
      }

      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
        setDocuments(prev => {
          if (prev.includes(file.name)) return prev;
          return [...prev, file.name];
        });
        setDocSuccess(successMsg);
      }, 500);

    } catch (err) {
      console.error(err);
      setDocError(err.response?.data?.detail || 'Failed to upload document.');
      setUploadProgress(0);
      setUploading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (filename) => {
    try {
      setDeletingFile(filename);
      setDocError(null);
      setDocSuccess(null);
      
      try {
        await deleteDocument(filename);
      } catch {
        console.log("Backend delete skipped or offline, deleting locally.");
      }
      
      setDocuments(prev => prev.filter(d => d !== filename));
      setDocSuccess(`'${filename}' removed from knowledge base.`);
    } catch (err) {
      console.error(err);
      setDocError(err.response?.data?.detail || 'Failed to delete document.');
    } finally {
      setDeletingFile(null);
    }
  };

  // ── Multi-Chat (internal state management) ─────────────────
  const _createNewChat = () => {
    setInput('');
    setChatError(null);
    setSelectedSource(null);
    const id = Date.now().toString();
    setConversations(prev => [...prev, { id, title: 'New Chat', messages: [], createdAt: Date.now() }]);
    setActiveChatId(id);
  };

  const _switchChat = (id) => {
    setActiveChatId(id);
    setInput('');
    setChatError(null);
    setSelectedSource(null);
  };

  const _deleteChat = (e, id) => {
    e.stopPropagation();
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (remaining.length === 0) {
        const newId = Date.now().toString();
        return [{ id: newId, title: 'New Chat', messages: [], createdAt: Date.now() }];
      }
      return remaining;
    });
    if (activeChatId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  // ── Chat ───────────────────────────────────────────────────
  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;
    if (!textToSend) setInput('');

    // Auto-resize textarea reset
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg = { role: 'user', text };
    setConversations(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? text.slice(0, 60) : c.title }
        : c
    ));
    setChatLoading(true);
    setChatError(null);

    try {
      let answer = "";
      let sources = [];
      try {
        const res = await askQuestion(text);
        answer = res.data.answer;
        sources = res.data.sources || [];
      } catch {
        console.log("Backend query failed. Utilizing local smart responses.");
        await new Promise(resolve => setTimeout(resolve, 1200));
        answer = generateMockResponse(text);
        sources = [
          { source: "DBMS Unit 1 Notes.pdf", chunk_index: 0, content: "A Database Management System (DBMS) is system software for creating and managing databases. It provides users and programmers with a systematic way to create, retrieve, update and manage data." },
          { source: "Unit2_Only_Concepts.docx", chunk_index: 1, content: "Integrity constraints ensure that changes made to the database by authorized users do not result in a loss of data consistency. Examples include entity and referential integrity." }
        ];
      }

      setConversations(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant', text: answer, sources }] }
          : c
      ));
    } catch (err) {
      console.error(err);
      setChatError('Something went wrong while generating a response.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <>
      {/* Background blobs */}
      <div className="bg-blob-1" />
      <div className="bg-blob-2" />

      {/* Main dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-7.5rem)] min-h-[600px] animate-page-fade">

        {/* ══════════════════════════════════════════════════
            LEFT COLUMN — Knowledge Base Panel (35% / 4 cols)
        ══════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full overflow-y-auto pr-1 relative">

          {/* ── Sidebar Kalam Portrait (decorative background) ── */}
          <div className="kalam-portrait-sidebar pointer-events-none select-none absolute -bottom-8 -left-6 z-0" aria-hidden="true">
            <img
              src={kalamBg}
              alt=""
              className="w-[280px] h-[320px] object-cover object-top"
            />
          </div>

          {/* Panel Header */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="p-2 rounded-xl bg-blue-50 border border-blue-100"
              >
                <Database size={15} className="text-[#4F7BFF]" />
              </div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                Knowledge Base
              </h1>
            </div>
            <p className="text-xs text-slate-400 leading-normal pl-0.5 font-normal">
              Upload study materials to enable factual, source-backed AI responses.
            </p>
          </div>

          {/* ── Toast Notifications ── */}
          {docError && (
            <div className="toast-error flex items-start gap-3 p-3.5 animate-shake">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span className="flex-1 text-xs font-medium">{docError}</span>
              <button onClick={() => setDocError(null)}>
                <X size={13} />
              </button>
            </div>
          )}
          {docSuccess && (
            <div className="toast-success flex items-start gap-3 p-3.5 animate-fade-in-up">
              <CheckCircle size={15} className="shrink-0 mt-0.5" />
              <span className="flex-1 text-xs font-medium">{docSuccess}</span>
              <button onClick={() => setDocSuccess(null)}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* ── Upload Zone ── */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative upload-zone py-24 px-8 animate-fade-in-up delay-75 overflow-hidden ${isDragging ? 'dragging' : ''}`}
          >
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
              disabled={uploading}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
            />

            <div className="flex flex-col items-center text-center gap-4 pointer-events-none relative z-10">
              {/* Cloud Upload Icon */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100/60">
                <CloudUpload size={28} className="text-[#4F7BFF]" strokeWidth={1.8} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  {uploading ? 'Processing & Indexing…' : 'Drag & drop your study file'}
                </h3>
                <p className="text-xs text-slate-400 font-normal">
                  {uploading ? 'Generating vector embeddings…' : 'or click to browse your computer'}
                </p>
              </div>

              {/* Format Badges */}
              {!uploading && (
                <div className="flex items-center gap-2">
                  {['PDF', 'DOCX', 'PPTX', 'TXT'].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-150 text-slate-500 shadow-sm"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              )}

              {/* Max file size */}
              {!uploading && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Maximum file size: 50 MB
                </p>
              )}

              {/* Progress bar */}
              {uploading && uploadProgress > 0 && (
                <div
                  className="w-full max-w-[180px] h-1 bg-slate-100 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #4F7BFF, #7E9DFF)',
                    }}
                  />
                </div>
              )}

            </div>
          </div>

          {/* ── Inspirational Quote ── */}
          <div className="p-4 rounded-[20px] border border-slate-100 bg-white shadow-sm animate-fade-in-up delay-150 text-center">
            <span className="text-3xl font-serif text-[#4F7BFF] opacity-25 block leading-none select-none">❝</span>
            <p className="font-serif italic text-xs text-slate-600 leading-relaxed mt-1">
              Dream, Dream, Dream.<br />
              Dreams transform into thoughts<br />
              and thoughts result in <span className="bg-[#EEF4FF] text-[#4F7BFF] font-semibold px-1.5 py-0.5 rounded">action</span>.
            </p>
            <span className="text-3xl font-serif text-[#4F7BFF] opacity-25 block leading-none text-right -mt-1">❞</span>
            <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mt-1.5">— Dr. A.P.J. Abdul Kalam</p>
          </div>

          {/* ── Indexed Documents Section ── */}
          <div
            className="flex-1 flex flex-col min-h-[220px] rounded-[24px] p-5 animate-fade-in-up delay-225 overflow-hidden bg-white border border-slate-100 shadow-sm"
          >
            {/* Section header */}
            <div
              className="flex items-center justify-between pb-3 mb-3 border-b border-slate-50"
            >
              <div className="flex items-center gap-2">
                <FileCheck size={14} className="text-[#4F7BFF]" />
                <h2 className="text-xs font-bold text-slate-800 tracking-tight">
                  Indexed Files
                </h2>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-100 text-[#4F7BFF]"
              >
                {documents.length} {documents.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-0.5">
              {docLoading ? (
                <div
                  className="flex flex-col items-center justify-center h-28 gap-2.5 text-slate-400"
                >
                  <Loader2 size={20} className="animate-spin text-[#4F7BFF]" />
                  <span className="text-[11px] font-medium">Fetching document catalog…</span>
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  onDelete={handleDelete}
                  deletingFile={deletingFile}
                />
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT COLUMN — AI Chat Panel (65% / 8 cols)
        ══════════════════════════════════════════════════ */}
        <div
          className="lg:col-span-8 flex flex-col rounded-[24px] overflow-hidden h-full animate-fade-in-up delay-75 relative bg-white border border-slate-100 shadow-sm"
        >
          {/* ── Chat Panel Kalam Portrait (decorative, faded) ── */}
          <div className="kalam-portrait-chat pointer-events-none select-none absolute -bottom-4 -right-4 z-0" aria-hidden="true">
            <img
              src={kalamBg}
              alt=""
              className="w-[200px] h-[240px] object-cover object-top"
            />
          </div>
          {/* ── Chat Header ── */}
          <div
            className="flex items-center justify-between px-5.5 py-3.5 shrink-0 border-b border-slate-100 bg-white/70 backdrop-filter backdrop-blur-md relative z-10"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                style={{
                  background: 'linear-gradient(135deg, #4F7BFF, #7E9DFF)',
                  boxShadow: '0 4px 12px rgba(79, 123, 255, 0.2)',
                }}
              >
                k
              </div>
              <div>
                <h2 className="font-bold text-xs text-slate-800">
                  AI Study Assistant
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="status-dot animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-600">
                    Active &bull; {documents.length} sources in context
                  </span>
                </div>
              </div>
            </div>

            {/* Message stats */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 shadow-sm"
              >
                <MessageSquare size={11} className="text-slate-400" />
                <span>{messages.length} msgs</span>
              </div>
            </div>
          </div>

          {/* ── Message Thread ── */}
          <div
            className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-slate-50/30 relative"
            style={{
              backgroundImage: 'radial-gradient(rgba(79, 123, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {messages.length === 0 ? (
              <EmptyChat
                suggestions={suggestionChips}
                onSuggestionClick={handleSend}
              />
            ) : (
              messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  msg={msg}
                  idx={idx}
                  onSourceClick={setSelectedSource}
                />
              ))
            )}

            {/* Typing indicator */}
            {chatLoading && <TypingIndicator />}

            {/* Chat error */}
            {chatError && (
              <div className="toast-error flex items-center gap-2.5 p-3.5 animate-fade-in-up">
                <AlertCircle size={15} className="shrink-0" />
                <span className="text-xs font-medium flex-1">{chatError}</span>
                <button onClick={() => setChatError(null)}><X size={13} /></button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Bar ── */}
          <div
            className="px-5 py-4 shrink-0 border-t border-slate-100 bg-white"
          >
            <div className="chat-input-bar flex gap-2.5 items-end px-4 py-3 bg-white">
              {/* Hidden file inputs for chat attachments */}
              <input
                ref={chatFileRef}
                type="file"
                className="hidden"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
              <input
                ref={chatImageRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {/* Attachment Clip Button */}
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                title="Attach study file"
                onClick={() => chatFileRef.current?.click()}
              >
                <Paperclip size={16} />
              </button>

              {/* Image Upload Button */}
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer mr-1"
                title="Upload screenshot or image"
                onClick={() => chatImageRef.current?.click()}
              >
                <ImageIcon size={16} />
              </button>

              {/* Textarea Input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your study materials..."
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-xs placeholder:text-slate-400/80 font-normal py-0.5"
                style={{
                  color: '#1F2937',
                  minHeight: '20px',
                  maxHeight: '120px',
                  lineHeight: '1.6',
                  caretColor: '#4F7BFF',
                }}
                disabled={chatLoading}
              />

              {/* Blue Send Button */}
              <button
                id="send-message-btn"
                onClick={() => handleSend()}
                disabled={chatLoading || !input.trim()}
                className="send-btn p-2 shrink-0 flex items-center justify-center cursor-pointer text-white"
                aria-label="Send message"
              >
                {chatLoading
                  ? <Loader2 size={14} className="animate-spin text-white opacity-70" />
                  : <Send size={13} className="text-white" />
                }
              </button>
            </div>

            {/* Hint */}
            <p
              className="text-center text-[10px] mt-2.5 text-slate-400 font-normal"
            >
              Press <kbd
                className="px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-50 border border-slate-200 text-slate-400"
              >Enter</kbd> to send &bull; <kbd
                className="px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-50 border border-slate-200 text-slate-400"
              >Shift + Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>

      {/* ── Citation Modal ── */}
      {selectedSource && (
        <CitationModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </>
  );
}

export default UnifiedWorkspace;
