import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { projectService } from '../services/projectService';
import { Project, ProjectStatus } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('Planning');
    setStartDate('');
    setDueDate('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setError('Due date cannot be earlier than start date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await projectService.createProject({
        name: name.trim(),
        description: description.trim(),
        status,
        start_date: startDate || null,
        due_date: dueDate || null,
      });

      resetForm();
      onProjectCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      subtitle="Define project goals, timeline, and collaboration settings"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <Input
          label="Project Name *"
          placeholder="e.g., Q3 Mobile App Launch"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Briefly describe the objective, scope, and target outcomes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg text-slate-100 text-sm p-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
