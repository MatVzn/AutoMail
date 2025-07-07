// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Garantir que a URL seja sempre completa
export const API_BASE_URL_FINAL = API_BASE_URL.startsWith('http') 
  ? API_BASE_URL 
  : `https://${API_BASE_URL}`;

// URLs dos endpoints
export const API_ENDPOINTS = {
  upload: `${API_BASE_URL_FINAL}/upload`,
  uploads: `${API_BASE_URL_FINAL}/uploads`,
  uploadById: (id: string) => `${API_BASE_URL_FINAL}/uploads/${id}`,
} as const; 