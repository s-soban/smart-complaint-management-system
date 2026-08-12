import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smart_complaint_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (identifier: string, password?: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ identifier, password: password || 'password123' });
      if (data.success && data.token && data.user) {
        localStorage.setItem('smart_complaint_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const data = await api.register(userData);
      if (data.success && data.token && data.user) {
        localStorage.setItem('smart_complaint_token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('smart_complaint_token');
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (targetRole: Role) => {
    let demoEmail = 'student1@campus.edu';
    if (targetRole === 'maintenance') demoEmail = 'staff1@campus.edu';
    if (targetRole === 'admin') demoEmail = 'admin@campus.edu';

    await login(demoEmail, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickDemoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
