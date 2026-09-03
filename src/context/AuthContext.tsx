import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as loginRequest } from '../api/authService';
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

const TOKEN_STORAGE_KEY = 'guardian.token';
const USER_STORAGE_KEY = 'guardian.user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorCode | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginRequest(credentials);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'unknown';
      setError(code);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
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
