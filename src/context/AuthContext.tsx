import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          setTokenState(storedToken);
        } catch {
          // Token expired or invalid
          clearAuthToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();

    const handleExpired = () => {
      setTokenState(null);
      setUser(null);
      showToast('Your session expired. Please sign in again.', 'info');
    };
    window.addEventListener('interviewiq:session-expired', handleExpired);
    return () => window.removeEventListener('interviewiq:session-expired', handleExpired);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login({ email, password: pass });
      setUser(res.user);
      setTokenState(res.token);
      setAuthToken(res.token);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.register({ name, email, password: pass });
      setUser(res.user);
      setTokenState(res.token);
      setAuthToken(res.token);
      showToast('Account created successfully! Welcome to InterviewIQ.', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logout = () => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
    showToast('Signed out successfully.', 'info');
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
