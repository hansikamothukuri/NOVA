import api from './api';
import { Task, TaskPriority, TaskStatus } from '../types';

export interface TaskQueryParams {
  status?: string;
  priority?: string;
  assigned_to?: string | number;
  search?: string;
  sort?: 'due_date' | 'priority' | 'created_at';
}

export const taskService = {
  async getProjectTasks(projectId: number | string, params?: TaskQueryParams) {
    const response = await api.get<{ success: boolean; data: { tasks: Task[] } }>(
      `/projects/${projectId}/tasks`,
      { params }
    );
    return response.data.data.tasks;
  },

  async getTaskById(taskId: number | string) {
    const response = await api.get<{
      success: boolean;
      data: {
        task: Task;
        permissions: { canEdit: boolean; canDelete: boolean; isOwner: boolean };
      };
    }>(`/tasks/${taskId}`);
    return response.data.data;
  },

  async createTask(
    projectId: number | string,
    taskData: {
      title: string;
      description?: string;
      assigned_to?: number | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      due_date?: string | null;
    }
  ) {
    const response = await api.post<{ success: boolean; message: string; data: { task: Task } }>(
      `/projects/${projectId}/tasks`,
      taskData
    );
    return response.data.data.task;
  },

  async updateTask(
    taskId: number | string,
    taskData: {
      title?: string;
      description?: string;
      assigned_to?: number | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      due_date?: string | null;
    }
  ) {
    const response = await api.put<{ success: boolean; message: string; data: { task: Task } }>(
      `/tasks/${taskId}`,
      taskData
    );
    return response.data.data.task;
  },

  async updateTaskStatus(taskId: number | string, status: TaskStatus) {
    const response = await api.patch<{ success: boolean; message: string; data: { task: Task } }>(
      `/tasks/${taskId}`,
      { status }
    );
    return response.data.data.task;
  },

  async deleteTask(taskId: number | string) {
    const response = await api.delete<{ success: boolean; message: string }>(`/tasks/${taskId}`);
    return response.data;
  },
};
