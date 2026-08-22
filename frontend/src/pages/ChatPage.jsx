import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, BookOpen, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { askQuestion } from '../services/api';

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "What are the main concepts in these documents?",
    "Summarize the key points of the uploaded files.",
    "Explain the core definition mentioned in the texts.",
    "Can you give me a list of important takeaways?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) {
      setInput('');
    }

    // Add user message
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    
    setLoading(true);
    setError(null);

    try {
      const res = await askQuestion(text);
      
      const assistantMsg = {
        role: 'assistant',
        text: res.data.answer,
        sources: res.data.sources || []
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Something went wrong while generating response.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)] animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden h-full">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Study Assistant</h2>
            <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              RAG Knowledge Activated
            </p>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="p-4 bg-blue-50/80 text-blue-500 rounded-3xl animate-bounce">
                <Bot size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-gray-700 font-bold text-xl">Ask your Knowledge Base</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Send a question, and the assistant will scan your uploaded documents to construct a factual, annotated response.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full pt-4">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    className="p-3 text-left text-xs text-gray-600 bg-white border border-gray-100 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl transition-all duration-300 shadow-sm font-medium hover:translate-y-[-1px]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-9 h-9 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                    <Bot size={18} />
                  </div>
                )}
                
                <div className="flex flex-col max-w-[80%] gap-2">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-blue">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Sources displayed under LLM response */}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-semibold self-center">Sources:</span>
                      {msg.sources.map((src, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => setSelectedSource(src)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-200/50 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                        >
                          <BookOpen size={12} />
                          <span className="truncate max-w-[120px]">{src.source}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-9 h-9 shrink-0 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Answer Generation Loading Skeletal/Spinner */}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-9 h-9 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold animate-pulse">
                <Bot size={18} />
              </div>
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={16} />
                  <span className="text-xs text-gray-400 font-semibold">Reading documents & generating response...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2 items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 hover:border-gray-200 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the course documents..."
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 max-h-24 min-h-[20px]"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                loading || !input.trim()
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/10 active:scale-95'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Citation Inspector Drawer / Side Panel */}
      {selectedSource && (
        <div className="w-full md:w-80 bg-white border border-gray-100 rounded-3xl shadow-lg p-5 flex flex-col h-full animate-slide-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <BookOpen size={16} />
              <span>Source Citation</span>
            </div>
            <button
              onClick={() => setSelectedSource(null)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Document Name</p>
              <p className="text-sm font-semibold text-gray-800 break-all">{selectedSource.source}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Chunk Index</p>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                #{selectedSource.chunk_index + 1}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col min-h-[150px]">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Retrieved Context Snippet</p>
              <div className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-wrap overflow-y-auto">
                {selectedSource.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
