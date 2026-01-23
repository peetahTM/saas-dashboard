// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
