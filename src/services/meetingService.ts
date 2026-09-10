import api from './api';
import { Meeting, MeetingAttendee } from '../types';

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  project_id: number;
  start_time: string;
  end_time: string;
  meeting_link: string;
  platform?: string;
  additional_attendees?: {
    user_id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role?: string;
  }[];
  attendees?: MeetingAttendee[];
}

export interface UpdateMeetingPayload {
  title?: string;
  description?: string;
  project_id?: number | null;
  start_time?: string;
  end_time?: string;
  meeting_link?: string;
  platform?: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
  additional_attendees?: {
    user_id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role?: string;
  }[];
  attendees?: MeetingAttendee[];
}

export const meetingService = {
  async getMeetings(params?: { projectId?: number | string; status?: string }) {
    const response = await api.get<{
      success: boolean;
      count: number;
      data: Meeting[];
    }>('/meetings', { params });
    return response.data.data;
  },

  async getMeetingById(id: number | string) {
    const response = await api.get<{
      success: boolean;
      data: Meeting;
    }>(`/meetings/${id}`);
    return response.data.data;
  },

  async createMeeting(payload: CreateMeetingPayload) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: Meeting;
    }>('/meetings', payload);
    return response.data.data;
  },

  async updateMeeting(id: number | string, payload: UpdateMeetingPayload) {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: Meeting;
    }>(`/meetings/${id}`, payload);
    return response.data.data;
  },

  async deleteMeeting(id: number | string) {
    const response = await api.delete<{
      success: boolean;
      message: string;
    }>(`/meetings/${id}`);
    return response.data;
  },
};
