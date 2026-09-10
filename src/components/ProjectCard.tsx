import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckSquare, Users, Crown, ArrowRight } from 'lucide-react';
import { Project } from '../types';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { Avatar } from './Avatar';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const isOwner = project.user_role === 'Owner';

  const formattedDueDate = project.due_date
    ? new Date(project.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

  return (
    <div
      id={`project-card-${project.id}`}
      className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-orange-950/20"
    >
      <div>
        {/* Header: Title & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusBadge status={project.status} size="sm" />
              {isOwner ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Crown className="w-3 h-3" />
                  Owner
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                  Member
                </span>
              )}
            </div>

            <Link
              to={`/projects/${project.id}`}
              className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-orange-400 transition-colors block truncate"
            >
              {project.name}
            </Link>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-5 leading-relaxed">
          {project.description || 'No description provided for this project.'}
        </p>

        {/* Dynamic Progress Bar */}
        <div className="mb-5">
          <ProgressBar progress={project.progress} showLabel size="sm" />
        </div>
      </div>

      {/* Footer Info & Member Avatars */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300" title="Tasks completed">
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {project.completed_tasks}/{project.total_tasks}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300" title="Due Date">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{formattedDueDate}</span>
          </div>
        </div>

        {/* Team Avatars or Link */}
        <div className="flex items-center gap-2">
          {project.members && project.members.length > 0 ? (
            <div className="flex -space-x-1.5 overflow-hidden">
              {project.members.slice(0, 3).map((m) => (
                <Avatar key={m.user_id} src={m.avatar} name={m.name} size="xs" />
              ))}
              {project.members.length > 3 && (
                <span className="w-6 h-6 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold flex items-center justify-center border border-slate-700">
                  +{project.members.length - 3}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>{project.member_count}</span>
            </div>
          )}

          <Link
            to={`/projects/${project.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-colors ml-1"
            aria-label="View project details"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
