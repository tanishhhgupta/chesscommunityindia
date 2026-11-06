import React, { useState, useEffect, useMemo } from "react";
import { 
  Trophy, 
  Swords, 
  Users, 
  Settings, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  ShieldCheck,
  RefreshCw,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
  FileSpreadsheet,
  UserCheck,
  Trash2,
  Edit3
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  TournamentRecord, 
  loadStoredTournament, 
  saveStoredTournament,
  PlayerRecord,
  loadStoredPlayers,
  saveStoredPlayers
} from "../../lib/storage/mockDatabase";
import { 
  BoardMatch, 
  generateSwissPairings, 
  calculateBuchholzCut1, 
  calculateSonnebornBerger, 
  TournamentPlayer 
} from "../../lib/chess/pairingEngine";
import { 
  DEFAULT_PLAYER_RATING,
  getTierFromRating, 
  calculateMatchFideRatingChanges,
  CCI_RATING_CATEGORIES
} from "../../lib/chess/eloEngine";
import { sound } from "../../lib/audio";
import { ChessDeskBackend } from "../../lib/backend/chessDeskBackend";

interface TournamentManagerProps {
  onNavigate?: (view: string) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({ onNavigate }) => {
  const [tournament, setTournament] = useState<TournamentRecord>(() => ChessDeskBackend.getActiveTournament());
  const [activeTab, setActiveTab] = useState<"pairings" | "standings" | "players" | "arbiter">("pairings");
  const [selectedRound, setSelectedRound] = useState<number>(() => tournament.currentRound);
  const [arbiterMode, setArbiterMode] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeScoreDropdownId, setActiveScoreDropdownId] = useState<string | null>(null);

