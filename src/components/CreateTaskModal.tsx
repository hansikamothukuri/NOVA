import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { taskService } from '../services/taskService';
import { userService, RegisteredUser } from '../services/userService';
import { ProjectMember, Task, TaskPriority, TaskStatus } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: ProjectMember[];
  initialStatus?: TaskStatus;
  onTaskCreated: (newTask: Task) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  members,
  initialStatus = 'Todo',
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List of all registered users in the system
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStatus(initialStatus);
      // Fetch all registered persons so the user can assign to any registered user
      userService.getAllUsers()
        .then((users) => {
          setRegisteredUsers(users);
        })
        .catch(() => {
          // Fall back gracefully to project members
        });
    }
  }, [isOpen, initialStatus]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setStatus(initialStatus);
    setPriority('Medium');
    setDueDate('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await taskService.createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo ? Number(assignedTo) : null,
        status,
        priority,
        due_date: dueDate || null,
      });

      resetForm();
      onTaskCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  // Ensure any project members not in registeredUsers are also present
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

  const memberOptions = [
    { value: '', label: 'Unassigned' },
    ...activeUserList.map((u) => ({
      value: String(u.id),
      label: `${u.name} (${u.email})${u.title ? ` — ${u.title}` : ''}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      subtitle="Add a task item with timeline, priority, and team ownership"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <Input
          label="Task Title *"
          placeholder="e.g., Integrate OAuth login callback"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Outline task details, acceptance criteria, or technical references..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-100 text-sm p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            options={memberOptions}
          />

          <Input
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={[
              { value: 'Todo', label: 'Todo' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Review', label: 'Review' },
              { value: 'Completed', label: 'Completed' },
            ]}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
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
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
