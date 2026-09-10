import api from './api';
import { User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string; confirmPassword?: string; invite_project?: number | string }) {
    const response = await api.post<{ success: boolean; message: string; data: { user: User; token: string } }>(
      '/auth/register',
      data
    );
    return response.data.data;
  },

  async login(credentials: { email: string; password: string }) {
    const response = await api.post<{ success: boolean; message: string; data: { user: User; token: string } }>(
      '/auth/login',
      credentials
    );
    return response.data.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network failures on logout
    } finally {
      localStorage.removeItem('nova_token');
      localStorage.removeItem('nova_user');
    }
  },

  async getMe() {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return response.data.data.user;
  },

  async forgotPassword(email: string) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data?: { email: string; code: string; expiresInMinutes: number };
    }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword?: string;
  }) {
    const response = await api.post<{
      success: boolean;
      message: string;
    }>('/auth/reset-password', data);
    return response.data;
  },
};
