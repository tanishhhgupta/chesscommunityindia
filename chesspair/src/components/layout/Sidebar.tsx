import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Award,
  History,
  Compass,
  Settings,
  PlusCircle,
  Building,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { Tournament } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, tournamentId?: string) => void;
  tournaments: Tournament[];
  activeTournamentId?: string;
  onOpenCreateTournament: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  tournaments,
  activeTournamentId,
  onOpenCreateTournament,
}) => {
  const { activeOrg, permissions } = useOrg();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: tournaments.length },
    { id: 'players', label: 'Player Roster', icon: Users },
    { id: 'arbiter-desk', label: 'Arbiter Desk', icon: Award },
    { id: 'audit-logs', label: 'Audit Records', icon: History },
    { id: 'public-portal', label: 'Spectator Portal', icon: Compass },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/40 p-4 shrink-0">
      {/* Navigation Section */}
      <div className="space-y-1 mb-6">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tournaments Section */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tournaments
          </span>
          {permissions.canManageTournaments && (
            <button
              onClick={onOpenCreateTournament}
              className="text-amber-400 hover:text-amber-300 p-0.5 rounded cursor-pointer"
              title="Create Tournament"
            >
              <PlusCircle size={15} />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {tournaments.slice(0, 5).map((t) => {
            const isSelected = currentView === 'tournament-detail' && activeTournamentId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onNavigate('tournament-detail', t.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === 'in_progress'
                      ? 'bg-emerald-400 animate-pulse'
                      : t.status === 'registration'
                      ? 'bg-blue-400'
                      : 'bg-slate-600'
                  }`}
                />
                <span className="truncate">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Club Footer Info */}
      <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-1">
          <Building size={14} className="text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">{activeOrg.name}</span>
        </div>
        <p className="text-[11px] text-slate-500 truncate">{activeOrg.website || activeOrg.country}</p>
      </div>
    </aside>
  );
};
