import React, { useState } from 'react';
import {
  EnginePlayer,
  EngineRoundHistoryGame,
  GameResult,
  Pairing,
  Player,
  Round,
  Tournament,
  TournamentPlayer,
} from '../../types';
import { getTournamentEngine } from '../../engine';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { printTournamentDocument } from '../../lib/export';
import {
  Compass,
  Search,
  Trophy,
  Swords,
  Printer,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';

interface PublicPortalProps {
  tournaments: Tournament[];
  selectedTournamentId?: string;
  allRounds: Round[];
  allPairings: Pairing[];
  allTournamentPlayers: (TournamentPlayer & { player: Player })[];
  onBackToApp: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  tournaments,
  selectedTournamentId,
  allRounds,
  allPairings,
  allTournamentPlayers,
  onBackToApp,
}) => {
  const publicTournaments = tournaments.filter((t) => t.isPublic);

  const [activeTournamentId, setActiveTournamentId] = useState<string>(() => {
    if (selectedTournamentId && publicTournaments.some((t) => t.id === selectedTournamentId)) {
      return selectedTournamentId;
    }
    return publicTournaments[0]?.id || '';
  });

  const [portalTab, setPortalTab] = useState<'pairings' | 'standings'>('pairings');
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [playerSearch, setPlayerSearch] = useState('');

  const currentTournament = publicTournaments.find((t) => t.id === activeTournamentId);

  // Tournament specific data
  const tRounds = allRounds
    .filter((r) => r.tournamentId === activeTournamentId && r.status !== 'draft')
    .sort((a, b) => a.roundNumber - b.roundNumber);

  const tPlayers = allTournamentPlayers.filter((tp) => tp.tournamentId === activeTournamentId);
  const playerMap = new Map<string, Player>();
  tPlayers.forEach((tp) => playerMap.set(tp.playerId, tp.player));

  // Determine active round
  const effectiveRoundNumber =
    tRounds.length > 0
      ? tRounds.some((r) => r.roundNumber === selectedRoundNumber)
        ? selectedRoundNumber
        : tRounds[tRounds.length - 1].roundNumber
      : 1;

  const activeRound = tRounds.find((r) => r.roundNumber === effectiveRoundNumber);

  // Pairings for selected round
  const roundPairings = allPairings
    .filter((p) => activeRound && p.roundId === activeRound.id)
    .sort((a, b) => a.boardNumber - b.boardNumber)
    .map((p) => ({
      ...p,
      whitePlayer: p.whitePlayer || (p.whitePlayerId ? playerMap.get(p.whitePlayerId) : undefined),
      blackPlayer: p.blackPlayer || (p.blackPlayerId ? playerMap.get(p.blackPlayerId) : undefined),
    }));

  const filteredPairings = roundPairings.filter((p) => {
    if (!playerSearch) return true;
    const q = playerSearch.toLowerCase();
    const wName = p.whitePlayer?.surname || p.whitePlayer?.name || '';
    const bName = p.blackPlayer?.surname || p.blackPlayer?.name || '';
    const matchWhite = wName.toLowerCase().includes(q);
    const matchBlack = bName.toLowerCase().includes(q);
    const matchBoard = String(p.boardNumber) === q;
    return matchWhite || matchBlack || matchBoard;
  });

  // Calculate live standings
  const engine = currentTournament ? getTournamentEngine(currentTournament.format) : null;
  const enginePlayers: EnginePlayer[] = tPlayers.map((tp, idx) => ({
    id: tp.playerId,
    name: tp.player.name,
    rating: tp.initialRating,
    title: tp.player.title,
    federation: tp.player.federation,
    seed: tp.seedNumber || idx + 1,
    score: 0,
    colorHistory: [],
    opponentIds: [],
    receivedBye: false,
    isWithdrawn: tp.isWithdrawn,
  }));

  const roundHistories: EngineRoundHistoryGame[][] = [];
  tRounds.forEach((r) => {
    const rGames = allPairings.filter((p) => p.roundId === r.id);
    roundHistories.push(
      rGames.map((p) => ({
        roundNumber: r.roundNumber,
        boardNumber: p.boardNumber,
        whitePlayerId: p.whitePlayerId,
        blackPlayerId: p.blackPlayerId,
        result: p.result,
        isBye: p.isBye,
        byeType: p.byeType,
      }))
    );
  });

  const standings =
    engine && currentTournament
      ? engine.calculateStandings(enginePlayers, roundHistories, currentTournament.tiebreakRules)
      : [];

  const filteredStandings = standings.filter((s) => {
    if (!playerSearch) return true;
    return s.playerName.toLowerCase().includes(playerSearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Public Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md bg-slate-900/90 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold shadow-md shadow-amber-950/40">
              ♚
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Chess<span className="text-amber-500">Pair</span> Spectator Hub
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                LIVE TOURNAMENT BULLETIN
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBackToApp}>
              Exit to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tournament Selector Dropdown if multiple tournaments */}
        {publicTournaments.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {publicTournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTournamentId(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTournamentId === t.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {currentTournament ? (
          <>
            {/* Tournament Hero Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950/30 border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="amber" size="sm">OFFICIAL LIVE BULLETIN</Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      {currentTournament.roundsCount} Rounds
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {currentTournament.name}
                  </h1>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printTournamentDocument(`${currentTournament.name} Bulletin`)}
                  icon={<Printer size={14} />}
                >
                  Print Board
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1 font-mono">
                  <Clock size={13} className="text-amber-400" /> {currentTournament.timeControlString}
                </span>
                {currentTournament.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-amber-400" /> {currentTournament.venue}
                  </span>
                )}
                {currentTournament.chiefArbiter && (
                  <span>Chief Arbiter: <strong className="text-white">{currentTournament.chiefArbiter}</strong></span>
                )}
              </div>
            </div>

            {/* Live Player Lookup Search Bar */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Players: type your name or board number to find your game..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>
            </div>

            {/* Navigation Tabs (Pairings vs Standings) */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setPortalTab('pairings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    portalTab === 'pairings'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  <Swords size={16} />
                  <span>Pairings & Results</span>
                </button>
                <button
                  onClick={() => setPortalTab('standings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    portalTab === 'standings'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  <Trophy size={16} />
                  <span>Tournament Standings</span>
                </button>
              </div>

              {/* Round switcher pills if on pairings tab */}
              {portalTab === 'pairings' && tRounds.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  {tRounds.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoundNumber(r.roundNumber)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        effectiveRoundNumber === r.roundNumber
                          ? 'bg-slate-700 text-amber-300 border border-slate-600'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      R{r.roundNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab Content: Pairings */}
            {portalTab === 'pairings' && (
              <div className="space-y-3">
                {roundPairings.length > 0 ? (
                  filteredPairings.map((p) => {
                    if (p.isBye) {
                      return (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                              Brd {p.boardNumber}
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm">
                                {p.whitePlayer?.surname || p.whitePlayer?.name || (p.whitePlayerId ? `Player ${p.whitePlayerId}` : 'Assigned Player')}
                              </div>
                              <div className="text-xs text-slate-400">
                                1.0 Point Full Bye Allocated
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-emerald-400 font-bold text-xs">
                            1.0 (Bye)
                          </span>
                        </div>
                      );
                    }

                    const whiteName = p.whitePlayer?.surname || p.whitePlayer?.name || (p.whitePlayerId ? `Player ${p.whitePlayerId}` : 'No Player');
                    const blackName = p.blackPlayer?.surname || p.blackPlayer?.name || (p.blackPlayerId ? `Player ${p.blackPlayerId}` : 'No Player');

                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {p.boardNumber}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            {/* White */}
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-100 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                                ♔
                              </span>
                              <div>
                                <span className="font-bold text-white text-xs sm:text-sm">
                                  {p.whitePlayer?.title && p.whitePlayer.title !== 'None' && !whiteName.startsWith(p.whitePlayer.title) ? `${p.whitePlayer.title} ` : ''}
                                  {whiteName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                                  ({p.whitePlayer?.rating ?? '-'})
                                </span>
                              </div>
                            </div>

                            {/* Black */}
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-[10px] flex items-center justify-center shrink-0">
                                ♚
                              </span>
                              <div>
                                <span className="font-bold text-white text-xs sm:text-sm">
                                  {p.blackPlayer?.title && p.blackPlayer.title !== 'None' && !blackName.startsWith(p.blackPlayer.title) ? `${p.blackPlayer.title} ` : ''}
                                  {blackName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                                  ({p.blackPlayer?.rating ?? '-'})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Result */}
                        <div className="flex items-center justify-end font-mono text-sm font-bold text-amber-400 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 self-end sm:self-auto">
                          {p.result === 'UNPLAYED' ? 'Scheduled' : p.result}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                    No published pairings available for Round {effectiveRoundNumber} yet.
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Standings */}
            {portalTab === 'standings' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-12">Rk</th>
                      <th className="p-3">Player Name</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3 text-center">Pts</th>
                      <th className="p-3 font-mono">BH-1</th>
                      <th className="p-3 font-mono">BH-T</th>
                      <th className="p-3 font-mono">SB</th>
                      <th className="p-3 font-mono">Wins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredStandings.map((s) => (
                      <tr key={s.playerId} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="p-3 font-mono font-bold text-amber-400">{s.rank}</td>
                        <td className="p-3 font-semibold text-white">
                          {s.title && s.title !== 'None' ? `${s.title} ` : ''}
                          {s.playerName}
                        </td>
                        <td className="p-3 font-mono">{s.rating}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-300 text-sm">
                          {s.score.toFixed(1)}
                        </td>
                        <td className="p-3 font-mono text-slate-300">{s.buchholzCut1.toFixed(1)}</td>
                        <td className="p-3 font-mono text-slate-400">{s.buchholzTotal.toFixed(1)}</td>
                        <td className="p-3 font-mono text-emerald-400">{s.sonnebornBerger.toFixed(2)}</td>
                        <td className="p-3 font-mono text-slate-300">{s.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No public tournaments are currently available.
          </div>
        )}
      </div>
    </div>
  );
};
