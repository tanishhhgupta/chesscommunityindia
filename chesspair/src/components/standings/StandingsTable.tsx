import React, { useState } from 'react';
import { EngineStanding, Tournament } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { TiebreakBreakdownModal } from './TiebreakBreakdownModal';
import { exportStandingsText, printTournamentDocument } from '../../lib/export';
import { downloadCsv } from '../../lib/csv';
import {
  Trophy,
  Printer,
  Download,
  Search,
  HelpCircle,
  Medal,
  ChevronRight,
} from 'lucide-react';

interface StandingsTableProps {
  tournament: Tournament;
  standings: EngineStanding[];
  isPublicView?: boolean;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  tournament,
  standings,
  isPublicView = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStanding, setSelectedStanding] = useState<EngineStanding | null>(null);

  const filtered = standings.filter((s) =>
    s.playerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportText = () => {
    const text = exportStandingsText(tournament, standings);
    downloadCsv(`${tournament.slug}_official_standings.txt`, text);
  };

  const handleExportCsv = () => {
    const headers = ['Rank', 'Title', 'Player', 'Rating', 'Score', 'BH-Cut1', 'BH-Total', 'Sonneborn-Berger', 'Direct Encounter', 'Wins', 'Blacks'];
    const rows = standings.map((s) => [
      s.rank,
      s.title || '',
      `"${s.playerName.replace(/"/g, '""')}"`,
      s.rating,
      s.score,
      s.buchholzCut1,
      s.buchholzTotal,
      s.sonnebornBerger,
      s.directEncounter,
      s.wins,
      s.blacks,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(`${tournament.slug}_standings.csv`, csvContent);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 flex items-center justify-center font-bold text-xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
          3
        </span>
      );
    }
    return <span className="font-mono text-slate-400 pl-1.5">{rank}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search standings by player..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printTournamentDocument(`${tournament.name} Standings`)}
            icon={<Printer size={14} />}
          >
            Print Sheet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download size={14} />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Standings Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3 w-12">Rk</th>
                <th className="p-3">Title</th>
                <th className="p-3">Player Name</th>
                <th className="p-3">Rating</th>
                <th className="p-3 text-center">Pts</th>
                <th className="p-3 font-mono" title="Buchholz Cut-1: Sum of opponents' scores dropping lowest">
                  BH-1
                </th>
                <th className="p-3 font-mono" title="Buchholz Total: Sum of all opponents' scores">
                  BH-T
                </th>
                <th className="p-3 font-mono" title="Sonneborn-Berger: Wins + 0.5 * Draws">
                  SB
                </th>
                <th className="p-3 font-mono" title="Direct Encounter between tied players">
                  DE
                </th>
                <th className="p-3 font-mono" title="Number of Wins">
                  Wins
                </th>
                <th className="p-3 font-mono" title="Games played with Black pieces">
                  Blk
                </th>
                <th className="p-3 text-right">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((standing) => (
                <tr
                  key={standing.playerId}
                  onClick={() => setSelectedStanding(standing)}
                  className="hover:bg-slate-800/50 text-slate-300 transition-colors cursor-pointer group"
                >
                  <td className="p-3">{getRankBadge(standing.rank)}</td>
                  <td className="p-3">
                    {standing.title && standing.title !== 'None' ? (
                      <Badge
                        variant={
                          standing.title === 'GM'
                            ? 'amber'
                            : standing.title === 'IM'
                            ? 'purple'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {standing.title}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 font-mono">-</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {standing.playerName}
                  </td>
                  <td className="p-3 font-mono text-slate-300">{standing.rating}</td>
                  <td className="p-3 text-center font-mono font-bold text-amber-400 text-sm bg-amber-500/5">
                    {standing.score.toFixed(1)}
                  </td>
                  <td className="p-3 font-mono text-slate-300 font-semibold">
                    {standing.buchholzCut1.toFixed(1)}
                  </td>
                  <td className="p-3 font-mono text-slate-400">
                    {standing.buchholzTotal.toFixed(1)}
                  </td>
                  <td className="p-3 font-mono text-emerald-400 font-medium">
                    {standing.sonnebornBerger.toFixed(2)}
                  </td>
                  <td className="p-3 font-mono text-blue-400">
                    {standing.directEncounter > 0 ? standing.directEncounter.toFixed(1) : '-'}
                  </td>
                  <td className="p-3 font-mono text-slate-300">{standing.wins}</td>
                  <td className="p-3 font-mono text-slate-400">{standing.blacks}</td>
                  <td className="p-3 text-right">
                    <span className="text-[11px] text-amber-400/80 group-hover:text-amber-300 flex items-center justify-end gap-1">
                      Math <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No standings found matching player search.
          </div>
        )}
      </div>

      {/* Legend & Tiebreak Priority Notice */}
      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span><strong>BH-1:</strong> Buchholz Cut-1</span>
          <span><strong>BH-T:</strong> Buchholz Total</span>
          <span><strong>SB:</strong> Sonneborn-Berger</span>
          <span><strong>DE:</strong> Direct Encounter</span>
          <span><strong>Blk:</strong> Games as Black</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Click any player row to view exact round-by-round tiebreak math.
        </div>
      </div>

      {/* Tiebreak Audit Modal */}
      <TiebreakBreakdownModal
        isOpen={Boolean(selectedStanding)}
        onClose={() => setSelectedStanding(null)}
        standing={selectedStanding}
      />
    </div>
  );
};
