import React from 'react';
import { Calendar, User, MoreVertical } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange }) => {
  const formattedDue = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const isOverdue =
    task.due_date &&
    task.status !== 'Completed' &&
    new Date(task.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  return (
    <div
      id={`task-card-${task.id}`}
      onClick={() => onClick && onClick(task)}
      className="group relative bg-slate-900 border border-slate-800/90 hover:border-orange-500/50 rounded-xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer select-none"
    >
      {/* Top Row: Priority & Project/Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        
        {/* Status Dropdown Quick-Selector */}
        {onStatusChange && (
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
            className="text-[11px] bg-slate-950/80 border border-slate-700/60 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        )}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-orange-300 transition-colors line-clamp-2 mb-1.5 leading-snug">
        {task.title}
      </h4>

      {/* Task Description snippet if available */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer: Due Date & Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          {formattedDue ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] ${
                isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {formattedDue}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No deadline</span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {task.assignee_name ? (
            <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee_name}`}>
              <Avatar src={task.assignee_avatar} name={task.assignee_name} size="xs" />
              <span className="text-[11px] text-slate-300 hidden sm:inline max-w-[80px] truncate">
                {task.assignee_name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400" title="Unassigned">
              <User className="w-3 h-3" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
