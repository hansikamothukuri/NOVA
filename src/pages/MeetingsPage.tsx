import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  Users,
  FolderKanban,
  CheckCircle2,
  Copy,
  ExternalLink,
  MoreVertical,
  CalendarCheck,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Meeting, Project } from '../types';
import { meetingService } from '../services/meetingService';
import { projectService } from '../services/projectService';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ScheduleMeetingModal } from '../components/ScheduleMeetingModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'today' | 'completed'>('upcoming');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [meetingsData, projectsData] = await Promise.all([
        meetingService.getMeetings(),
        projectService.getProjects().catch(() => []),
      ]);
      setMeetings(meetingsData || []);
      setProjects(projectsData || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCopyLink = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!meeting.meeting_link) return;
    navigator.clipboard.writeText(meeting.meeting_link);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await meetingService.deleteMeeting(meetingToDelete.id);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingToDelete.id));
      setMeetingToDelete(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const handleMeetingSaved = (savedMeeting: Meeting) => {
    setMeetings((prev) => {
      const exists = prev.some((m) => m.id === savedMeeting.id);
      if (exists) {
        return prev.map((m) => (m.id === savedMeeting.id ? savedMeeting : m));
      }
      return [savedMeeting, ...prev];
    });
  };

  // Status and time categorization
  const now = new Date();
  const todayDateStr = now.toDateString();

  const isToday = (dateStr: string) => new Date(dateStr).toDateString() === todayDateStr;
  const isUpcoming = (dateStr: string) => new Date(dateStr) >= now;
  const isPast = (dateStr: string) => new Date(dateStr) < now;

  // Filtered dataset
  const filteredMeetings = meetings.filter((m) => {
    // Project filter
    if (selectedProjectId !== 'all') {
      if (String(m.project_id) !== selectedProjectId) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchDesc = m.description && m.description.toLowerCase().includes(q);
      const matchProject = m.project_name && m.project_name.toLowerCase().includes(q);
      const matchAttendee = m.attendees.some(
        (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchProject && !matchAttendee) return false;
    }

    // Tab filter
    if (filterTab === 'upcoming') {
      return isUpcoming(m.start_time) && m.status !== 'Completed' && m.status !== 'Cancelled';
    }
    if (filterTab === 'today') {
      return isToday(m.start_time);
    }
    if (filterTab === 'completed') {
      return m.status === 'Completed' || (isPast(m.end_time || m.start_time) && m.status !== 'Cancelled');
    }

    return true;
  });

  // Calculate Metrics
  const totalCount = meetings.length;
  const upcomingCount = meetings.filter((m) => isUpcoming(m.start_time) && m.status === 'Scheduled').length;
  const todayCount = meetings.filter((m) => isToday(m.start_time)).length;
  const completedCount = meetings.filter((m) => m.status === 'Completed' || isPast(m.end_time || m.start_time)).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-orange-500" />
            Schedule Meetings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Coordinate standups, roadmap reviews, and synchronized video calls with registered team members.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingMeeting(null);
            setIsScheduleModalOpen(true);
          }}
        >
          Schedule Meeting
        </Button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Syncs</span>
            <CalendarCheck className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Recorded calls</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Upcoming</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{upcomingCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">On the calendar</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's Sessions</span>
            <Video className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-orange-400">{todayCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Scheduled for today</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{completedCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Past discussions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search meetings by title, description, or attendee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Project Filter Dropdown */}
          <div className="w-full md:w-64 shrink-0">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Projects & Syncs</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  Project: {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            View:
          </span>
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
            { key: 'today', label: 'Today', count: todayCount },
            { key: 'all', label: 'All Meetings', count: totalCount },
            { key: 'completed', label: 'Past / Completed', count: completedCount },
          ].map((tab) => {
            const isSelected = filterTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-orange-800/80 text-orange-200' : 'bg-slate-700/80 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting) => {
            const startDate = new Date(meeting.start_time);
            const endDate = new Date(meeting.end_time || meeting.start_time);

            const isOrganizer = user && meeting.organizer_id === user.id;
            const isCallToday = isToday(meeting.start_time);
            const isCallPast = isPast(meeting.end_time || meeting.start_time);

            const formattedDate = startDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            const formattedTimeRange = `${startDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })} - ${endDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}`;

            return (
              <div
                key={meeting.id}
                className="bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Date & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          isCallToday
                            ? 'bg-orange-500/15 text-orange-400 border-orange-500/30 animate-pulse'
                            : isCallPast
                            ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {isCallToday ? 'Today' : formattedDate}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        {formattedTimeRange}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {meeting.platform && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          {meeting.platform}
                        </span>
                      )}

                      {/* Associated Project Pill */}
                      {meeting.project_name ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800/70 px-2 py-0.5 rounded-md border border-slate-700 truncate max-w-[150px]">
                          <FolderKanban className="w-3 h-3 text-orange-400 shrink-0" />
                          <span className="truncate">{meeting.project_name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          General Sync
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-orange-400 transition-colors mb-1.5 line-clamp-1">
                    {meeting.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {meeting.description || 'No detailed agenda provided for this meeting.'}
                  </p>

                  {/* Organizer & Attendees Section */}
                  <div className="space-y-2 mb-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Host & Attendees ({meeting.attendees?.length || 1})
                      </span>
                      {meeting.organizer_name && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          Host: <strong className="text-slate-300 font-semibold">{meeting.organizer_name}</strong>
                        </span>
                      )}
                    </div>

                    {/* Attendee Avatars with Hover Names */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {meeting.attendees && meeting.attendees.length > 0 ? (
                        meeting.attendees.map((attendee) => (
                          <div
                            key={attendee.user_id}
                            className="inline-flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-lg text-xs text-slate-300"
                            title={attendee.email}
                          >
                            <Avatar src={attendee.avatar} name={attendee.name} size="xs" />
                            <span className="truncate max-w-[100px] text-[11px]">
                              {attendee.name.split(' ')[0]}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No attendees added</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Join Call & Manage */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {meeting.meeting_link && (
                      <button
                        onClick={(e) => handleCopyLink(meeting, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
                        title="Copy meeting video link"
                      >
                        <Copy className="w-3 h-3 text-orange-400" />
                        <span>{copiedId === meeting.id ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    )}

                    {isOrganizer && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMeeting(meeting);
                            setIsScheduleModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-orange-400 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
                          title="Reschedule / Edit meeting"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setMeetingToDelete(meeting)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
                          title="Cancel meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Direct Join Action */}
                  {meeting.meeting_link ? (
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-950/50 transition-all hover:scale-[1.02]"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No link provided</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={searchQuery ? 'No matching meetings found' : 'No meetings scheduled yet'}
          description={
            searchQuery
              ? `No meetings match your search query "${searchQuery}".`
              : 'Schedule your first team sync or project standup to collaborate in real time with registered team members.'
          }
          actionText="Schedule Meeting"
          onAction={() => {
            setEditingMeeting(null);
            setIsScheduleModalOpen(true);
          }}
        />
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingMeeting(null);
        }}
        onMeetingScheduled={handleMeetingSaved}
        editingMeeting={editingMeeting}
      />

      {/* Delete/Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!meetingToDelete}
        onClose={() => setMeetingToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Cancel Scheduled Meeting"
        message={`Are you sure you want to cancel "${meetingToDelete?.title}"? All participants will be notified and the meeting link will be invalidated.`}
        confirmText="Cancel Meeting"
        variant="danger"
      />
    </div>
  );
};