  // Dismiss dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-score-dropdown]')) {
        setActiveScoreDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleBackendUpdate = () => {
      setTournament(ChessDeskBackend.getActiveTournament());
    };
    window.addEventListener("cci-tournament-backend-updated", handleBackendUpdate);
    return () => window.removeEventListener("cci-tournament-backend-updated", handleBackendUpdate);
  }, []);

  // Player Registration Modal State
  const [showAddPlayerModal, setShowAddPlayerModal] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>("");
  const [newPlayerCity, setNewPlayerCity] = useState<string>("Jabalpur");
  const [newPlayerRating, setNewPlayerRating] = useState<number>(DEFAULT_PLAYER_RATING);
  const [newPlayerFideId, setNewPlayerFideId] = useState<string>("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>("");

  const currentMatches = tournament.rounds[selectedRound] || [];

  // Show transient toast
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Re-compute Standings, Tiebreaks, and Live FIDE Ratings across all rounds
  const { standingsList, playerLiveRatings, playerEloDeltas } = useMemo(() => {
    const playerMap = new Map<string, TournamentPlayer>();
    const ratingsMap = new Map<string, number>();
    const startRatingsMap = new Map<string, number>();
    const deltasMap = new Map<string, number>();

    // 1. Initialize with baseline players
    tournament.players.forEach((p) => {
      const starting = p.startRating ?? p.rating;
      startRatingsMap.set(p.id, starting);
      ratingsMap.set(p.id, starting);
      deltasMap.set(p.id, 0);

      playerMap.set(p.id, {
        ...p,
        startRating: starting,
        score: 0,
        opponentsPlayed: [],
        colorHistory: [],
      });
    });

    // 2. Sequentially process all round matches to compute score and live FIDE Elo adjustments
    const sortedRoundKeys = Object.keys(tournament.rounds)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);

    sortedRoundKeys.forEach((rNum) => {
      const matches = tournament.rounds[rNum] || [];

      matches.forEach((m) => {
        if (!m.isCompleted) return;

        const white = playerMap.get(m.whitePlayer.id);
        const black = m.blackPlayer ? playerMap.get(m.blackPlayer.id) : null;

        // Points update
        if (white) {
          white.colorHistory.push("W");
          if (m.blackPlayer) {
            white.opponentsPlayed.push(m.blackPlayer.id);
          }

          if (m.result === "1-0" || m.result === "1F-0F" || m.result === "BYE") {
            white.score += 1.0;
          } else if (m.result === "1/2-1/2") {
            white.score += 0.5;
          }
        }

        if (black && m.whitePlayer) {
          black.colorHistory.push("B");
          black.opponentsPlayed.push(m.whitePlayer.id);

          if (m.result === "0-1" || m.result === "0F-1F") {
            black.score += 1.0;
          } else if (m.result === "1/2-1/2") {
            black.score += 0.5;
          }
        }

        // FIDE Rating calculation (if both players exist and it's not a bye)
        if (white && black && m.result !== "BYE" && m.result !== "PENDING") {
          const currentWhiteR = ratingsMap.get(white.id) ?? white.rating;
          const currentBlackR = ratingsMap.get(black.id) ?? black.rating;

          const { whiteDelta, blackDelta } = calculateMatchFideRatingChanges(
            currentWhiteR,
            currentBlackR,
            m.result as any
          );

          ratingsMap.set(white.id, currentWhiteR + whiteDelta);
          ratingsMap.set(black.id, currentBlackR + blackDelta);

          deltasMap.set(white.id, (deltasMap.get(white.id) ?? 0) + whiteDelta);
          deltasMap.set(black.id, (deltasMap.get(black.id) ?? 0) + blackDelta);
        }
      });
    });

    // 3. Update player objects with live ratings, dynamic tiers, and tiebreaks
    const allMatches = Object.values(tournament.rounds).flat();
    const updatedList = Array.from(playerMap.values()).map((p) => {
      const liveR = ratingsMap.get(p.id) ?? p.rating;
      const netDelta = deltasMap.get(p.id) ?? 0;
      const liveTier = getTierFromRating(liveR);

      return {
        ...p,
        rating: liveR,
        ratingDelta: netDelta,
        tierName: liveTier.name,
        tierNumber: liveTier.tierNumber,
        buchholzCut1: calculateBuchholzCut1(p, playerMap),
        sonnebornBerger: calculateSonnebornBerger(p.id, allMatches, playerMap),
      };
    });

    // Sort by Score DESC, Buchholz Cut 1 DESC, Sonneborn-Berger DESC, Rating DESC
    updatedList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.buchholzCut1 || 0) !== (a.buchholzCut1 || 0)) {
        return (b.buchholzCut1 || 0) - (a.buchholzCut1 || 0);
      }
      if ((b.sonnebornBerger || 0) !== (a.sonnebornBerger || 0)) {
        return (b.sonnebornBerger || 0) - (a.sonnebornBerger || 0);
      }
      return b.rating - a.rating;
    });

    return {
      standingsList: updatedList,
      playerLiveRatings: ratingsMap,
      playerEloDeltas: deltasMap,
    };
  }, [tournament]);

  // Handle Match Result Entry with real-time FIDE delta computation
  const handleSetResult = (matchId: string, result: BoardMatch["result"]) => {
    sound.playPieceMove();

    const roundMatches = tournament.rounds[selectedRound] || [];
    const updatedMatches = roundMatches.map((m) => {
      if (m.id === matchId) {
        let whiteDelta = 0;
        let blackDelta = 0;

        if (m.blackPlayer && result !== "BYE" && result !== "PENDING") {
          const wR = m.whitePlayer.rating;
          const bR = m.blackPlayer.rating;
          const calc = calculateMatchFideRatingChanges(wR, bR, result as any);
          whiteDelta = calc.whiteDelta;
          blackDelta = calc.blackDelta;
        }

        return {
          ...m,
          result,
          isCompleted: result !== "PENDING",
          whiteDelta,
          blackDelta,
        };
      }
      return m;
    });

    const updatedTourney: TournamentRecord = {
      ...tournament,
      rounds: {
        ...tournament.rounds,
        [selectedRound]: updatedMatches,
      },
    };

    setTournament(updatedTourney);
    saveStoredTournament(updatedTourney);
    showToast(`Result updated: ${result}`);

    // If all matches finished in current round, trigger celebration
    const allDone = updatedMatches.every((m) => m.isCompleted);
    if (allDone && selectedRound === tournament.currentRound) {
      sound.playGoldenChord();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#C5A059", "#38BDF8", "#34D399"],
      });
    }
  };

  // Generate Next Swiss Round (Arbiter Action)
  const handleGenerateNextRound = () => {
    sound.playGoldenChord();
    const nextRoundNumber = tournament.currentRound + 1;

    if (nextRoundNumber > tournament.totalRounds) {
      showToast(`Tournament completed! Final round was Round ${tournament.totalRounds}`);
      return;
    }

    const nextPairings = generateSwissPairings(standingsList, nextRoundNumber);

    const updatedTourney: TournamentRecord = {
      ...tournament,
      currentRound: nextRoundNumber,
      players: standingsList,
      rounds: {
        ...tournament.rounds,
        [nextRoundNumber]: nextPairings,
      },
    };

    setTournament(updatedTourney);
    saveStoredTournament(updatedTourney);
    setSelectedRound(nextRoundNumber);
    showToast(`Round ${nextRoundNumber} Pairings generated via FIDE Dutch Swiss Algorithm!`);
    setActiveTab("pairings");
  };

  // Add / Register Player with default rating (default 1000 Elo)
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      showToast("Player name is required.");
      return;
    }

    const assignedRating = Number(newPlayerRating) || DEFAULT_PLAYER_RATING;
    const tier = getTierFromRating(assignedRating);

    const newId = `p-${Date.now()}`;
    const newCciId = `CCI-2026-${String(tournament.players.length + 1).padStart(4, "0")}`;

    const newPlayer: TournamentPlayer = {
      id: newId,
      cciId: newCciId,
      name: newPlayerName.trim(),
      rating: assignedRating,
      startRating: assignedRating,
      tierName: tier.name,
      tierNumber: tier.tierNumber,
      score: 0,
      colorHistory: [],
      opponentsPlayed: [],
      hasReceivedBye: false,
      buchholzCut1: 0,
      sonnebornBerger: 0,
      city: newPlayerCity,
      fideId: newPlayerFideId.trim() || undefined,
      ratingDelta: 0,
    };

    const updatedPlayers = [...tournament.players, newPlayer];
    const updatedTourney: TournamentRecord = {
      ...tournament,
      players: updatedPlayers,
    };

    setTournament(updatedTourney);
    saveStoredTournament(updatedTourney);

    // Also persist into community players database
    const communityPlayers = loadStoredPlayers();
    const newRecord: PlayerRecord = {
      id: newId,
      cciId: newCciId,
      name: newPlayerName.trim(),
      avatarUrl: "/images/hero.webp",
      rating: assignedRating,
      peakRating: assignedRating,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      city: newPlayerCity,
      state: "India",
      fideId: newPlayerFideId.trim() || undefined,
      role: "player",
      tierNumber: tier.tierNumber,
      tierName: tier.name,
    };
    saveStoredPlayers([newRecord, ...communityPlayers]);

    sound.playGoldenChord();
    showToast(`Registered ${newPlayer.name} with default ${assignedRating} Elo (${tier.name})`);
    
    // Reset form
    setNewPlayerName("");
    setNewPlayerFideId("");
    setNewPlayerRating(DEFAULT_PLAYER_RATING);
    setShowAddPlayerModal(false);
  };

  // Filtered players in player management
  const filteredDirectory = useMemo(() => {
    return standingsList.filter((p) =>
      p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
      p.cciId.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(playerSearchQuery.toLowerCase()))
    );
  }, [standingsList, playerSearchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="chess-manager">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#0A1F24] border border-[#C5A059]/60 text-white shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-fade-in font-sans text-sm">
          <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Tournament Desk Shell */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-[rgba(245, 242, 235,0.06)] bg-[#08161A]/90 backdrop-blur-2xl">
        
        {/* ========================================================================= */}
        {/* TOURNAMENT DESK HEADER BAR (Modeled after ChessManager) */}
        {/* ========================================================================= */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#0E2126] via-[#0E2126] to-[#0E2126] border-b border-[rgba(245, 242, 235,0.06)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-sans font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live ChessManager Engine
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-sans font-semibold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                  FIDE Swiss Dutch &bull; Official Ratings
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-sans font-semibold bg-white/5 text-slate-300 border border-[rgba(245, 242, 235,0.06)]">
                  Default {DEFAULT_PLAYER_RATING} Elo Base
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
                {tournament.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#C5A059]" />
                  {tournament.timeControl}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  {tournament.players.length} Competitors Registered
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Round {tournament.currentRound} of {tournament.totalRounds}
                </span>
              </div>
            </div>

            {/* Quick Actions & Arbiter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  sound.playTactileClick();
                  if (onNavigate) {
                    onNavigate("admin");
                  } else {
                    window.location.hash = "admin";
                  }
                }}
                className="px-4 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-sans font-semibold flex items-center gap-2 shadow-lg transition-all cursor-button"
                title="Go to Arbiter Backend to add/delete players, track attendance, confirm roster, or create new tournaments"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Arbiter Backend Console</span>
              </button>

              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="accent-gold-btn px-5 py-2.5 rounded-full text-xs font-sans font-semibold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Player</span>
              </button>

              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-[rgba(245, 242, 235,0.06)]">
                <button
                  onClick={() => setArbiterMode(!arbiterMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                    arbiterMode
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {arbiterMode ? "Arbiter Desk: ON" : "Arbiter Desk: OFF"}
                </button>
                <button
                  onClick={() => window.print()}
                  title="Print Pairings / Crosstable"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 sm:gap-4 mt-8 pt-6 border-t border-[rgba(245, 242, 235,0.06)] overflow-x-auto">
            <button
              onClick={() => setActiveTab("pairings")}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "pairings"
                  ? "bg-[#C5A059] text-[#08161A] shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Pairings &amp; Results</span>
            </button>

            <button
              onClick={() => setActiveTab("standings")}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "standings"
                  ? "bg-[#C5A059] text-[#08161A] shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Standings &amp; Elo Delta</span>
            </button>

            <button
              onClick={() => setActiveTab("players")}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "players"
                  ? "bg-[#C5A059] text-[#08161A] shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manage Players ({tournament.players.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("arbiter")}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "arbiter"
                  ? "bg-[#C5A059] text-[#08161A] shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Swiss Protocols</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PAIRINGS & LIVE FIDE MATCH DESK */}
        {/* ========================================================================= */}
        {activeTab === "pairings" && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Round Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(245, 242, 235,0.04)]">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {Array.from({ length: tournament.totalRounds }, (_, i) => i + 1).map((r) => {
                  const hasRound = Boolean(tournament.rounds[r]);
                  const isCurrent = r === selectedRound;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRound(r);
                        setActiveScoreDropdownId(null);
                      }}
                      disabled={!hasRound}
                      className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-white/15 text-white border border-[#C5A059]/60 shadow-sm"
                          : hasRound
                          ? "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                          : "opacity-30 cursor-not-allowed text-slate-600 bg-black/20"
                      }`}
                    >
                      <span>Round {r}</span>
                      {hasRound && r < tournament.currentRound && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {r === tournament.currentRound && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>

              {arbiterMode && selectedRound === tournament.currentRound && (
                <button
                  onClick={handleGenerateNextRound}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#C5A059] text-black font-sans font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md self-start sm:self-auto shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Round {tournament.currentRound + 1} Pairings</span>
                </button>
              )}
            </div>

            {/* Match Board Cards Grid */}
            <div className="space-y-3">
              {currentMatches.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-sans text-sm space-y-3">
                  <AlertCircle className="w-8 h-8 text-[#C5A059] mx-auto opacity-60" />
                  <p>No pairings generated for Round {selectedRound} yet.</p>
                </div>
              ) : (
                currentMatches.map((m) => {
                  const wLiveR = playerLiveRatings.get(m.whitePlayer.id) ?? m.whitePlayer.rating;
                  const bLiveR = m.blackPlayer ? (playerLiveRatings.get(m.blackPlayer.id) ?? m.blackPlayer.rating) : 0;
                  const wTier = getTierFromRating(wLiveR);
                  const bTier = m.blackPlayer ? getTierFromRating(bLiveR) : null;

                  return (
                    <div
                      key={m.id}
                      className={`quiet-card rounded-2xl p-4 sm:p-5 border border-[rgba(245, 242, 235,0.04)] hover:border-white/15 transition-all bg-[#091A1E]/80 backdrop-blur-md relative ${
                        activeScoreDropdownId === m.id ? "z-30 ring-1 ring-[#C5A059]/30" : "z-10"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* Board Number */}
                        <div className="md:col-span-1 flex items-center gap-2 md:justify-center">
                          <span className="font-mono text-xs font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-lg">
                            B{m.boardNumber || "—"}
                          </span>
                        </div>

                        {/* White Player */}
                        <div className="md:col-span-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(245, 242, 235,0.04)]">
                          <div className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-sm shrink-0" title="White" />
                            <div>
                              <div className="font-sans font-semibold text-sm text-white flex items-center gap-2">
                                <span>{m.whitePlayer.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-sans mt-0.5">
                                <span className="text-[#C5A059] font-mono font-medium">{wLiveR} Elo</span>
                                <span>&bull;</span>
                                <span className="text-[11px] text-slate-400">{wTier.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Rating Delta Indicator */}
                          {m.isCompleted && m.whiteDelta !== undefined && m.whiteDelta !== 0 && (
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center ${
                              m.whiteDelta > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                            }`}>
                              {m.whiteDelta > 0 ? `+${m.whiteDelta}` : m.whiteDelta}
                            </span>
                          )}
                        </div>

                        {/* Match Result Scoring Dropdown with Smooth Scroll-Down Effect */}
                        <div className="md:col-span-3 flex flex-col items-center justify-center gap-1.5 py-1 relative" data-score-dropdown>
                          {m.result === "BYE" ? (
                            <span className="text-xs font-mono font-bold px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                              <Award className="w-3.5 h-3.5 text-emerald-400" />
                              <span>BYE (1.0 PT)</span>
                            </span>
                          ) : (
                            <div className="relative w-full max-w-[210px]">
                              {/* Dropdown Trigger Button */}
                              <button
                                type="button"
                                disabled={!arbiterMode}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (arbiterMode) {
                                    setActiveScoreDropdownId(activeScoreDropdownId === m.id ? null : m.id);
                                  }
                                }}
                                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between gap-2 transition-all border shadow-md select-none cursor-pointer ${
                                  !arbiterMode
                                    ? "opacity-60 cursor-not-allowed bg-black/40 border-[rgba(245, 242, 235,0.04)] text-slate-400"
                                    : activeScoreDropdownId === m.id
                                    ? "bg-[#0E2126] border-[#C5A059] text-[#C5A059] ring-2 ring-[#C5A059]/30"
                                    : m.isCompleted
                                    ? m.result === "1-0"
                                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:border-emerald-400"
                                      : m.result === "0-1"
                                      ? "bg-sky-950/70 border-sky-500/50 text-sky-300 hover:border-sky-400"
                                      : m.result === "1/2-1/2"
                                      ? "bg-amber-950/70 border-amber-500/50 text-amber-300 hover:border-amber-400"
                                      : "bg-purple-950/70 border-purple-500/50 text-purple-300 hover:border-purple-400"
                                    : "bg-black/60 border-[rgba(245, 242, 235,0.06)] text-slate-300 hover:border-[#C5A059]/50 hover:text-white"
                                }`}
                                title={arbiterMode ? "Click to open scoring dropdown" : "Arbiter mode required"}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    m.isCompleted ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                                  }`} />
                                  <span className="truncate">
                                    {m.result === "1-0" ? "1 : 0 (1.0 - 0.0)" :
                                     m.result === "1/2-1/2" ? "½ : ½ (0.5 - 0.5)" :
                                     m.result === "0-1" ? "0 : 1 (0.0 - 1.0)" :
                                     m.result === "1F-0F" ? "1F : 0 (Forfeit)" :
                                     m.result === "0F-1F" ? "0 : 1F (Forfeit)" :
                                     m.result === "0F-0F" ? "0F : 0F (Double 0)" :
                                     "Score / Pointing (- : -)"}
                                  </span>
                                </div>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-slate-400 ${
                                    activeScoreDropdownId === m.id ? "rotate-180 text-[#C5A059]" : ""
                                  }`}
                                />
                              </button>

                              {/* Scroll-Down Dropdown Menu */}
                              {activeScoreDropdownId === m.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute z-50 top-full left-0 right-0 mt-1.5 p-2 rounded-2xl bg-[#091D22] border border-[#C5A059]/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 text-left min-w-[210px]"
                                >
                                  {/* Header */}
                                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#C5A059] font-bold border-b border-[rgba(245, 242, 235,0.04)] mb-1 flex items-center justify-between">
                                    <span>Pointing &amp; Result</span>
                                    <span>Pts (W - B)</span>
                                  </div>

                                  {/* Standard Pointings */}
                                  <div className="space-y-0.5">
                                    {[
                                      { value: "1-0", label: "1 : 0", sub: "White Wins", pts: "1.0 - 0.0", hover: "hover:bg-emerald-500/15 hover:text-emerald-300" },
                                      { value: "1/2-1/2", label: "½ : ½", sub: "Draw", pts: "0.5 - 0.5", hover: "hover:bg-amber-500/15 hover:text-amber-300" },
                                      { value: "0-1", label: "0 : 1", sub: "Black Wins", pts: "0.0 - 1.0", hover: "hover:bg-sky-500/15 hover:text-sky-300" },
                                    ].map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          handleSetResult(m.id, opt.value as any);
                                          setActiveScoreDropdownId(null);
                                        }}
                                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                          m.result === opt.value
                                            ? "bg-[#C5A059] text-[#08161A] font-bold shadow-md"
                                            : `text-slate-200 ${opt.hover}`
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="font-bold">{opt.label}</span>
                                          <span className="text-[10px] opacity-75 font-sans truncate">{opt.sub}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[11px] font-bold">{opt.pts}</span>
                                          {m.result === opt.value && <Check className="w-3 h-3 text-[#08161A]" />}
                                        </div>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Forfeits Header */}
                                  <div className="px-2 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-t border-[rgba(245, 242, 235,0.04)] mt-1.5 mb-0.5 flex items-center justify-between">
                                    <span>Forfeits &amp; Zeroes</span>
                                    <span>Pts</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {[
                                      { value: "1F-0F", label: "1F : 0", sub: "White Forfeit Win", pts: "1.0 - 0.0" },
                                      { value: "0F-1F", label: "0 : 1F", sub: "Black Forfeit Win", pts: "0.0 - 1.0" },
                                      { value: "0F-0F", label: "0F : 0F", sub: "Double Forfeit", pts: "0.0 - 0.0" },
                                    ].map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          handleSetResult(m.id, opt.value as any);
                                          setActiveScoreDropdownId(null);
                                        }}
                                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                          m.result === opt.value
                                            ? "bg-purple-600 text-white font-bold"
                                            : "text-slate-300 hover:bg-purple-950/40 hover:text-purple-300"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="font-bold">{opt.label}</span>
                                          <span className="text-[10px] opacity-75 font-sans truncate">{opt.sub}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[11px] font-bold">{opt.pts}</span>
                                          {m.result === opt.value && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                      </button>
                                    ))}
                                  </div>

                                  {/* Reset Option */}
                                  <div className="border-t border-[rgba(245, 242, 235,0.04)] mt-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSetResult(m.id, "PENDING");
                                        setActiveScoreDropdownId(null);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                        m.result === "PENDING"
                                          ? "bg-rose-950/60 text-rose-300 border border-rose-800/40"
                                          : "text-slate-400 hover:bg-rose-950/30 hover:text-rose-300"
                                      }`}
                                    >
                                      <span className="font-sans font-medium text-[11px]">Reset to Scheduled (- : -)</span>
                                      <span className="text-[10px] opacity-75">Clear</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Black Player */}
                        <div className="md:col-span-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-[rgba(245, 242, 235,0.04)]">
                          {m.blackPlayer ? (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700 shadow-sm shrink-0" title="Black" />
                                <div>
                                  <div className="font-sans font-semibold text-sm text-white flex items-center gap-2">
                                    <span>{m.blackPlayer.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-400 font-sans mt-0.5">
                                    <span className="text-[#C5A059] font-mono font-medium">{bLiveR} Elo</span>
                                    <span>&bull;</span>
                                    <span className="text-[11px] text-slate-400">{bTier?.name}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Rating Delta Indicator */}
                              {m.isCompleted && m.blackDelta !== undefined && m.blackDelta !== 0 && (
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center ${
                                  m.blackDelta > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                                }`}>
                                  {m.blackDelta > 0 ? `+${m.blackDelta}` : m.blackDelta}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-sans text-slate-500 italic">Unassigned Bye</span>
                          )}
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
        {/* TAB 2: STANDINGS & LIVE FIDE ELO DELTA CROSSTABLE */}
        {/* ========================================================================= */}
        {activeTab === "standings" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(245, 242, 235,0.04)]">
              <div>
                <h3 className="text-lg font-display font-bold text-white">
                  Official FIDE Swiss Crosstable &amp; Standings
                </h3>
                <p className="text-xs font-sans text-slate-400 mt-0.5">
                  Tiebreak Protocol: Buchholz Cut 1 (BH-1) &rarr; Sonneborn-Berger (SB) &rarr; Direct Encounter
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-sans text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  Live FIDE Rated
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[rgba(245, 242, 235,0.06)] text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3">Starting Elo</th>
                    <th className="py-3 px-3">Live Elo</th>
                    <th className="py-3 px-3">Elo Delta</th>
                    <th className="py-3 px-3">Category Batch</th>
                    <th className="py-3 px-3 text-center">PTS</th>
                    <th className="py-3 px-3 text-center">BH-1</th>
                    <th className="py-3 px-3 text-center">SB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {standingsList.map((p, idx) => {
                    const delta = p.ratingDelta ?? 0;
                    const tier = getTierFromRating(p.rating);

                    return (
                      <tr 
                        key={p.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          idx === 0 ? "bg-[#C5A059]/[0.05]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          {idx + 1}
                        </td>
                        
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {idx === 0 && <Trophy className="w-3.5 h-3.5 text-[#C5A059]" />}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {p.cciId} {p.city ? `• ${p.city}` : ""}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-400">
                          {p.startRating ?? p.rating}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          {p.rating}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] ${
                            delta > 0
                              ? "bg-emerald-500/20 text-emerald-300"
                              : delta < 0
                              ? "bg-rose-500/20 text-rose-300"
                              : "text-slate-400"
                          }`}>
                            {delta > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            ) : delta < 0 ? (
                              <ArrowDownRight className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Minus className="w-3 h-3 text-slate-500" />
                            )}
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold border ${tier.badgeColor} ${tier.textColor} ${tier.borderColor}`}>
                            {tier.name}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono font-bold text-sm text-[#C5A059]">
                          {p.score.toFixed(1)}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                          {(p.buchholzCut1 || 0).toFixed(1)}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                          {(p.sonnebornBerger || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PLAYER MANAGEMENT DESK (Register with Default Elo) */}
        {/* ========================================================================= */}
        {activeTab === "players" && (
          <div className="p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(245, 242, 235,0.04)]">
              <div>
                <h3 className="text-lg font-display font-bold text-white">
                  Player Roster &amp; FIDE Elo Directory
                </h3>
                <p className="text-xs font-sans text-slate-400 mt-0.5">
                  Manage registered tournament players, seed ratings, and FIDE club affiliations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                    placeholder="Search player name or city..."
                    className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C5A059] font-sans"
                  />
                </div>

                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="accent-gold-btn px-4 py-2 rounded-xl text-xs font-sans font-semibold flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Player</span>
                </button>
              </div>
            </div>

            {/* Players Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[rgba(245, 242, 235,0.06)] text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3">CCI ID</th>
                    <th className="py-3 px-4">Player Name</th>
                    <th className="py-3 px-3">City / Chapter</th>
                    <th className="py-3 px-3">Current Elo</th>
                    <th className="py-3 px-3">Category Batch</th>
                    <th className="py-3 px-3">FIDE ID</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDirectory.map((p) => {
                    const tier = getTierFromRating(p.rating);

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">
                          {p.cciId}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-white">
                          {p.name}
                        </td>

                        <td className="py-3.5 px-3 text-slate-300">
                          {p.city || "Jabalpur Hub"}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold text-[#C5A059] text-sm">
                          {p.rating}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${tier.badgeColor} ${tier.textColor} ${tier.borderColor}`}>
                            {tier.name}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-400">
                          {p.fideId || "Unlinked"}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <UserCheck className="w-3.5 h-3.5" />
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ARBITER CONSOLE & SWISS PROTOCOLS */}
        {/* ========================================================================= */}
        {activeTab === "arbiter" && (
          <div className="p-6 sm:p-8 space-y-8 font-sans">
            <div>
              <h3 className="text-lg font-display font-bold text-white">
                FIDE Arbiter Panel &amp; Swiss Algorithms
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Operates according to the FIDE Swiss Rules (Dutch System C.04.3). Rematch prevention, color sequence alternation, and automatic bye allocation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-5 rounded-2xl quiet-surface border border-[rgba(245, 242, 235,0.04)] space-y-3">
                <span className="text-[#C5A059] font-bold block text-sm font-display">1. Rematch Strictness</span>
                <p className="text-slate-400 leading-relaxed">
                  No two players shall be paired more than once in the same tournament, regardless of score tiebreaks.
                </p>
              </div>

              <div className="p-5 rounded-2xl quiet-surface border border-[rgba(245, 242, 235,0.04)] space-y-3">
                <span className="text-[#C5A059] font-bold block text-sm font-display">2. Color Balance</span>
                <p className="text-slate-400 leading-relaxed">
                  Alternates White and Black rounds whenever possible. Prevents any competitor from playing three consecutive games with the same color.
                </p>
              </div>

              <div className="p-5 rounded-2xl quiet-surface border border-[rgba(245, 242, 235,0.04)] space-y-3">
                <span className="text-[#C5A059] font-bold block text-sm font-display">3. Live Rating Engine</span>
                <p className="text-slate-400 leading-relaxed">
                  Applies dynamic FIDE K-factors (K=40 for default/provisional, K=20 standard, K=10 master) instantly on result confirmation.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[rgba(245, 242, 235,0.06)] flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  sound.playTactileClick();
                  window.print();
                }}
                className="px-5 py-2.5 rounded-xl border border-[rgba(245, 242, 235,0.06)] hover:border-[#C5A059] text-xs font-semibold text-white transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <span>Export / Print Pairing Sheet</span>
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  showToast("Tournament pairing cross-table exported to FIDE format.");
                }}
                className="px-5 py-2.5 rounded-xl border border-[rgba(245, 242, 235,0.06)] hover:border-[#C5A059] text-xs font-semibold text-white transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export FIDE CSV Matrix</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ADD PLAYER MODAL (With default rating 1000 Elo) */}
      {/* ========================================================================= */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="quiet-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#C5A059]/40 shadow-2xl relative space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(245, 242, 235,0.06)]">
              <div>
                <h3 className="text-xl font-display font-bold text-white">Register Competitor</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default base rating: <strong className="text-[#C5A059]">{DEFAULT_PLAYER_RATING} Elo</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAddPlayerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPlayer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Player Full Name</label>
                <input
                  type="text"
                  required
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="e.g. Aditya Kashyap"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">City / Chapter</label>
                  <select
                    value={newPlayerCity}
                    onChange={(e) => setNewPlayerCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Jabalpur">Jabalpur</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Indore">Indore</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Starting Elo (Default 1000)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3200"
                    value={newPlayerRating}
                    onChange={(e) => setNewPlayerRating(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-white font-mono font-bold focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">FIDE ID (Optional)</label>
                <input
                  type="text"
                  value={newPlayerFideId}
                  onChange={(e) => setNewPlayerFideId(e.target.value)}
                  placeholder="e.g. 5049382"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Dynamic Tier Category Preview */}
              <div className="p-3.5 rounded-xl bg-[#091A1E] border border-[rgba(245, 242, 235,0.06)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Initial Performance Batch:</span>
                  <span className="font-display font-bold text-white text-sm">
                    {getTierFromRating(newPlayerRating).name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#C5A059]">
                  {newPlayerRating} Elo
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-gold-btn px-6 py-2.5 rounded-xl font-semibold shadow-lg"
                >
                  Add Player
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default TournamentManager;
