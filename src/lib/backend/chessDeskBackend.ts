import { 
  TournamentPlayer, 
  BoardMatch, 
  generateSwissPairings, 
  calculateBuchholzCut1, 
  calculateSonnebornBerger 
} from '../chess/pairingEngine';
import { 
  DEFAULT_PLAYER_RATING, 
  getTierFromRating, 
  calculateMatchFideRatingChanges 
} from '../chess/eloEngine';
import { 
  TournamentRecord, 
  loadStoredTournament, 
  saveStoredTournament 
} from '../storage/mockDatabase';

const STORAGE_ALL_TOURNAMENTS_KEY = "cci_all_tournaments_v2";
const STORAGE_ACTIVE_TOURNEY_ID_KEY = "cci_active_tourney_id_v2";

export interface CreateTournamentInput {
  title: string;
  format?: 'Swiss System' | 'Round Robin' | 'Single Elimination';
  timeControl?: string;
  totalRounds?: number;
  startDate?: string;
  location?: string;
  city?: string;
  venue?: string;
  defaultRating?: number;
  arbiterName?: string;
  organizerName?: string;
  description?: string;
}

export interface PlayerInput {
  name: string;
  rating?: number;
  city?: string;
  fideId?: string;
  email?: string;
  phone?: string;
  isConfirmed?: boolean;
  attendanceStatus?: 'present' | 'absent' | 'withdrawn';
  notes?: string;
}

export interface AttendanceMetrics {
  totalRegistered: number;
  confirmedCount: number;
  pendingCount: number;
  presentCount: number;
  absentCount: number;
  withdrawnCount: number;
  attendanceRatePercent: number;
}

// Event dispatcher for reactive updates
function notifyChange(tournamentId?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cci-tournament-backend-updated", { 
      detail: { tournamentId, timestamp: Date.now() } 
    }));
  }
}

/**
 * Initialize default tournaments if storage is empty
 */
function getInitialTournamentsList(): TournamentRecord[] {
  const seed = loadStoredTournament();
  const initialList: TournamentRecord[] = [
    {
      ...seed,
      id: seed.id || "tourney-cci-national-2026",
      title: seed.title || "CCI National Swiss Masters 2026",
      format: seed.format || "Swiss System",
      timeControl: seed.timeControl || "15m + 10s Blitz & Rapid",
      totalRounds: seed.totalRounds || 5,
      currentRound: seed.currentRound || 2,
      status: seed.status || "ongoing",
      startDate: seed.startDate || "2026-10-15",
      location: seed.location || "Jabalpur Chess Center, MP",
      players: seed.players.map((p) => ({
        ...p,
        isConfirmed: p.isConfirmed ?? true,
        attendanceStatus: p.attendanceStatus ?? "present",
      })),
    },
    {
      id: "tourney-bangalore-open-2026",
      title: "Bangalore Rapid Grand Prix 2026",
      format: "Swiss System",
      timeControl: "10m + 5s Rapid",
      totalRounds: 5,
      currentRound: 1,
      status: "upcoming",
      startDate: "2026-11-05",
      location: "Indiranagar Chess Club, Bangalore",
      players: [
        {
          id: "p-b01",
          cciId: "CCI-2026-B001",
          name: "Arjun Erigaisi",
          rating: 2795,
          startRating: 2795,
          tierName: "Grand Sovereign",
          tierNumber: 6,
          score: 0,
          colorHistory: [],
          opponentsPlayed: [],
          hasReceivedBye: false,
          isConfirmed: true,
          attendanceStatus: "present",
          city: "Warangal",
          fideId: "25072700",
        },
        {
          id: "p-b02",
          cciId: "CCI-2026-B002",
          name: "Praggnanandhaa R",
          rating: 2760,
          startRating: 2760,
          tierName: "Grand Sovereign",
          tierNumber: 6,
          score: 0,
          colorHistory: [],
          opponentsPlayed: [],
          hasReceivedBye: false,
          isConfirmed: true,
          attendanceStatus: "present",
          city: "Chennai",
          fideId: "25059530",
        },
        {
          id: "p-b03",
          cciId: "CCI-2026-B003",
          name: "Nihal Sarin",
          rating: 2690,
          startRating: 2690,
          tierName: "Grand Sovereign",
          tierNumber: 6,
          score: 0,
          colorHistory: [],
          opponentsPlayed: [],
          hasReceivedBye: false,
          isConfirmed: true,
          attendanceStatus: "present",
          city: "Thrissur",
          fideId: "25040002",
        },
        {
          id: "p-b04",
          cciId: "CCI-2026-B004",
          name: "Aadit Sen",
          rating: DEFAULT_PLAYER_RATING,
          startRating: DEFAULT_PLAYER_RATING,
          tierName: "Tactical Striker",
          tierNumber: 2,
          score: 0,
          colorHistory: [],
          opponentsPlayed: [],
          hasReceivedBye: false,
          isConfirmed: false,
          attendanceStatus: "absent",
          city: "Bangalore",
        },
      ],
      rounds: { 1: [] },
    }
  ];
  return initialList;
}

