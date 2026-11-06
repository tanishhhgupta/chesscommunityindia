import React from 'react';
import { Tournament, Round, Pairing, AuditLog } from '../../types';
import { useOrg } from '../../context/OrgContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Award,
  Sparkles,
  Swords,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface ArbiterDeskViewProps {
  tournaments: Tournament[];
  allRounds: Round[];
  allPairings: Pairing[];
  auditLogs: AuditLog[];
  onOpenTournament: (tournamentId: string) => void;
  onNavigate: (view: string, tournamentId?: string) => void;
}

export const ArbiterDeskView: React.FC<ArbiterDeskViewProps> = ({
  tournaments,
  allRounds,
  allPairings,
  auditLogs,
  onOpenTournament,
  onNavigate,
}) => {
  const { userRole, permissions, activeOrg } = useOrg();

  const inProgressTournaments = tournaments.filter((t) => t.status === 'in_progress');

  return (
    <div className="space-y-6 pb-12">
      {/* Arbiter Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/30 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="emerald" size="sm">CHIEF ARBITER CONTROL ROOM</Badge>
            <span className="text-xs text-slate-400">Pairing Engine & Result Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Award size={28} className="text-amber-400" />
            Tournament Arbiter Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Generate pairings, evaluate score brackets, perform manual board swaps, and enforce fair play rules for {activeOrg.name}.
          </p>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <div className="text-slate-400">Your Permission Status</div>
          <div className="font-bold text-amber-300 text-sm capitalize">
            {userRole} • {permissions.canManageRounds ? 'Full Pairing Authority' : 'Read-only Auditor'}
          </div>
        </div>
      </div>

      {/* Engine Status & Disclosure Box */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-2 text-amber-200">
        <div className="font-bold text-amber-300 flex items-center gap-2">
          <ShieldAlert size={16} />
          Active Engine: Basic Swiss Pairing System (Standard Score Bracket & Color Balancing)
        </div>
        <p className="text-slate-300">
          This system pairs players strictly within equal score groups, avoids repeat matches, regulates color balances (maximum 2 consecutive same colors), and gives odd-player byes to the lowest eligible score bracket. Official FIDE endorsement requires independent validation.
        </p>
      </div>

      {/* In-Progress Tournaments Requiring Arbiter Supervision */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Swords size={18} className="text-amber-400" />
          Active Competitions Requiring Rounds Control
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inProgressTournaments.map((t) => {
            const tRounds = allRounds.filter((r) => r.tournamentId === t.id);
            const currentRnd = tRounds.find((r) => r.roundNumber === t.currentRound);
            const currentRndPairings = allPairings.filter((p) => currentRnd && p.roundId === currentRnd.id);
            const pendingResults = currentRndPairings.filter((p) => !p.isBye && p.result === 'UNPLAYED');

            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant={currentRnd?.status === 'published' ? 'blue' : 'amber'}>
                      {currentRnd?.status === 'draft' ? 'PAIRINGS DRAFT' : 'ROUND LIVE'}
                    </Badge>
                    <h3 className="text-base font-bold text-white mt-1.5">{t.name}</h3>
                  </div>
                  <div className="text-right font-mono text-xs text-amber-400 font-bold">
                    Round {t.currentRound} / {t.roundsCount}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Total Boards:</span>
                    <span className="font-mono font-bold text-white">{currentRndPairings.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Unplayed Games Pending:</span>
                    <span className="font-mono font-bold text-amber-300">{pendingResults.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <Button
                    variant="amber"
                    size="sm"
                    className="flex-1"
                    onClick={() => onOpenTournament(t.id)}
                    icon={<Award size={14} />}
                  >
                    Open Round Manager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('public-portal', t.id)}
                  >
                    Spectator View
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {inProgressTournaments.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
            No active in-progress tournaments at this time.
          </div>
        )}
      </div>

      {/* Arbiter Audit Records Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History size={16} className="text-amber-400" />
            Arbiter Log Traceability
          </h3>
          <span className="text-xs text-slate-400">Permanent Record</span>
        </div>

        <div className="divide-y divide-slate-800">
          {auditLogs.slice(0, 6).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white">{log.actorName}</span>{' '}
                  <span className="text-slate-400">performed</span>{' '}
                  <span className="font-mono text-amber-300 font-semibold">{log.action}</span>
                </div>
              </div>
              <span className="text-slate-500 font-mono text-[11px] shrink-0">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
