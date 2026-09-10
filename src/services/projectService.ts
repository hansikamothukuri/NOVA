import api from './api';
import { Project } from '../types';

export interface ProjectQueryParams {
  search?: string;
  status?: string;
  sort?: 'due_date' | 'name' | 'created_at';
}

export const projectService = {
  async getAllProjects(params?: ProjectQueryParams) {
    const response = await api.get<{ success: boolean; data: { projects: Project[] } }>('/projects', {
      params,
    });
    return response.data.data.projects;
  },

  async getProjects(params?: ProjectQueryParams) {
    return this.getAllProjects(params);
  },

  async getProjectById(id: number | string) {
    const response = await api.get<{ success: boolean; data: { project: Project } }>(`/projects/${id}`);
    return response.data.data.project;
  },

  async createProject(projectData: {
    name: string;
    description?: string;
    status?: string;
    start_date?: string | null;
    due_date?: string | null;
  }) {
    const response = await api.post<{ success: boolean; message: string; data: { project: Project } }>(
      '/projects',
      projectData
    );
    return response.data.data.project;
  },

  async updateProject(
    id: number | string,
    projectData: {
      name?: string;
      description?: string;
      status?: string;
      start_date?: string | null;
      due_date?: string | null;
    }
  ) {
    const response = await api.put<{ success: boolean; message: string; data: { project: Project } }>(
      `/projects/${id}`,
      projectData
    );
    return response.data.data.project;
  },

  async deleteProject(id: number | string) {
    const response = await api.delete<{ success: boolean; message: string }>(`/projects/${id}`);
    return response.data;
  },

  async joinProject(id: number | string) {
    const response = await api.post<{ success: boolean; message: string; data?: any }>(`/projects/${id}/join`);
    return response.data;
  },
};
