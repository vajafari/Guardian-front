import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { login as loginRequest } from '../api/authService';
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from '../api/tokenStorage';
import { AuthError, type AuthErrorCode, type AuthUser, type LoginCredentials } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthErrorCode | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorCode | null>(null);

  const logout = () => {
    setToken(null);
    setUser(null);
    clearSession();
  };

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, logout);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginRequest(credentials);
      setToken(result.token);
      setUser(result.user);
      setSession(result);
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'unknown';
      setError(code);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: Boolean(token), isLoading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
