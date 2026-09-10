import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Briefcase,
  FileText,
  Lock,
  Save,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Shield,
  Sparkles,
  ExternalLink,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService, ProfileUpdateData } from '../services/profileService';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { UserProfile, Project, Task } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, updateUserInState } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active section tab
  const [activeSection, setActiveSection] = useState<'overview' | 'owned_projects' | 'assigned_tasks' | 'settings'>('overview');

  // Task filter
  const [taskStatusFilter, setTaskStatusFilter] = useState<'All' | 'Todo' | 'In Progress' | 'Review' | 'Completed'>('All');

  useEffect(() => {
    loadFullProfile();
  }, []);

  const loadFullProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await profileService.getProfile();
      setProfileData(data as any);
      setName(data.name || '');
      setTitle(data.title || '');
      setBio(data.bio || '');
      setAvatar(data.avatar || '');
    } catch (err: any) {
      console.warn('Failed to load profile data:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setError('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: ProfileUpdateData = {
        name: name.trim(),
        title: title.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar.trim() || undefined,
      };

      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const updatedUser = await profileService.updateProfile(updateData);
      updateUserInState(updatedUser);
      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await loadFullProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const ownedProjects: Project[] = profileData?.ownedProjects || [];
  const assignedTasks: Task[] = profileData?.assignedTasks || [];

  const filteredTasks = assignedTasks.filter((t) => {
    if (taskStatusFilter === 'All') return true;
    return t.status === taskStatusFilter;
  });

  const stats = profileData?.stats || {
    ownedProjects: ownedProjects.length,
    assignedTasks: assignedTasks.length,
    completedTasks: assignedTasks.filter((t) => t.status === 'Completed').length,
    pendingTasks: assignedTasks.filter((t) => t.status !== 'Completed').length,
    completionRate:
      assignedTasks.length > 0
        ? Math.round((assignedTasks.filter((t) => t.status === 'Completed').length / assignedTasks.length) * 100)
        : 0,
    memberProjects: 0,
    totalProjects: 0,
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const isOverdue = (dueDateStr?: string | null, status?: string) => {
    if (!dueDateStr || status === 'Completed') return false;
    return new Date(dueDateStr) < new Date();
  };

  if (loadingProfile && !profileData) {
    return <LoadingSpinner message="Loading your profile & workspace statistics..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-6 h-6 text-orange-400" />
            <span>My Profile</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your owned projects, assigned tasks, and workspace activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/projects">
            <Button variant="outline" size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              All Projects
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Top Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar src={avatar} name={name || user?.name || 'User'} size="xl" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-100">{name || user?.name || 'User'}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold">
                  {title || user?.title || 'Team Contributor'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email}</span>
              </p>
              {bio && <p className="text-xs text-slate-300 mt-2 max-w-xl italic">"{bio}"</p>}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveSection('owned_projects')}
              className="p-3 bg-slate-950/70 hover:bg-slate-800/60 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <FolderKanban className="w-3.5 h-3.5 text-orange-400" />
                <span>Projects Owned</span>
              </div>
              <div className="text-xl font-black text-slate-100">{stats.ownedProjects ?? 0}</div>
            </button>

            <button
              onClick={() => setActiveSection('assigned_tasks')}
              className="p-3 bg-slate-950/70 hover:bg-slate-800/60 rounded-xl border border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Assigned Tasks</span>
              </div>
              <div className="text-xl font-black text-amber-400">{stats.assignedTasks ?? 0}</div>
            </button>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-left">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Completed Tasks</span>
              </div>
              <div className="text-xl font-black text-emerald-400">{stats.completedTasks ?? 0}</div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-left">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>Completion Rate</span>
              </div>
              <div className="text-xl font-black text-purple-400">{stats.completionRate ?? 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'overview'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveSection('owned_projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'owned_projects'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Projects Owned
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {stats.ownedProjects ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('assigned_tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'assigned_tasks'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Assigned Tasks
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {stats.assignedTasks ?? 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'settings'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Account & Security
        </button>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owned Projects Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-orange-400" />
                    Projects Owned
                  </h3>
                  <p className="text-xs text-slate-400">Projects you manage and lead</p>
                </div>
                <button
                  onClick={() => setActiveSection('owned_projects')}
                  className="text-xs text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>View all ({ownedProjects.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {ownedProjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <p>You haven't created any projects yet.</p>
                  <Link to="/projects">
                    <Button variant="primary" size="sm" className="mt-3">
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {ownedProjects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100 truncate">{project.name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              project.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : project.status === 'Completed'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                          <span>{project.completed_tasks} / {project.total_tasks} tasks done</span>
                          <span>{project.member_count} team members</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      <Link to={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          Open
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Tasks Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    Assigned Tasks
                  </h3>
                  <p className="text-xs text-slate-400">Action items assigned to you</p>
                </div>
                <button
                  onClick={() => setActiveSection('assigned_tasks')}
                  className="text-xs text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>View all ({assignedTasks.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {assignedTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <p>You currently have no assigned tasks.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assignedTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-100 truncate">{task.title}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getStatusBadgeClass(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="text-orange-400/90 font-medium">{task.project_name}</span>
                          {task.due_date && (
                            <span
                              className={`flex items-center gap-1 ${
                                isOverdue(task.due_date, task.status) ? 'text-rose-400 font-semibold' : ''
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {task.due_date}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link to={`/projects/${task.project_id}`}>
                        <Button variant="ghost" size="sm">
                          Board
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PROJECTS OWNED */}
      {activeSection === 'owned_projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-orange-400" />
                <span>Projects Owned ({ownedProjects.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                You have full administrator privileges and settings control over these projects.
              </p>
            </div>
            <Link to="/projects">
              <Button variant="primary" size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
                Create New Project
              </Button>
            </Link>
          </div>

          {ownedProjects.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-200">No Owned Projects Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                You are not currently the owner of any projects. Create a new project to start assigning tasks and inviting teammates.
              </p>
              <Link to="/projects">
                <Button variant="primary" size="sm">
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownedProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                          Project #{project.id}
                        </span>
                        <h4 className="text-base font-bold text-slate-100">{project.name}</h4>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          project.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : project.status === 'Completed'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{project.description}</p>

                    {/* Progress */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-bold text-slate-200">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>{project.completed_tasks} of {project.total_tasks} Tasks Done</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{project.member_count} Team Members</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {project.due_date || 'No deadline'}
                    </span>
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Open Project
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ASSIGNED TASKS */}
      {activeSection === 'assigned_tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <span>Assigned Tasks ({assignedTasks.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                All deliverables and tickets assigned directly to your account across all projects.
              </p>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['All', 'Todo', 'In Progress', 'Review', 'Completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTaskStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    taskStatusFilter === st
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-200">
                {taskStatusFilter === 'All' ? 'No Assigned Tasks Found' : `No "${taskStatusFilter}" Tasks`}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                You're all caught up! New tasks assigned to you in any project will show up right here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task.due_date, task.status);

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-100">{task.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadgeClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="font-semibold text-orange-400/90 flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" />
                          {task.project_name || `Project #${task.project_id}`}
                        </span>

                        {task.due_date && (
                          <span
                            className={`flex items-center gap-1 ${
                              overdue ? 'text-rose-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Due: {task.due_date}</span>
                            {overdue && <span className="text-[10px] uppercase tracking-wider">(Overdue)</span>}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/projects/${task.project_id}`}>
                        <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          View on Board
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: ACCOUNT & SECURITY */}
      {activeSection === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
                <Input
                  label="Job Title / Role"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Senior Full-Stack Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg text-slate-500 text-sm px-3.5 py-2.5 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Email addresses are permanently anchored to account credentials.
                </p>
              </div>

              <Input
                label="Avatar URL (Optional)"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short note about yourself, your skills, or team focus..."
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm p-3.5 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Security & Password (Optional)</span>
              </h3>

              <div>
                <Input
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Leave blank if not changing"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={saving}
                icon={<Save className="w-4 h-4" />}
                id="save-profile-button"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
