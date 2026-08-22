import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData);
};

export const askQuestion = (question) => {
  return api.post('/ask', { question });
};

export const checkHealth = () => {
  return api.get('/health');
};

export const getDocuments = () => {
  return api.get('/documents');
};

export const deleteDocument = (filename) => {
  return api.delete(`/documents/${encodeURIComponent(filename)}`);
};

