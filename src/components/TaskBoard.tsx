import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, Eye, ListTodo } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onAddTask?: (initialStatus: TaskStatus) => void;
  canManageTasks?: boolean;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  colorClasses: string;
  borderClasses: string;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
  onAddTask,
  canManageTasks = true,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const columns: ColumnConfig[] = [
    {
      id: 'Todo',
      title: 'TODO',
      icon: <ListTodo className="w-4 h-4 text-slate-400" />,
      colorClasses: 'bg-slate-500/10 text-slate-300',
      borderClasses: 'border-slate-700/60',
    },
    {
      id: 'In Progress',
      title: 'IN PROGRESS',
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      colorClasses: 'bg-blue-500/10 text-blue-400',
      borderClasses: 'border-blue-500/30',
    },
    {
      id: 'Review',
      title: 'REVIEW',
      icon: <Eye className="w-4 h-4 text-purple-400" />,
      colorClasses: 'bg-purple-500/10 text-purple-400',
      borderClasses: 'border-purple-500/30',
    },
    {
      id: 'Completed',
      title: 'COMPLETED',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      colorClasses: 'bg-emerald-500/10 text-emerald-400',
      borderClasses: 'border-emerald-500/30',
    },
  ];

  // Drag & drop handlers for Kanban columns
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      onStatusChange(task, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            id={`kanban-col-${col.id.toLowerCase().replace(/\s+/g, '-')}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 min-h-[420px] transition-colors"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  {col.icon}
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {col.title}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.colorClasses} ${col.borderClasses}`}>
                  {colTasks.length}
                </span>
              </div>

              {canManageTasks && onAddTask && (
                <button
                  onClick={() => onAddTask(col.id)}
                  title={`Add task to ${col.title}`}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Task List in Column */}
            <div className="space-y-3 flex-1 flex flex-col">
              {colTasks.length > 0 ? (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="transition-transform active:scale-95"
                  >
                    <TaskCard
                      task={task}
                      onClick={onTaskClick}
                      onStatusChange={onStatusChange}
                    />
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-800/80 rounded-xl text-center">
                  <p className="text-xs text-slate-400 mb-2">No tasks in {col.title.toLowerCase()}</p>
                  {canManageTasks && onAddTask && (
                    <button
                      onClick={() => onAddTask(col.id)}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
