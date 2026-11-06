import React, { useState, useEffect, useMemo } from "react";
import { 
  Trophy, 
  Users, 
  UserCheck, 
  UserX, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  Swords, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Check,
  RefreshCw, 
  AlertTriangle,
  FolderPlus,
  Share2,
  Database
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  ChessDeskBackend, 
  CreateTournamentInput, 
  PlayerInput, 
  AttendanceMetrics 
} from "../../lib/backend/chessDeskBackend";
import { TournamentRecord } from "../../lib/storage/mockDatabase";
import { TournamentPlayer, BoardMatch } from "../../lib/chess/pairingEngine";
import { DEFAULT_PLAYER_RATING, getTierFromRating, CCI_RATING_CATEGORIES } from "../../lib/chess/eloEngine";
import { sound } from "../../lib/audio";

interface ChessDeskAdminProps {
  onNavigate: (view: string) => void;
}

export const ChessDeskAdmin: React.FC<ChessDeskAdminProps> = ({ onNavigate }) => {
  // Active Tournament & Tournaments List State
  const [tournaments, setTournaments] = useState<TournamentRecord[]>(() => ChessDeskBackend.getAllTournaments());
  const [activeTournamentId, setActiveTournamentId] = useState<string>(() => ChessDeskBackend.getActiveTournamentId());
  
  // Current active tournament
  const currentTourney = useMemo(() => {
    return tournaments.find((t) => t.id === activeTournamentId) || tournaments[0];
  }, [tournaments, activeTournamentId]);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<"players" | "attendance" | "pairings" | "tournaments" | "reports">("attendance");

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "pending">("all");
  const [filterAttendance, setFilterAttendance] = useState<"all" | "present" | "absent" | "withdrawn">("all");

  // Modals State
  const [showCreateTourneyModal, setShowCreateTourneyModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<TournamentPlayer | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(currentTourney?.currentRound || 1);
  const [activeScoreDropdownBoard, setActiveScoreDropdownBoard] = useState<number | null>(null);

  // Outside click listener for score dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-score-dropdown]')) {
        setActiveScoreDropdownBoard(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Form State: Create Tournament
  const [newTourneyTitle, setNewTourneyTitle] = useState("");
  const [newTourneyFormat, setNewTourneyFormat] = useState<'Swiss System' | 'Round Robin' | 'Single Elimination'>('Swiss System');
  const [newTourneyTimeControl, setNewTourneyTimeControl] = useState("15m + 10s Rapid");
  const [newTourneyRounds, setNewTourneyRounds] = useState<number>(5);
  const [newTourneyCity, setNewTourneyCity] = useState("Jabalpur");
  const [newTourneyVenue, setNewTourneyVenue] = useState("CCI Central Chess Arena");
  const [newTourneyStartDate, setNewTourneyStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Form State: Add/Edit Player
  const [playerName, setPlayerName] = useState("");
  const [playerRating, setPlayerRating] = useState<number>(DEFAULT_PLAYER_RATING);
  const [playerCity, setPlayerCity] = useState("Jabalpur");
  const [playerFideId, setPlayerFideId] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [playerIsConfirmed, setPlayerIsConfirmed] = useState(true);
  const [playerAttendance, setPlayerAttendance] = useState<'present' | 'absent' | 'withdrawn'>('present');
  const [playerNotes, setPlayerNotes] = useState("");

  // Sync state with backend events
  const refreshData = () => {
    const list = ChessDeskBackend.getAllTournaments();
    setTournaments(list);
    const activeId = ChessDeskBackend.getActiveTournamentId();
    setActiveTournamentId(activeId);
  };

  useEffect(() => {
    const handleBackendUpdate = () => {
      refreshData();
    };
    window.addEventListener("cci-tournament-backend-updated", handleBackendUpdate);
    return () => window.removeEventListener("cci-tournament-backend-updated", handleBackendUpdate);
  }, []);

  useEffect(() => {
    if (currentTourney) {
      setSelectedRound(currentTourney.currentRound || 1);
    }
  }, [currentTourney?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------------------
  // METRICS & FILTERED DATA
  // -------------------------------------------------------------------------
  const metrics: AttendanceMetrics = useMemo(() => {
    if (!currentTourney) {
      return {
        totalRegistered: 0,
        confirmedCount: 0,
        pendingCount: 0,
        presentCount: 0,
        absentCount: 0,
        withdrawnCount: 0,
        attendanceRatePercent: 0,
      };
    }
    return ChessDeskBackend.getAttendanceMetrics(currentTourney.id);
  }, [currentTourney]);

  const filteredPlayers = useMemo(() => {
    if (!currentTourney) return [];
    return currentTourney.players.filter((p) => {
      // Search text
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cciId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.fideId && p.fideId.includes(searchQuery));
      if (!matchesSearch) return false;

      // Tier filter
      if (filterTier !== "all" && p.tierName !== filterTier) return false;

      // Confirmed filter
      if (filterStatus === "confirmed" && p.isConfirmed === false) return false;
      if (filterStatus === "pending" && p.isConfirmed !== false) return false;

      // Attendance filter
      if (filterAttendance !== "all" && (p.attendanceStatus || "present") !== filterAttendance) return false;

      return true;
    });
  }, [currentTourney, searchQuery, filterTier, filterStatus, filterAttendance]);

  // -------------------------------------------------------------------------
  // ACTIONS: TOURNAMENT
  // -------------------------------------------------------------------------
  const handleSelectTournament = (id: string) => {
    sound.playTactileClick();
    ChessDeskBackend.setActiveTournamentId(id);
    setActiveTournamentId(id);
    refreshData();
    showToast(`Switched active tournament to: ${ChessDeskBackend.getTournamentById(id)?.title}`);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyTitle.trim()) {
      showToast("Tournament title is required");
      return;
    }

    const created = ChessDeskBackend.createTournament({
      title: newTourneyTitle.trim(),
      format: newTourneyFormat,
      timeControl: newTourneyTimeControl,
      totalRounds: Number(newTourneyRounds) || 5,
      city: newTourneyCity,
      venue: newTourneyVenue,
      startDate: newTourneyStartDate,
    });

    sound.playGoldenChord();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    setShowCreateTourneyModal(false);
    setNewTourneyTitle("");
    refreshData();
    showToast(`Created new tournament: ${created.title}`);
  };

  const handleDeleteTournament = (id: string) => {
    if (tournaments.length <= 1) {
      alert("At least one tournament must remain in the backend.");
      return;
    }
    const target = tournaments.find((t) => t.id === id);
    if (window.confirm(`Are you sure you want to delete tournament: "${target?.title}"? This cannot be undone.`)) {
      sound.playPieceMove();
      ChessDeskBackend.deleteTournament(id);
      refreshData();
      showToast(`Deleted tournament.`);
    }
  };

  // -------------------------------------------------------------------------
  // ACTIONS: PLAYER CRUD
  // -------------------------------------------------------------------------
  const openAddPlayerModal = () => {
    sound.playTactileClick();
    setEditingPlayer(null);
    setPlayerName("");
    setPlayerRating(DEFAULT_PLAYER_RATING);
    setPlayerCity("Jabalpur");
    setPlayerFideId("");
    setPlayerEmail("");
    setPlayerPhone("");
    setPlayerIsConfirmed(true);
    setPlayerAttendance("present");
    setPlayerNotes("");
    setShowPlayerModal(true);
  };

  const openEditPlayerModal = (p: TournamentPlayer) => {
    sound.playTactileClick();
    setEditingPlayer(p);
    setPlayerName(p.name);
    setPlayerRating(p.rating);
    setPlayerCity(p.city || "Jabalpur");
    setPlayerFideId(p.fideId || "");
    setPlayerEmail(p.email || "");
    setPlayerPhone(p.phone || "");
    setPlayerIsConfirmed(p.isConfirmed !== false);
    setPlayerAttendance(p.attendanceStatus || "present");
    setPlayerNotes(p.notes || "");
    setShowPlayerModal(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      showToast("Player name is required.");
      return;
    }

    if (!currentTourney) return;

    if (editingPlayer) {
      // Update existing
      ChessDeskBackend.updatePlayer(currentTourney.id, editingPlayer.id, {
        name: playerName.trim(),
        rating: Number(playerRating) || DEFAULT_PLAYER_RATING,
        city: playerCity.trim(),
        fideId: playerFideId.trim() || undefined,
        email: playerEmail.trim() || undefined,
        phone: playerPhone.trim() || undefined,
        isConfirmed: playerIsConfirmed,
        attendanceStatus: playerAttendance,
        notes: playerNotes.trim() || undefined,
      });
      showToast(`Updated player: ${playerName.trim()}`);
    } else {
      // Insert new
      ChessDeskBackend.addPlayer(currentTourney.id, {
        name: playerName.trim(),
        rating: Number(playerRating) || DEFAULT_PLAYER_RATING,
        city: playerCity.trim(),
        fideId: playerFideId.trim() || undefined,
        email: playerEmail.trim() || undefined,
        phone: playerPhone.trim() || undefined,
        isConfirmed: playerIsConfirmed,
        attendanceStatus: playerAttendance,
        notes: playerNotes.trim() || undefined,
      });
      showToast(`Added ${playerName.trim()} with ${playerRating} Elo`);
    }

    sound.playPieceMove();
    setShowPlayerModal(false);
    refreshData();
  };

  const handleDeletePlayer = (playerId: string, name: string) => {
    if (!currentTourney) return;
    if (window.confirm(`Delete player "${name}" from tournament?`)) {
      sound.playPieceMove();
      ChessDeskBackend.deletePlayer(currentTourney.id, playerId);
      refreshData();
      showToast(`Removed ${name} from roster.`);
    }
  };

  // -------------------------------------------------------------------------
  // ACTIONS: ATTENDANCE & CONFIRMATION DESK
  // -------------------------------------------------------------------------
  const handleToggleAttendance = (playerId: string, current: 'present' | 'absent' | 'withdrawn' | undefined) => {
    if (!currentTourney) return;
    sound.playTactileClick();
    const nextStatus: 'present' | 'absent' | 'withdrawn' = 
      current === "present" ? "absent" : current === "absent" ? "withdrawn" : "present";
    ChessDeskBackend.setPlayerAttendance(currentTourney.id, playerId, nextStatus);
    refreshData();
  };

  const handleToggleConfirmed = (playerId: string, currentStatus: boolean | undefined) => {
    if (!currentTourney) return;
    sound.playTactileClick();
    const next = currentStatus === false ? true : false;
    ChessDeskBackend.confirmPlayer(currentTourney.id, playerId, next);
    refreshData();
  };

  const handleMarkAllPresent = () => {
    if (!currentTourney) return;
    sound.playGoldenChord();
    const ids = currentTourney.players.map((p) => p.id);
    ChessDeskBackend.bulkSetAttendance(currentTourney.id, ids, "present");
    refreshData();
    showToast(`Marked all ${ids.length} players as PRESENT.`);
  };

  const handleConfirmAllCheckedIn = () => {
    if (!currentTourney) return;
    sound.playGoldenChord();
    const presentIds = currentTourney.players
      .filter((p) => p.attendanceStatus === "present" || !p.attendanceStatus)
      .map((p) => p.id);
    ChessDeskBackend.bulkConfirmPlayers(currentTourney.id, presentIds, true);
    refreshData();
    showToast(`Confirmed ${presentIds.length} checked-in competitors.`);
  };

  // -------------------------------------------------------------------------
  // ACTIONS: PAIRINGS & RESULTS OVERRIDE
  // -------------------------------------------------------------------------
  const handleGeneratePairings = (onlyEligible: boolean = true) => {
    if (!currentTourney) return;
    try {
      sound.playGoldenChord();
      const matches = ChessDeskBackend.generateNextRound(currentTourney.id, onlyEligible);
      refreshData();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast(`Generated Round ${currentTourney.currentRound + 1} with ${matches.length} boards.`);
    } catch (err: any) {
      alert(err.message || "Failed to generate pairings.");
    }
  };

  const handleSetResult = (boardNum: number, res: BoardMatch["result"]) => {
    if (!currentTourney) return;
    sound.playPieceMove();
    ChessDeskBackend.setMatchResult(currentTourney.id, selectedRound, boardNum, res);
    refreshData();
    showToast(`Board ${boardNum} result: ${res}`);
  };

  // -------------------------------------------------------------------------
  // ACTIONS: CSV DOWNLOADS ("GET THE LIST")
  // -------------------------------------------------------------------------
  const downloadCSV = (content: string, filename: string) => {
    sound.playTactileClick();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded: ${filename}`);
  };

  const handlePrint = () => {
    sound.playTactileClick();
    window.print();
  };

  return (
    <div className="w-full min-h-screen pt-28 pb-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#0E2126] border border-[#C5A059] text-white shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-fade-in text-sm font-semibold">
          <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP ADMIN HEADER BAR */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[rgba(245, 242, 235,0.06)] bg-[#08161A]/90 backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Arbiter &amp; Admin Backend
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                ChessManager Official Desk
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs border border-emerald-500/30">
                {currentTourney?.status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
                {currentTourney?.title}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-[#9CA3A8]">
              {currentTourney?.location} &bull; {currentTourney?.timeControl} &bull; Round {currentTourney?.currentRound} of {currentTourney?.totalRounds}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tournament Selector Dropdown */}
            <select
              value={activeTournamentId}
              onChange={(e) => handleSelectTournament(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#0E2126] border border-[rgba(245, 242, 235,0.06)] text-white text-xs font-semibold focus:outline-none focus:border-[#C5A059]"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.players.length} players)
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                sound.playTactileClick();
                setShowCreateTourneyModal(true);
              }}
              className="accent-gold-btn px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Tournament</span>
            </button>

            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("manager");
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-[rgba(245, 242, 235,0.06)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trophy className="w-4 h-4 text-[#C5A059]" />
              <span>Public Desk</span>
            </button>
          </div>

        </div>

        {/* METRICS ROW (Get Attendances, Confirmations) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[rgba(245, 242, 235,0.06)]">
          <div className="p-3.5 rounded-2xl bg-black/30 border border-[rgba(245, 242, 235,0.04)]">
            <span className="text-[10px] text-slate-400 font-mono block">TOTAL REGISTERED</span>
            <span className="text-2xl font-display font-bold text-white mt-1 block">
              {metrics.totalRegistered}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 font-mono block">CONFIRMED ROSTER</span>
            <span className="text-2xl font-display font-bold text-emerald-400 mt-1 block">
              {metrics.confirmedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-300 font-mono block">PENDING APPROVAL</span>
            <span className="text-2xl font-display font-bold text-amber-400 mt-1 block">
              {metrics.pendingCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
            <span className="text-[10px] text-sky-300 font-mono block">PRESENT (CHECKED IN)</span>
            <span className="text-2xl font-display font-bold text-sky-400 mt-1 block">
              {metrics.presentCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] text-rose-300 font-mono block">ABSENT / NO-SHOW</span>
            <span className="text-2xl font-display font-bold text-rose-400 mt-1 block">
              {metrics.absentCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20">
            <span className="text-[10px] text-[#C5A059] font-mono block">ATTENDANCE RATE</span>
            <span className="text-2xl font-display font-bold text-[#C5A059] mt-1 block">
              {metrics.attendanceRatePercent}%
            </span>
          </div>
        </div>

        {/* ADMIN CONSOLE TABS */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-[rgba(245, 242, 235,0.06)] pt-4 scrollbar-none">
          <button
            onClick={() => { sound.playTactileClick(); setActiveTab("attendance"); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "attendance"
                ? "bg-[#C5A059] text-[#08161A] shadow-md"
                : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Attendance &amp; Confirmation Desk</span>
          </button>

          <button
            onClick={() => { sound.playTactileClick(); setActiveTab("players"); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "players"
                ? "bg-[#C5A059] text-[#08161A] shadow-md"
                : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Player Desk (Add, Edit, Delete)</span>
          </button>

          <button
            onClick={() => { sound.playTactileClick(); setActiveTab("pairings"); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pairings"
                ? "bg-[#C5A059] text-[#08161A] shadow-md"
                : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Swiss Pairings &amp; Overrides</span>
          </button>

          <button
            onClick={() => { sound.playTactileClick(); setActiveTab("reports"); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "reports"
                ? "bg-[#C5A059] text-[#08161A] shadow-md"
                : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>List &amp; CSV Exports</span>
          </button>

          <button
            onClick={() => { sound.playTactileClick(); setActiveTab("tournaments"); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "tournaments"
                ? "bg-[#C5A059] text-[#08161A] shadow-md"
                : "text-slate-300 hover:text-white bg-white/5 hover:bg-white/10"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Tournament Settings &amp; Manager</span>
          </button>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ATTENDANCE & CONFIRMATION DESK ("GET ATTENDANCES, CONFIRM")   */}
      {/* ===================================================================== */}
      {activeTab === "attendance" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick Action Bar for Attendance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.06)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleMarkAllPresent}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleConfirmAllCheckedIn}
                className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Confirm All Checked-In</span>
              </button>

              <button
                onClick={() => {
                  if (currentTourney) {
                    downloadCSV(
                      ChessDeskBackend.exportAttendanceCSV(currentTourney.id),
                      `${currentTourney.title.replace(/\s+/g, "_")}_Attendance_Sheet.csv`
                    );
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-[rgba(245, 242, 235,0.06)] text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Export Attendance Sheet</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search player name, city, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs w-64 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <select
                value={filterAttendance}
                onChange={(e: any) => setFilterAttendance(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">All Attendance</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* ATTENDANCE CHECKLIST TABLE */}
          <div className="glass-panel rounded-2xl border border-[rgba(245, 242, 235,0.06)] overflow-hidden bg-[#08161A]/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E2126] text-slate-400 uppercase font-mono text-[10px] border-b border-[rgba(245, 242, 235,0.06)]">
                  <tr>
                    <th className="py-3 px-4">No.</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">CCI ID</th>
                    <th className="py-3 px-4">Elo Rating</th>
                    <th className="py-3 px-4">Category Batch</th>
                    <th className="py-3 px-4 text-center">Attendance (Check-in)</th>
                    <th className="py-3 px-4 text-center">Confirmation Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-200">
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No players match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p, idx) => {
                      const att = p.attendanceStatus || "present";
                      const isConf = p.isConfirmed !== false;

                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.city || "Jabalpur"} {p.fideId ? `• FIDE ${p.fideId}` : ""}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{p.cciId}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{p.rating}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-[rgba(245, 242, 235,0.06)]">
                              {p.tierName}
                            </span>
                          </td>

                          {/* Attendance Status Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleAttendance(p.id, p.attendanceStatus)}
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                                att === "present"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                  : att === "absent"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                att === "present" ? "bg-emerald-400" : att === "absent" ? "bg-rose-400" : "bg-amber-400"
                              }`} />
                              <span className="capitalize">{att}</span>
                            </button>
                          </td>

                          {/* Confirmation Status Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleConfirmed(p.id, p.isConfirmed)}
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                                isConf
                                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                              }`}
                            >
                              {isConf ? <CheckCircle2 className="w-3 h-3 text-sky-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                              <span>{isConf ? "Confirmed" : "Pending"}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditPlayerModal(p)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                title="Edit Player"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                title="Delete Player"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PLAYER DESK (ADD, INSERT, EDIT, DELETE)                        */}
      {/* ===================================================================== */}
      {activeTab === "players" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.06)]">
            <div className="flex items-center gap-3">
              <button
                onClick={openAddPlayerModal}
                className="accent-gold-btn px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add / Insert Competitor</span>
              </button>

              <span className="text-xs text-slate-400">
                Default rating assigned: <strong className="text-amber-300 font-mono">{DEFAULT_PLAYER_RATING} Elo</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name, city, rating..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs w-60 focus:outline-none"
                />
              </div>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">All Batches</option>
                {CCI_RATING_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.minElo}-{c.maxElo})</option>
                ))}
              </select>
            </div>
          </div>

          {/* PLAYERS LISTING TABLE */}
          <div className="glass-panel rounded-2xl border border-[rgba(245, 242, 235,0.06)] overflow-hidden bg-[#08161A]/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E2126] text-slate-400 uppercase font-mono text-[10px] border-b border-[rgba(245, 242, 235,0.06)]">
                  <tr>
                    <th className="py-3 px-4">Starting Rank</th>
                    <th className="py-3 px-4">Player Name</th>
                    <th className="py-3 px-4">FIDE ID</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Batch Tier</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4 text-right">Arbiter Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-200">
                  {filteredPlayers
                    .sort((a, b) => b.rating - a.rating)
                    .map((p, idx) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.cciId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-sky-400">{p.fideId || "—"}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{p.rating}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-[rgba(245, 242, 235,0.06)]">
                            {p.tierName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{p.city || "Jabalpur"}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {p.email || p.phone || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditPlayerModal(p)}
                              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-[#C5A059]" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(p.id, p.name)}
                              className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SWISS PAIRINGS & OVERRIDES                                     */}
      {/* ===================================================================== */}
      {activeTab === "pairings" && currentTourney && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.06)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-400">ROUND SELECTOR:</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: currentTourney.totalRounds }, (_, i) => i + 1).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      sound.playTactileClick();
                      setSelectedRound(r);
                      setActiveScoreDropdownBoard(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedRound === r
                        ? "bg-[#C5A059] text-[#08161A]"
                        : currentTourney.rounds[r] && currentTourney.rounds[r].length > 0
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-white/5 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    R{r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleGeneratePairings(true)}
                className="accent-gold-btn px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
              >
                <Swords className="w-4 h-4" />
                <span>Pair Eligible Players (Present &amp; Confirmed)</span>
              </button>
            </div>
          </div>

          {/* Board Matches */}
          <div className="space-y-3">
            {(!currentTourney.rounds[selectedRound] || currentTourney.rounds[selectedRound].length === 0) ? (
              <div className="glass-panel p-12 text-center rounded-2xl border border-[rgba(245, 242, 235,0.06)]">
                <Trophy className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No Pairings Generated for Round {selectedRound}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Confirm attendance in the Attendance Desk, then click "Pair Eligible Players" to generate FIDE Dutch Swiss pairings.
                </p>
              </div>
            ) : (
              currentTourney.rounds[selectedRound].map((m) => {
                const isOpen = activeScoreDropdownBoard === m.boardNumber;
                return (
                  <div
                    key={m.id}
                    className={`glass-panel p-4 rounded-2xl border border-[rgba(245, 242, 235,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#08161A]/80 hover:border-white/20 transition-all relative ${
                      isOpen ? "z-30 ring-1 ring-[#C5A059]/30" : "z-10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-lg bg-black/40 border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center font-mono font-bold text-xs text-[#C5A059]">
                        {m.boardNumber}
                      </span>

                      {/* White Player */}
                      <div className="min-w-[180px]">
                        <div className="font-semibold text-white text-xs">{m.whitePlayer?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.whitePlayer?.rating} Elo &bull; {m.whitePlayer?.tierName}
                        </div>
                      </div>

                      <span className="text-xs font-mono text-slate-500 font-bold">vs</span>

                      {/* Black Player */}
                      <div className="min-w-[180px]">
                        <div className="font-semibold text-white text-xs">
                          {m.blackPlayer ? m.blackPlayer.name : "BYE (1.0 Point)"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.blackPlayer ? `${m.blackPlayer.rating} Elo • ${m.blackPlayer.tierName}` : "Unpaired"}
                        </div>
                      </div>
                    </div>

                    {/* Result Scoring Dropdown with Smooth Scroll-Down Effect */}
                    <div className="flex items-center gap-2 relative" data-score-dropdown>
                      {m.result === "BYE" ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold shadow-sm">
                          BYE (1.0 PT)
                        </span>
                      ) : (
                        <div className="relative w-48">
                          {/* Trigger Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveScoreDropdownBoard(isOpen ? null : m.boardNumber);
                            }}
                            className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center justify-between gap-2 transition-all border shadow-md select-none cursor-pointer ${
                              isOpen
                                ? "bg-[#0E2126] border-[#C5A059] text-[#C5A059] ring-2 ring-[#C5A059]/30"
                                : m.result === "1-0"
                                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:border-emerald-400"
                                : m.result === "0-1"
                                ? "bg-sky-950/70 border-sky-500/50 text-sky-300 hover:border-sky-400"
                                : m.result === "1/2-1/2"
                                ? "bg-amber-950/70 border-amber-500/50 text-amber-300 hover:border-amber-400"
                                : m.result && m.result !== "PENDING"
                                ? "bg-purple-950/70 border-purple-500/50 text-purple-300 hover:border-purple-400"
                                : "bg-black/60 border-[rgba(245, 242, 235,0.06)] text-slate-300 hover:border-[#C5A059]/50 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                m.result && m.result !== "PENDING" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
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
                                isOpen ? "rotate-180 text-[#C5A059]" : ""
                              }`}
                            />
                          </button>

                          {/* Scroll-Down Dropdown Menu */}
                          {isOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute z-50 top-full right-0 mt-1.5 p-2 rounded-2xl bg-[#091D22] border border-[#C5A059]/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 text-left w-56"
                            >
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
                                      handleSetResult(m.boardNumber, opt.value as any);
                                      setActiveScoreDropdownBoard(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      m.result === opt.value
                                        ? "bg-[#C5A059] text-[#08161A] font-bold shadow-md"
                                        : `text-slate-200 ${opt.hover}`
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
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
                                      handleSetResult(m.boardNumber, opt.value as any);
                                      setActiveScoreDropdownBoard(null);
                                    }}
                                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      m.result === opt.value
                                        ? "bg-purple-600 text-white font-bold"
                                        : "text-slate-300 hover:bg-purple-950/40 hover:text-purple-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
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
                                    handleSetResult(m.boardNumber, "PENDING");
                                    setActiveScoreDropdownBoard(null);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                    m.result === "PENDING"
                                      ? "bg-rose-950/60 text-rose-300 border border-rose-800/40"
                                      : "text-slate-400 hover:bg-rose-950/30 hover:text-rose-300"
                                  }`}
                                >
                                  <span className="font-sans font-medium text-[11px]">Reset (- : -)</span>
                                  <span className="text-[10px] opacity-75">Clear</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: REPORTS & LIST EXPORTS ("GET THE LIST")                        */}
      {/* ===================================================================== */}
      {activeTab === "reports" && currentTourney && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Official Starting List */}
            <div className="glass-panel p-6 rounded-2xl border border-[rgba(245, 242, 235,0.06)] space-y-4 bg-[#08161A]/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Official Player Roster</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download or print the complete ranked player list with Elo ratings, CCI IDs, FIDE numbers, and attendance status.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => downloadCSV(ChessDeskBackend.exportPlayersCSV(currentTourney.id), `${currentTourney.title}_Players.csv`)}
                  className="accent-gold-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Roster</span>
                </button>
              </div>
            </div>

            {/* Card 2: Attendance Sign-In Checklist */}
            <div className="glass-panel p-6 rounded-2xl border border-[rgba(245, 242, 235,0.06)] space-y-4 bg-[#08161A]/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Attendance Sign-In Sheet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Alphabetical arbiter sign-in sheet for in-person player check-in at the tournament venue desk.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => downloadCSV(ChessDeskBackend.exportAttendanceCSV(currentTourney.id), `${currentTourney.title}_Attendance_Sheet.csv`)}
                  className="accent-gold-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* Card 3: Database JSON Backup */}
            <div className="glass-panel p-6 rounded-2xl border border-[rgba(245, 242, 235,0.06)] space-y-4 bg-[#08161A]/80">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Database Backup &amp; JSON</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export all tournaments, player rosters, and round match results as a single portable JSON file.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const json = ChessDeskBackend.exportDatabaseJSON();
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `CCI_Tournament_Backup_${Date.now()}.json`;
                    link.click();
                    showToast("Downloaded database backup JSON.");
                  }}
                  className="accent-gold-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: TOURNAMENT SETTINGS & REGISTRY                                 */}
      {/* ===================================================================== */}
      {activeTab === "tournaments" && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Tournaments in System</h2>
            <button
              onClick={() => setShowCreateTourneyModal(true)}
              className="accent-gold-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Create Tournament</span>
            </button>
          </div>

          <div className="grid gap-4">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  t.id === activeTournamentId
                    ? "border-[#C5A059]/60 bg-[#C5A059]/5 shadow-xl"
                    : "border-[rgba(245, 242, 235,0.06)] bg-black/40 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">{t.title}</h3>
                    {t.id === activeTournamentId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#C5A059] text-black font-bold">
                        ACTIVE
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.location} &bull; {t.timeControl} &bull; {t.totalRounds} Rounds &bull; {t.players.length} Competitors
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {t.id !== activeTournamentId && (
                    <button
                      onClick={() => handleSelectTournament(t.id)}
                      className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      Set as Active
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTournament(t.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete Tournament"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE TOURNAMENT                                              */}
      {/* ===================================================================== */}
      {showCreateTourneyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0E2126] border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white">Create New Tournament</h3>
                <p className="text-xs text-slate-400 mt-0.5">Initialize a Swiss or Round Robin tournament in the backend</p>
              </div>
              <button
                onClick={() => setShowCreateTourneyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Tournament Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Winter Rapid Open 2026"
                  value={newTourneyTitle}
                  onChange={(e) => setNewTourneyTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Format
                  </label>
                  <select
                    value={newTourneyFormat}
                    onChange={(e: any) => setNewTourneyFormat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  >
                    <option value="Swiss System">Swiss System (FIDE Dutch)</option>
                    <option value="Round Robin">Round Robin</option>
                    <option value="Single Elimination">Knockout</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Total Rounds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={newTourneyRounds}
                    onChange={(e) => setNewTourneyRounds(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Time Control
                  </label>
                  <input
                    type="text"
                    value={newTourneyTimeControl}
                    onChange={(e) => setNewTourneyTimeControl(e.target.value)}
                    placeholder="e.g. 15m + 10s"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={newTourneyCity}
                    onChange={(e) => setNewTourneyCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={newTourneyVenue}
                  onChange={(e) => setNewTourneyVenue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[rgba(245, 242, 235,0.06)]">
                <button
                  type="button"
                  onClick={() => setShowCreateTourneyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-gold-btn px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT PLAYER                                              */}
      {/* ===================================================================== */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0E2126] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white">
                  {editingPlayer ? "Edit Competitor" : "Add / Insert Competitor"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default {DEFAULT_PLAYER_RATING} Elo assigned automatically unless specified
                </p>
              </div>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Player Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Elo Rating (Default 1000)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={3200}
                    value={playerRating}
                    onChange={(e) => setPlayerRating(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-[#C5A059] block mt-1">
                    Batch: {getTierFromRating(playerRating).name}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    FIDE ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25012345"
                    value={playerFideId}
                    onChange={(e) => setPlayerFideId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    City / Club
                  </label>
                  <input
                    type="text"
                    value={playerCity}
                    onChange={(e) => setPlayerCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={playerPhone}
                    onChange={(e) => setPlayerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Attendance Check-in
                  </label>
                  <select
                    value={playerAttendance}
                    onChange={(e: any) => setPlayerAttendance(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  >
                    <option value="present">🟢 Present</option>
                    <option value="absent">🔴 Absent</option>
                    <option value="withdrawn">🟡 Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Confirmation
                  </label>
                  <select
                    value={playerIsConfirmed ? "yes" : "no"}
                    onChange={(e) => setPlayerIsConfirmed(e.target.value === "yes")}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none"
                  >
                    <option value="yes">✓ Confirmed Eligible</option>
                    <option value="no">⏳ Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[rgba(245, 242, 235,0.06)]">
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="accent-gold-btn px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg"
                >
                  {editingPlayer ? "Save Changes" : "Insert Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
