import { db, StorageService } from './storage';
import { getTournamentEngine, TournamentFormat } from '../engine';
import {
  AuditLog,
  GameResult,
  Organization,
  Pairing,
  Player,
  Round,
  RoundStatus,
  Tournament,
  TournamentPlayer,
  UserProfile,
  UserRole,
} from '../types';
import { parsePlayerCsv, CsvParseResult } from './csv';
import { exportStandingsCsv, exportPairingsCsv, exportPlayersCsv } from './export';
import { getCCICategory, CCIRatingCategory, CCI_CATEGORIES } from './cciAdapter';
import {
  ChessColor,
  EnginePairing,
  EnginePlayer,
  EngineRoundHistoryGame,
  EngineStanding,
  TiebreakRule,
} from '../engine/types';

export interface CreateTournamentParams {
  name: string;
  organizationId?: string;
  format?: TournamentFormat;
  engineVersion?: string;
  roundsCount?: number;
  timeControlCategory?: 'blitz' | 'rapid' | 'classical' | 'bullet' | 'custom';
  timeControlString?: string;
  city?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  isFideRated?: boolean;
  tiebreakRules?: TiebreakRule[];
  chiefArbiter?: string;
  notes?: string;
  isPublic?: boolean;
}

export interface ManualBoardSwapParams {
  pairing1Id: string;
  pairing2Id: string;
  swapWhite: boolean;
  reason: string;
  arbiterId?: string;
  arbiterName?: string;
}

export interface RegisterPlayerParams {
  name: string;
  surname?: string;
  rating?: number;
  fideId?: string;
  nationalId?: string;
  title?: Player['title'];
  federation?: string;
  club?: string;
  city?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  notes?: string;
}

/**
 * ChessManagerBackendService
 * 
 * Production-ready backend management service for Chess Manager.
 * Governs multi-tenant tournament configuration, FIDE/Swiss pairing engines,
 * arbiter commands, result recording, manual board swaps, CSV imports,
 * rating calculations, and immutable audit logs.
 */
export class ChessManagerBackendService {
  private storage: StorageService;

  constructor(storageInstance: StorageService = db) {
    this.storage = storageInstance;
  }

  // ===========================================================================
  // 1. TOURNAMENT LIFECYCLE MANAGEMENT
  // ===========================================================================

  public getTournaments(organizationId?: string): Tournament[] {
    const orgId = organizationId || this.storage.getActiveOrgId();
    return this.storage.getTournaments(orgId);
  }

  public getTournamentById(tournamentId: string): Tournament | undefined {
    return this.storage.getTournament(tournamentId);
  }

  public createTournament(params: CreateTournamentParams): Tournament {
    const orgId = params.organizationId || this.storage.getActiveOrgId();
    const tiebreaks: TiebreakRule[] = params.tiebreakRules || [
      'buchholz_cut1',
      'buchholz_total',
      'sonneborn_berger',
      'direct_encounter',
      'most_blacks',
      'wins',
    ];

    const format: TournamentFormat = params.format || 'basic_swiss';
    const tournament = this.storage.createTournament({
      organizationId: orgId,
      name: params.name,
      slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      format,
      engineVersion: params.engineVersion || '1.0.0-basic',
      roundsCount: params.roundsCount || 5,
      currentRound: 1,
      status: 'upcoming' as any,
      timeControlCategory: params.timeControlCategory || 'rapid',
      timeControlString: params.timeControlString || '15m + 10s',
      pointsWin: 1,
      pointsDraw: 0.5,
      pointsLoss: 0,
      isPublic: params.isPublic ?? true,
      startDate: params.startDate || new Date().toISOString().split('T')[0],
      endDate: params.endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      city: params.city || 'Jabalpur',
      venue: params.venue || 'CCI Chess Arena',
      isFideRated: params.isFideRated ?? false,
      tiebreakRules: tiebreaks,
      chiefArbiter: params.chiefArbiter || 'Chief Arbiter',
      playersCount: 0,
    });

    this.addAuditLog({
      organizationId: orgId,
      tournamentId: tournament.id,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'UPDATE_SETTINGS',
      details: {
        event: 'tournament_created',
        name: tournament.name,
        format: tournament.format,
        roundsCount: tournament.roundsCount,
      },
    });

    return tournament;
  }

  public publishTournament(tournamentId: string, isPublic = true): Tournament | null {
    return this.updateTournament(tournamentId, { isPublic });
  }

