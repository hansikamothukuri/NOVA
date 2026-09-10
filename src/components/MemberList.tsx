import React, { useState } from 'react';
import { Crown, Trash2, UserPlus, Shield } from 'lucide-react';
import { ProjectMember } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

interface MemberListProps {
  members: ProjectMember[];
  isOwner: boolean;
  onAddMemberClick?: () => void;
  onRemoveMember?: (userId: number) => Promise<void>;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  isOwner,
  onAddMemberClick,
  onRemoveMember,
}) => {
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<ProjectMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleConfirmRemove = async () => {
    if (!selectedMemberToRemove || !onRemoveMember) return;
    setRemoving(true);
    try {
      await onRemoveMember(selectedMemberToRemove.user_id);
      setSelectedMemberToRemove(null);
    } catch {
      // Handled by parent
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Team Members
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {members.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Collaborators assigned to this project</p>
        </div>

        {isOwner && onAddMemberClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddMemberClick}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Add Member
          </Button>
        )}
      </div>

      <div className="divide-y divide-slate-800/60">
        {members.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm">No team members added yet.</p>
            {isOwner && onAddMemberClick && (
              <Button
                variant="primary"
                size="sm"
                onClick={onAddMemberClick}
                icon={<UserPlus className="w-3.5 h-3.5" />}
                className="mt-3"
              >
                Add First Team Member
              </Button>
            )}
          </div>
        ) : (
          members.map((member) => {
            const isMemberOwner = member.role === 'Owner';
            const displayName =
              (member.name && member.name.trim()) ||
              (member.email ? member.email.split('@')[0] : 'Team Member');

            return (
              <div
                key={member.id || member.user_id}
                className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={member.avatar} name={displayName} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-100 truncate">
                        {displayName}
                      </span>
                      {isMemberOwner ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <Crown className="w-3 h-3" />
                          Owner
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {member.role || 'Member'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{member.email}</div>
                    {member.title && (
                      <div className="text-[11px] text-orange-400/90 font-medium truncate">{member.title}</div>
                    )}
                  </div>
                </div>

                {/* Actions: Owner can remove non-owners */}
                {isOwner && !isMemberOwner && onRemoveMember && (
                  <button
                    onClick={() => setSelectedMemberToRemove(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={`Remove ${displayName} from project`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedMemberToRemove}
        onClose={() => setSelectedMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${selectedMemberToRemove?.name} from this project? Their assigned tasks will become unassigned.`}
        confirmText="Remove Member"
        loading={removing}
      />
    </div>
  );
};
