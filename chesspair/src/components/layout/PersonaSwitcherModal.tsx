import React from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { UserCheck, Shield, Award, Eye, Crown } from 'lucide-react';
import { Badge } from '../common/Badge';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, availableProfiles, switchUser } = useAuth();
  const { members, userRole } = useOrg();

  const getPersonaRole = (userId: string) => {
    const mem = members.find((m) => m.userId === userId);
    return mem ? mem.role : 'viewer';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="text-amber-400" size={16} />;
      case 'admin':
        return <Shield className="text-purple-400" size={16} />;
      case 'arbiter':
        return <Award className="text-emerald-400" size={16} />;
      default:
        return <Eye className="text-slate-400" size={16} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Demo Persona (Test RBAC)"
      subtitle="Instantly experience ChessPair through different club permission levels"
      maxWidth="md"
    >
      <div className="space-y-3">
        {availableProfiles.map((profile) => {
          const isSelected = profile.id === currentUser.id;
          const role = getPersonaRole(profile.id);

          return (
            <button
              key={profile.id}
              onClick={() => {
                switchUser(profile.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-950/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={profile.fullName}
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                />
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    {profile.fullName}
                    {isSelected && <UserCheck size={15} className="text-amber-400" />}
                  </div>
                  <div className="text-xs text-slate-400">{profile.email}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  {getRoleIcon(role)}
                  <Badge
                    variant={
                      role === 'owner'
                        ? 'amber'
                        : role === 'admin'
                        ? 'purple'
                        : role === 'arbiter'
                        ? 'emerald'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {role.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-500 capitalize">
                  {role === 'owner'
                    ? 'Full Club Admin'
                    : role === 'arbiter'
                    ? 'Pairings & Results'
                    : role === 'admin'
                    ? 'Tournaments & Org'
                    : 'Read-only View'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Active Permissions:</span> Current role is{' '}
        <span className="text-amber-300 font-semibold">{userRole.toUpperCase()}</span>. Arbiter actions (Pairing creation, board swaps, result entry) require Organizer, Arbiter, Admin, or Owner roles.
      </div>
    </Modal>
  );
};
