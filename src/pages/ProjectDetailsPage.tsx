import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Calendar,
  Users,
  Plus,
  Settings,
  Trash2,
  Crown,
  LayoutGrid,
  CheckSquare,
  ArrowLeft,
  Clock,
  Video,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { memberService } from '../services/memberService';
import { meetingService } from '../services/meetingService';
import { Project, Task, ProjectMember, TaskStatus, Meeting } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { TaskBoard } from '../components/TaskBoard';
import { MemberList } from '../components/MemberList';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { ScheduleMeetingModal } from '../components/ScheduleMeetingModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [permissions, setPermissions] = useState<{ isOwner: boolean; isMember: boolean }>({
    isOwner: false,
    isMember: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'members' | 'meetings' | 'settings'>('board');

  // Meetings state
  const [projectMeetings, setProjectMeetings] = useState<Meeting[]>([]);
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);
  const [copiedMeetingId, setCopiedMeetingId] = useState<number | null>(null);

  // Modals state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>('Todo');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Edit Project Settings state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const proj = await projectService.getProjectById(id);
      setProject(proj);
      setTasks(proj.tasks || []);
      setMembers(proj.members || []);
      setPermissions({
        isOwner: proj.user_role === 'Owner',
        isMember: true,
      });

      setEditName(proj.name);
      setEditDescription(proj.description || '');
      setEditStatus(proj.status);
      setEditStartDate(proj.start_date ? proj.start_date.slice(0, 10) : '');
      setEditDueDate(proj.due_date ? proj.due_date.slice(0, 10) : '');

      // Load project meetings
      try {
        const meetings = await meetingService.getMeetings({ projectId: id });
        setProjectMeetings(meetings || []);
      } catch {
        // Non-blocking
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Recalculate completion progress percentage
  const calculateProgress = (taskList: Task[]) => {
    if (!taskList.length) return 0;
    const completed = taskList.filter((t) => t.status === 'Completed').length;
    return Math.round((completed / taskList.length) * 100);
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const updated = await taskService.updateTaskStatus(task.id, newStatus);
      const updatedTasks = tasks.map((t) => (t.id === task.id ? updated : t));
      setTasks(updatedTasks);

      if (project) {
        setProject({
          ...project,
          progress: calculateProgress(updatedTasks),
          completed_tasks: updatedTasks.filter((t) => t.status === 'Completed').length,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task status.');
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    if (project) {
      setProject({
        ...project,
        total_tasks: updatedTasks.length,
        completed_tasks: updatedTasks.filter((t) => t.status === 'Completed').length,
        progress: calculateProgress(updatedTasks),
      });
      // Refresh member list in case assignee was newly auto-added
      memberService.getMembers(project.id).then((m) => setMembers(m)).catch(() => {});
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    const updatedTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updatedTasks);
    if (project) {
      setProject({
        ...project,
        completed_tasks: updatedTasks.filter((t) => t.status === 'Completed').length,
        progress: calculateProgress(updatedTasks),
      });
      // Refresh member list in case assignee was newly auto-added
      memberService.getMembers(project.id).then((m) => setMembers(m)).catch(() => {});
    }
  };

  const handleTaskDeleted = (deletedTaskId: number) => {
    const updatedTasks = tasks.filter((t) => t.id !== deletedTaskId);
    setTasks(updatedTasks);
    if (project) {
      setProject({
        ...project,
        total_tasks: updatedTasks.length,
        completed_tasks: updatedTasks.filter((t) => t.status === 'Completed').length,
        progress: calculateProgress(updatedTasks),
      });
    }
  };

  const handleMemberAdded = (newMember: ProjectMember) => {
    setMembers((prev) => [...prev, newMember]);
    if (project) {
      setProject({ ...project, member_count: members.length + 1 });
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!project) return;
    await memberService.removeMember(project.id, userId);
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    // Also re-assign any tasks assigned to removed user
    setTasks((prev) =>
      prev.map((t) => (t.assigned_to === userId ? { ...t, assigned_to: null, assignee_name: undefined } : t))
    );
  };

  const handleSaveProjectSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    setError(null);
    try {
      const updated = await projectService.updateProject(project.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus as any,
        start_date: editStartDate || null,
        due_date: editDueDate || null,
      });
      setProject(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update project settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setDeletingProject(true);
    try {
      await projectService.deleteProject(project.id);
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project.');
      setIsDeleteProjectOpen(false);
    } finally {
      setDeletingProject(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project workspace & Kanban board..." />;
  }

  if (error && !project) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} onRetry={fetchProjectDetails} />
        <Link to="/projects">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {/* Project Hero Header (Requirement 26) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={project.status} />
              {permissions.isOwner && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Crown className="w-3.5 h-3.5" />
                  Owner
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight break-words">
              {project.name}
            </h1>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>

            <div className="flex items-center gap-6 pt-2 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  Due:{' '}
                  {project.due_date
                    ? new Date(project.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not specified'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{members.length} team members</span>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>
                  {project.completed_tasks} / {project.total_tasks} tasks completed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Progress Widget */}
          <div className="w-full lg:w-72 bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-4">
            <div>
              <ProgressBar progress={project.progress} showLabel size="md" />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setInitialTaskStatus('Todo');
                  setIsCreateTaskOpen(true);
                }}
              >
                New Task
              </Button>
              {permissions.isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Users className="w-3.5 h-3.5" />}
                  onClick={() => setIsAddMemberOpen(true)}
                  title="Invite Member"
                >
                  Invite
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'board'
              ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Kanban Board
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Team Members
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'meetings'
              ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Video className="w-4 h-4" />
          Meetings
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {projectMeetings.length}
          </span>
        </button>

        {permissions.isOwner && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Project Settings
          </button>
        )}
      </div>

      {/* Tab 1: Kanban Task Board (Requirements 29, 30) */}
      {activeTab === 'board' && (
        <TaskBoard
          tasks={tasks}
          canManageTasks={permissions.isMember || permissions.isOwner}
          onTaskClick={(task) => setSelectedTaskId(task.id)}
          onStatusChange={handleStatusChange}
          onAddTask={(initialStatus) => {
            setInitialTaskStatus(initialStatus);
            setIsCreateTaskOpen(true);
          }}
        />
      )}

      {/* Tab 2: Team Members (Requirements 27, 28) */}
      {activeTab === 'members' && (
        <MemberList
          members={members}
          isOwner={permissions.isOwner}
          onAddMemberClick={() => setIsAddMemberOpen(true)}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {/* Tab 3: Project Meetings */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Project Meetings</h3>
              <p className="text-xs text-slate-400">
                Scheduled standups and synchronized video calls for {project.name}.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsScheduleMeetingOpen(true)}
            >
              Schedule Meeting
            </Button>
          </div>

          {projectMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectMeetings.map((meeting) => {
                const startDate = new Date(meeting.start_time);
                const endDate = new Date(meeting.end_time || meeting.start_time);
                const formattedDate = startDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                const formattedTime = `${startDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })} - ${endDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`;

                return (
                  <div
                    key={meeting.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          {formattedDate} • {formattedTime}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {meeting.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 mb-1">{meeting.title}</h4>
                      {meeting.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {meeting.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>Host: {meeting.organizer_name || 'Team Member'}</span>
                        <span>{meeting.attendees?.length || 0} participants</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      {meeting.meeting_link && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(meeting.meeting_link || '');
                            setCopiedMeetingId(meeting.id);
                            setTimeout(() => setCopiedMeetingId(null), 2000);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-orange-400" />
                          <span>{copiedMeetingId === meeting.id ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      )}

                      {meeting.meeting_link && (
                        <a
                          href={meeting.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Call</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Video className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-slate-300">No meetings scheduled for this project</div>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Keep the team aligned by scheduling a quick sync or standup.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsScheduleMeetingOpen(true)}
              >
                Schedule First Meeting
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings & Edit Project (Requirements 26, 33) */}
      {activeTab === 'settings' && permissions.isOwner && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 mb-1">Edit Project Details</h3>
            <p className="text-xs text-slate-400 mb-6">
              Update project name, timeline, and execution status.
            </p>

            {settingsSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                Project settings updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProjectSettings} className="space-y-4">
              <Input
                label="Project Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-100 text-sm p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={[
                    { value: 'Planning', label: 'Planning' },
                    { value: 'Active', label: 'Active' },
                    { value: 'On Hold', label: 'On Hold' },
                    { value: 'Completed', label: 'Completed' },
                  ]}
                />

                <Input
                  type="date"
                  label="Start Date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />

                <Input
                  type="date"
                  label="Due Date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <Button type="submit" variant="primary" size="md" loading={savingSettings}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Danger Zone: Delete Project */}
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-rose-300">Delete This Project</h4>
                <p className="text-xs text-rose-300/80 mt-1">
                  Permanently remove this project, all its tasks, and team assignments from the database.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setIsDeleteProjectOpen(true)}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projectId={project.id}
        members={members}
        initialStatus={initialTaskStatus}
        onTaskCreated={handleTaskCreated}
      />

      <TaskDetailsModal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        members={members}
        canManageTasks={permissions.isMember || permissions.isOwner}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        projectId={project.id}
        existingMembers={members}
        onMemberAdded={handleMemberAdded}
      />

      <ConfirmDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}"? All related tasks and member associations will be deleted from MySQL.`}
        confirmText="Delete Project"
        loading={deletingProject}
      />

      <ScheduleMeetingModal
        isOpen={isScheduleMeetingOpen}
        onClose={() => setIsScheduleMeetingOpen(false)}
        onMeetingScheduled={(newM) => setProjectMeetings((prev) => [newM, ...prev])}
        initialProjectId={project.id}
      />
    </div>
  );
};
