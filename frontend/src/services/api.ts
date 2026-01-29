const API_BASE_URL = 'http://localhost:3001';
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

// Error codes that match backend
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// User-friendly error messages
const ErrorMessages = {
  [ErrorCodes.NETWORK_ERROR]: 'Connection issue. Check your internet and try again.',
  [ErrorCodes.TIMEOUT_ERROR]: 'Request timed out. Please check your connection and try again.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Session expired. Please log in again.',
  [ErrorCodes.AUTH_REQUIRED]: 'Please log in to continue.',
  [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong. Please try again later.',
};

/**
 * Creates a fetch request with timeout
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Handles 401 errors by clearing auth state and redirecting to login
 */
const handleUnauthorized = (code?: string): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');

  // Only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    const message = code === ErrorCodes.TOKEN_EXPIRED
      ? 'Session expired. Please log in again.'
      : 'Please log in to continue.';

    // Store message to display on login page
    sessionStorage.setItem('authMessage', message);
    window.location.href = '/login';
  }
};

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          ...options,
          headers: {
            ...this.getAuthHeaders(),
            ...options.headers,
          },
        },
        REQUEST_TIMEOUT
      );

      // Handle empty responses (e.g., 204 No Content)
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        const errorCode = data.code || ErrorCodes.INTERNAL_ERROR;
        const errorMessage = data.message || (errorCode in ErrorMessages ? ErrorMessages[errorCode as keyof typeof ErrorMessages] : 'An error occurred');

        // Handle 401 errors
        if (response.status === 401) {
          handleUnauthorized(errorCode);
          return {
            error: errorMessage,
            code: errorCode
          };
        }

        return {
          error: errorMessage,
          code: errorCode
        };
      }

      return { data };
    } catch (error) {
      // Handle network/timeout errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: ErrorMessages[ErrorCodes.TIMEOUT_ERROR],
            code: ErrorCodes.TIMEOUT_ERROR,
          };
        }

        // Network errors (no internet, DNS failure, etc.)
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          return {
            error: ErrorMessages[ErrorCodes.NETWORK_ERROR],
            code: ErrorCodes.NETWORK_ERROR,
          };
        }

        return {
          error: error.message,
          code: ErrorCodes.INTERNAL_ERROR,
        };
      }

      return {
        error: ErrorMessages[ErrorCodes.INTERNAL_ERROR],
        code: ErrorCodes.INTERNAL_ERROR,
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(credentials: SignupCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<AuthResponse['user']>> {
    return this.request<AuthResponse['user']>('/api/auth/me');
  }
}

export const api = new ApiService(API_BASE_URL);
export type { LoginCredentials, SignupCredentials, AuthResponse, ApiResponse };
