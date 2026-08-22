import React, { useState, useEffect } from 'react';
import { CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument } from '../services/api';
import DocumentList from '../components/DocumentList';

function UploadPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await getDocuments();
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch documents. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    // Basic validation
    const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt'];
    const suffix = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(suffix)) {
      setError(`Unsupported file type. Please upload: ${allowedExtensions.join(', ')}`);
      setSuccess(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      setSuccess(null);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      const response = await uploadDocument(file);
      
      setSuccess(response.data.message || `Successfully uploaded and indexed ${file.name}`);
      fetchDocs();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to upload document.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    try {
      setDeletingFile(filename);
      setError(null);
      setSuccess(null);
      
      await deleteDocument(filename);
      setSuccess(`Document '${filename}' deleted successfully.`);
      fetchDocs();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to delete document.";
      setError(msg);
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Knowledge Base</h1>
        <p className="text-gray-500">
          Upload reference files so that the AI assistant can draw answers directly from your documents.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl animate-shake">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
          <CheckCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-lg shadow-blue-500/5'
            : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50/50'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={`p-4 rounded-2xl transition-transform duration-300 ${
            uploading ? 'bg-blue-50 text-blue-600 animate-pulse' : 'bg-gray-50 text-gray-500'
          }`}>
            {uploading ? (
              <Loader2 size={36} className="animate-spin text-blue-600" />
            ) : (
              <CloudUpload size={36} className="text-gray-400" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-gray-700 font-semibold text-lg">
              {uploading ? 'Processing and chunking document...' : 'Drag and drop your file here'}
            </h3>
            <p className="text-gray-400 text-sm">
              {uploading ? 'Creating embeddings and storing in database...' : 'Or click to browse your computer'}
            </p>
          </div>
          
          <div className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100/80 rounded-full">
            PDF, DOCX, PPTX, TXT (Max 50MB)
          </div>
        </div>
      </div>

      {/* Document List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-xl font-bold text-gray-800">Indexed Documents</h2>
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
            {documents.length} Total
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Loader2 className="animate-spin text-gray-400 mb-2" size={28} />
            <span className="text-sm">Retrieving indexed document list...</span>
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
  );
}

export default UploadPage;
