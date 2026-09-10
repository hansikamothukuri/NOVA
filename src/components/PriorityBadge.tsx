import React from 'react';
import { TaskPriority } from '../types';
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  const getDetails = () => {
    switch (priority) {
      case 'Urgent':
        return {
          styles: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: <AlertCircle className="w-3 h-3 mr-1" />
        };
      case 'High':
        return {
          styles: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-3 h-3 mr-1" />
        };
      case 'Medium':
        return {
          styles: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          icon: <ArrowUp className="w-3 h-3 mr-1" />
        };
      case 'Low':
      default:
        return {
          styles: 'bg-slate-500/15 text-slate-400 border-slate-600/30',
          icon: <ArrowDown className="w-3 h-3 mr-1" />
        };
    }
  };

  const { styles, icon } = getDetails();

  return (
    <span
      id={`priority-badge-${priority.toLowerCase()}`}
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap ${styles}`}
    >
      {showIcon && icon}
      {priority}
    </span>
  );
};
