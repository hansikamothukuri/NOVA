import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  Folder,
  User,
  AlertCircle,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { memberService } from '../services/memberService';
import { userService, RegisteredUser } from '../services/userService';
import { Task, TaskPriority, TaskStatus, ProjectMember } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const TaskDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [permissions, setPermissions] = useState<{
    canEdit: boolean;
    canDelete: boolean;
    isOwner: boolean;
  }>({
    canEdit: false,
    canDelete: false,
    isOwner: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState<string>('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('Todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium');
  const [editDueDate, setEditDueDate] = useState('');

  // Delete Confirm Dialog state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchTaskDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTaskById(id);
      setTask(data.task);
      setPermissions(data.permissions);

      setEditTitle(data.task.title);
      setEditDescription(data.task.description || '');
      setEditAssignedTo(data.task.assigned_to ? String(data.task.assigned_to) : '');
      setEditStatus(data.task.status);
      setEditPriority(data.task.priority);
      setEditDueDate(data.task.due_date ? data.task.due_date.slice(0, 10) : '');

      // Load project members for assignee selection
      if (data.task.project_id) {
        try {
          const projectMembers = await memberService.getMembers(data.task.project_id);
          setMembers(projectMembers);
        } catch {
          // If loading members fails non-fatally, keep empty members list
        }
      }

      // Load all registered users so any registered person can be assigned
      try {
        const users = await userService.getAllUsers();
        setRegisteredUsers(users);
      } catch {
        // non-fatal
      }

      // Load all registered users so any registered person can be assigned
      try {
        const users = await userService.getAllUsers();
        setRegisteredUsers(users);
      } catch {
        // non-fatal
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!editTitle.trim()) {
      setError('Task title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await taskService.updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        assigned_to: editAssignedTo ? Number(editAssignedTo) : null,
        status: editStatus,
        priority: editPriority,
        due_date: editDueDate || null,
      });

      // Update local task with updated data
      setTask((prev) => (prev ? { ...prev, ...updated } : updated));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const updated = await taskService.updateTaskStatus(task.id, newStatus);
      setTask((prev) => (prev ? { ...prev, ...updated, status: newStatus } : updated));
      setEditStatus(newStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await taskService.deleteTask(task.id);
      setIsConfirmDeleteOpen(false);
      navigate(`/projects/${task.project_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading task details..." />;
  }

  if (error && !task) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <ErrorMessage message={error} onRetry={fetchTaskDetails} />
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100 mb-2">Task Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">The requested task could not be located or you may not have access to it.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
          View Projects
        </Button>
      </div>
    );
  }

  // Compile assignee list prioritizing all registered users
  const activeUserList: { id: number; name: string; email: string; title?: string }[] = [];
  const seenIds = new Set<number>();

  if (registeredUsers.length > 0) {
    registeredUsers.forEach((u) => {
      if (!seenIds.has(u.id)) {
        seenIds.add(u.id);
        activeUserList.push(u);
      }
    });
  }

  // Ensure any project members not in registeredUsers are also included
  members.forEach((m) => {
    if (!seenIds.has(m.user_id)) {
      seenIds.add(m.user_id);
      activeUserList.push({
        id: m.user_id,
        name: m.name,
        email: m.email,
        title: m.title,
      });
    }
  });

  // Ensure current task assignee is in the list
  if (task.assigned_to && !seenIds.has(task.assigned_to) && task.assignee_name) {
    seenIds.add(task.assigned_to);
    activeUserList.push({
      id: task.assigned_to,
      name: task.assignee_name,
      email: task.assignee_email || '',
    });
  }

  const memberOptions = [
    { value: '', label: 'Unassigned' },
    ...activeUserList.map((u) => ({
      value: String(u.id),
      label: `${u.name} (${u.email})${u.title ? ` — ${u.title}` : ''}`,
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (task.project_id) {
                navigate(`/projects/${task.project_id}`);
              } else {
                navigate(-1);
              }
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            id="task-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Project</span>
          </button>

          {task.project_name && (
            <Link
              to={`/projects/${task.project_id}`}
              className="hidden sm:flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{task.project_name}</span>
            </Link>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {permissions.canDelete && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setIsConfirmDeleteOpen(true)}
              id="delete-task-button"
            >
              Delete
            </Button>
          )}

          {permissions.canEdit && !isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
              onClick={() => setIsEditing(true)}
              id="edit-task-button"
            >
              Edit Task
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}

      {isEditing ? (
        /* Edit Form Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-orange-400" />
              <span>Editing Task #{task.id}</span>
            </h2>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Cancel editing"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            <Input
              label="Task Title *"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g., Design authentication flow"
              required
              id="edit-task-title-input"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={6}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Provide detailed instructions, context, or acceptance criteria..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm p-3.5 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                id="edit-task-description-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assignee"
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
                options={memberOptions}
                id="edit-task-assignee-select"
              />

              <Input
                type="date"
                label="Due Date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                id="edit-task-due-date-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                options={[
                  { value: 'Todo', label: 'Todo' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Review', label: 'Review' },
                  { value: 'Completed', label: 'Completed' },
                ]}
                id="edit-task-status-select"
              />

              <Select
                label="Priority"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' },
                ]}
                id="edit-task-priority-select"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={saving}
                icon={<Save className="w-4 h-4" />}
                id="save-task-changes-button"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header: Title & Badges */}
              <div>
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="text-xs text-slate-500 font-mono">#{task.id}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
                  {task.title}
                </h1>
              </div>

              {/* Description Body */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Description
                </h3>
                <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {task.description ? (
                    task.description
                  ) : (
                    <span className="text-slate-500 italic">No description provided for this task.</span>
                  )}
                </div>
              </div>

              {/* Quick Status Control */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-slate-300">Update Workflow Status:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['Todo', 'In Progress', 'Review', 'Completed'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleQuickStatusChange(st)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        task.status === st
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                      }`}
                      id={`status-pill-${st.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Metadata (Right 1 col) */}
          <div className="space-y-6">
            {/* Project Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Project
              </span>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-200 truncate">
                      {task.project_name || 'Project'}
                    </span>
                  </div>
                  <Link
                    to={`/projects/${task.project_id}`}
                    className="text-slate-400 hover:text-orange-400 transition-colors p-1"
                    title="Open project board"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Assignee Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Assignee
              </span>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                {task.assignee_name ? (
                  <div className="flex items-center gap-3">
                    <Avatar src={task.assignee_avatar} name={task.assignee_name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{task.assignee_name}</p>
                      <p className="text-xs text-slate-400 truncate">{task.assignee_email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-400 py-1">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Unassigned</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Dates & Timestamps
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </span>
                  <span className="font-semibold text-slate-200">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No deadline'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Created Date
                  </span>
                  <span className="text-slate-300">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {task.creator_name && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400">Created By</span>
                    <span className="text-slate-200 font-medium">{task.creator_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        loading={deleting}
      />
    </div>
  );
};