// ---------------------------------------------------------------------------
// TOURNAMENT CRUD & REPOSITORY
// ---------------------------------------------------------------------------

export const ChessDeskBackend = {
  /**
   * Get all tournaments in database
   */
  getAllTournaments(): TournamentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_ALL_TOURNAMENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading tournaments from localStorage", e);
    }
    const initial = getInitialTournamentsList();
    this.saveAllTournaments(initial);
    return initial;
  },

  /**
   * Persist tournament list
   */
  saveAllTournaments(tournaments: TournamentRecord[]): void {
    try {
      localStorage.setItem(STORAGE_ALL_TOURNAMENTS_KEY, JSON.stringify(tournaments));
      // Keep legacy single tournament key synchronized with active tournament
      const activeId = this.getActiveTournamentId();
      const active = tournaments.find((t) => t.id === activeId) || tournaments[0];
      if (active) {
        saveStoredTournament(active);
      }
      notifyChange(activeId);
    } catch (e) {
      console.error("Error saving tournaments", e);
    }
  },

  /**
   * Get current active tournament ID
   */
  getActiveTournamentId(): string {
    try {
      const stored = localStorage.getItem(STORAGE_ACTIVE_TOURNEY_ID_KEY);
      if (stored) return stored;
    } catch (e) {
      console.warn("Could not read active tournament id", e);
    }
    const all = this.getAllTournaments();
    const firstId = all[0]?.id || "tourney-cci-national-2026";
    this.setActiveTournamentId(firstId);
    return firstId;
  },

  /**
   * Set active tournament ID
   */
  setActiveTournamentId(id: string): void {
    try {
      localStorage.setItem(STORAGE_ACTIVE_TOURNEY_ID_KEY, id);
      const all = this.getAllTournaments();
      const target = all.find((t) => t.id === id);
      if (target) {
        saveStoredTournament(target);
      }
      notifyChange(id);
    } catch (e) {
      console.error("Could not set active tournament id", e);
    }
  },

  /**
   * Get active tournament object
   */
  getActiveTournament(): TournamentRecord {
    const all = this.getAllTournaments();
    const activeId = this.getActiveTournamentId();
    const found = all.find((t) => t.id === activeId);
    if (found) return found;
    if (all.length > 0) {
      this.setActiveTournamentId(all[0].id);
      return all[0];
    }
    const initial = getInitialTournamentsList();
    this.saveAllTournaments(initial);
    return initial[0];
  },

  /**
   * Find tournament by ID
   */
  getTournamentById(id: string): TournamentRecord | null {
    const all = this.getAllTournaments();
    return all.find((t) => t.id === id) || null;
  },

  /**
   * Create a new tournament with custom parameters
   */
  createTournament(input: CreateTournamentInput): TournamentRecord {
    const all = this.getAllTournaments();
    const id = `tourney-${Date.now()}`;
    const newTournament: TournamentRecord = {
      id,
      title: input.title.trim(),
      format: input.format || 'Swiss System',
      timeControl: input.timeControl || '15m + 10s',
      totalRounds: input.totalRounds || 5,
      currentRound: 1,
      status: 'upcoming',
      startDate: input.startDate || new Date().toISOString().split("T")[0],
      location: input.location || `${input.venue || "Central Arena"}, ${input.city || "Jabalpur"}`,
      players: [],
      rounds: { 1: [] },
    };

    const updated = [newTournament, ...all];
    this.saveAllTournaments(updated);
    this.setActiveTournamentId(id);
    notifyChange(id);
    return newTournament;
  },

  /**
   * Update tournament settings
   */
  updateTournament(id: string, updates: Partial<TournamentRecord>): TournamentRecord | null {
    const all = this.getAllTournaments();
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updatedTourney: TournamentRecord = {
      ...all[index],
      ...updates,
    };

    all[index] = updatedTourney;
    this.saveAllTournaments(all);
    notifyChange(id);
    return updatedTourney;
  },

  /**
   * Delete tournament by ID
   */
  deleteTournament(id: string): boolean {
    const all = this.getAllTournaments();
    if (all.length <= 1) {
      // Keep at least one tournament
      return false;
    }
    const filtered = all.filter((t) => t.id !== id);
    this.saveAllTournaments(filtered);
    if (this.getActiveTournamentId() === id) {
      this.setActiveTournamentId(filtered[0].id);
    }
    notifyChange(filtered[0]?.id);
    return true;
  },

  // ---------------------------------------------------------------------------
  // PLAYER CRUD, ATTENDANCE & CONFIRMATION
  // ---------------------------------------------------------------------------

  /**
   * Add / Insert player into a tournament
   */
  addPlayer(tournamentId: string, input: PlayerInput): TournamentPlayer {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney) throw new Error(`Tournament ${tournamentId} not found`);

    const assignedRating = Number(input.rating) || DEFAULT_PLAYER_RATING;
    const tier = getTierFromRating(assignedRating);
    const newId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCciId = `CCI-2026-${String(tourney.players.length + 1).padStart(4, "0")}`;

    const newPlayer: TournamentPlayer = {
      id: newId,
      cciId: newCciId,
      name: input.name.trim(),
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
      city: input.city || "Jabalpur",
      fideId: input.fideId?.trim() || undefined,
      ratingDelta: 0,
      isConfirmed: input.isConfirmed ?? true,
      attendanceStatus: input.attendanceStatus ?? "present",
      email: input.email?.trim(),
      phone: input.phone?.trim(),
      registeredAt: new Date().toISOString(),
      notes: input.notes?.trim(),
    };

    tourney.players = [...tourney.players, newPlayer];
    this.saveAllTournaments(all);
    notifyChange(tournamentId);
    return newPlayer;
  },

  /**
   * Update existing player
   */
  updatePlayer(tournamentId: string, playerId: string, updates: Partial<TournamentPlayer>): TournamentPlayer | null {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney) return null;

    const pIdx = tourney.players.findIndex((p) => p.id === playerId);
    if (pIdx === -1) return null;

    const current = tourney.players[pIdx];
    const newRating = updates.rating ?? current.rating;
    const tier = getTierFromRating(newRating);

    const updatedPlayer: TournamentPlayer = {
      ...current,
      ...updates,
      tierName: tier.name,
      tierNumber: tier.tierNumber,
    };

    tourney.players[pIdx] = updatedPlayer;
    this.saveAllTournaments(all);
    notifyChange(tournamentId);
    return updatedPlayer;
  },

  /**
   * Delete player from tournament
   */
  deletePlayer(tournamentId: string, playerId: string): boolean {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney) return false;

    tourney.players = tourney.players.filter((p) => p.id !== playerId);
    this.saveAllTournaments(all);
    notifyChange(tournamentId);
    return true;
  },

  /**
   * Set individual player attendance status
   */
  setPlayerAttendance(
    tournamentId: string, 
    playerId: string, 
    status: 'present' | 'absent' | 'withdrawn'
  ): boolean {
    return !!this.updatePlayer(tournamentId, playerId, { attendanceStatus: status });
  },

  /**
   * Confirm or Unconfirm a player
   */
  confirmPlayer(tournamentId: string, playerId: string, isConfirmed: boolean): boolean {
    return !!this.updatePlayer(tournamentId, playerId, { isConfirmed });
  },

  /**
   * Bulk attendance update
   */
  bulkSetAttendance(
    tournamentId: string, 
    playerIds: string[], 
    status: 'present' | 'absent' | 'withdrawn'
  ): void {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney) return;

    tourney.players = tourney.players.map((p) => {
      if (playerIds.includes(p.id)) {
        return { ...p, attendanceStatus: status };
      }
      return p;
    });

    this.saveAllTournaments(all);
    notifyChange(tournamentId);
  },

  /**
   * Bulk confirm / unconfirm
   */
  bulkConfirmPlayers(tournamentId: string, playerIds: string[], isConfirmed: boolean): void {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney) return;

    tourney.players = tourney.players.map((p) => {
      if (playerIds.includes(p.id)) {
        return { ...p, isConfirmed };
      }
      return p;
    });

    this.saveAllTournaments(all);
    notifyChange(tournamentId);
  },

  /**
   * Get attendance metrics summary
   */
  getAttendanceMetrics(tournamentId: string): AttendanceMetrics {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) {
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

    const total = tourney.players.length;
    const confirmed = tourney.players.filter((p) => p.isConfirmed !== false).length;
    const pending = total - confirmed;
    const present = tourney.players.filter((p) => p.attendanceStatus === "present").length;
    const absent = tourney.players.filter((p) => p.attendanceStatus === "absent").length;
    const withdrawn = tourney.players.filter((p) => p.attendanceStatus === "withdrawn").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      totalRegistered: total,
      confirmedCount: confirmed,
      pendingCount: pending,
      presentCount: present,
      absentCount: absent,
      withdrawnCount: withdrawn,
      attendanceRatePercent: rate,
    };
  },

  // ---------------------------------------------------------------------------
  // PAIRINGS & RESULTS
  // ---------------------------------------------------------------------------

  /**
   * Generate next round Swiss pairings with attendance verification
   */
  generateNextRound(tournamentId: string, onlyPresentAndConfirmed: boolean = true): BoardMatch[] {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney) throw new Error("Tournament not found");

    const nextRound = tourney.currentRound + 1;
    if (nextRound > tourney.totalRounds) {
      throw new Error(`Tournament already reached maximum ${tourney.totalRounds} rounds.`);
    }

    // Filter eligible players: must be confirmed and present if specified
    const eligiblePlayers = tourney.players.filter((p) => {
      if (!onlyPresentAndConfirmed) return true;
      const isConfirmed = p.isConfirmed !== false;
      const isPresent = p.attendanceStatus === "present";
      return isConfirmed && isPresent;
    });

    if (eligiblePlayers.length < 2) {
      throw new Error("At least 2 present & confirmed players are required to generate pairings.");
    }

    const newMatches = generateSwissPairings(eligiblePlayers, nextRound);

    tourney.currentRound = nextRound;
    tourney.rounds[nextRound] = newMatches;
    tourney.status = "ongoing";

    this.saveAllTournaments(all);
    notifyChange(tournamentId);
    return newMatches;
  },

  /**
   * Enter / Update Match Result
   */
  setMatchResult(
    tournamentId: string,
    roundNumber: number,
    boardNumber: number,
    result: BoardMatch["result"]
  ): boolean {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney || !tourney.rounds[roundNumber]) return false;

    const matches = tourney.rounds[roundNumber];
    const matchIndex = matches.findIndex((m) => m.boardNumber === boardNumber);
    if (matchIndex === -1) return false;

    const targetMatch = matches[matchIndex];
    let whiteDelta = 0;
    let blackDelta = 0;

    if (
      targetMatch.whitePlayer && 
      targetMatch.blackPlayer && 
      result !== "PENDING" && 
      result !== "BYE" && 
      result !== "0F-0F"
    ) {
      const deltas = calculateMatchFideRatingChanges(
        targetMatch.whitePlayer.startRating ?? targetMatch.whitePlayer.rating,
        targetMatch.blackPlayer.startRating ?? targetMatch.blackPlayer.rating,
        result
      );
      whiteDelta = deltas.whiteDelta;
      blackDelta = deltas.blackDelta;
    }

    matches[matchIndex] = {
      ...targetMatch,
      result,
      isCompleted: result !== "PENDING",
      whiteDelta,
      blackDelta,
    };

    this.saveAllTournaments(all);
    notifyChange(tournamentId);
    return true;
  },

  /**
   * Arbiter manual pairing override
   */
  manualOverrideBoard(
    tournamentId: string,
    roundNumber: number,
    boardNumber: number,
    whitePlayerId: string,
    blackPlayerId?: string
  ): boolean {
    const all = this.getAllTournaments();
    const tourney = all.find((t) => t.id === tournamentId);
    if (!tourney || !tourney.rounds[roundNumber]) return false;

    const white = tourney.players.find((p) => p.id === whitePlayerId);
    const black = blackPlayerId ? tourney.players.find((p) => p.id === blackPlayerId) : undefined;
    if (!white) return false;

    const matches = tourney.rounds[roundNumber];
    const matchIdx = matches.findIndex((m) => m.boardNumber === boardNumber);

    const updatedMatch: BoardMatch = {
      id: `match-r${roundNumber}-b${boardNumber}-custom`,
      boardNumber,
      whitePlayer: white,
      blackPlayer: black,
      result: black ? 'PENDING' : 'BYE',
      isCompleted: !black,
    };

    if (matchIdx !== -1) {
      matches[matchIdx] = updatedMatch;
    } else {
      matches.push(updatedMatch);
    }

    this.saveAllTournaments(all);
    notifyChange(tournamentId);
    return true;
  },

  // ---------------------------------------------------------------------------
  // CSV EXPORTS & REPORTS ("GET THE LIST")
  // ---------------------------------------------------------------------------

  /**
   * Export Player List to CSV
   */
  exportPlayersCSV(tournamentId: string): string {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) return "";

    const headers = ["Rank", "CCI ID", "Name", "Rating", "Batch Tier", "City", "FIDE ID", "Attendance", "Confirmed", "Score"];
    const rows = tourney.players
      .sort((a, b) => b.rating - a.rating)
      .map((p, idx) => [
        idx + 1,
        `"${p.cciId}"`,
        `"${p.name}"`,
        p.rating,
        `"${p.tierName}"`,
        `"${p.city || ""}"`,
        `"${p.fideId || ""}"`,
        `"${p.attendanceStatus || "present"}"`,
        p.isConfirmed !== false ? "Confirmed" : "Pending",
        p.score,
      ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  },

  /**
   * Export Attendance Sheet to CSV
   */
  exportAttendanceCSV(tournamentId: string): string {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) return "";

    const headers = ["No.", "Name", "CCI ID", "Rating", "Attendance", "Confirmed", "Signature / Verification"];
    const rows = [...tourney.players]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p, idx) => [
        idx + 1,
        `"${p.name}"`,
        `"${p.cciId}"`,
        p.rating,
        `"${p.attendanceStatus || "present"}"`,
        p.isConfirmed !== false ? "YES" : "NO",
        "",
      ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  },

  /**
   * Reset database back to default seed state
   */
  resetToDefaultData(): void {
    const initial = getInitialTournamentsList();
    this.saveAllTournaments(initial);
    this.setActiveTournamentId(initial[0].id);
    notifyChange(initial[0].id);
  },

  /**
   * Export entire tournament database to JSON string
   */
  exportDatabaseJSON(): string {
    const tournaments = this.getAllTournaments();
    return JSON.stringify({
      schema: "cci-tournaments-v2",
      exportedAt: new Date().toISOString(),
      activeTournamentId: this.getActiveTournamentId(),
      tournaments,
    }, null, 2);
  },

  /**
   * Restore database from JSON string
   */
  restoreDatabaseJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.tournaments) && parsed.tournaments.length > 0) {
        this.saveAllTournaments(parsed.tournaments);
        if (parsed.activeTournamentId) {
          this.setActiveTournamentId(parsed.activeTournamentId);
        }
        notifyChange(parsed.activeTournamentId || parsed.tournaments[0].id);
        return true;
      }
    } catch (e) {
      console.error("Invalid database JSON format", e);
    }
    return false;
  }
};
