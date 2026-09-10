import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  Calendar,
  User,
  Video,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService, DashboardData } from '../services/dashboardService';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types';
import { ScheduleMeetingModal } from '../components/ScheduleMeetingModal';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ProgressBar } from '../components/ProgressBar';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { openCreateProject } = useOutletContext<{ openCreateProject: () => void }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');

  // Meetings state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [copiedMeetingId, setCopiedMeetingId] = useState<number | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, meetingsData] = await Promise.all([
        dashboardService.getStats(),
        meetingService.getMeetings().catch(() => []),
      ]);
      setData(statsData);
      setMeetings(meetingsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating workspace statistics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchStats} />;
  }

  if (!data) return null;

  const { stats, recentProjects, recentTasks } = data;

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      subtext: `${stats.activeProjects} active, ${stats.completedProjects} completed`,
      icon: FolderKanban,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      subtext: `${stats.completedTasks} completed`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks,
      subtext: `${stats.pendingTasks} pending in Todo`,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      subtext: stats.overdueTasks > 0 ? 'Requires attention' : 'All on track',
      icon: AlertTriangle,
      color: stats.overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400',
      bg: stats.overdueTasks > 0 ? 'bg-rose-500/10' : 'bg-slate-800/40',
      border: stats.overdueTasks > 0 ? 'border-rose-500/30' : 'border-slate-800',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is what is happening across your projects and milestones today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreateProject}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid (Requirement 20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.border} border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-slate-400 mt-1.5 font-medium">{card.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress Widget */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Overall Workspace Velocity</h3>
          </div>
          <p className="text-xs text-slate-400">
            {stats.completedTasks} of {stats.totalTasks} total tasks completed across all projects
          </p>
        </div>

        <div className="w-full sm:w-72">
          <ProgressBar progress={stats.overallCompletionRate} showLabel size="md" />
        </div>
      </div>

      {/* Meeting Schedule Section */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Meeting Schedule</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/30">
                  {meetings.filter((m) => m.status === 'Scheduled').length} upcoming
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upcoming video calls, milestone reviews, and team standups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/meetings"
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 mr-1"
            >
              View all syncs &rarr;
            </Link>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule Meeting
            </Button>
          </div>
        </div>

        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.slice(0, 3).map((meeting) => {
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
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        {formattedDate} • {formattedTime}
                      </span>
                      {meeting.project_name && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {meeting.project_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1 mb-1">
                      {meeting.title}
                    </h3>
                    {meeting.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {meeting.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 mb-3">
                      <span>Host: {meeting.organizer_name || 'Team Member'}</span>
                      <span>{meeting.attendees?.length || 1} attendees</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800">
            <Video className="w-8 h-8 text-orange-500/40 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">No upcoming meetings scheduled</div>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Coordinate discussions, sprint reviews, or architecture syncs with registered team members.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule First Meeting
            </Button>
          </div>
        )}
      </div>

      {/* Split Section: Recent Projects & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects (Requirement 21) */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-slate-100">Recent Projects</h2>
              </div>
              <Link
                to={projectStatusFilter === 'all' ? '/projects' : `/projects?status=${encodeURIComponent(projectStatusFilter)}`}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
              >
                View all &rarr;
              </Link>
            </div>

            {/* Status Tabs on Dashboard */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-800/60">
              {[
                { label: 'All Projects', value: 'all', count: recentProjects.length },
                { label: 'Planning', value: 'Planning', count: recentProjects.filter(p => (p.status || '').toLowerCase() === 'planning').length },
                { label: 'Active', value: 'Active', count: recentProjects.filter(p => (p.status || '').toLowerCase() === 'active').length },
                { label: 'On Hold', value: 'On Hold', count: recentProjects.filter(p => (p.status || '').toLowerCase().replace(/[\s-_]/g, '') === 'onhold').length },
                { label: 'Completed', value: 'Completed', count: recentProjects.filter(p => (p.status || '').toLowerCase() === 'completed').length },
              ].map((tab) => {
                const isSelected =
                  projectStatusFilter.toLowerCase().replace(/[\s-_]/g, '') ===
                  tab.value.toLowerCase().replace(/[\s-_]/g, '');

                return (
                  <button
                    key={tab.value}
                    onClick={() => setProjectStatusFilter(tab.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1 rounded-full font-bold ${
                        isSelected ? 'bg-orange-800 text-orange-200' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const displayedRecentProjects = recentProjects.filter((p) => {
                if (projectStatusFilter === 'all') return true;
                const normFilter = projectStatusFilter.toLowerCase().replace(/[\s-_]/g, '');
                const normStatus = (p.status || '').toLowerCase().replace(/[\s-_]/g, '');
                return normStatus === normFilter;
              });

              if (displayedRecentProjects.length > 0) {
                return (
                  <div className="space-y-4">
                    {displayedRecentProjects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}`}
                        className="block p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-sm font-bold text-slate-200 group-hover:text-orange-400 transition-colors truncate">
                            {project.name}
                          </h3>
                          <StatusBadge status={project.status} size="sm" />
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                          {project.description || 'No description provided.'}
                        </p>

                        <ProgressBar progress={project.progress} showLabel size="sm" />
                      </Link>
                    ))}
                  </div>
                );
              }

              return (
                <EmptyState
                  title={projectStatusFilter !== 'all' ? `No ${projectStatusFilter} projects` : 'No projects yet'}
                  description={
                    projectStatusFilter !== 'all'
                      ? `There are currently no projects with the "${projectStatusFilter}" status.`
                      : 'Create your first project to start organizing tasks and tracking progress.'
                  }
                  actionText={projectStatusFilter !== 'all' ? 'Show All Projects' : 'Create Project'}
                  onAction={projectStatusFilter !== 'all' ? () => setProjectStatusFilter('all') : openCreateProject}
                />
              );
            })()}
          </div>
        </div>

        {/* Recent Tasks (Requirement 22) */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-slate-100">Recent Tasks</h2>
              </div>
              <Link
                to="/projects"
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
              >
                Project Boards &rarr;
              </Link>
            </div>

            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-[11px] text-slate-400 truncate">
                          {task.project_name}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-orange-400 transition-colors truncate">
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={task.status} size="sm" />
                      {task.assignee_name ? (
                        <Avatar src={task.assignee_avatar} name={task.assignee_name} size="xs" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                          <User className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No tasks found"
                description="Tasks added to your projects will appear here in chronological order."
              />
            )}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onMeetingScheduled={(newM) => setMeetings((prev) => [newM, ...prev])}
      />
    </div>
  );
};
