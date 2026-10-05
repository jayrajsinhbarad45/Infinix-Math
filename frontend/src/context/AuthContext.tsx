'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  clearSession,
  getStoredSession,
  persistSession,
  validateStaticLogin,
} from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage on initial client mount
    const existing = getStoredSession();
    if (existing) {
      setUser(existing);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate brief network latency for realistic authentic UI feel
    await new Promise((resolve) => setTimeout(resolve, 400));

    const authenticatedUser = validateStaticLogin(username, password);

    if (authenticatedUser) {
      persistSession(authenticatedUser);
      setUser(authenticatedUser);
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return {
        success: false,
        error: "Invalid username or password. For this build, use credentials: 'admin' / 'admin'",
      };
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
