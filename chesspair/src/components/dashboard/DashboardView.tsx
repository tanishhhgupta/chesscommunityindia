import React from 'react';
import { useOrg } from '../../context/OrgContext';
import { Tournament, Player, AuditLog } from '../../types';
import {
  Trophy,
  Users,
  Swords,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet,
  Award,
  ChevronRight,
  Clock,
  MapPin,
  Compass,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface DashboardViewProps {
  tournaments: Tournament[];
  players: Player[];
  auditLogs: AuditLog[];
  onNavigate: (view: string, tournamentId?: string) => void;
  onOpenCreateTournament: () => void;
  onOpenAddPlayer: () => void;
  onOpenCsvImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tournaments,
  players,
  auditLogs,
  onNavigate,
  onOpenCreateTournament,
  onOpenAddPlayer,
  onOpenCsvImport,
}) => {
  const { activeOrg, permissions } = useOrg();

  const activeTournaments = tournaments.filter((t) => t.status === 'in_progress');
  const registrationTournaments = tournaments.filter((t) => t.status === 'registration');

  return (
    <div className="space-y-6 pb-12">
      {/* Club Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/30 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="amber" size="sm">ORGANIZATION DASHBOARD</Badge>
            <span className="text-xs text-slate-400">Multi-tenant Data Isolation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeOrg.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            {activeOrg.description || 'Welcome to your chess tournament headquarters.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {permissions.canManageTournaments && (
            <Button
              variant="amber"
              onClick={onOpenCreateTournament}
              icon={<PlusCircle size={16} />}
            >
              New Tournament
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => onNavigate('public-portal')}
            icon={<Compass size={16} />}
          >
            Spectator Portal
          </Button>
        </div>
      </div>

      {/* Overview Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{tournaments.length}</div>
            <div className="text-xs text-slate-400">Total Tournaments</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Swords size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{activeTournaments.length}</div>
            <div className="text-xs text-slate-400">Active In-Progress</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{players.length}</div>
            <div className="text-xs text-slate-400">Registered Players</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {players.filter((p) => p.title && p.title !== 'None').length}
            </div>
            <div className="text-xs text-slate-400">Titled Masters (GM/IM)</div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenCreateTournament}
          disabled={!permissions.canManageTournaments}
          className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group disabled:opacity-50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Trophy size={18} />
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-sm font-semibold text-white">Create Tournament</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Swiss, Round Robin, or Knockout</div>
        </button>

        <button
          onClick={onOpenAddPlayer}
          disabled={!permissions.canManagePlayers}
          className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group disabled:opacity-50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Users size={18} />
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-sm font-semibold text-white">Register Player</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Add to club member roster</div>
        </button>

        <button
          onClick={onOpenCsvImport}
          disabled={!permissions.canManagePlayers}
          className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group disabled:opacity-50 cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <FileSpreadsheet size={18} />
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-sm font-semibold text-white">CSV Bulk Import</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Import players with ratings</div>
        </button>

        <button
          onClick={() => onNavigate('arbiter-desk')}
          className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <Award size={18} />
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-sm font-semibold text-white">Arbiter Desk</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pairings & result control</div>
        </button>
      </div>

      {/* Active & Upcoming Tournaments Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            Tournaments
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('tournaments')}
            icon={<ChevronRight size={14} />}
          >
            View All ({tournaments.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.slice(0, 4).map((t) => {
            const progressPercent = Math.round((t.currentRound / t.roundsCount) * 100);
            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge
                      variant={
                        t.status === 'in_progress'
                          ? 'emerald'
                          : t.status === 'registration'
                          ? 'blue'
                          : 'slate'
                      }
                    >
                      {t.status === 'in_progress'
                        ? 'ROUND IN PROGRESS'
                        : t.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock size={12} /> {t.timeControlString}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white hover:text-amber-400 transition-colors cursor-pointer" onClick={() => onNavigate('tournament-detail', t.id)}>
                    {t.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">
                    {t.description || 'Chess tournament organized with Swiss pairing engine.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Round <strong className="text-white">{t.currentRound}</strong> of{' '}
                        <strong>{t.roundsCount}</strong>
                      </span>
                      <span>{t.playersCount || 0} Players</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {t.venue && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                      <MapPin size={13} /> {t.venue}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <Button
                    variant="amber"
                    size="sm"
                    className="flex-1"
                    onClick={() => onNavigate('tournament-detail', t.id)}
                  >
                    Open Tournament
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('public-portal', t.id)}
                    title="Spectator Link"
                  >
                    <Compass size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            Recent Organization Audit Activity
          </h3>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            View Complete Logs →
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200">{log.actorName}</span>{' '}
                  <span className="text-slate-400">executed</span>{' '}
                  <span className="font-mono text-amber-300">{log.action}</span>
                </div>
              </div>
              <span className="text-slate-500 text-[11px] shrink-0 font-mono">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
