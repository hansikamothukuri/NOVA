export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  title?: string | null;
  created_at?: string;
  updated_at?: string;
  stats?: {
    ownedProjects?: number;
    ownedProjectsCount?: number;
    memberProjects?: number;
    projectsCount?: number;
    totalProjects?: number;
    assignedTasks?: number;
    assignedTasksCount?: number;
    completedTasks?: number;
    completedTasksCount?: number;
    pendingTasks?: number;
    completionRate?: number;
  };
  ownedProjects?: Project[];
  assignedTasks?: Task[];
}

export type UserProfile = User;

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: 'Owner' | 'Member';
  joined_at?: string;
  name: string;
  email: string;
  avatar?: string | null;
  title?: string | null;
  bio?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  owner_avatar?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at?: string;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
  member_count: number;
  user_role?: 'Owner' | 'Member';
  members?: ProjectMember[];
  tasks?: Task[];
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: number;
  project_id: number;
  project_name?: string;
  project_owner_id?: number;
  title: string;
  description?: string;
  assigned_to?: number | null;
  assigned_to_user?: User | null;
  assignee_name?: string | null;
  assignee_email?: string | null;
  assignee_avatar?: string | null;
  created_by: number;
  creator_name?: string;
  creator_email?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  planningProjects: number;
  onHoldProjects: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  completedTasks: number;
  overdueTasks: number;
  overallCompletionRate: number;
}

export interface MeetingAttendee {
  user_id: number;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
  status?: 'accepted' | 'tentative' | 'declined' | 'pending';
}

export interface Meeting {
  id: number;
  title: string;
  description?: string;
  project_id?: number | null;
  project_name?: string | null;
  organizer_id: number;
  organizer_name?: string;
  organizer_email?: string;
  organizer_avatar?: string | null;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  platform?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  attendees: MeetingAttendee[];
  created_at: string;
  updated_at?: string;
}

