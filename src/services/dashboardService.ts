import api from './api';
import { DashboardStats, Project, Task } from '../types';

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: Project[];
  recentTasks: Task[];
  myTasks: Task[];
}

export const dashboardService = {
  async getStats() {
    const response = await api.get<{ success: boolean; data: DashboardData }>('/dashboard/stats');
    return response.data.data;
  },
};
