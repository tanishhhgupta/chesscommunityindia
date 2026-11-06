import React, { useState, useEffect } from 'react';
import {
  AuditLog,
  EnginePairing,
  EnginePlayer,
  EngineRoundHistoryGame,
  GameResult,
  Pairing,
  Player,
  Round,
  Tournament,
  TournamentPlayer,
  TournamentStatus,
} from '../../types';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { getTournamentEngine } from '../../engine';
import { RoundManager } from '../rounds/RoundManager';
import { StandingsTable } from '../standings/StandingsTable';
import { Button } from '../common/Button';
import {
  Trophy,
  Users,
  Settings as SettingsIcon,
  Printer,
  Compass,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Save,
  Trash2,
  Download,
  CreditCard,
  UploadCloud,
  UserPlus,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  ChevronDown,
  SquareCheck,
  Pause,
  Square,
  CloudDownload,
  UserCheck,
  UserX,
} from 'lucide-react';
import { EntryFeesModal } from './EntryFeesModal';
import { ImportFileModal } from './ImportFileModal';
import { AddPlayerCard } from '../players/AddPlayerCard';
import { ShareModal } from './ShareModal';
import { EmailPlayersModal } from '../players/EmailPlayersModal';
import { Footer } from '../layout/Footer';
import { exportPlayersToCsv, downloadCsv } from '../../lib/csv';
import { db } from '../../lib/storage';

interface TournamentDetailViewProps {
  tournament: Tournament;
  rounds: Round[];
  pairings: Pairing[];
  tournamentPlayers: (TournamentPlayer & { player: Player })[];
  allOrgPlayers: Player[];
  auditLogs: AuditLog[];
  onBack: () => void;
  onNavigate: (view: string, tournamentId?: string) => void;
  onGeneratePairings: (roundNumber: number, pairings: EnginePairing[], status: 'draft' | 'published') => void;
  onUpdateResult: (pairingId: string, result: GameResult, reason?: string) => void;
  onSwapPairing: (pairing1Id: string, pairing2Id: string, swapWhite: boolean, reason: string) => void;
  onPublishRound: (roundId: string) => void;
  onCompleteRound: (roundId: string) => void;
  onCreateNextRound: () => void;
  onWithdrawPlayer?: (playerId: string) => void;
  onReinstatePlayer?: (playerId: string) => void;
  onImportPlayersToTournament?: (players: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[], tournamentId?: string) => void;
  onUpdateTournament?: (updates: Partial<Tournament>) => void;
  onDeleteTournament?: (tournamentId: string) => void;
  onAddPlayerToTournament?: (playerData: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>, tournamentId?: string) => void;
  onUpdatePlayerInTournament?: (playerId: string, updates: Partial<Player>, tournamentId?: string) => void;
  onBatchUpdatePlayers?: (playerIds: string[], updates: Partial<TournamentPlayer>) => void;
}

