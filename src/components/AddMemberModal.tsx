import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Send,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  Search,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { ErrorMessage } from './ErrorMessage';
import { memberService } from '../services/memberService';
import { userService, RegisteredUser } from '../services/userService';
import { ProjectMember } from '../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  existingMembers?: ProjectMember[];
  onMemberAdded: (member: ProjectMember) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  existingMembers = [],
  onMemberAdded,
}) => {
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [role, setRole] = useState<'Member' | 'Owner'>('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registered users directory
  const [allUsers, setAllUsers] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState<'directory' | 'manual'>('directory');

  // States for unregistered member invitation flow
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showDirectInviteCard, setShowDirectInviteCard] = useState(false);

  const resetForm = () => {
    setEmail('');
    setSelectedUser(null);
    setRole('Member');
    setError(null);
    setSearchTerm('');
    setUnregisteredEmail(null);
    setCopiedLink(false);
    setCopiedMessage(false);
    setShowDirectInviteCard(false);
    setMode('directory');
  };

  useEffect(() => {
    if (isOpen) {
      loadRegisteredUsers();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const loadRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await userService.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.warn('Failed to load registered users directory:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const existingUserIds = new Set(existingMembers.map((m) => m.user_id));

  // Users who are not yet members
  const candidateUsers = allUsers.filter((u) => !existingUserIds.has(u.id));

  const filteredCandidates = candidateUsers.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.title && u.title.toLowerCase().includes(term))
    );
  });

  const activeEmailForInvite = unregisteredEmail || email.trim();
  const inviteUrl = `${window.location.origin}/register?invite_project=${projectId}${
    activeEmailForInvite ? `&email=${encodeURIComponent(activeEmailForInvite)}` : ''
  }`;

  const invitationSubject = `Invitation to collaborate on NOVA`;
  const invitationBody = `Hi,\n\nYou have been invited to join our project workspace on NOVA.\n\nPlease click the link below to create your account and automatically join this project:\n\n${inviteUrl}\n\nLooking forward to collaborating with you!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(invitationBody);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleAddSelectedUser = async (userToAdd: RegisteredUser) => {
    setLoading(true);
    setError(null);
    try {
      const added = await memberService.addMember(projectId, userToAdd.email, role);
      resetForm();
      onMemberAdded(added);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add member to project.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (selectedUser ? selectedUser.email : email).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please select a team member or enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setUnregisteredEmail(null);

    try {
      const added = await memberService.addMember(projectId, cleanEmail, role);
      resetForm();
      onMemberAdded(added);
      onClose();
    } catch (err: any) {
      const isNotFound =
        err.status === 404 ||
        err.data?.notRegistered ||
        (err.message &&
          (err.message.toLowerCase().includes('not registered') ||
            err.message.toLowerCase().includes('not found') ||
            err.message.toLowerCase().includes('register first')));

      if (isNotFound) {
        setUnregisteredEmail(cleanEmail);
        setError(null);
      } else {
        setError(err.message || 'Failed to add member to project.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Team Member"
      subtitle="Select an existing team member by name or invite someone new"
      maxWidth="lg"
    >
      {/* 1. When the invited user is not registered: Keep a link to send to the inviting person to Register */}
      {unregisteredEmail ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-orange-300">User not registered on NOVA</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  No existing NOVA account was found for <strong className="text-white">{unregisteredEmail}</strong>.
                  Send them the registration link below so they can create an account and immediately join this project workspace.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Registration & Project Invite Link</span>
              <span className="text-[11px] text-orange-400 font-normal">Pre-filled with their email</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs p-3 font-mono focus:outline-none focus:border-orange-500 selection:bg-orange-500/30"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCopyLink}
                icon={copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                className="shrink-0"
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <a
              href={`mailto:${encodeURIComponent(unregisteredEmail)}?subject=${encodeURIComponent(
                invitationSubject
              )}&body=${encodeURIComponent(invitationBody)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-orange-400" />
              <span>Email Invite Directly</span>
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-orange-950/40 hover:bg-orange-900/50 text-orange-200 border border-orange-500/40 hover:border-orange-500 transition-colors cursor-pointer"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
              <span>{copiedMessage ? 'Message Copied!' : 'Copy Invitation Message'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setUnregisteredEmail(null);
                setError(null);
              }}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Try another member
            </button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <ErrorMessage message={error} />}

          {/* Mode Switcher: Directory vs Custom Email */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('directory')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'directory'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Select Registered Team Member ({candidateUsers.length} available)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'manual'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Enter Email / Invite Link</span>
            </button>
          </div>

          {/* Role selection common to both modes */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <Select
              label="Assigned Project Role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'Member' | 'Owner')}
              options={[
                { value: 'Member', label: 'Member (Can view, create & update tasks, attend meetings)' },
                { value: 'Owner', label: 'Owner (Full administrative control, settings & delete rights)' },
              ]}
            />
          </div>

          {/* MODE 1: Directory with visible names */}
          {mode === 'directory' && (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search team members by name, title, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Candidates List with explicit names */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
                {loadingUsers ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading team directory...</div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {candidateUsers.length === 0
                      ? 'All registered team members are already part of this project!'
                      : 'No matching team members found.'}
                  </div>
                ) : (
                  filteredCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-2.5 rounded-xl hover:bg-slate-800/60 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={cand.avatar} name={cand.name} size="md" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                            <span>{cand.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 truncate">{cand.email}</div>
                          {cand.title && (
                            <div className="text-[11px] text-orange-400/90 font-medium truncate">{cand.title}</div>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={loading}
                        onClick={() => handleAddSelectedUser(cand)}
                        icon={<UserPlus className="w-3.5 h-3.5" />}
                        className="shrink-0"
                      >
                        Add to Project
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MODE 2: Manual Email / Invite Link */}
          {mode === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="User Email Address *"
                type="email"
                placeholder="e.g. colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoFocus
                helperText="If the user is not yet registered on NOVA, you'll receive a direct registration invite link."
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  Add by Email
                </Button>
              </div>
            </form>
          )}

          {/* Quick toggle to view generic registration invite link */}
          <div className="pt-2 border-t border-slate-800">
            {!showDirectInviteCard ? (
              <button
                type="button"
                onClick={() => setShowDirectInviteCard(true)}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Inviting someone not on this list? Share direct registration link</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-orange-400" />
                    Direct Registration Invite Link
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDirectInviteCard(false)}
                    className="text-slate-500 hover:text-slate-300 text-[11px] cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 text-xs p-2 font-mono selection:bg-orange-500/30"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCopyLink}
                    icon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Anyone who creates an account using this link will immediately be added to this project.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
