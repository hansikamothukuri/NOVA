import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string, invite_project?: number | string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserInState: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial session hydration
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('nova_token');
      const cachedUser = localStorage.getItem('nova_user');

      if (token) {
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            // ignore JSON parse error
          }
        }

        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('nova_user', JSON.stringify(freshUser));
        } catch {
          // Token invalid or expired
          localStorage.removeItem('nova_token');
          localStorage.removeItem('nova_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('nova_token', data.token);
    localStorage.setItem('nova_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string, invite_project?: number | string) => {
    const data = await authService.register({ name, email, password, confirmPassword, invite_project });
    localStorage.setItem('nova_token', data.token);
    localStorage.setItem('nova_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      localStorage.setItem('nova_user', JSON.stringify(freshUser));
    } catch {
      // Ignored
    }
  };

  const updateUserInState = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('nova_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUserInState,
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
