import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import type { AuthUser, AuthContextType, LoginPayload, RegisterPayload } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(storage.getUser<AuthUser>());
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Validate saved session against backend on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = storage.getToken();
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.getMe();
        setUser(me);
        setToken(savedToken);
        storage.setUser(me);
      } catch {
        // Token is invalid or expired — clear everything
        storage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for 401 events dispatched by the Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:logout', handleUnauthorized);
    return () => window.removeEventListener('auth:logout', handleUnauthorized);
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<void> => {
    const response = await authService.login(payload);
    storage.setUser(response.user);
    setUser(response.user);
    setToken(response.token);
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    const response = await authService.register(payload);
    storage.setUser(response.user);
    setUser(response.user);
    setToken(response.token);
  }, []);

  const logout = useCallback((): void => {
    authService.logout();
    storage.clear();
    setUser(null);
    setToken(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
