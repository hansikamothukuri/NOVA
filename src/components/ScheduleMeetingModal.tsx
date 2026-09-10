import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Users,
  FolderKanban,
  Search,
  Link2,
  X,
  UserCheck,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { Avatar } from './Avatar';
import { Meeting, Project, ProjectMember, User } from '../types';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { memberService } from '../services/memberService';
import { meetingService, CreateMeetingPayload } from '../services/meetingService';
import { useAuth } from '../context/AuthContext';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingScheduled: (meeting: Meeting) => void;
  initialProjectId?: number | null;
  editingMeeting?: Meeting | null;
}

function isValidUrl(string: string): boolean {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onMeetingScheduled,
  initialProjectId,
  editingMeeting,
}) => {
  const { user: currentUser } = useAuth();

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:30');
  const [platform, setPlatform] = useState<'Google Meet' | 'Zoom' | 'Other'>('Google Meet');
  const [meetingLink, setMeetingLink] = useState('');

  // Team-based Recipients
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Optional Additional Members (e.g. Mentor, Manager, Faculty, External collaborator)
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [additionalMembers, setAdditionalMembers] = useState<User[]>([]);
  const [showAdditionalMembers, setShowAdditionalMembers] = useState(false);
  const [additionalSearch, setAdditionalSearch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset or Populate State when opened
  useEffect(() => {
    if (isOpen) {
      if (editingMeeting) {
        setTitle(editingMeeting.title);
        setDescription(editingMeeting.description || '');
        const pId = editingMeeting.project_id ? String(editingMeeting.project_id) : '';
        setProjectId(pId);

        const startDate = new Date(editingMeeting.start_time);
        setDate(startDate.toISOString().split('T')[0]);
        const startH = String(startDate.getHours()).padStart(2, '0');
        const startM = String(startDate.getMinutes()).padStart(2, '0');
        setStartTime(`${startH}:${startM}`);

        const endDate = new Date(editingMeeting.end_time || editingMeeting.start_time);
        const endH = String(endDate.getHours()).padStart(2, '0');
        const endM = String(endDate.getMinutes()).padStart(2, '0');
        setEndTime(`${endH}:${endM}`);

        setMeetingLink(editingMeeting.meeting_link || '');
        if (editingMeeting.platform) {
          setPlatform(editingMeeting.platform as any);
        } else if (editingMeeting.meeting_link?.includes('zoom.us')) {
          setPlatform('Zoom');
        } else if (editingMeeting.meeting_link?.includes('meet.google.com')) {
          setPlatform('Google Meet');
        } else {
          setPlatform('Other');
        }
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]);
        setStartTime('10:00');
        setEndTime('10:30');
        setTitle('');
        setDescription('');
        setMeetingLink('');
        setPlatform('Google Meet');
        setAdditionalMembers([]);
        setShowAdditionalMembers(false);
        setProjectId(initialProjectId ? String(initialProjectId) : '');
      }
      setError(null);
    }
  }, [isOpen, editingMeeting, initialProjectId]);

  // Load Projects & Workspace Users
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          userService.getAllUsers().catch(() => []),
          projectService.getProjects().catch(() => []),
        ]);
        setAvailableUsers(usersRes || []);
        setProjects(projectsRes || []);
      } catch (err: any) {
        console.error('Failed to load meeting dependencies', err);
      }
    };

    loadData();
  }, [isOpen]);

  // When projectId changes, auto-retrieve all members of that project
  useEffect(() => {
    if (!projectId) {
      setTeamMembers([]);
      return;
    }

    const loadProjectMembers = async () => {
      setLoadingMembers(true);
      try {
        // Fast-path: check if project already has members loaded
        const selectedProj = projects.find((p) => String(p.id) === String(projectId));
        if (selectedProj && selectedProj.members && selectedProj.members.length > 0) {
          setTeamMembers(selectedProj.members);
        }

        // Fresh fetch from API
        const members = await memberService.getMembers(projectId);
        setTeamMembers(members || []);
      } catch (err) {
        console.error('Failed to fetch project members', err);
        const selectedProj = projects.find((p) => String(p.id) === String(projectId));
        if (selectedProj && selectedProj.members) {
          setTeamMembers(selectedProj.members);
        }
      } finally {
        setLoadingMembers(false);
      }
    };

    loadProjectMembers();
  }, [projectId, projects]);

  // Handle start time change - automatically bump end time if needed
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    if (!newStartTime) return;
    const [h, m] = newStartTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const totalMin = h * 60 + m + 30;
    const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
    const endM = String(totalMin % 60).padStart(2, '0');
    setEndTime(`${endH}:${endM}`);
  };

  const addAdditionalMember = (user: User) => {
    if (additionalMembers.some((m) => m.id === user.id)) return;
    setAdditionalMembers((prev) => [...prev, user]);
    setAdditionalSearch('');
  };

  const removeAdditionalMember = (userId: number) => {
    setAdditionalMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  // Submit Handler with full validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Title
    if (!title.trim()) {
      setError('Please provide a meeting title.');
      return;
    }

    // 2. Validate Project Team Selection
    if (!projectId) {
      setError('Please select a project team. Meetings must be associated with a project team.');
      return;
    }

    // 3. Validate Date, Start Time and End Time
    if (!date) {
      setError('Please select a meeting date.');
      return;
    }
    if (!startTime) {
      setError('Please provide a start time.');
      return;
    }
    if (!endTime) {
      setError('Please provide an end time.');
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (isNaN(startDateTime.getTime())) {
      setError('Please enter a valid meeting date and start time.');
      return;
    }
    if (isNaN(endDateTime.getTime())) {
      setError('Please enter a valid meeting end time.');
      return;
    }
    if (endDateTime.getTime() <= startDateTime.getTime()) {
      setError('Meeting end time must be after the start time.');
      return;
    }

    // 4. Validate Meeting Link (Manual Entry)
    if (!meetingLink.trim()) {
      setError('Meeting link is required. Please paste your Zoom or Google Meet URL.');
      return;
    }

    if (!isValidUrl(meetingLink.trim())) {
      setError('Please enter a valid meeting URL (e.g., https://meet.google.com/xxx-yyyy-zzz or https://zoom.us/j/123456789).');
      return;
    }

    // 5. Validate that selected project has team members
    if (teamMembers.length === 0) {
      setError('The selected project has no registered team members. Please add members to the project first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: CreateMeetingPayload = {
        title: title.trim(),
        description: description.trim(),
        project_id: parseInt(projectId, 10),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        meeting_link: meetingLink.trim(),
        platform,
        additional_attendees: additionalMembers.map((u) => ({
          user_id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          role: u.title || 'Guest',
        })),
      };

      let result: Meeting;
      if (editingMeeting) {
        result = await meetingService.updateMeeting(editingMeeting.id, payload);
      } else {
        result = await meetingService.createMeeting(payload);
      }

      onMeetingScheduled(result);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save meeting schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter available users for optional additional members
  // Exclude members already in the selected project team or already added
  const teamMemberUserIds = new Set(teamMembers.map((m) => m.user_id));
  const additionalMemberUserIds = new Set(additionalMembers.map((m) => m.id));

  const eligibleExternalUsers = availableUsers.filter((u) => {
    if (teamMemberUserIds.has(u.id)) return false;
    if (additionalMemberUserIds.has(u.id)) return false;
    if (!additionalSearch.trim()) return true;
    const q = additionalSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const selectedProject = projects.find((p) => String(p.id) === String(projectId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMeeting ? 'Reschedule / Edit Meeting' : 'Schedule Team Meeting'}
      subtitle="Schedule synchronized video standups and meetings for your project team."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorMessage message={error} />}

        {/* 1. Meeting Title */}
        <Input
          id="meeting-title-input"
          label="Meeting Title"
          placeholder="e.g., Sprint Planning & Roadmap Sync"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        {/* 2. Select Project Team */}
        <div>
          <label
            htmlFor="project-team-select"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"
          >
            <FolderKanban className="w-3.5 h-3.5 text-orange-400" />
            Select Project Team <span className="text-orange-400">*</span>
          </label>
          <select
            id="project-team-select"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors cursor-pointer"
          >
            <option value="">-- Select Project Team --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Selecting a project team automatically targets and notifies all registered members of that project.
          </p>
        </div>

        {/* 3. Automatic Team-Based Recipients Display */}
        {projectId && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>
                  Team Members of <span className="text-orange-400">{selectedProject?.name || 'Project'}</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'})
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Auto-Included Recipients
              </span>
            </div>

            {loadingMembers ? (
              <div className="text-xs text-slate-400 py-2 text-center">
                Retrieving project team members...
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {teamMembers.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80"
                  >
                    <Avatar src={m.avatar} name={m.name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                        {m.name}
                        {currentUser && m.user_id === currentUser.id && (
                          <span className="text-[9px] px-1 rounded bg-orange-500/20 text-orange-400 font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{m.email}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                      {m.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  This project currently has no team members. Please add members to the project first.
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 italic">
              All team members listed above will automatically receive and view this meeting invitation.
            </p>
          </div>
        )}

        {/* 4. Date, Start Time & End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Meeting Date */}
          <div>
            <label
              htmlFor="meeting-date-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Meeting Date <span className="text-orange-400">*</span>
            </label>
            <input
              id="meeting-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>

          {/* Start Time */}
          <div>
            <label
              htmlFor="meeting-start-time"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              Start Time <span className="text-orange-400">*</span>
            </label>
            <input
              id="meeting-start-time"
              type="time"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>

          {/* End Time */}
          <div>
            <label
              htmlFor="meeting-end-time"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              End Time <span className="text-orange-400">*</span>
            </label>
            <input
              id="meeting-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* 5. Meeting Platform & Meeting Link (Manual Entry) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Meeting Platform */}
          <div>
            <label
              htmlFor="meeting-platform-select"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-orange-400" />
              Platform
            </label>
            <select
              id="meeting-platform-select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors cursor-pointer"
            >
              <option value="Google Meet">Google Meet</option>
              <option value="Zoom">Zoom</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Meeting Link (Manual Entry) */}
          <div className="sm:col-span-2">
            <label
              htmlFor="meeting-link-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5 text-orange-400" />
              Meeting Link <span className="text-orange-400">*</span>
            </label>
            <div className="relative">
              <input
                id="meeting-link-input"
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder={
                  platform === 'Google Meet'
                    ? 'https://meet.google.com/xxx-yyyy-zzz'
                    : platform === 'Zoom'
                    ? 'https://zoom.us/j/1234567890'
                    : 'https://...'
                }
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Paste your {platform === 'Google Meet' ? 'Google Meet URL' : platform === 'Zoom' ? 'Zoom meeting URL' : 'meeting room URL'}. The link will not be altered.
            </p>
          </div>
        </div>

        {/* 6. Description / Agenda */}
        <div>
          <label
            htmlFor="meeting-agenda-textarea"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            Agenda / Description
          </label>
          <textarea
            id="meeting-agenda-textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key discussion points, agenda links, or review notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
        </div>

        {/* 7. Optional Additional Members (Mentor, Manager, Faculty, External Collaborator) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-orange-400" />
              Additional Members (Optional)
            </label>
            <button
              id="toggle-additional-members-btn"
              type="button"
              onClick={() => setShowAdditionalMembers(!showAdditionalMembers)}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium cursor-pointer"
            >
              {showAdditionalMembers
                ? 'Hide selector'
                : `+ Invite external (Mentor, Manager, etc.)${additionalMembers.length > 0 ? ` (${additionalMembers.length})` : ''}`}
            </button>
          </div>

          {/* List of currently selected additional members */}
          {additionalMembers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              {additionalMembers.map((am) => (
                <span
                  key={am.id}
                  className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg pl-2 pr-1.5 py-1 text-xs text-slate-200"
                >
                  <Avatar src={am.avatar} name={am.name} size="xs" />
                  <span className="font-medium text-slate-200">{am.name}</span>
                  <span className="text-[10px] text-slate-400">({am.title || 'Guest'})</span>
                  <button
                    type="button"
                    onClick={() => removeAdditionalMember(am.id)}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Remove member"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Additional members dropdown search when expanded */}
          {showAdditionalMembers && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <p className="text-[11px] text-slate-400">
                Invite someone who is not part of the selected project team (e.g. Mentor, Manager, Faculty, External collaborator).
              </p>
              <div className="relative">
                <input
                  id="search-additional-members-input"
                  type="text"
                  placeholder="Search user by name or email..."
                  value={additionalSearch}
                  onChange={(e) => setAdditionalSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {eligibleExternalUsers.length > 0 ? (
                  eligibleExternalUsers.slice(0, 10).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => addAdditionalMember(u)}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={u.avatar} name={u.name} size="xs" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-orange-400 font-medium">+ Add</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-2">
                    {additionalSearch
                      ? 'No matching workspace users found.'
                      : 'All available users are already included.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            id="cancel-meeting-btn"
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            id="submit-meeting-btn"
            variant="primary"
            type="submit"
            loading={isSubmitting}
          >
            {editingMeeting ? 'Update Schedule' : 'Schedule Team Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
