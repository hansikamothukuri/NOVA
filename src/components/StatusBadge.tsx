import React from 'react';
import { ProjectStatus, TaskStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      // Projects
      case 'Planning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Active':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'On Hold':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      // Tasks & Projects
      case 'Completed':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      case 'Todo':
        return 'bg-slate-500/20 text-slate-300 border-slate-600/40';
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Review':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      id={`status-badge-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center font-medium rounded-md border whitespace-nowrap ${sizeClasses} ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
