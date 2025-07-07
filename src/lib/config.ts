// Configuração da API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// URLs dos endpoints
export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/upload`,
  uploads: `${API_BASE_URL}/uploads`,
  uploadById: (id: string) => `${API_BASE_URL}/uploads/${id}`,
} as const; 