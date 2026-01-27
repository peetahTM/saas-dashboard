import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { AuthResponse, LoginCredentials, SignupCredentials } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('authUser', JSON.stringify(response.user));
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data) {
      handleAuthResponse(response.data);
      return { success: true };
    }

    return { success: false, error: 'Unable to complete login. Please try again.' };
  };

  const signup = async (credentials: SignupCredentials) => {
    const response = await api.signup(credentials);

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data) {
      handleAuthResponse(response.data);
      return { success: true };
    }

    return { success: false, error: 'Unable to create your account. Please try again.' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    api.logout();
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