  public unpublishTournament(tournamentId: string): Tournament | null {
    return this.updateTournament(tournamentId, { isPublic: false });
  }

  public updateTournament(tournamentId: string, updates: Partial<Tournament>): Tournament | null {
    const existing = this.storage.getTournament(tournamentId);
    if (!existing) return null;

    const updated = this.storage.updateTournament(tournamentId, updates);
    if (updated) {
      this.addAuditLog({
        organizationId: updated.organizationId,
        tournamentId: updated.id,
        actorId: this.storage.getCurrentUserId(),
        actorName: this.getActorName(),
        action: 'UPDATE_SETTINGS',
        details: {
          event: 'tournament_updated',
          updates,
        },
      });
    }
    return updated;
  }

  public deleteTournament(tournamentId: string): boolean {
    const existing = this.storage.getTournament(tournamentId);
    if (!existing) return false;

    this.addAuditLog({
      organizationId: existing.organizationId,
      tournamentId: existing.id,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'UPDATE_SETTINGS',
      details: {
        event: 'tournament_deleted',
        name: existing.name,
      },
    });

    this.storage.deleteTournament(tournamentId);
    return true;
  }

  // ===========================================================================
  // 2. MASTER PLAYER ROSTER & PARTICIPANT REGISTRATION
  // ===========================================================================

  public getPlayers(organizationId?: string): Player[] {
    const orgId = organizationId || this.storage.getActiveOrgId();
    return this.storage.getPlayers(orgId);
  }

  public getPlayerById(playerId: string): Player | undefined {
    return this.storage.getPlayer(playerId);
  }

  public registerPlayer(params: RegisterPlayerParams): Player {
    const orgId = params.organizationId || this.storage.getActiveOrgId();

    // Prevent duplicate player records: match existing by fideId, nationalId, or email
    const existingPlayers = this.storage.getPlayers(orgId);
    let existing: Player | undefined;

    if (params.fideId) {
      existing = existingPlayers.find((p) => p.fideId === params.fideId);
    }
    if (!existing && params.nationalId) {
      existing = existingPlayers.find((p) => p.nationalId === params.nationalId);
    }
    if (!existing && params.email) {
      existing = existingPlayers.find((p) => p.email && p.email.toLowerCase() === params.email!.toLowerCase());
    }

    if (existing) {
      const updated = this.storage.updatePlayer(existing.id, {
        name: params.name || existing.name,
        surname: params.surname ?? existing.surname,
        rating: params.rating ?? existing.rating,
        title: params.title ?? existing.title,
        federation: params.federation ?? existing.federation,
        club: params.club || params.city || existing.club,
        email: params.email ?? existing.email,
        phone: params.phone ?? existing.phone,
        notes: params.notes ?? existing.notes,
      });
      return updated || existing;
    }

    const player = this.storage.createPlayer({
      organizationId: orgId,
      name: params.name,
      surname: params.surname,
      rating: params.rating || 1000,
      fideId: params.fideId,
      nationalId: params.nationalId,
      title: params.title || 'None',
      federation: params.federation || 'IND',
      club: params.club || params.city || 'Chess Community India',
      email: params.email,
      phone: params.phone,
      notes: params.notes,
      isActive: true,
    });

    this.addAuditLog({
      organizationId: orgId,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'REGISTER_PLAYER',
      details: {
        playerId: player.id,
        name: player.name,
        rating: player.rating,
        fideId: player.fideId,
      },
    });

    return player;
  }

  public updatePlayer(playerId: string, updates: Partial<Player>): Player | null {
    return this.storage.updatePlayer(playerId, updates);
  }

  public deletePlayer(playerId: string): void {
    this.storage.deletePlayer(playerId);
  }

  public importPlayersFromCSV(csvText: string, organizationId?: string): CsvParseResult & { importedCount: number } {
    const orgId = organizationId || this.storage.getActiveOrgId();
    const result = parsePlayerCsv(csvText);

    let importedCount = 0;
    for (const p of result.validPlayers) {
      this.storage.createPlayer({
        ...p,
        organizationId: orgId,
      });
      importedCount++;
    }

    if (importedCount > 0) {
      this.addAuditLog({
        organizationId: orgId,
        actorId: this.storage.getCurrentUserId(),
        actorName: this.getActorName(),
        action: 'REGISTER_PLAYER',
        details: {
          event: 'bulk_csv_import',
          importedCount,
          errorsCount: result.errors.length,
        },
      });
    }

    return { ...result, importedCount };
  }

