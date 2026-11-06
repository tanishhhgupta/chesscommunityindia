import React, { useState } from 'react';
import { Player, ChessTitle } from '../../types';
import { useOrg } from '../../context/OrgContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { exportPlayersToCsv, downloadCsv } from '../../lib/csv';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PlayersViewProps {
  players: Player[];
  onOpenAddPlayer: () => void;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onOpenCsvImport: () => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  onOpenAddPlayer,
  onEditPlayer,
  onDeletePlayer,
  onOpenCsvImport,
}) => {
  const { activeOrg, permissions } = useOrg();
  const [search, setSearch] = useState('');
  const [titleFilter, setTitleFilter] = useState<string>('ALL');

  const filtered = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.fideId && p.fideId.includes(search)) ||
      (p.club && p.club.toLowerCase().includes(search.toLowerCase()));

    const matchesTitle =
      titleFilter === 'ALL' ||
      (titleFilter === 'TITLED' && p.title && p.title !== 'None') ||
      p.title === titleFilter;

    return matchesSearch && matchesTitle;
  });

  const handleExportCsv = () => {
    const csvData = exportPlayersToCsv(players);
    downloadCsv(`${activeOrg.slug}_players_roster.csv`, csvData);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="amber" size="sm">ROSTER DIRECTORY</Badge>
            <span className="text-xs text-slate-400">{activeOrg.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users size={24} className="text-amber-400" />
            Player Roster Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain ratings, FIDE titles, and tournament registration eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canManagePlayers && (
            <>
              <Button
                variant="amber"
                size="sm"
                onClick={onOpenAddPlayer}
                icon={<Plus size={15} />}
              >
                Register Player
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenCsvImport}
                icon={<FileSpreadsheet size={15} />}
              >
                Import CSV
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download size={15} />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player name or FIDE ID..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <div className="flex gap-1.5 text-xs">
            {['ALL', 'TITLED', 'GM', 'IM', 'FM', 'CM'].map((t) => (
              <button
                key={t}
                onClick={() => setTitleFilter(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  titleFilter === t
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Title</th>
                <th className="p-3">Player Name</th>
                <th className="p-3">Rating</th>
                <th className="p-3">FIDE ID</th>
                <th className="p-3">Federation</th>
                <th className="p-3">Status</th>
                {permissions.canManagePlayers && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((player, idx) => (
                <tr key={player.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                  <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                  <td className="p-3">
                    {player.title && player.title !== 'None' ? (
                      <Badge
                        variant={
                          player.title === 'GM'
                            ? 'amber'
                            : player.title === 'IM'
                            ? 'purple'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {player.title}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 font-mono">-</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-white">
                    {player.name}
                  </td>
                  <td className="p-3 font-mono text-amber-300 font-bold">
                    {player.rating}
                  </td>
                  <td className="p-3 font-mono text-slate-400">
                    {player.fideId ? (
                      <a
                        href={`https://ratings.fide.com/profile/${player.fideId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-amber-400"
                      >
                        {player.fideId}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-300">
                    {player.federation || 'FID'}
                  </td>
                  <td className="p-3">
                    {player.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                        <CheckCircle size={13} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                        <XCircle size={13} /> Inactive
                      </span>
                    )}
                  </td>
                  {permissions.canManagePlayers && (
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditPlayer(player)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Edit Player"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${player.name} from club roster?`)) {
                              onDeletePlayer(player.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Delete Player"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No players found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};
