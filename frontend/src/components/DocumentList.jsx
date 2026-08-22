import React from 'react';
import { FileText, File, Trash2, Loader2 } from 'lucide-react';

function DocumentList({ documents, onDelete, deletingFile }) {
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return (
          <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
            <FileText size={18} />
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
            <FileText size={18} />
          </div>
        );
      case 'ppt':
      case 'pptx':
        return (
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
            <File size={18} />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-gray-50 text-gray-500 rounded-xl">
            <FileText size={18} />
          </div>
        );
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 border border-slate-100 rounded-2xl text-center">
        <div className="p-3 bg-white text-slate-400 rounded-2xl mb-3 shadow-sm border border-slate-100">
          <File size={24} className="text-slate-400" />
        </div>
        <h3 className="text-slate-700 font-semibold text-sm mb-1">No study files</h3>
        <p className="text-slate-400 text-xs max-w-xs font-normal">Upload study materials to index them in your knowledge base.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {documents.map((filename) => {
        const isDeleting = deletingFile === filename;
        return (
          <div
            key={filename}
            className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group doc-item"
          >
            <div className="flex items-center gap-3 min-w-0">
              {getFileIcon(filename)}
              <div className="min-w-0">
                <p className="text-slate-800 font-medium text-xs truncate max-w-[130px] sm:max-w-[170px] md:max-w-[200px]" title={filename}>
                  {filename}
                </p>
                <div className="mt-1 flex">
                  <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100">
                    Indexed
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onDelete(filename)}
              disabled={isDeleting}
              className={`p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 ${
                isDeleting ? 'cursor-not-allowed opacity-50' : ''
              }`}
              title="Delete document"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin text-rose-500" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default DocumentList;