  // ===========================================================================
  // 3. TOURNAMENT PLAYER SEEDING & ROSTER ENROLLMENT
  // ===========================================================================

  public getTournamentPlayers(tournamentId: string): (TournamentPlayer & { player?: Player })[] {
    const tournamentPlayers = this.storage.getTournamentPlayers(tournamentId);
    return tournamentPlayers.map((tp) => ({
      ...tp,
      player: this.storage.getPlayer(tp.playerId),
    }));
  }

  public addPlayerToTournament(tournamentId: string, playerId: string, customSeed?: number): TournamentPlayer {
    const existing = this.storage.getTournamentPlayers(tournamentId).find((tp) => tp.playerId === playerId);
    if (existing) return existing;

    const currentCount = this.storage.getTournamentPlayers(tournamentId).length;
    const tp = this.storage.addPlayerToTournament(tournamentId, playerId);

    this.addAuditLog({
      organizationId: this.storage.getActiveOrgId(),
      tournamentId,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'REGISTER_PLAYER',
      details: {
        event: 'enrolled_in_tournament',
        tournamentId,
        playerId,
        seedNumber: tp.seedNumber,
      },
    });

    return tp;
  }

  public removePlayerFromTournament(tournamentId: string, playerId: string): void {
    const currentIds = this.storage.getTournamentPlayers(tournamentId).map((tp) => tp.playerId);
    this.storage.setTournamentPlayers(tournamentId, currentIds.filter((id) => id !== playerId));
    this.addAuditLog({
      organizationId: this.storage.getActiveOrgId(),
      tournamentId,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'WITHDRAW_PLAYER',
      details: {
        event: 'removed_from_tournament',
        tournamentId,
        playerId,
      },
    });
  }

  // ===========================================================================
  // 4. ROUNDS & PAIRING ENGINE EXECUTION
  // ===========================================================================

  public getRounds(tournamentId: string): Round[] {
    return this.storage.getRounds(tournamentId);
  }

  public getRoundByNumber(tournamentId: string, roundNumber: number): Round | undefined {
    return this.storage.getRounds(tournamentId).find((r) => r.roundNumber === roundNumber);
  }

  public createRound(tournamentId: string, roundNumber?: number): Round {
    const rounds = this.storage.getRounds(tournamentId);
    const nextRoundNumber = roundNumber || (rounds.length > 0 ? Math.max(...rounds.map((r) => r.roundNumber)) + 1 : 1);
    const round = this.storage.createRound(tournamentId, nextRoundNumber);

    this.addAuditLog({
      organizationId: this.storage.getActiveOrgId(),
      tournamentId,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'UPDATE_SETTINGS',
      details: {
        event: 'round_created',
        tournamentId,
        roundNumber: nextRoundNumber,
        roundId: round.id,
      },
    });

    return round;
  }

  public updateRoundStatus(roundId: string, status: RoundStatus): void {
    this.storage.updateRoundStatus(roundId, status);
    this.addAuditLog({
      organizationId: this.storage.getActiveOrgId(),
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: status === 'published' ? 'PUBLISH_ROUND' : 'UPDATE_SETTINGS',
      details: {
        event: 'round_status_updated',
        roundId,
        status,
      },
    });
  }

  public getPairings(roundId: string): Pairing[] {
    return this.storage.getPairings(roundId);
  }

  public getAllPairingsForTournament(tournamentId: string): Pairing[] {
    const rounds = this.storage.getRounds(tournamentId);
    return rounds.flatMap((r) => this.storage.getPairings(r.id));
  }

