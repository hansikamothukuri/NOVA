import api from './api';

export interface RegisteredUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
}

export const userService = {
  async getAllUsers(): Promise<RegisteredUser[]> {
    const response = await api.get<{
      success: boolean;
      data: {
        users: RegisteredUser[];
      };
    }>('/users');
    return response.data.data.users || [];
  },
};
