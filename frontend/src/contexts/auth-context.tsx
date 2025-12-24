'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.me();
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    if (response.success && response.data) {
      setUser(response.data.user);
      router.push('/service-desk/requests');
    } else {
      throw new Error(response.error?.message || 'Login failed');
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    router.push('/login');
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some((role) => user?.roles?.includes(role)) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
