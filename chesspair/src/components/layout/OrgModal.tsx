import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useOrg } from '../../context/OrgContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Plus, Building, UserPlus, Check, Trash2 } from 'lucide-react';
import { UserRole } from '../../types';

interface OrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'switch' | 'create' | 'members';
}

export const OrgModal: React.FC<OrgModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'switch',
}) => {
  const {
    organizations,
    activeOrg,
    setActiveOrgId,
    createOrganization,
    members,
    inviteMember,
    updateMemberRole,
    removeMember,
    permissions,
  } = useOrg();

  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'members'>(initialTab);

  // New Org Form
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [newOrgCountry, setNewOrgCountry] = useState('USA');

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('arbiter');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewOrgName(val);
    setNewOrgSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    createOrganization({
      name: newOrgName.trim(),
      slug: newOrgSlug.trim() || `org-${Date.now()}`,
      description: newOrgDesc.trim(),
      country: newOrgCountry,
    });

    setNewOrgName('');
    setNewOrgSlug('');
    setNewOrgDesc('');
    onClose();
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    inviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chess Club & Organization Hub"
      subtitle="Switch organizations, onboard new chess clubs, or manage member access"
      maxWidth="xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 pb-2">
        <button
          onClick={() => setActiveTab('switch')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'switch' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Clubs ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'create' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          + Onboard New Club
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'members' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Club Roster & Roles ({members.length})
        </button>
      </div>

      {/* Switch Club Tab */}
      {activeTab === 'switch' && (
        <div className="space-y-3 pt-2">
          {organizations.map((org) => {
            const isSelected = org.id === activeOrg.id;
            return (
              <div
                key={org.id}
                onClick={() => {
                  setActiveOrgId(org.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/50 flex items-center justify-center text-amber-400">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {org.name}
                      {isSelected && <Badge variant="amber" size="sm">ACTIVE</Badge>}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{org.description || 'Chess organization'}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {org.country}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Club Tab */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Club / Organization Name *
            </label>
            <input
              type="text"
              required
              value={newOrgName}
              onChange={handleNameChange}
              placeholder="e.g. Berkeley Chess Club"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              URL Slug / Identifier
            </label>
            <input
              type="text"
              required
              value={newOrgSlug}
              onChange={(e) => setNewOrgSlug(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description & Mission
            </label>
            <textarea
              rows={2}
              value={newOrgDesc}
              onChange={(e) => setNewOrgDesc(e.target.value)}
              placeholder="Short description of the club, facilities, or league"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Country / Federation
            </label>
            <input
              type="text"
              value={newOrgCountry}
              onChange={(e) => setNewOrgCountry(e.target.value)}
              placeholder="e.g. USA, FID, ENG, GER"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setActiveTab('switch')} type="button">
              Cancel
            </Button>
            <Button variant="amber" type="submit" icon={<Plus size={16} />}>
              Create Organization
            </Button>
          </div>
        </form>
      )}

      {/* Members & Roles Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4 pt-2">
          {/* Invite form if permitted */}
          {permissions.canInviteMembers ? (
            <form onSubmit={handleInvite} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserPlus size={15} className="text-amber-400" />
                Invite Organizer or Arbiter to {activeOrg.name}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="colleague@chessclub.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="arbiter">Arbiter (Pairings & Results)</option>
                  <option value="organizer">Organizer (Tournaments & Players)</option>
                  <option value="admin">Admin (Full Management)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>

                <Button variant="amber" size="sm" type="submit">
                  Send Invite
                </Button>
              </div>

              {inviteSuccess && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Member invited and granted {inviteRole} privileges.
                </div>
              )}
            </form>
          ) : (
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400">
              Only Club Owners and Admins have permission to invite new staff.
            </div>
          )}

          {/* Members List */}
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden">
            {members.map((m) => (
              <div key={m.id} className="p-3 bg-slate-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={m.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={m.user.fullName}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">{m.user.fullName}</div>
                    <div className="text-xs text-slate-400">{m.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {permissions.canManageOrg && m.role !== 'owner' ? (
                    <select
                      value={m.role}
                      onChange={(e) => updateMemberRole(m.id, e.target.value as UserRole)}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200"
                    >
                      <option value="admin">Admin</option>
                      <option value="organizer">Organizer</option>
                      <option value="arbiter">Arbiter</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <Badge variant={m.role === 'owner' ? 'amber' : m.role === 'arbiter' ? 'emerald' : 'slate'}>
                      {m.role.toUpperCase()}
                    </Badge>
                  )}

                  {permissions.canManageOrg && m.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