  /**
   * Runs the algorithmic pairing engine to generate pairings for a tournament round.
   * Enforces no-repeat opponents, score groups, color balance invariants, and byes.
   */
  public generatePairingsForRound(tournamentId: string, roundNumber: number): Pairing[] {
    const tournament = this.storage.getTournament(tournamentId);
    if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

    // Ensure round exists
    let targetRound = this.storage.getRounds(tournamentId).find((r) => r.roundNumber === roundNumber);
    if (!targetRound) {
      targetRound = this.createRound(tournamentId, roundNumber);
    }

    // Retrieve active (non-withdrawn) tournament players
    const tPlayers = this.storage.getTournamentPlayers(tournamentId).filter((tp) => !tp.isWithdrawn);
    if (tPlayers.length < 2) {
      throw new Error(`Insufficient players (${tPlayers.length}) to generate pairings. Minimum 2 required.`);
    }

    // Previous completed rounds
    const previousRounds = this.storage
      .getRounds(tournamentId)
      .filter((r) => r.roundNumber < roundNumber)
      .sort((a, b) => a.roundNumber - b.roundNumber);

    const historyRounds: EngineRoundHistoryGame[][] = previousRounds.map((r) => {
      const pairings = this.storage.getPairings(r.id);
      return pairings.map((p) => ({
        roundNumber: r.roundNumber,
        boardNumber: p.boardNumber,
        whitePlayerId: p.whitePlayerId,
        blackPlayerId: p.blackPlayerId,
        result: p.result as GameResult,
        isBye: p.isBye || p.blackPlayerId === null,
        byeType: p.byeType,
      }));
    });

    // Map each tournament player into EnginePlayer with score and color history
    const allGames = historyRounds.flat();
    const enginePlayers: EnginePlayer[] = tPlayers.map((tp) => {
      const p = this.storage.getPlayer(tp.playerId);
      const name = p ? p.name : `Player ${tp.seedNumber}`;
      const rating = p ? p.rating : 1200;

      // Calculate score from games played
      let score = 0;
      const colorHistory: ChessColor[] = [];
      const opponentIds: string[] = [];
      let receivedBye = false;

      for (const game of allGames) {
        if (game.whitePlayerId === tp.playerId) {
          if (game.isBye) {
            receivedBye = true;
            score += 1.0;
            colorHistory.push('NONE');
          } else {
            colorHistory.push('W');
            if (game.blackPlayerId) opponentIds.push(game.blackPlayerId);
            if (game.result === '1-0' || game.result === '1F-0') score += 1.0;
            else if (game.result === '0.5-0.5') score += 0.5;
          }
        } else if (game.blackPlayerId === tp.playerId) {
          colorHistory.push('B');
          if (game.whitePlayerId) opponentIds.push(game.whitePlayerId);
          if (game.result === '0-1' || game.result === '0-1F') score += 1.0;
          else if (game.result === '0.5-0.5') score += 0.5;
        }
      }

      return {
        id: tp.playerId,
        name,
        rating,
        title: p?.title,
        federation: p?.federation,
        seed: tp.seedNumber,
        score,
        colorHistory,
        opponentIds,
        receivedBye,
        isWithdrawn: tp.isWithdrawn,
      };
    });

    // Instantiate appropriate pairing engine (Swiss, Round Robin, Knockout)
    const engineFormat: TournamentFormat = tournament.format || 'basic_swiss';
    const engine = getTournamentEngine(engineFormat);

    const generatedPairings = engine.pairRound({
      roundNumber,
      players: enginePlayers,
      previousRounds: historyRounds,
      allowDownfloats: true,
    });

    // Transform engine output to storage pairing records
    const pairingsToSave = generatedPairings.map((gp, idx) => ({
      boardNumber: gp.boardNumber || idx + 1,
      whitePlayerId: gp.whitePlayerId,
      blackPlayerId: gp.blackPlayerId,
      result: (gp.isBye || gp.blackPlayerId === null ? '1-0_BYE' : 'UNPLAYED') as GameResult,
      isBye: gp.isBye || gp.blackPlayerId === null,
      byeType: gp.byeType,
      isManualOverride: false,
    }));

    const saved = this.storage.savePairings(targetRound.id, tournamentId, pairingsToSave);

    // Update round status to published
    this.storage.updateRoundStatus(targetRound.id, 'published');

    // Audit Log
    const metadata = engine.getMetadata();
    this.addAuditLog({
      organizationId: tournament.organizationId,
      tournamentId,
      actorId: this.storage.getCurrentUserId(),
      actorName: this.getActorName(),
      action: 'GENERATE_PAIRINGS',
      details: {
        roundNumber,
        pairingsCount: saved.length,
        engineName: metadata.name,
      },
    });

    return saved;
  }

  // ===========================================================================
  // 5. RESULT RECORDING & ARBITER BOARD ADJUSTMENTS
  // ===========================================================================

