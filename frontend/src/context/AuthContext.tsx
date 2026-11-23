'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { apiRequest } from '../lib/api';
import { getSocket } from '../lib/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role, partnerEmail?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const data = await apiRequest<{ user: User }>('/auth/me');
        setUser(data.user);
        const socket = getSocket();
        socket.emit('join_user', data.user.id);
      } else {
        // Auto sign-in as default customer for instant demo experience
        await switchRole('CUSTOMER');
      }
    } catch (err) {
      console.warn('Auth init failed, switching to default demo customer');
      try {
        await switchRole('CUSTOMER');
      } catch (e) {
        console.error('Demo auth failed', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      const socket = getSocket();
      socket.emit('join_user', data.user.id);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: Role, partnerEmail?: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/switch-demo-user', {
        method: 'POST',
        body: JSON.stringify({ targetRole, partnerEmail }),
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      const socket = getSocket();
      socket.emit('join_user', data.user.id);
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        refreshUser,
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
