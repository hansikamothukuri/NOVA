import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  Folder,
} from 'lucide-react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { ErrorMessage } from './ErrorMessage';
import { ConfirmDialog } from './ConfirmDialog';
import { taskService } from '../services/taskService';
import { userService, RegisteredUser } from '../services/userService';
import { ProjectMember, Task, TaskPriority, TaskStatus } from '../types';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  members: ProjectMember[];
  canManageTasks?: boolean;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: number) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  taskId,
  members,
  canManageTasks = true,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
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
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails(taskId);
      setIsEditing(false);
      userService.getAllUsers()
        .then((users) => setRegisteredUsers(users))
        .catch(() => {});
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTaskById(id);
      setTask(data.task);
      setEditTitle(data.task.title);
      setEditDescription(data.task.description || '');
      setEditAssignedTo(data.task.assigned_to ? String(data.task.assigned_to) : '');
      setEditStatus(data.task.status);
      setEditPriority(data.task.priority);
      setEditDueDate(data.task.due_date ? data.task.due_date.slice(0, 10) : '');
    } catch (err: any) {
      setError(err.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

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

      setTask(updated);
      setIsEditing(false);
      onTaskUpdated(updated);
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
      setTask(updated);
      setEditStatus(newStatus);
      onTaskUpdated(updated);
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
      onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

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
  if (task?.assigned_to && !seenIds.has(task.assigned_to) && task.assignee_name) {
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Task' : task?.title || 'Task Details'}
        subtitle={task?.project_name ? `Project: ${task.project_name}` : undefined}
        maxWidth="lg"
      >
        {error && <ErrorMessage message={error} className="mb-4" />}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : task ? (
          isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="Task Title *"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-100 text-sm p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Assignee"
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  options={memberOptions}
                />

                <Input
                  type="date"
                  label="Due Date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
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
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Badges & Quick Status */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Change Status:</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleQuickStatusChange(e.target.value as TaskStatus)}
                    className="text-xs bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Description
                </h4>
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 text-sm text-slate-300 leading-relaxed min-h-[80px]">
                  {task.description || 'No detailed description provided.'}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Assignee */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1.5 font-medium">Assignee</span>
                  {task.assignee_name ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar src={task.assignee_avatar} name={task.assignee_name} size="sm" />
                      <div>
                        <div className="font-semibold text-slate-200">{task.assignee_name}</div>
                        <div className="text-[11px] text-slate-400">{task.assignee_email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 py-1">
                      <User className="w-4 h-4" />
                      <span>Unassigned</span>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1.5 font-medium">Due Date</span>
                  <div className="flex items-center gap-2 text-slate-200 font-semibold py-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No deadline'}
                    </span>
                  </div>
                </div>

                {/* Creator */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1 font-medium">Created By</span>
                  <div className="text-slate-200 font-medium">{task.creator_name || 'Project Member'}</div>
                </div>

                {/* Created At */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1 font-medium">Created Date</span>
                  <div className="text-slate-300">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {canManageTasks ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setIsConfirmDeleteOpen(true)}
                  >
                    Delete Task
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  {canManageTasks && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Edit3 className="w-4 h-4" />}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button type="button" variant="primary" size="sm" onClick={onClose}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )
        ) : null}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        loading={deleting}
      />
    </>
  );
};
