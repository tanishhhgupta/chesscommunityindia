import React, { useState, useMemo } from "react";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { Tournament, Round, Pairing, StandingsRow, Player } from "../../lib/domain/types";
import { sound } from "../../lib/audio";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ShieldCheck, 
  ArrowLeft, 
  Swords, 
  Award, 
  FileText, 
  Download, 
  Share2,
  Settings
} from "lucide-react";
import { ExportService } from "../../lib/domain/services/ExportService";

interface TournamentPublicDetailViewProps {
  tournamentId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const TournamentPublicDetailView: React.FC<TournamentPublicDetailViewProps> = ({
  tournamentId,
  onNavigate,
}) => {
  const [dbTimestamp, setDbTimestamp] = useState<number>(Date.now());

  React.useEffect(() => {
    const handleSync = () => setDbTimestamp(Date.now());
    window.addEventListener("cci-domain-db-synced", handleSync);
    return () => window.removeEventListener("cci-domain-db-synced", handleSync);
  }, []);

  const tournament = useMemo(() => {
    return tournamentRepository.getTournamentById(tournamentId) || tournamentRepository.getActiveTournament();
  }, [tournamentId, dbTimestamp]);

  const [activeTab, setActiveTab] = useState<"pairings" | "standings" | "players" | "overview">("pairings");
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(tournament.currentRoundNumber || 1);

  const rounds = useMemo(() => tournamentRepository.getTournamentRounds(tournament.id), [tournament.id, dbTimestamp]);
  const registrations = useMemo(() => tournamentRepository.getTournamentRegistrations(tournament.id), [tournament.id, dbTimestamp]);
  const players = useMemo(() => tournamentRepository.getTournamentPlayers(tournament.id), [tournament.id, dbTimestamp]);
  const standings = useMemo(() => tournamentRepository.getStandings(tournament.id), [tournament.id, dbTimestamp]);

  const selectedRound = rounds.find((r) => r.number === selectedRoundNumber) || rounds[0];
  const activePairings = selectedRound ? tournamentRepository.getActivePairingsForRound(selectedRound.id) : [];

  const playerMap = useMemo(() => {
    return new Map<string, Player>(players.map((p) => [p.id, p]));
  }, [players]);

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-10">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => {
            sound.playTactileClick();
            onNavigate("tournaments");
          }}
          className="inline-flex items-center gap-2 text-xs font-sans text-slate-400 hover:text-white transition-colors cursor-button"
        >
          <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
          <span>All Tournaments</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Editorial, Minimal, adhering to Sections 38 & 39)        */}
      {/* ========================================================================= */}
      <section className="glass-dark p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                  tournament.status === "LIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                    : tournament.status === "UPCOMING"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-white/10 text-slate-300 border border-[rgba(245, 242, 235,0.06)]"
                }`}
              >
                {tournament.status}
              </span>

              <span className="px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold">
                Round {tournament.currentRoundNumber} / {tournament.rounds}
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs font-sans">
                {tournament.ratingType} &bull; {tournament.baseTime}+{tournament.increment}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-[1.1]">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 font-sans">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                {tournament.venue}, {tournament.city}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C5A059]" />
                {tournament.startDate} {tournament.endDate !== tournament.startDate ? `– ${tournament.endDate}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                {registrations.length} Competitors
              </span>
            </div>
          </div>

          {/* Arbiter Admin shortcut */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("chess-manager");
              }}
              className="px-5 py-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-sans font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Arbiter Control Center</span>
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[rgba(245, 242, 235,0.06)] pb-4 overflow-x-auto scrollbar-none">
        {[
          { id: "pairings", label: "Pairings & Results", icon: Swords },
          { id: "standings", label: "Live Standings", icon: Trophy },
          { id: "players", label: "Starting List", icon: Users },
          { id: "overview", label: "Tournament Regulations", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTactileClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? "bg-[#C5A059] text-[#08161A] shadow-md font-bold"
                  : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAIRINGS & RESULTS                                                 */}
      {/* ========================================================================= */}
      {activeTab === "pairings" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Round Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-dark">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-mono text-slate-400 uppercase mr-2 font-bold">ROUND:</span>
              {Array.from({ length: tournament.rounds }, (_, i) => i + 1).map((r) => {
                const roundObj = rounds.find((rd) => rd.number === r);
                const hasPairings = roundObj && roundObj.activePairingVersionId;

                return (
                  <button
                    key={r}
                    onClick={() => {
                      sound.playTactileClick();
                      setSelectedRoundNumber(r);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      selectedRoundNumber === r
                        ? "bg-[#C5A059] text-[#08161A] shadow-lg"
                        : hasPairings
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-white/5 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    R{r}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                ExportService.downloadCSV(
                  ExportService.exportPairingsToCSV(selectedRoundNumber, activePairings, players),
                  `${tournament.name.replace(/\s+/g, "_")}_Round_${selectedRoundNumber}_Pairings.csv`
                );
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Export Pairings CSV</span>
            </button>
          </div>

          {/* Pairings List */}
          <div className="space-y-3">
            {activePairings.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-3xl border border-[rgba(245, 242, 235,0.06)]">
                <Swords className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">Pairings Pending for Round {selectedRoundNumber}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  The chief arbiter has not yet published official pairings for this round.
                </p>
              </div>
            ) : (
              activePairings.map((m) => {
                const white = playerMap.get(m.whitePlayerId);
                const black = m.blackPlayerId ? playerMap.get(m.blackPlayerId) : null;

                return (
                  <div
                    key={m.id}
                    className="glass-dark-card p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 flex-1">
                      {/* Board Number */}
                      <span className="w-10 h-10 rounded-xl bg-black/50 border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center font-mono font-bold text-sm text-[#C5A059] shrink-0">
                        {String(m.boardNumber).padStart(2, "0")}
                      </span>

                      {/* White Player */}
                      <div
                        onClick={() => white && onNavigate("player-profile", white.id)}
                        className="flex-1 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
                          <span className="font-semibold text-white group-hover:text-[#C5A059] transition-colors text-sm">
                            {white?.name || "Unpaired"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {white ? `${white.cciRapidRating} Elo • ${white.currentCategory.name}` : ""}
                        </div>
                      </div>

                      {/* Result Pill */}
                      <div className="px-4 py-1.5 rounded-xl bg-black/60 border border-[rgba(245, 242, 235,0.06)] font-mono font-bold text-xs text-amber-300 text-center min-w-[70px]">
                        {m.result === "PENDING" ? "vs" : m.result}
                      </div>

                      {/* Black Player */}
                      <div
                        onClick={() => black && onNavigate("player-profile", black.id)}
                        className={`flex-1 text-right ${black ? "cursor-pointer group" : ""}`}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-white group-hover:text-[#C5A059] transition-colors text-sm">
                            {black ? black.name : (m.result === "BYE" ? "BYE (1.0 Point)" : "Unpaired")}
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600" />
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {black ? `${black.cciRapidRating} Elo • ${black.currentCategory.name}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE STANDINGS                                                     */}
      {/* ========================================================================= */}
      {activeTab === "standings" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.06)]">
            <span className="text-xs text-slate-400">
              Standings derived authoritatively from all round results &bull; FIDE Tie-Break Rules
            </span>
            <button
              onClick={() => {
                ExportService.downloadCSV(
                  ExportService.exportStandingsToCSV(tournament, standings),
                  `${tournament.name.replace(/\s+/g, "_")}_Standings.csv`
                );
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Export Standings CSV</span>
            </button>
          </div>

          <div className="glass-panel rounded-3xl border border-[rgba(245, 242, 235,0.06)] overflow-hidden bg-[#08161A]/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E2126] text-slate-400 uppercase font-mono text-[10px] border-b border-[rgba(245, 242, 235,0.06)]">
                  <tr>
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Player</th>
                    <th className="py-3.5 px-4 font-mono">Rating</th>
                    <th className="py-3.5 px-4">Category Batch</th>
                    <th className="py-3.5 px-4 font-bold text-white">Points</th>
                    <th className="py-3.5 px-4 font-mono">Buchholz Cut-1</th>
                    <th className="py-3.5 px-4 font-mono">Buchholz</th>
                    <th className="py-3.5 px-4 font-mono">Wins</th>
                    <th className="py-3.5 px-4 font-mono text-right">&Delta; Elo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-200">
                  {standings.map((s) => (
                    <tr
                      key={s.playerId}
                      onClick={() => onNavigate("player-profile", s.playerId)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {s.rank}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{s.player.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.player.cciPlayerId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{s.startRating}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-[rgba(245, 242, 235,0.06)]">
                          {s.category.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-base text-white">
                        {s.points}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{s.tieBreaks.buchholzCut1}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{s.tieBreaks.buchholz}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{s.wins}</td>
                      <td className={`py-3.5 px-4 font-mono text-right font-bold ${
                        s.ratingChange > 0 ? "text-emerald-400" : s.ratingChange < 0 ? "text-rose-400" : "text-slate-400"
                      }`}>
                        {s.ratingChange > 0 ? `+${s.ratingChange}` : s.ratingChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STARTING LIST                                                      */}
      {/* ========================================================================= */}
      {activeTab === "players" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.06)]">
            <span className="text-xs text-slate-400">
              {registrations.length} Verified Competitors Registered
            </span>
            <button
              onClick={() => {
                ExportService.downloadCSV(
                  ExportService.exportStartingListToCSV(tournament, registrations, players),
                  `${tournament.name.replace(/\s+/g, "_")}_Starting_List.csv`
                );
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Export Starting List CSV</span>
            </button>
          </div>

          <div className="glass-panel rounded-3xl border border-[rgba(245, 242, 235,0.06)] overflow-hidden bg-[#08161A]/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E2126] text-slate-400 uppercase font-mono text-[10px] border-b border-[rgba(245, 242, 235,0.06)]">
                  <tr>
                    <th className="py-3 px-4">Starting No</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">CCI ID</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Category Batch</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">FIDE ID</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-200">
                  {registrations
                    .sort((a, b) => a.seedNumber - b.seedNumber)
                    .map((r) => {
                      const p = playerMap.get(r.playerId);
                      if (!p) return null;

                      return (
                        <tr
                          key={r.playerId}
                          onClick={() => onNavigate("player-profile", p.id)}
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-400">{r.seedNumber}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.club || "Club Player"}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{p.cciPlayerId}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{r.initialRating}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-[rgba(245, 242, 235,0.06)]">
                              {p.currentCategory.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{p.city}</td>
                          <td className="py-3.5 px-4 font-mono text-sky-400">{p.fideId || "—"}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TOURNAMENT REGULATIONS                                             */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[rgba(245, 242, 235,0.06)] bg-[#08161A]/80 space-y-8 animate-fade-in font-sans">
          <div className="space-y-3">
            <h3 className="text-2xl font-display font-bold text-white">Tournament Overview &amp; Regulations</h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {tournament.description}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-[rgba(245, 242, 235,0.06)] text-xs">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">FORMAT</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">{tournament.format}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">TOTAL ROUNDS</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">{tournament.rounds} Rounds</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">TIME CONTROL</span>
              <span className="text-white font-semibold text-sm mt-0.5 block">{tournament.baseTime} min + {tournament.increment} sec</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">PRIZE FUND</span>
              <span className="text-[#C5A059] font-bold text-sm mt-0.5 block">{tournament.prizePool}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[rgba(245, 242, 235,0.06)]">
            <h4 className="text-base font-bold text-white">Official Arbiters &amp; Organizer Panel</h4>
            <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                <span className="text-[10px] font-mono text-slate-400 block">CHIEF ARBITER</span>
                <span className="text-white font-bold text-sm">{tournament.chiefArbiter}</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                <span className="text-[10px] font-mono text-slate-400 block">ORGANIZER</span>
                <span className="text-white font-bold text-sm">{tournament.organizer}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
