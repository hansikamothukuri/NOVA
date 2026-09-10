import api from './api';
import { User } from '../types';

export interface ProfileUpdateData {
  name?: string;
  avatar?: string;
  bio?: string;
  title?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const profileService = {
  async getProfile() {
    const response = await api.get<{ success: boolean; data: { profile: User } }>('/profile');
    return response.data.data.profile;
  },

  async updateProfile(data: ProfileUpdateData) {
    const response = await api.put<{ success: boolean; message: string; data: { user: User } }>(
      '/profile',
      data
    );
    return response.data.data.user;
  },
};