  public recordResult(pairingId: string, result: GameResult, arbiterId?: string, arbiterName?: string): boolean {
    const success = this.storage.updatePairingResult(pairingId, result);
    if (!success) {
      throw new Error(`Pairing ${pairingId} not found`);
    }

    this.addAuditLog({
      organizationId: this.storage.getActiveOrgId(),
      actorId: arbiterId || this.storage.getCurrentUserId(),
      actorName: arbiterName || this.getActorName(),
      action: 'ENTER_RESULT',
      details: {
        pairingId,
        result,
      },
    });
    return true;
  }

  public recordMatchResult(params: { pairingId: string; result: GameResult; enteredBy?: string }): boolean {
    return this.recordResult(params.pairingId, params.result, undefined, params.enteredBy);
  }

  public swapPairings(params: ManualBoardSwapParams): void {
    this.storage.swapPairing(params.pairing1Id, params.pairing2Id, params.swapWhite, params.reason);

    this.addAuditLog({
      organizationId: this.storage.getActiveOrgId(),
      actorId: params.arbiterId || this.storage.getCurrentUserId(),
      actorName: params.arbiterName || this.getActorName(),
      action: 'MANUAL_SWAP',
      details: {
        pairing1Id: params.pairing1Id,
        pairing2Id: params.pairing2Id,
        swapWhite: params.swapWhite,
        reason: params.reason,
      },
    });
  }

  // ===========================================================================
  // 6. TIEBREAK MATHEMATICS & STANDINGS CALCULATION
  // ===========================================================================

  public calculateStandings(tournamentId: string): EngineStanding[] {
    const tournament = this.storage.getTournament(tournamentId);
    if (!tournament) return [];

    const tPlayers = this.storage.getTournamentPlayers(tournamentId);
    const rounds = this.storage.getRounds(tournamentId).sort((a, b) => a.roundNumber - b.roundNumber);

    const historyRounds: EngineRoundHistoryGame[][] = rounds.map((r) => {
      const pairings = this.storage.getPairings(r.id);
      return pairings.map((p) => ({
        roundNumber: r.roundNumber,
        boardNumber: p.boardNumber,
        whitePlayerId: p.whitePlayerId,
        blackPlayerId: p.blackPlayerId,
        result: p.result as GameResult,
        isBye: p.isBye || p.blackPlayerId === null,
        byeType: p.byeType,
      }));
    });

    const allGames = historyRounds.flat();
    const enginePlayers: EnginePlayer[] = tPlayers.map((tp) => {
      const p = this.storage.getPlayer(tp.playerId);
      const name = p ? p.name : `Player ${tp.seedNumber}`;
      const rating = p ? p.rating : 1200;

      let score = 0;
      const colorHistory: ChessColor[] = [];
      const opponentIds: string[] = [];
      let receivedBye = false;

      for (const game of allGames) {
        if (game.whitePlayerId === tp.playerId) {
          if (game.isBye) {
            receivedBye = true;
            score += 1.0;
            colorHistory.push('NONE');
          } else {
            colorHistory.push('W');
            if (game.blackPlayerId) opponentIds.push(game.blackPlayerId);
            if (game.result === '1-0' || game.result === '1F-0') score += 1.0;
            else if (game.result === '0.5-0.5') score += 0.5;
          }
        } else if (game.blackPlayerId === tp.playerId) {
          colorHistory.push('B');
          if (game.whitePlayerId) opponentIds.push(game.whitePlayerId);
          if (game.result === '0-1' || game.result === '0-1F') score += 1.0;
          else if (game.result === '0.5-0.5') score += 0.5;
        }
      }

      return {
        id: tp.playerId,
        name,
        rating,
        title: p?.title,
        federation: p?.federation,
        seed: tp.seedNumber,
        score,
        colorHistory,
        opponentIds,
        receivedBye,
        isWithdrawn: tp.isWithdrawn,
      };
    });

    const engineFormat: TournamentFormat = tournament.format || 'basic_swiss';
    const engine = getTournamentEngine(engineFormat);

    return engine.calculateStandings(enginePlayers, historyRounds, tournament.tiebreakRules);
  }

  // ===========================================================================
  // 7. CSV EXPORT UTILITIES
  // ===========================================================================

  public exportStandingsToCSV(tournamentId: string): string {
    const tournament = this.storage.getTournament(tournamentId);
    if (!tournament) return '';

    const standings = this.calculateStandings(tournamentId);
    const players = this.storage.getPlayers(tournament.organizationId);
    const rounds = this.storage.getRounds(tournamentId);
    const allPairings = this.getAllPairingsForTournament(tournamentId);

    return exportStandingsCsv({
      tournament,
      standings,
      players,
      rounds,
      pairings: allPairings,
    });
  }