export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({
  tournament,
  rounds,
  pairings,
  tournamentPlayers,
  allOrgPlayers,
  auditLogs,
  onBack,
  onNavigate,
  onGeneratePairings,
  onUpdateResult,
  onSwapPairing,
  onPublishRound,
  onCompleteRound,
  onCreateNextRound,
  onWithdrawPlayer,
  onReinstatePlayer,
  onImportPlayersToTournament,
  onUpdateTournament,
  onDeleteTournament,
  onAddPlayerToTournament,
  onUpdatePlayerInTournament,
  onBatchUpdatePlayers,
}) => {
  const { permissions } = useOrg();

  // Secondary Navigation Tabs: 'dashboard' | 'tournament-page' | 'players' | 'rounds' | 'standings' | 'contact' | 'settings'
  const [activeNavTab, setActiveNavTab] = useState<
    'dashboard' | 'tournament-page' | 'players' | 'rounds' | 'standings' | 'contact' | 'settings'
  >('dashboard');

  // Dashboard Sub-tabs
  const [leftSubTab, setLeftSubTab] = useState<'basic' | 'details' | 'schedule'>('basic');
  const [rightSubTab, setRightSubTab] = useState<'registers' | 'fide' | 'chess-results'>('registers');

  // Form states for Basic Information
  const [tName, setTName] = useState(tournament.name);
  const [tCity, setTCity] = useState(tournament.city || 'Jabalpur');
  const [tFederation, setTFederation] = useState(tournament.federation || 'India');
  const [tStartDate, setTStartDate] = useState(tournament.startDate || '2026-10-03');
  const [tEndDate, setTEndDate] = useState(tournament.endDate || '2026-10-03');
  const [tDescription, setTDescription] = useState(tournament.description || '');

  // Form states for Details
  const [tChiefArbiter, setTChiefArbiter] = useState(tournament.chiefArbiter || 'Tanay Trait');
  const [tDeputyArbiter, setTDeputyArbiter] = useState(tournament.deputyArbiter || '');
  const [tVenue, setTVenue] = useState(tournament.venue || `${tCity}, ${tFederation}`);
  const [tRoundsCount, setTRoundsCount] = useState(tournament.roundsCount);

  // Form states for Registers & Publication
  const [showCalendar, setShowCalendar] = useState(tournament.showOnCalendar ?? true);
  const [allowSignup, setAllowSignup] = useState(tournament.allowPlayerSignup ?? true);
  const [fideRated, setFideRated] = useState(tournament.isFideRated ?? true);
  const [localRated, setLocalRated] = useState(tournament.isLocalRated ?? false);
  const [isPublicTourney, setIsPublicTourney] = useState(tournament.isPublic ?? true);
  const [tStatus, setTStatus] = useState<TournamentStatus>(tournament.status || 'registration');

  // Modals state
  const [isEntryFeesOpen, setIsEntryFeesOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [currentEditingPlayerIndex, setCurrentEditingPlayerIndex] = useState<number>(
    tournamentPlayers.length > 0 ? tournamentPlayers.length : 1
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Player selection and toolbar state (Screenshot vertical toolbar)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [playerActionFeedback, setPlayerActionFeedback] = useState<string | null>(null);
  const [playerListFilter, setPlayerListFilter] = useState<'all' | 'present' | 'pending' | 'paused' | 'withdrawn'>('all');

  const totalRegistered = tournamentPlayers.length;
  const withdrawnPlayers = tournamentPlayers.filter((p) => p.isWithdrawn);
  const pausedPlayers = tournamentPlayers.filter((p) => !p.isWithdrawn && p.isPaused);
  const confirmedPresentPlayers = tournamentPlayers.filter(
    (p) => !p.isWithdrawn && !p.isPaused && p.isConfirmed !== false
  );
  const pendingCheckInPlayers = tournamentPlayers.filter(
    (p) => !p.isWithdrawn && !p.isPaused && p.isConfirmed === false
  );
  const activeEligibleForPairing = tournamentPlayers.filter(
    (p) => !p.isWithdrawn && !p.isPaused
  );
  const attendancePct =
    totalRegistered > 0
      ? Math.round((confirmedPresentPlayers.length / totalRegistered) * 100)
      : 0;
  const withdrawalPct =
    totalRegistered > 0
      ? Math.round((withdrawnPlayers.length / totalRegistered) * 100)
      : 0;

  const displayedTournamentPlayers = tournamentPlayers.filter((tp) => {
    if (playerListFilter === 'present') return !tp.isWithdrawn && !tp.isPaused && tp.isConfirmed !== false;
    if (playerListFilter === 'pending') return !tp.isWithdrawn && !tp.isPaused && tp.isConfirmed === false;
    if (playerListFilter === 'withdrawn') return tp.isWithdrawn;
    if (playerListFilter === 'paused') return !tp.isWithdrawn && tp.isPaused;
    return true;
  });

  const handleToggleSelectPlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (displayedTournamentPlayers.length > 0 && selectedPlayerIds.size === displayedTournamentPlayers.length) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(displayedTournamentPlayers.map((tp) => tp.playerId)));
    }
  };

  // Button 1: Checkbox with checkmark (SquareCheck) - Confirm Presence / Select All
  const handleConfirmOrSelectAll = () => {
    if (selectedPlayerIds.size > 0) {
      const ids = Array.from(selectedPlayerIds);
      if (onBatchUpdatePlayers) {
        onBatchUpdatePlayers(ids, { isConfirmed: true, isPaused: false });
      } else {
        db.batchUpdateTournamentPlayers(tournament.id, ids, { isConfirmed: true, isPaused: false });
      }
      setPlayerActionFeedback(`✓ ${ids.length} player(s) confirmed as Present.`);
      setTimeout(() => setPlayerActionFeedback(null), 3000);
    } else {
      const allIds = new Set(tournamentPlayers.map((tp) => tp.playerId));
      setSelectedPlayerIds(allIds);
      setPlayerActionFeedback(`All ${allIds.size} players selected. Click again to confirm presence.`);
      setTimeout(() => setPlayerActionFeedback(null), 3500);
    }
  };

  // Button 2: Pause icon (Pause) - Toggle Pause / Skip Round
  const handlePauseSelected = () => {
    if (selectedPlayerIds.size === 0) {
      setPlayerActionFeedback('Please select one or more players first using the checkboxes.');
      setTimeout(() => setPlayerActionFeedback(null), 3000);
      return;
    }
    const ids = Array.from(selectedPlayerIds);
    const anyUnpaused = tournamentPlayers.some(
      (tp) => selectedPlayerIds.has(tp.playerId) && !tp.isPaused
    );
    const targetPaused = anyUnpaused;
    if (onBatchUpdatePlayers) {
      onBatchUpdatePlayers(ids, { isPaused: targetPaused });
    } else {
      db.batchUpdateTournamentPlayers(tournament.id, ids, { isPaused: targetPaused });
    }
    setPlayerActionFeedback(
      targetPaused
        ? `⏸ ${ids.length} player(s) paused (skipping upcoming round pairings).`
        : `▶ ${ids.length} player(s) resumed for pairings.`
    );
    setTimeout(() => setPlayerActionFeedback(null), 3000);
  };

  const handleToggleSinglePlayerPause = (playerId: string, targetPaused: boolean) => {
    if (onBatchUpdatePlayers) {
      onBatchUpdatePlayers([playerId], { isPaused: targetPaused });
    } else {
      db.batchUpdateTournamentPlayers(tournament.id, [playerId], { isPaused: targetPaused });
    }
    setPlayerActionFeedback(
      targetPaused
        ? '⏸ Player paused (skipping upcoming round).'
        : '▶ Player resumed for pairings.'
    );
    setTimeout(() => setPlayerActionFeedback(null), 3000);
  };

  const handleReinstate = (playerId: string) => {
    if (onReinstatePlayer) {
      onReinstatePlayer(playerId);
    } else {
      db.reinstatePlayer(tournament.id, playerId);
    }
    setPlayerActionFeedback('✓ Player reinstated and restored to active tournament roster.');
    setTimeout(() => setPlayerActionFeedback(null), 3000);
  };

  // Button 3: Square empty icon (Square) - Deselect all / Reset check-in
  const handleDeselectOrReset = () => {
    if (selectedPlayerIds.size > 0) {
      setSelectedPlayerIds(new Set());
      setPlayerActionFeedback('Selection cleared.');
      setTimeout(() => setPlayerActionFeedback(null), 2500);
    } else {
      const allIds = tournamentPlayers.map((tp) => tp.playerId);
      if (onBatchUpdatePlayers) {
        onBatchUpdatePlayers(allIds, { isConfirmed: false });
      } else {
        db.batchUpdateTournamentPlayers(tournament.id, allIds, { isConfirmed: false });
      }
      setPlayerActionFeedback('Check-in status reset to Pending for all players.');
      setTimeout(() => setPlayerActionFeedback(null), 3000);
    }
  };

  // Button 5: Cloud download (CloudDownload) - Export CSV
  const handleExportPlayers = () => {
    const playersToExport =
      selectedPlayerIds.size > 0
        ? tournamentPlayers
            .filter((tp) => selectedPlayerIds.has(tp.playerId))
            .map((tp) => tp.player)
        : tournamentPlayers.map((tp) => tp.player);

    if (playersToExport.length === 0) {
      setPlayerActionFeedback('No players available to export.');
      setTimeout(() => setPlayerActionFeedback(null), 2500);
      return;
    }

    const csv = exportPlayersToCsv(playersToExport);
    const filename = `${tournament.slug || 'tournament'}_players.csv`;
    downloadCsv(filename, csv);
    setPlayerActionFeedback(`Exported ${playersToExport.length} player(s) to CSV successfully.`);
    setTimeout(() => setPlayerActionFeedback(null), 3000);
  };

  useEffect(() => {
    if (!editingPlayer) {
      setCurrentEditingPlayerIndex(tournamentPlayers.length > 0 ? tournamentPlayers.length : 1);
    }
  }, [tournamentPlayers.length, editingPlayer]);

  // Active round number for Rounds tab
  const [activeRoundNumber, setActiveRoundNumber] = useState<number>(() => {
    return tournament.currentRound || 1;
  });

  // Calculate live tournament standings
  const engine = getTournamentEngine(tournament.format);

  const enginePlayers: EnginePlayer[] = tournamentPlayers.map((tp, idx) => ({
    id: tp.playerId,
    name: tp.player.surname || tp.player.name,
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
  rounds.forEach((r) => {
    const rGames = pairings.filter((p) => p.roundId === r.id);
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

  const liveStandings = engine.calculateStandings(
    enginePlayers,
    roundHistories,
    tournament.tiebreakRules
  );

  const handleSaveBasic = () => {
    if (onUpdateTournament) {
      onUpdateTournament({
        name: tName,
        city: tCity,
        federation: tFederation,
        startDate: tStartDate,
        endDate: tEndDate,
        description: tDescription,
        chiefArbiter: tChiefArbiter,
        deputyArbiter: tDeputyArbiter,
        venue: tVenue,
        roundsCount: Number(tRoundsCount),
        showOnCalendar: showCalendar,
        allowPlayerSignup: allowSignup,
        isFideRated: fideRated,
        isLocalRated: localRated,
        isPublic: isPublicTourney,
        status: tStatus,
      });
    }
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete tournament "${tournament.name}"? This cannot be undone.`)) {
      if (onDeleteTournament) {
        onDeleteTournament(tournament.id);
      }
      onBack();
    }
  };

  const handleExportRoster = () => {
    const playerObjects = tournamentPlayers.map((tp) => tp.player);
    const csvStr = exportPlayersToCsv(playerObjects);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.slug}-players.csv`;
    a.click();
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] flex flex-col bg-[#f4f5f8] text-slate-800">
      {/* SECONDARY DARK NAVIGATION BAR (Cowhide Cocoa + Golden Batter underline) */}
      <div className="bg-[#442D1C] border-t border-white/10 select-none shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto scrollbar-none">
          {/* Left Tabs List */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveNavTab('dashboard')}
              className={`py-3 px-3 sm:px-4 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeNavTab === 'dashboard'
                  ? 'text-[#E8D1A7] font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
              {activeNavTab === 'dashboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8D1A7]" />
              )}
            </button>

            <button
              onClick={() => setActiveNavTab('tournament-page')}
              className={`py-3 px-3 sm:px-4 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeNavTab === 'tournament-page'
                  ? 'text-[#E8D1A7] font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Tournament Page
              {activeNavTab === 'tournament-page' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8D1A7]" />
              )}
            </button>

            <button
              onClick={() => setActiveNavTab('players')}
              className={`py-3 px-3 sm:px-4 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeNavTab === 'players'
                  ? 'text-[#E8D1A7] font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Players
              {activeNavTab === 'players' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8D1A7]" />
              )}
            </button>

            <button
              onClick={() => setActiveNavTab('rounds')}
              className={`py-3 px-3 sm:px-4 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeNavTab === 'rounds'
                  ? 'text-[#E8D1A7] font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Rounds
              {activeNavTab === 'rounds' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8D1A7]" />
              )}
            </button>

            <button
              onClick={() => setActiveNavTab('standings')}
              className={`py-3 px-3 sm:px-4 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeNavTab === 'standings'
                  ? 'text-[#E8D1A7] font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Standings
              {activeNavTab === 'standings' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8D1A7]" />
              )}
            </button>

            <button
              onClick={() => setActiveNavTab('contact')}
              className={`py-3 px-3 sm:px-4 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeNavTab === 'contact'
                  ? 'text-[#E8D1A7] font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              Contact
              {activeNavTab === 'contact' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E8D1A7]" />
              )}
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 py-2 text-white/90 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs hover:bg-white/10 transition-colors cursor-pointer"
              title="Print Current View"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => setActiveNavTab('settings')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                activeNavTab === 'settings' ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10'
              }`}
              title="Tournament Engine Settings"
            >
              <SettingsIcon size={14} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {saveSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 shadow-sm">
            <CheckCircle size={15} className="text-emerald-600 shrink-0" />
            <span>Tournament configuration saved successfully!</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* TAB 1: DASHBOARD (Image 4) */}
        {activeNavTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Pane (7 cols) */}
            <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {/* Sub-tabs header */}
              <div className="flex items-center border-b border-slate-200 bg-white px-2 pt-2 text-xs font-semibold">
                <button
                  onClick={() => setLeftSubTab('basic')}
                  className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors ${
                    leftSubTab === 'basic'
                      ? 'border-[#84592B] text-[#84592B] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Basic information
                </button>
                <button
                  onClick={() => setLeftSubTab('details')}
                  className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors ${
                    leftSubTab === 'details'
                      ? 'border-[#84592B] text-[#84592B] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setLeftSubTab('schedule')}
                  className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors ${
                    leftSubTab === 'schedule'
                      ? 'border-[#84592B] text-[#84592B] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Schedule
                </button>
              </div>

              {/* Sub-tab 1: Basic Information Form */}
              {leftSubTab === 'basic' && (
                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={tCity}
                        onChange={(e) => setTCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Federation</label>
                      <select
                        value={tFederation}
                        onChange={(e) => setTFederation(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="India">🇮🇳 India</option>
                        <option value="USA">🇺🇸 USA</option>
                        <option value="Germany">🇩🇪 Germany</option>
                        <option value="France">🇫🇷 France</option>
                        <option value="England">🇬🇧 England</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={tStartDate}
                        onChange={(e) => setTStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={tEndDate}
                        onChange={(e) => setTEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={5}
                      value={tDescription}
                      onChange={(e) => setTDescription(e.target.value)}
                      placeholder="Tournament details, regulations, and venue guidelines..."
                      className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Action Buttons: Save, Cancel, Delete */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSaveBasic}
                      className="bg-[#84592B] hover:bg-[#6c4822] text-white font-bold px-4 py-2 rounded text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save size={13} />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={onBack}
                      className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium px-4 py-2 rounded text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="bg-[#e4e6eb] hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-medium px-3 py-2 rounded text-xs ml-auto cursor-pointer flex items-center gap-1.5 transition-colors"
                      title="Delete Tournament"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Details */}
              {leftSubTab === 'details' && (
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Chief Arbiter</label>
                      <input
                        type="text"
                        value={tChiefArbiter}
                        onChange={(e) => setTChiefArbiter(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Deputy Arbiter</label>
                      <input
                        type="text"
                        value={tDeputyArbiter}
                        onChange={(e) => setTDeputyArbiter(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Time Control</label>
                      <input
                        type="text"
                        readOnly
                        value={tournament.timeControlString}
                        className="w-full px-3 py-2 text-xs bg-slate-50 rounded border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Total Rounds</label>
                      <input
                        type="number"
                        min="1"
                        value={tRoundsCount}
                        onChange={(e) => setTRoundsCount(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Venue Address</label>
                    <input
                      type="text"
                      value={tVenue}
                      onChange={(e) => setTVenue(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSaveBasic}
                      className="bg-[#84592B] hover:bg-[#6c4822] text-white font-bold px-4 py-2 rounded text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save size={13} />
                      <span>Save Details</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Schedule */}
              {leftSubTab === 'schedule' && (
                <div className="p-5 space-y-3 text-xs">
                  <p className="font-semibold text-slate-700 mb-2">Round Timings & Dates</p>
                  <div className="border border-slate-200 rounded divide-y divide-slate-100">
                    {Array.from({ length: tRoundsCount }).map((_, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <span className="font-bold text-slate-800">Round {idx + 1}</span>
                        <span className="text-slate-500 font-mono">
                          {tStartDate} &bull; {10 + idx}:00 AM
                        </span>
                        <span className="text-[11px] font-semibold text-[#84592B] bg-[#84592B]/10 px-2 py-0.5 rounded">
                          {idx + 1 <= tournament.currentRound ? 'Completed' : 'Scheduled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane (5 cols) */}
            <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {/* Sub-tabs header */}
              <div className="flex items-center border-b border-slate-200 bg-white px-2 pt-2 text-xs font-semibold">
                <button
                  onClick={() => setRightSubTab('registers')}
                  className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors ${
                    rightSubTab === 'registers'
                      ? 'border-[#84592B] text-[#84592B] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Registers
                </button>
                <button
                  onClick={() => setRightSubTab('fide')}
                  className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors ${
                    rightSubTab === 'fide'
                      ? 'border-[#84592B] text-[#84592B] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Data for FIDE
                </button>
                <button
                  onClick={() => setRightSubTab('chess-results')}
                  className={`px-4 py-2.5 border-b-2 cursor-pointer transition-colors ${
                    rightSubTab === 'chess-results'
                      ? 'border-[#84592B] text-[#84592B] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Chess-Results
                </button>
              </div>

              {/* Sub-tab 1: Registers (Toggles & Export) */}
              {rightSubTab === 'registers' && (
                <div className="p-5 space-y-4 text-xs">
                  {/* Status Selection */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <label className="block font-bold text-slate-800">Tournament Status</label>
                    <select
                      value={tStatus}
                      onChange={(e) => setTStatus(e.target.value as TournamentStatus)}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:border-amber-600"
                    >
                      <option value="draft">Draft (Private Arbiter Workspace)</option>
                      <option value="registration">Registration Open</option>
                      <option value="in_progress">Live (In Progress / Rounds Active)</option>
                      <option value="completed">Completed (Final Standings Sealed)</option>
                      <option value="archived">Archived Historical</option>
                    </select>
                  </div>

                  {/* Toggle 0: Publish to Chess Pair (Public Website) */}
                  <label className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50 cursor-pointer select-none">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Publish to Chess Pair (Public Website)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPublicTourney ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isPublicTourney ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Controls whether this tournament and its published rounds are visible to visitors on the public Chess Pair platform.
                      </p>
                    </div>
                    <div
                      onClick={() => setIsPublicTourney(!isPublicTourney)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer shrink-0 ml-3 ${
                        isPublicTourney ? 'bg-emerald-600' : 'bg-[#e2d9cc]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          isPublicTourney ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Toggle 1: Calendar */}
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <span className="font-medium text-slate-800">
                      Show this Tournament on ChessManager&apos;s Calendar
                    </span>
                    <div
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                        showCalendar ? 'bg-[#84592B]' : 'bg-[#e2d9cc]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          showCalendar ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Toggle 2: Sign-up */}
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <span className="font-medium text-slate-800">Allow players to sign up</span>
                    <div
                      onClick={() => setAllowSignup(!allowSignup)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                        allowSignup ? 'bg-[#84592B]' : 'bg-[#e2d9cc]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          allowSignup ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Toggle 3: FIDE Rated */}
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <span className="font-medium text-slate-800">FIDE Rated Tournament</span>
                    <div
                      onClick={() => setFideRated(!fideRated)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                        fideRated ? 'bg-[#84592B]' : 'bg-[#e2d9cc]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          fideRated ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Toggle 4: Local Rated */}
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <span className="font-medium text-slate-800">Local Rated Tournament</span>
                    <div
                      onClick={() => setLocalRated(!localRated)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 duration-200 cursor-pointer ${
                        localRated ? 'bg-[#84592B]' : 'bg-[#e2d9cc]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          localRated ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>

                  {/* Action Buttons: Save, Export, Cancel */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSaveBasic}
                      className="bg-[#84592B] hover:bg-[#6c4822] text-white font-bold px-4 py-2 rounded text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save size={13} />
                      <span>Save</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportRoster}
                      className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium px-3 py-2 rounded text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <UploadCloud size={13} />
                      <span>Export</span>
                      <ChevronDown size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={onBack}
                      className="bg-[#e4e6eb] hover:bg-[#d8dbe0] text-slate-700 font-medium px-4 py-2 rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Data for FIDE */}
              {rightSubTab === 'fide' && (
                <div className="p-5 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">FIDE Tournament Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 293849"
                      className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chief Arbiter FIDE ID</label>
                    <input
                      type="text"
                      defaultValue="5202213"
                      className="w-full px-3 py-2 text-xs bg-white rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExportRoster}
                      className="bg-[#84592B] hover:bg-[#6c4822] text-white px-3 py-2 rounded font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download size={13} />
                      <span>Download FIDE TRF File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Chess-Results */}
              {rightSubTab === 'chess-results' && (
                <div className="p-5 space-y-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Chess-Results &amp; Swiss-Manager Sync</p>
                  <p>
                    You can export pairing results directly in Swiss-Manager Krausse format to upload to chess-results.com.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportRoster}
                    className="bg-[#84592B] hover:bg-[#6c4822] text-white px-3 py-2 rounded font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download size={13} />
                    <span>Generate Swiss-Manager Krausse File (.TRF)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TOURNAMENT PAGE (Spectator View) */}
        {activeNavTab === 'tournament-page' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{tournament.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live spectator portal for players and attendees at {tournament.city || 'Venue'}.
                </p>
              </div>
              <button
                onClick={() => onNavigate('public-portal', tournament.id)}
                className="bg-[#442D1C] hover:bg-[#583a24] text-white font-bold text-xs px-4 py-2 rounded-md shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Compass size={14} />
                <span>Open Full Spectator Mode</span>
              </button>
            </div>

            {/* Quick Standings Preview */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Live Top Standings</h3>
              <StandingsTable tournament={tournament} standings={liveStandings.slice(0, 8)} />
            </div>
          </div>
        )}

        {/* TAB 3: PLAYERS (Image 5 & Add Player Toggle) */}
        {activeNavTab === 'players' && (
          <div className="space-y-4">
            {isAddPlayerOpen ? (
              <AddPlayerCard
                initialPlayer={editingPlayer}
                totalPlayersCount={tournamentPlayers.length}
                currentIndex={currentEditingPlayerIndex}
                onNavigatePlayer={(direction) => {
                  if (tournamentPlayers.length === 0) return;
                  let nextIdx =
                    direction === 'prev'
                      ? currentEditingPlayerIndex - 1
                      : currentEditingPlayerIndex + 1;
                  if (nextIdx < 1) nextIdx = tournamentPlayers.length;
                  if (nextIdx > tournamentPlayers.length) nextIdx = 1;
                  setCurrentEditingPlayerIndex(nextIdx);
                  const targetPlayer = tournamentPlayers[nextIdx - 1]?.player;
                  if (targetPlayer) {
                    setEditingPlayer(targetPlayer);
                  }
                }}
                allAvailablePlayers={allOrgPlayers}
                onSaveAndClose={(playerData) => {
                  if (editingPlayer) {
                    if (onUpdatePlayerInTournament) {
                      onUpdatePlayerInTournament(editingPlayer.id, playerData, tournament.id);
                    } else {
                      db.updatePlayer(editingPlayer.id, playerData);
                    }
                  } else {
                    if (onAddPlayerToTournament) {
                      onAddPlayerToTournament(playerData, tournament.id);
                    } else {
                      const created = db.createPlayer({
                        ...playerData,
                        organizationId: tournament.organizationId,
                      });
                      db.addPlayerToTournament(tournament.id, created.id);
                    }
                  }
                  setIsAddPlayerOpen(false);
                  setEditingPlayer(null);
                  setSaveSuccessMsg(true);
                  setTimeout(() => setSaveSuccessMsg(false), 2500);
                }}
                onAddNew={(playerData) => {
                  if (editingPlayer) {
                    if (onUpdatePlayerInTournament) {
                      onUpdatePlayerInTournament(editingPlayer.id, playerData, tournament.id);
                    } else {
                      db.updatePlayer(editingPlayer.id, playerData);
                    }
                  } else {
                    if (onAddPlayerToTournament) {
                      onAddPlayerToTournament(playerData, tournament.id);
                    } else {
                      const created = db.createPlayer({
                        ...playerData,
                        organizationId: tournament.organizationId,
                      });
                      db.addPlayerToTournament(tournament.id, created.id);
                    }
                  }
                  setEditingPlayer(null);
                  setCurrentEditingPlayerIndex(tournamentPlayers.length + 1);
                  setSaveSuccessMsg(true);
                  setTimeout(() => setSaveSuccessMsg(false), 2500);
                }}
                onCancel={() => {
                  setIsAddPlayerOpen(false);
                  setEditingPlayer(null);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Column Buttons & Stats */}
                <div className="md:col-span-3 space-y-3">
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setEditingPlayer(null);
                        setCurrentEditingPlayerIndex(tournamentPlayers.length + 1);
                        setIsAddPlayerOpen(true);
                      }}
                      className="w-full bg-[#442D1C] hover:bg-[#583a24] active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-md shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UserPlus size={16} className="text-[#E8D1A7]" />
                      <span>Add Player</span>
                    </button>

                    <button
                      onClick={() => setIsEntryFeesOpen(true)}
                      className="w-full bg-[#f0e8dc] hover:bg-[#e4dac9] active:scale-[0.99] text-[#442D1C] font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CreditCard size={16} className="text-[#84592B]" />
                      <span>Entry Fees</span>
                    </button>

                    <button
                      onClick={() => setIsImportOpen(true)}
                      className="w-full bg-[#f0e8dc] hover:bg-[#e4dac9] active:scale-[0.99] text-[#442D1C] font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UploadCloud size={16} className="text-[#84592B]" />
                      <span>Import</span>
                    </button>
                  </div>

                  {/* Attendance Statistics Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wide">
                        <UserCheck size={15} className="text-emerald-600" />
                        <span>Attendance</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {attendancePct}% Present
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${attendancePct}%` }}
                        title={`Present: ${confirmedPresentPlayers.length}`}
                      />
                      <div
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{
                          width: `${
                            totalRegistered > 0
                              ? Math.round((pendingCheckInPlayers.length / totalRegistered) * 100)
                              : 0
                          }%`,
                        }}
                        title={`Pending: ${pendingCheckInPlayers.length}`}
                      />
                      <div
                        className="bg-rose-400 h-full transition-all duration-300"
                        style={{ width: `${withdrawalPct}%` }}
                        title={`Withdrawn: ${withdrawnPlayers.length}`}
                      />
                    </div>

                    {/* Attendance Breakdown */}
                    <div className="space-y-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setPlayerListFilter((prev) => (prev === 'present' ? 'all' : 'present'))
                        }
                        className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                          playerListFilter === 'present'
                            ? 'bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-300'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          Confirmed Present
                        </span>
                        <span className="font-bold font-mono text-emerald-700">
                          {confirmedPresentPlayers.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPlayerListFilter((prev) => (prev === 'pending' ? 'all' : 'pending'))
                        }
                        className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                          playerListFilter === 'pending'
                            ? 'bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-300'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          Pending Check-in
                        </span>
                        <span className="font-bold font-mono text-amber-700">
                          {pendingCheckInPlayers.length}
                        </span>
                      </button>

                      {pausedPlayers.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPlayerListFilter((prev) => (prev === 'paused' ? 'all' : 'paused'))
                          }
                          className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                            playerListFilter === 'paused'
                              ? 'bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-300'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Pause size={11} className="text-amber-600 shrink-0" />
                            Paused (Skipping)
                          </span>
                          <span className="font-bold font-mono text-amber-600">
                            {pausedPlayers.length}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal & Roster Stats Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wide">
                        <UserX size={15} className="text-rose-600" />
                        <span>Withdrawal & Active</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          withdrawnPlayers.length > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {withdrawnPlayers.length} Out
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between py-1 px-1.5 text-slate-700">
                        <span>Total Registered:</span>
                        <span className="font-bold font-mono text-slate-800">{totalRegistered}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPlayerListFilter((prev) =>
                            prev === 'withdrawn' ? 'all' : 'withdrawn'
                          )
                        }
                        className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-colors text-left cursor-pointer ${
                          playerListFilter === 'withdrawn'
                            ? 'bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-300'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          Withdrawn Players
                        </span>
                        <span className="font-bold font-mono text-rose-600">
                          {withdrawnPlayers.length} ({withdrawalPct}%)
                        </span>
                      </button>

                      <div className="flex items-center justify-between py-1.5 px-2 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-900 mt-2">
                        <span className="font-medium text-[11px] text-emerald-800">
                          Active for Next Round:
                        </span>
                        <span className="font-bold text-emerald-700 font-mono text-xs">
                          {activeEligibleForPairing.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active filter badge if filtering */}
                  {playerListFilter !== 'all' && (
                    <div className="p-2 bg-slate-100 rounded-md flex items-center justify-between text-[11px] text-slate-700 border border-slate-200">
                      <span>
                        Filtered by: <strong className="capitalize">{playerListFilter}</strong> ({displayedTournamentPlayers.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlayerListFilter('all')}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                      >
                        Show All
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Column Table + Vertical Toolbar (Screenshot media_1791054379923.png) */}
                <div className="md:col-span-9">
                  <div className="flex gap-3 items-start">
                    {/* Table Container */}
                    <div className="flex-1 min-w-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      {/* Action Feedback Banner */}
                      {playerActionFeedback && (
                        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-xs font-semibold text-blue-900 flex items-center justify-between animate-in fade-in">
                          <span>{playerActionFeedback}</span>
                          <button
                            type="button"
                            onClick={() => setPlayerActionFeedback(null)}
                            className="text-blue-500 hover:text-blue-800 text-xs cursor-pointer ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Selected Players Action Strip */}
                      {selectedPlayerIds.size > 0 && (
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-700">
                            {selectedPlayerIds.size} player(s) selected
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleConfirmOrSelectAll}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-sm transition-colors"
                            >
                              ✓ Confirm Present
                            </button>
                            <button
                              type="button"
                              onClick={handlePauseSelected}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-sm transition-colors"
                            >
                              ⏸ Pause / Skip
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPlayerIds(new Set())}
                              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#f9fafb] border-b border-slate-200 text-slate-700">
                            <tr>
                              <th className="py-3 px-3 w-10 text-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    displayedTournamentPlayers.length > 0 &&
                                    selectedPlayerIds.size === displayedTournamentPlayers.length
                                  }
                                  onChange={handleToggleSelectAll}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                                  title="Select / Deselect all"
                                />
                              </th>
                              <th className="py-3 px-2 w-10 font-bold text-slate-700 text-center">#</th>
                              <th className="py-3 px-4 font-bold text-slate-800">Surname, Name</th>
                              <th className="py-3 px-3 font-bold text-slate-800 text-center">Status</th>
                              <th className="py-3 px-4 font-bold text-slate-800">Rating</th>
                              <th className="py-3 px-4 font-bold text-slate-800">Birthdate</th>
                              <th className="py-3 px-4 font-bold text-slate-800 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedTournamentPlayers.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-sm">
                                  No Players
                                </td>
                              </tr>
                            ) : (
                              displayedTournamentPlayers.map((tp, idx) => {
                                const isSelected = selectedPlayerIds.has(tp.playerId);
                                return (
                                  <tr
                                    key={tp.id}
                                    className={`hover:bg-slate-50/70 transition-colors ${
                                      tp.isWithdrawn
                                        ? 'opacity-50 line-through'
                                        : isSelected
                                        ? 'bg-blue-50/40'
                                        : ''
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectPlayer(tp.playerId)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-xs font-semibold">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        {tp.player.title && tp.player.title !== 'None' && (
                                          <span className="font-bold text-amber-600 text-[10px]">
                                            {tp.player.title}
                                          </span>
                                        )}
                                        <span>{tp.player.surname || tp.player.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {tp.isWithdrawn ? (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                          Withdrawn
                                        </span>
                                      ) : tp.isPaused ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                          <Pause size={10} /> Paused
                                        </span>
                                      ) : tp.isConfirmed !== false ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <CheckCircle size={10} /> Present
                                        </span>
                                      ) : (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                                          Pending
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-600 font-mono">
                                      {tp.initialRating}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-500">
                                      {tp.player.birthdate || '2008-04-12'}
                                    </td>
                                    <td className="py-2.5 px-4 text-right space-x-2">
                                      {tp.isWithdrawn ? (
                                        <button
                                          onClick={() => handleReinstate(tp.playerId)}
                                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 transition-colors border border-emerald-300 shadow-xs"
                                          title="Mistakenly withdrawn? Click to reinstate player to active roster"
                                        >
                                          Undo Withdraw
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleToggleSinglePlayerPause(tp.playerId, !tp.isPaused)}
                                            className="text-[11px] text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
                                          >
                                            {tp.isPaused ? 'Resume' : 'Pause'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (onWithdrawPlayer) {
                                                onWithdrawPlayer(tp.playerId);
                                              } else {
                                                db.withdrawPlayer(tournament.id, tp.playerId, tournament.currentRound);
                                              }
                                              setPlayerActionFeedback('Player marked as withdrawn.');
                                              setTimeout(() => setPlayerActionFeedback(null), 3000);
                                            }}
                                            className="text-[11px] text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                                          >
                                            Withdraw
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => {
                                          setEditingPlayer(tp.player);
                                          setCurrentEditingPlayerIndex(idx + 1);
                                          setIsAddPlayerOpen(true);
                                        }}
                                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT VERTICAL TOOLBAR (Matching media_1791054379923.png) */}
                    <div className="bg-white border border-gray-200 rounded-md shadow-sm w-11 flex flex-col shrink-0 divide-y divide-gray-200 self-start sticky top-24">
                      {/* Button 1: Checkbox with checkmark (SquareCheck) */}
                      <button
                        type="button"
                        onClick={handleConfirmOrSelectAll}
                        className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer group relative"
                        title={
                          selectedPlayerIds.size > 0
                            ? `Confirm presence for ${selectedPlayerIds.size} selected player(s)`
                            : 'Select all players / Confirm presence'
                        }
                      >
                        <SquareCheck size={18} />
                      </button>

                      {/* Button 2: Pause icon (Pause) */}
                      <button
                        type="button"
                        onClick={handlePauseSelected}
                        className="p-3 text-gray-400 hover:text-amber-600 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer group relative"
                        title={
                          selectedPlayerIds.size > 0
                            ? `Toggle pause (skip round) for ${selectedPlayerIds.size} player(s)`
                            : 'Pause selected players (skip next round)'
                        }
                      >
                        <Pause size={18} />
                      </button>

                      {/* Button 3: Empty checkbox icon (Square) */}
                      <button
                        type="button"
                        onClick={handleDeselectOrReset}
                        className="p-3 text-gray-400 hover:text-slate-800 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer group relative"
                        title={
                          selectedPlayerIds.size > 0
                            ? 'Deselect all players'
                            : 'Reset check-in status for all players'
                        }
                      >
                        <Square size={18} />
                      </button>

                      {/* Button 4: Mail envelope (Mail) */}
                      <button
                        type="button"
                        onClick={() => setIsEmailModalOpen(true)}
                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer group relative"
                        title={
                          selectedPlayerIds.size > 0
                            ? `Send email to ${selectedPlayerIds.size} selected player(s)`
                            : 'Send email to all players'
                        }
                      >
                        <Mail size={18} />
                      </button>

                      {/* Button 5: Cloud download (CloudDownload) */}
                      <button
                        type="button"
                        onClick={handleExportPlayers}
                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer group relative"
                        title="Download player list (CSV)"
                      >
                        <CloudDownload size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ROUNDS */}
        {activeNavTab === 'rounds' && (() => {
          const currentRound = rounds.find((r) => r.roundNumber === activeRoundNumber);
          const pMap = new Map<string, Player>();
          allOrgPlayers.forEach((p) => pMap.set(p.id, p));
          tournamentPlayers.forEach((tp) => {
            if (tp.player) pMap.set(tp.playerId, tp.player);
          });

          const currentRoundPairings = currentRound
            ? pairings.filter((p) => p.roundId === currentRound.id)
            : [];

          const enrichedCurrentRoundPairings = currentRoundPairings.map((p) => ({
            ...p,
            whitePlayer: p.whitePlayer || (p.whitePlayerId ? pMap.get(p.whitePlayerId) : undefined),
            blackPlayer: p.blackPlayer || (p.blackPlayerId ? pMap.get(p.blackPlayerId) : undefined),
          }));

          const enrichedAllTournamentPairings = pairings.map((p) => ({
            ...p,
            whitePlayer: p.whitePlayer || (p.whitePlayerId ? pMap.get(p.whitePlayerId) : undefined),
            blackPlayer: p.blackPlayer || (p.blackPlayerId ? pMap.get(p.blackPlayerId) : undefined),
          }));

          return (
            <div className="w-full">
              <RoundManager
                tournament={tournament}
                rounds={rounds}
                pairings={enrichedCurrentRoundPairings}
                allTournamentPairings={enrichedAllTournamentPairings}
                tournamentPlayers={tournamentPlayers}
                activeRoundNumber={activeRoundNumber}
                onSelectRoundNumber={setActiveRoundNumber}
                onGeneratePairings={onGeneratePairings}
                onUpdateResult={onUpdateResult}
                onSwapPairing={onSwapPairing}
                onPublishRound={onPublishRound}
                onCompleteRound={onCompleteRound}
                onCreateNextRound={onCreateNextRound}
              />
            </div>
          );
        })()}

        {/* TAB 5: STANDINGS */}
        {activeNavTab === 'standings' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tournament Standings &amp; Tiebreaks</h3>
                <p className="text-xs text-slate-500">
                  Computed live using FIDE Basic Swiss Engine rules and Buchholz / Sonneborn-Berger math.
                </p>
              </div>
              <button
                onClick={handleExportRoster}
                className="bg-[#84592B] hover:bg-[#6c4822] text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Download size={13} className="text-[#E8D1A7]" />
                <span>Export CSV</span>
              </button>
            </div>
            <StandingsTable tournament={tournament} standings={liveStandings} />
          </div>
        )}

        {/* TAB 6: CONTACT */}
        {activeNavTab === 'contact' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Tournament Organizer &amp; Arbiter Contacts
            </h3>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-[#84592B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Chief Arbiter</span>
                  <span>{tournament.chiefArbiter || 'Tanay Trait (FIDE Arbiter)'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[#84592B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Email Support</span>
                  <span>tanay.trait@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-[#84592B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Phone / WhatsApp</span>
                  <span>+91 98260 12345</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#84592B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Playing Venue</span>
                  <span>{tournament.venue || `${tournament.city || 'Jabalpur'}, India`}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeNavTab === 'settings' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-5 text-xs">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Tournament Engine &amp; Tiebreak Priority Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pairing Engine</label>
                <select
                  defaultValue={tournament.format}
                  className="w-full px-3 py-2 bg-white rounded border border-slate-300 font-medium"
                >
                  <option value="basic_swiss">Basic Swiss Pairing Engine (FIDE Heuristics)</option>
                  <option value="round_robin">Round Robin (Berger Tables)</option>
                  <option value="knockout">Single Elimination</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiebreak System Priority</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5 font-mono text-[11px]">
                  <div>1. Buchholz Cut-1 (BH-1)</div>
                  <div>2. Buchholz Total (BH)</div>
                  <div>3. Sonneborn-Berger (SB)</div>
                  <div>4. Direct Encounter</div>
                  <div>5. Number of Wins</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Win Points</label>
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={tournament.pointsWin}
                    className="w-full px-3 py-2 bg-white rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Draw Points</label>
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={tournament.pointsDraw}
                    className="w-full px-3 py-2 bg-white rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loss Points</label>
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={tournament.pointsLoss}
                    className="w-full px-3 py-2 bg-white rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveBasic}
                  className="bg-[#84592B] hover:bg-[#6c4822] text-white px-4 py-2 rounded font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Save Engine Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* Modals */}
      <EntryFeesModal
        isOpen={isEntryFeesOpen}
        onClose={() => setIsEntryFeesOpen(false)}
        tournamentPlayers={tournamentPlayers}
        onTogglePaid={(playerId, paid) => {
          // updates state
        }}
      />

      <ImportFileModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportPlayers={(importedPlayers) => {
          if (onImportPlayersToTournament) {
            onImportPlayersToTournament(importedPlayers, tournament.id);
          } else {
            const created = db.importPlayers(tournament.organizationId, importedPlayers);
            created.forEach((p) => {
              db.addPlayerToTournament(tournament.id, p.id);
            });
            window.location.reload();
          }
          setPlayerActionFeedback(`✓ Successfully imported ${importedPlayers.length} player(s) into tournament roster.`);
          setTimeout(() => setPlayerActionFeedback(null), 3500);
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tournament={tournament}
        onOpenPublicPortal={() => onNavigate('public-portal', tournament.id)}
      />

      <EmailPlayersModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        tournament={tournament}
        tournamentPlayers={tournamentPlayers}
        selectedPlayerIds={selectedPlayerIds}
        onLogAudit={(action, details) => {
          db.addAuditLog({
            organizationId: tournament.organizationId,
            tournamentId: tournament.id,
            actorId: 'arbiter',
            actorName: 'Tournament Arbiter',
            action: action as any,
            details,
          });
        }}
      />
    </div>
  );
};
