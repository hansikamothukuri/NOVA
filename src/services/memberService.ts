import api from './api';
import { ProjectMember } from '../types';

export const memberService = {
  async getMembers(projectId: number | string) {
    const response = await api.get<{ success: boolean; data: { members: ProjectMember[] } }>(
      `/projects/${projectId}/members`
    );
    return response.data.data.members;
  },

  async addMember(projectId: number | string, email: string, role: 'Owner' | 'Member' = 'Member') {
    const response = await api.post<{ success: boolean; message: string; data: { member: ProjectMember } }>(
      `/projects/${projectId}/members`,
      { email, role }
    );
    return response.data.data.member;
  },

  async removeMember(projectId: number | string, userId: number | string) {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/projects/${projectId}/members/${userId}`
    );
    return response.data;
  },
};