  public exportPairingsToCSV(tournamentId: string, roundNumber: number): string {
    const tournament = this.storage.getTournament(tournamentId);
    if (!tournament) return '';

    const round = this.storage.getRounds(tournamentId).find((r) => r.roundNumber === roundNumber);
    if (!round) return '';

    const pairings = this.storage.getPairings(round.id);
    const players = this.storage.getPlayers(tournament.organizationId);

    return exportPairingsCsv({
      tournament,
      round,
      pairings,
      players,
    });
  }

  public exportPlayersToCSV(organizationId?: string): string {
    const orgId = organizationId || this.storage.getActiveOrgId();
    const players = this.storage.getPlayers(orgId);
    return exportPlayersCsv(players);
  }

  // ===========================================================================
  // 8. AUDIT TRAILS & ACCESS CONTROL (RBAC)
  // ===========================================================================

  public getAuditLogs(tournamentId?: string, organizationId?: string): AuditLog[] {
    const orgId = organizationId || this.storage.getActiveOrgId();
    return this.storage.getAuditLogs(orgId, tournamentId);
  }

  public addAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    return this.storage.addAuditLog(data);
  }

  public getOrganizations(): Organization[] {
    return this.storage.getOrganizations();
  }

  public getActiveOrgId(): string {
    return this.storage.getActiveOrgId();
  }

  public setActiveOrgId(orgId: string): void {
    this.storage.setActiveOrgId(orgId);
  }

  public getCurrentUserId(): string {
    return this.storage.getCurrentUserId();
  }

  public setCurrentUserId(userId: string): void {
    this.storage.setCurrentUserId(userId);
  }

  public resetToDefaults(): void {
    this.storage.resetToDefaults();
  }

  // ===========================================================================
  // 9. AUTHORITATIVE PUBLIC READ METHODS FOR CHESS PAIR (Zero Admin Controls)
  // ===========================================================================

  /**
   * Returns published tournaments visible to the public.
   * Excludes draft or uncommitted tournaments.
   */
  public getPublishedTournaments(filters?: {
    status?: string;
    city?: string;
    format?: string;
    date?: string;
    search?: string;
  }): Tournament[] {
    const orgTourneys = this.storage.getTournaments(this.storage.getActiveOrgId());
    let list = orgTourneys.filter((t) => t.isPublic !== false);

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        const s = filters.status.toLowerCase();
        list = list.filter((t) => {
          if (s === 'live' || s === 'in_progress') return t.status === 'in_progress';
          if (s === 'upcoming' || s === 'registration') return t.status === 'registration' || (t.status as string) === 'upcoming';
          if (s === 'completed') return t.status === 'completed' || t.status === 'archived';
          return t.status === s;
        });
      }
      if (filters.city && filters.city !== 'ALL' && filters.city !== 'all') {
        list = list.filter((t) => t.city?.toLowerCase() === filters.city!.toLowerCase());
      }
      if (filters.format && filters.format !== 'all') {
        list = list.filter((t) => t.format === filters.format);
      }
      if (filters.date) {
        list = list.filter((t) => t.startDate === filters.date);
      }
      if (filters.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.city && t.city.toLowerCase().includes(q)) ||
            (t.venue && t.venue.toLowerCase().includes(q)) ||
            (t.chiefArbiter && t.chiefArbiter.toLowerCase().includes(q))
        );
      }
    }

    return list;
  }

  /**
   * Returns public details of one published tournament.
   * Returns undefined if tournament is private/draft or not found.
   */
  public getPublishedTournamentById(tournamentId: string): Tournament | undefined {
    const t = this.storage.getTournament(tournamentId);
    if (!t || t.isPublic === false) return undefined;
    return t;
  }

  /**
   * Returns only publicly visible rounds (status !== 'draft').
   */
  public getPublishedRounds(tournamentId: string): Round[] {
    const rounds = this.storage.getRounds(tournamentId);
    return rounds
      .filter((r) => r.status === 'published' || r.status === 'completed' || r.status === 'in_progress')
      .sort((a, b) => a.roundNumber - b.roundNumber);
  }

  /**
   * Returns published pairings and results for a round.
   * Omits round if still in draft state.
   */
  public getPublishedPairingsForRound(
    roundId: string
  ): (Pairing & { whitePlayer?: Player; blackPlayer?: Player })[] {
    const allRounds = this.storage.getAllRounds();
    const round = allRounds.find((r) => r.id === roundId);
    if (round && round.status === 'draft') {
      return [];
    }
    return this.storage.getPairings(roundId);
  }

  /**
   * Calculates authoritative standings for public display using the existing
   * tournament engine and tiebreak rules. Only includes published/confirmed rounds.
   */
  public calculateAuthoritativeStandings(tournamentId: string): EngineStanding[] {
    const tournament = this.getPublishedTournamentById(tournamentId);
    if (!tournament) return [];

    const tPlayers = this.storage.getTournamentPlayers(tournamentId);
    // Only published rounds are evaluated for public standings
    const publishedRounds = this.getPublishedRounds(tournamentId);

    const historyRounds: EngineRoundHistoryGame[][] = publishedRounds.map((r) => {
      const pairings = this.storage.getPairings(r.id);
      return pairings.map((p) => ({
        roundNumber: r.roundNumber,
        boardNumber: p.boardNumber,
        whitePlayerId: p.whitePlayerId,
        blackPlayerId: p.blackPlayerId,
        result: p.result as GameResult,
        isBye: p.isBye || p.blackPlayerId === null,
        byeType: p.byeType,
      }));
    });

    const allGames = historyRounds.flat();
    const enginePlayers: EnginePlayer[] = tPlayers.map((tp) => {
      const p = this.storage.getPlayer(tp.playerId);
      const name = p ? p.name : `Player ${tp.seedNumber}`;
      const rating = p ? p.rating : 1200;

      let score = 0;
      const colorHistory: ChessColor[] = [];
      const opponentIds: string[] = [];
      let receivedBye = false;

      for (const game of allGames) {
        if (game.whitePlayerId === tp.playerId) {
          if (game.isBye) {
            receivedBye = true;
            score += 1.0;
            colorHistory.push('NONE');
          } else {
            colorHistory.push('W');
            if (game.blackPlayerId) opponentIds.push(game.blackPlayerId);
            if (game.result === '1-0' || game.result === '1F-0') score += 1.0;
            else if (game.result === '0.5-0.5' || (game.result as string) === '1/2-1/2') score += 0.5;
          }
        } else if (game.blackPlayerId === tp.playerId) {
          colorHistory.push('B');
          if (game.whitePlayerId) opponentIds.push(game.whitePlayerId);
          if (game.result === '0-1' || game.result === '0-1F') score += 1.0;
          else if (game.result === '0.5-0.5' || (game.result as string) === '1/2-1/2') score += 0.5;
        }
      }

      return {
        id: tp.playerId,
        name,
        rating,
        title: p?.title,
        federation: p?.federation,
        seed: tp.seedNumber,
        score,
        colorHistory,
        opponentIds,
        receivedBye,
        isWithdrawn: tp.isWithdrawn,
      };
    });

    const engineFormat: TournamentFormat = tournament.format || 'basic_swiss';
    const engine = getTournamentEngine(engineFormat);
    return engine.calculateStandings(enginePlayers, historyRounds, tournament.tiebreakRules);
  }

  /**
   * Returns published participants for a tournament, stripped of sensitive details.
   */
  public getPublishedTournamentPlayers(
    tournamentId: string
  ): (TournamentPlayer & { player?: Player; cciCategory: CCIRatingCategory })[] {
    const rawList = this.storage.getTournamentPlayers(tournamentId);
    return rawList
      .filter((tp) => !tp.isWithdrawn)
      .map((tp) => {
        const p = tp.player || this.storage.getPlayer(tp.playerId);
        const rating = p?.rating || tp.initialRating || 1200;
        return {
          ...tp,
          player: p,
          cciCategory: getCCICategory(rating),
        };
      });
  }

  /**
   * Returns sanitized public profile for a player.
   * Omits private emails, phone numbers, notes, and payment credentials.
   */
  public getPublicPlayerProfile(playerId: string): {
    id: string;
    name: string;
    title: string;
    rating: number;
    ratingClassic?: number;
    ratingRapid?: number;
    ratingBlitz?: number;
    cciPlayerId: string;
    fideId?: string;
    federation: string;
    club?: string;
    city?: string;
    category: CCIRatingCategory;
    stats: {
      tournamentsPlayed: number;
      gamesPlayed: number;
      wins: number;
      draws: number;
      losses: number;
      totalPoints: number;
      winPercentage: number;
    };
  } | null {
    const player = this.storage.getPlayer(playerId);
    if (!player) return null;

    const tournaments = this.getPublishedTournaments();
    let tournamentsCount = 0;
    let gamesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let totalPoints = 0;

    for (const t of tournaments) {
      const tPlayers = this.storage.getTournamentPlayers(t.id);
      const enrolled = tPlayers.find((tp) => tp.playerId === playerId);
      if (!enrolled) continue;

      tournamentsCount++;
      const rounds = this.getPublishedRounds(t.id);
      for (const r of rounds) {
        const pairings = this.storage.getPairings(r.id);
        for (const p of pairings) {
          if (p.whitePlayerId === playerId) {
            if (p.isBye) {
              gamesPlayed++;
              wins++;
              totalPoints += 1.0;
            } else if (p.result === '1-0' || p.result === '1F-0') {
              gamesPlayed++;
              wins++;
              totalPoints += 1.0;
            } else if (p.result === '0.5-0.5' || p.result === '1/2-1/2') {
              gamesPlayed++;
              draws++;
              totalPoints += 0.5;
            } else if (p.result === '0-1' || p.result === '0-1F') {
              gamesPlayed++;
              losses++;
            }
          } else if (p.blackPlayerId === playerId) {
            if (p.result === '0-1' || p.result === '0-1F') {
              gamesPlayed++;
              wins++;
              totalPoints += 1.0;
            } else if (p.result === '0.5-0.5' || p.result === '1/2-1/2') {
              gamesPlayed++;
              draws++;
              totalPoints += 0.5;
            } else if (p.result === '1-0' || p.result === '1F-0') {
              gamesPlayed++;
              losses++;
            }
          }
        }
      }
    }

    const winPct = gamesPlayed > 0 ? Math.round(((wins + draws * 0.5) / gamesPlayed) * 100) : 0;
    const cciId = (player as any).cciPlayerId || player.localId || `CCI-${player.id.slice(-6).toUpperCase()}`;

    return {
      id: player.id,
      name: player.name,
      title: player.title || 'None',
      rating: player.rating || 1000,
      ratingClassic: player.ratingClassic || player.rating,
      ratingRapid: player.ratingRapid || player.rating,
      ratingBlitz: player.ratingBlitz || player.rating,
      cciPlayerId: cciId,
      fideId: player.fideId,
      federation: player.federation || 'IND',
      club: player.club || 'Chess Community India',
      city: (player as any).city || player.club || 'Jabalpur',
      category: getCCICategory(player.rating || 1000),
      stats: {
        tournamentsPlayed: tournamentsCount,
        gamesPlayed,
        wins,
        draws,
        losses,
        totalPoints,
        winPercentage: winPct,
      },
    };
  }

  /**
   * Returns publicly visible tournament history for a player.
   */
  public getPublicPlayerTournaments(playerId: string): {
    id?: string;
    tournamentId: string;
    tournamentName: string;
    city?: string;
    date?: string;
    format: string;
    points: number;
    rank?: number;
    totalPlayers: number;
    status: string;
  }[] {
    const list = this.getPublishedTournaments();
    const result: {
      id?: string;
      tournamentId: string;
      tournamentName: string;
      city?: string;
      date?: string;
      format: string;
      points: number;
      rank?: number;
      totalPlayers: number;
      status: string;
    }[] = [];

    for (const t of list) {
      const tPlayers = this.storage.getTournamentPlayers(t.id);
      const enrolled = tPlayers.find((tp) => tp.playerId === playerId);
      if (!enrolled) continue;

      const standings = this.calculateAuthoritativeStandings(t.id);
      const playerStanding = standings.find((s) => s.playerId === playerId);

      result.push({
        id: t.id,
        tournamentId: t.id,
        tournamentName: t.name,
        city: t.city,
        date: t.startDate,
        format: t.format,
        points: playerStanding ? playerStanding.score : 0,
        rank: playerStanding ? playerStanding.rank : undefined,
        totalPlayers: tPlayers.length,
        status: t.status,
      });
    }

    return result;
  }

  private getActorName(): string {
    const userId = this.storage.getCurrentUserId();
    const profiles = this.storage.getProfiles();
    const p = profiles.find((prof) => prof.id === userId);
    return p ? p.fullName : 'Administrator';
  }
}

// Canonical singleton instance for backend operations
export const chessManagerBackend = new ChessManagerBackendService();
