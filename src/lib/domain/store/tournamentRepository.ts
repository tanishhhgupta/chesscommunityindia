import { 
  Player, 
  Tournament, 
  TournamentRegistration, 
  Round, 
  PairingVersion, 
  Pairing, 
  RatingHistoryRecord, 
  AuditLog, 
  UserSession, 
  MatchResult, 
  HistoricalCorrectionImpact,
  StandingsRow,
  RatingType
} from '../types';
import { CategoryService } from '../services/CategoryService';
import { RatingService } from '../services/RatingService';
import { StandingsService } from '../services/StandingsService';
import { PairingService } from '../services/PairingService';
import { DependencyService } from '../services/DependencyService';
import { SEED_PLAYERS, SEED_TOURNAMENTS, createSeedDatabase } from './seedData';

const STORAGE_KEY = 'cci_ecosystem_db_v5';

export interface DatabaseSchema {
  players: Player[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  rounds: Round[];
  pairingVersions: PairingVersion[];
  pairings: Pairing[];
  ratingHistories: RatingHistoryRecord[];
  auditLogs: AuditLog[];
  currentUserSession: UserSession;
  activeTournamentId: string;
}

class TournamentRepository {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
            const hasMockGms = parsed.players.some((p: any) => p.email && p.email.includes('@cci.chess'));
            if (!hasMockGms) {
              return parsed;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load database from localStorage, initializing seed database.', err);
      }
    }
    const seed = createSeedDatabase();
    this.saveToStorage(seed);
    return seed;
  }

  private saveToStorage(data: DatabaseSchema): void {
    this.db = data;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('cci-domain-db-synced', { detail: { timestamp: Date.now() } }));
      } catch (err) {
        console.error('Failed to write to localStorage', err);
      }
    }
  }

  public notifyListeners(): void {
    this.saveToStorage(this.db);
  }

  public resetToSeed(): void {
    const seed = createSeedDatabase();
    this.saveToStorage(seed);
  }

  // ==========================================================================
  // SESSION & RBAC
  // ==========================================================================
  public getCurrentUserSession(): UserSession {
    return this.db.currentUserSession;
  }

  public setCurrentUserSession(session: UserSession): void {
    this.db.currentUserSession = session;
    this.saveToStorage(this.db);
  }

  // ==========================================================================
  // PLAYERS REPOSITORY
  // ==========================================================================
  public getAllPlayers(): Player[] {
    return [...this.db.players];
  }

  public getPlayerById(id: string): Player | null {
    return this.db.players.find((p) => p.id === id) || null;
  }

  public getPlayerByCciId(cciPlayerId: string): Player | null {
    return this.db.players.find((p) => p.cciPlayerId.toLowerCase() === cciPlayerId.toLowerCase()) || null;
  }

  public searchPlayers(query: string): Player[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllPlayers();
    return this.db.players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.cciPlayerId.toLowerCase().includes(q) ||
        (p.fideId && p.fideId.includes(q)) ||
        p.city.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.chessComId && p.chessComId.toLowerCase().includes(q))
    );
  }

  public createPlayer(input: Partial<Player>): Player {
    // Check duplicates by email, FIDE ID, or name
    if (input.email) {
      const existing = this.db.players.find((p) => p.email.toLowerCase() === input.email!.toLowerCase());
      if (existing) throw new Error(`A player with email ${input.email} already exists (${existing.name} - ${existing.cciPlayerId}).`);
    }
    if (input.fideId) {
      const existingFide = this.db.players.find((p) => p.fideId === input.fideId);
      if (existingFide) throw new Error(`A player with FIDE ID ${input.fideId} already exists (${existingFide.name}).`);
    }

    const nextNumber = this.db.players.length + 1;
    const cciPlayerId = input.cciPlayerId || `CCI-${String(nextNumber).padStart(6, '0')}`;
    const id = input.id || `player-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const initialRating = input.cciStandardRating ?? 1000;
    const category = CategoryService.getCategoryForRating(initialRating);

    const newPlayer: Player = {
      id,
      cciPlayerId,
      name: input.name || 'New Player',
      photo: input.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      email: input.email || '',
      phone: input.phone || '',
      dateOfBirth: input.dateOfBirth,
      gender: input.gender || 'M',
      city: input.city || 'Jabalpur',
      state: input.state || 'Madhya Pradesh',
      country: input.country || 'India',
      fideId: input.fideId,
      fideStandardRating: input.fideStandardRating || initialRating,
      fideRapidRating: input.fideRapidRating || initialRating,
      fideBlitzRating: input.fideBlitzRating || initialRating,
      cciStandardRating: initialRating,
      cciRapidRating: input.cciRapidRating || initialRating,
      cciBlitzRating: input.cciBlitzRating || initialRating,
      currentCategory: category,
      chessComId: input.chessComId,
      chessTitle: input.chessTitle,
      club: input.club || 'Chess Community India',
      status: 'ACTIVE',
      stats: {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalPoints: 0,
        winPercentage: 0,
        tournamentAppearances: 0,
        highestCciRating: initialRating,
        currentCciRating: initialRating,
        ratingChangeLast30Days: 0,
        averageOpponentRating: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.players.unshift(newPlayer);
    this.addAuditLog('Create Player', `Created competitor ${newPlayer.name} with permanent ID ${cciPlayerId} (${initialRating} Elo - ${category.name})`);
    this.saveToStorage(this.db);
    return newPlayer;
  }

  public updatePlayer(id: string, updates: Partial<Player>): Player {
    const idx = this.db.players.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Player ${id} not found.`);

    const current = this.db.players[idx];
    const newRating = updates.cciStandardRating ?? current.cciStandardRating;
    const currentCategory = CategoryService.getCategoryForRating(newRating);

    const updated: Player = {
      ...current,
      ...updates,
      currentCategory,
      updatedAt: new Date().toISOString(),
    };

    this.db.players[idx] = updated;
    this.addAuditLog('Update Player', `Updated player details for ${updated.name} (${updated.cciPlayerId})`);
    this.saveToStorage(this.db);
    return updated;
  }

  // ==========================================================================
  // TOURNAMENT REPOSITORY
  // ==========================================================================
  public getAllTournaments(): Tournament[] {
    return [...this.db.tournaments];
  }

  public getTournamentById(id: string): Tournament | null {
    return this.db.tournaments.find((t) => t.id === id) || null;
  }

  public getActiveTournament(): Tournament {
    const found = this.db.tournaments.find((t) => t.id === this.db.activeTournamentId);
    if (found) return found;
    if (this.db.tournaments.length > 0) return this.db.tournaments[0];
    return this.createTournament({
      id: `tourney-open-${Date.now()}`,
      name: 'CCI Open Championship 2026',
      city: 'Jabalpur',
    });
  }

  public setActiveTournament(id: string): void {
    this.db.activeTournamentId = id;
    this.saveToStorage(this.db);
  }

  public createTournament(input: Partial<Tournament>): Tournament {
    const id = input.id || `tourney-${Date.now()}`;
    const newTourney: Tournament = {
      id,
      name: input.name || 'New CCI Tournament',
      description: input.description || 'Official Chess Community India Tournament',
      organizer: input.organizer || 'Chess Community India',
      chiefArbiter: input.chiefArbiter || 'International Arbiter Panel',
      venue: input.venue || 'Central Chess Arena',
      address: input.address || 'Civil Lines',
      city: input.city || 'Jabalpur',
      state: input.state || 'Madhya Pradesh',
      country: input.country || 'India',
      startDate: input.startDate || new Date().toISOString().split('T')[0],
      endDate: input.endDate || new Date().toISOString().split('T')[0],
      format: input.format || 'SWISS',
      rounds: input.rounds || 5,
      baseTime: input.baseTime || 15,
      increment: input.increment || 10,
      fideRated: input.fideRated ?? true,
      cciRated: true,
      ratingType: input.ratingType || 'RAPID',
      registrationDeadline: input.registrationDeadline || new Date().toISOString().split('T')[0],
      maxPlayers: input.maxPlayers || 100,
      entryFee: input.entryFee || '₹500',
      prizePool: input.prizePool || '₹25,000',
      status: 'UPCOMING',
      currentRoundNumber: 1,
      tieBreakOrder: ['POINTS', 'BUCHHOLZ_CUT1', 'BUCHHOLZ', 'SONNEBORN_BERGER', 'WINS'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pre-create Round 1 in DRAFT state
    const round1Id = `round-${id}-1`;
    const round1: Round = {
      id: round1Id,
      tournamentId: id,
      number: 1,
      status: 'DRAFT',
      activePairingVersionId: '',
    };

    this.db.tournaments.unshift(newTourney);
    this.db.rounds.push(round1);
    this.db.activeTournamentId = id;

    this.addAuditLog('Create Tournament', `Created tournament: ${newTourney.name} (${newTourney.format}, ${newTourney.rounds} Rounds, ${newTourney.baseTime}+${newTourney.increment})`, id);
    this.saveToStorage(this.db);
    return newTourney;
  }

  public updateTournament(id: string, updates: Partial<Tournament>): Tournament {
    const idx = this.db.tournaments.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Tournament ${id} not found.`);
    const current = this.db.tournaments[idx];
    const updated: Tournament = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.db.tournaments[idx] = updated;
    this.addAuditLog('Update Tournament', `Updated tournament details for ${updated.name}`, id);
    this.saveToStorage(this.db);
    return updated;
  }

  public deleteTournament(id: string): void {
    const tourney = this.getTournamentById(id);
    const tourneyName = tourney?.name || id;
    const tourneyRoundIds = new Set(this.db.rounds.filter((r) => r.tournamentId === id).map((r) => r.id));
    this.db.tournaments = this.db.tournaments.filter((t) => t.id !== id);
    this.db.registrations = this.db.registrations.filter((r) => r.tournamentId !== id);
    this.db.rounds = this.db.rounds.filter((r) => r.tournamentId !== id);
    this.db.pairings = this.db.pairings.filter((p) => !tourneyRoundIds.has(p.roundId));
    if (this.db.activeTournamentId === id) {
      this.db.activeTournamentId = this.db.tournaments[0]?.id || '';
    }
    this.addAuditLog('Delete Tournament', `Deleted tournament: ${tourneyName} (${id})`, id);
    this.saveToStorage(this.db);
  }

  // ==========================================================================
  // REGISTRATIONS & STARTING LIST
  // ==========================================================================
  public getTournamentRegistrations(tournamentId: string): TournamentRegistration[] {
    return this.db.registrations.filter((r) => r.tournamentId === tournamentId);
  }

  public getTournamentPlayers(tournamentId: string): Player[] {
    const regs = this.getTournamentRegistrations(tournamentId);
    const regPlayerIds = new Set(regs.map((r) => r.playerId));
    return this.db.players.filter((p) => regPlayerIds.has(p.id));
  }

  public getStartingList(tournamentId: string) {
    const tourney = this.getTournamentById(tournamentId);
    const regs = this.getTournamentRegistrations(tournamentId);
    return regs
      .map((reg) => {
        const player = this.getPlayerById(reg.playerId);
        if (!player) return null;
        const rating = tourney ? RatingService.getPlayerRatingByPool(player, tourney.ratingType) : player.cciStandardRating;
        return {
          startingNo: reg.seedNumber,
          player,
          fideRating: tourney?.ratingType === 'BLITZ' ? player.fideBlitzRating : tourney?.ratingType === 'RAPID' ? player.fideRapidRating : player.fideStandardRating,
          cciRating: rating,
          category: player.currentCategory,
          status: reg.status,
          attendance: reg.attendance,
          isConfirmed: reg.isConfirmed,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.cciRating || 0) - (a!.cciRating || 0));
  }

  public registerPlayerForTournament(tournamentId: string, playerId: string): TournamentRegistration {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) throw new Error(`Tournament ${tournamentId} not found.`);

    const player = this.getPlayerById(playerId);
    if (!player) throw new Error(`Player ${playerId} not found.`);

    const existing = this.db.registrations.find(
      (r) => r.tournamentId === tournamentId && r.playerId === playerId
    );
    if (existing) return existing;

    const initialRating = RatingService.getPlayerRatingByPool(player, tourney.ratingType);
    const seedNumber = this.db.registrations.filter((r) => r.tournamentId === tournamentId).length + 1;

    const newReg: TournamentRegistration = {
      tournamentId,
      playerId,
      seedNumber,
      initialRating,
      currentScore: 0,
      status: 'ACTIVE',
      isConfirmed: true,
      attendance: 'PRESENT',
      registeredAt: new Date().toISOString(),
    };

    this.db.registrations.push(newReg);
    this.addAuditLog('Register Competitor', `Registered ${player.name} (${player.cciPlayerId}) in ${tourney.name}`, tournamentId);
    this.saveToStorage(this.db);
    return newReg;
  }

  public updateAttendance(tournamentId: string, playerId: string, attendance: 'PRESENT' | 'ABSENT' | 'WITHDRAWN'): void {
    const reg = this.db.registrations.find((r) => r.tournamentId === tournamentId && r.playerId === playerId);
    if (reg) {
      reg.attendance = attendance;
      this.addAuditLog('Attendance Update', `Marked ${playerId} as ${attendance}`, tournamentId);
      this.saveToStorage(this.db);
    }
  }

  public updateConfirmation(tournamentId: string, playerId: string, isConfirmed: boolean): void {
    const reg = this.db.registrations.find((r) => r.tournamentId === tournamentId && r.playerId === playerId);
    if (reg) {
      reg.isConfirmed = isConfirmed;
      this.addAuditLog('Confirmation Update', `Set confirmation for ${playerId} to ${isConfirmed ? 'CONFIRMED' : 'PENDING'}`, tournamentId);
      this.saveToStorage(this.db);
    }
  }

  public unregisterPlayerFromTournament(tournamentId: string, playerId: string): void {
    const reg = this.db.registrations.find((r) => r.tournamentId === tournamentId && r.playerId === playerId);
    if (reg) {
      this.db.registrations = this.db.registrations.filter((r) => !(r.tournamentId === tournamentId && r.playerId === playerId));
      this.addAuditLog('Unregister Competitor', `Unregistered player ${playerId} from tournament ${tournamentId}`, tournamentId);
      this.saveToStorage(this.db);
    }
  }

  public deletePlayer(playerId: string): void {
    this.db.players = this.db.players.filter((p) => p.id !== playerId);
    this.db.registrations = this.db.registrations.filter((r) => r.playerId !== playerId);
    this.addAuditLog('Delete Player', `Deleted player ${playerId} from database`);
    this.saveToStorage(this.db);
  }

  // ==========================================================================
  // ROUNDS & PAIRINGS
  // ==========================================================================
  public getTournamentRounds(tournamentId: string): Round[] {
    return this.db.rounds
      .filter((r) => r.tournamentId === tournamentId)
      .sort((a, b) => a.number - b.number);
  }

  public getActivePairingsForRound(roundId: string): Pairing[] {
    const round = this.db.rounds.find((r) => r.id === roundId);
    if (!round || !round.activePairingVersionId) return [];
    return this.db.pairings.filter(
      (p) => p.roundId === roundId && p.pairingVersionId === round.activePairingVersionId
    );
  }

  public getAllPairingVersions(roundId: string): PairingVersion[] {
    return this.db.pairingVersions
      .filter((v) => v.roundId === roundId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  /**
   * Generate Pairings for Round
   */
  public generateRoundPairings(tournamentId: string, roundNumber: number): {
    round: Round;
    version: PairingVersion;
    pairings: Pairing[];
  } {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) throw new Error('Tournament not found');

    let round = this.db.rounds.find((r) => r.tournamentId === tournamentId && r.number === roundNumber);
    if (!round) {
      round = {
        id: `round-${tournamentId}-${roundNumber}`,
        tournamentId,
        number: roundNumber,
        status: 'DRAFT',
        activePairingVersionId: '',
      };
      this.db.rounds.push(round);
    }

    const players = this.getTournamentPlayers(tournamentId);
    const registrations = this.getTournamentRegistrations(tournamentId);

    // Get all previous completed pairings from earlier rounds
    const previousRoundIds = new Set(
      this.db.rounds.filter((r) => r.tournamentId === tournamentId && r.number < roundNumber).map((r) => r.id)
    );
    const previousPairings = this.db.pairings.filter((p) => previousRoundIds.has(p.roundId));

    // Archive any existing active pairing version for this round
    const existingVersions = this.db.pairingVersions.filter((v) => v.roundId === round!.id);
    const nextVersionNumber = existingVersions.length + 1;
    existingVersions.forEach((v) => {
      v.status = 'ARCHIVED';
    });

    const { version, pairings } = PairingService.generateSwissRoundPairings(
      round,
      players,
      registrations,
      previousPairings,
      this.db.currentUserSession.name,
      `Generated Version ${nextVersionNumber}`
    );

    version.versionNumber = nextVersionNumber;
    round.activePairingVersionId = version.id;
    round.status = 'PAIRINGS_GENERATED';
    tourney.status = 'LIVE';
    tourney.currentRoundNumber = Math.max(tourney.currentRoundNumber, roundNumber);

    this.db.pairingVersions.push(version);
    this.db.pairings.push(...pairings);

    this.addAuditLog('Generate Pairings', `Generated Round ${roundNumber} pairings (Version ${nextVersionNumber}, ${pairings.length} boards)`, tournamentId, roundNumber);
    this.saveToStorage(this.db);

    return { round, version, pairings };
  }

  // ==========================================================================
  // RESULT ENTRY & HISTORICAL CORRECTION WITH DEPENDENCY ANALYSIS
  // ==========================================================================
  public recordResult(
    tournamentId: string,
    pairingId: string,
    result: MatchResult
  ): {
    pairing: Pairing;
    isHistoricalCorrection: boolean;
    impact?: HistoricalCorrectionImpact;
  } {
    const pairing = this.db.pairings.find((p) => p.id === pairingId);
    if (!pairing) throw new Error(`Pairing ${pairingId} not found.`);

    const round = this.db.rounds.find((r) => r.id === pairing.roundId);
    if (!round) throw new Error('Round not found for pairing.');

    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) throw new Error('Tournament not found.');

    const previousResult = pairing.result;
    pairing.result = result;
    pairing.status = result === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED';
    pairing.recordedBy = this.db.currentUserSession.name;
    pairing.recordedAt = new Date().toISOString();

    // Calculate real-time FIDE/CCI delta for this board
    const whitePlayer = this.getPlayerById(pairing.whitePlayerId);
    const blackPlayer = pairing.blackPlayerId ? this.getPlayerById(pairing.blackPlayerId) : null;

    if (whitePlayer && blackPlayer && result !== 'PENDING' && result !== 'BYE') {
      const wRating = RatingService.getPlayerRatingByPool(whitePlayer, tourney.ratingType);
      const bRating = RatingService.getPlayerRatingByPool(blackPlayer, tourney.ratingType);
      const deltas = RatingService.calculateMatchDeltas(wRating, bRating, result);
      pairing.whiteDelta = deltas.whiteDelta;
      pairing.blackDelta = deltas.blackDelta;
    }

    // Check if this round has any future rounds already paired or in progress
    const allRounds = this.getTournamentRounds(tournamentId);
    const maxRoundNumber = Math.max(...allRounds.map((r) => r.number));
    const isHistorical = round.number < maxRoundNumber;

    let impact: HistoricalCorrectionImpact | undefined;

    if (isHistorical && previousResult !== 'PENDING' && previousResult !== result) {
      impact = DependencyService.analyzeHistoricalResultImpact(
        tournamentId,
        allRounds,
        this.db.pairings,
        this.db.players,
        pairing,
        previousResult,
        result
      );

      this.addAuditLog(
        'Historical Result Correction',
        `Corrected Round ${round.number} Board ${pairing.boardNumber} from "${previousResult}" to "${result}". Downstream rounds affected: [${impact.affectedRounds.join(', ')}]`,
        tournamentId,
        round.number
      );
    } else {
      this.addAuditLog(
        'Result Entry',
        `Entered Board ${pairing.boardNumber} result: ${result}`,
        tournamentId,
        round.number
      );
    }

    this.saveToStorage(this.db);
    return { pairing, isHistoricalCorrection: isHistorical, impact };
  }

  public recordResultByRoundAndBoard(
    tournamentId: string,
    roundNumber: number,
    boardNumber: number,
    result: MatchResult
  ) {
    const rounds = this.db.rounds.filter((r) => r.tournamentId === tournamentId && r.number === roundNumber);
    if (rounds.length === 0) throw new Error(`Round ${roundNumber} not found for tournament ${tournamentId}`);
    const roundIds = new Set(rounds.map((r) => r.id));
    
    // Find pairing by roundId and boardNumber
    let pairing = this.db.pairings.find((p) => roundIds.has(p.roundId) && p.boardNumber === boardNumber);
    if (!pairing) {
      pairing = this.db.pairings.find((p) => roundIds.has(p.roundId));
    }
    if (!pairing) throw new Error(`Pairing not found for round ${roundNumber} board ${boardNumber}`);
    
    return this.recordResult(tournamentId, pairing.id, result);
  }

  /**
   * REGENERATE FROM ROUND (Mandatory test scenario workflow)
   * When an earlier round result is changed, administrator can safely archive
   * downstream pairing versions and generate fresh pairings from Round R.
   */
  public regenerateFromRound(tournamentId: string, fromRoundNumber: number): {
    regeneratedRounds: number[];
  } {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) throw new Error('Tournament not found');

    const roundsToRegenerate = this.db.rounds
      .filter((r) => r.tournamentId === tournamentId && r.number >= fromRoundNumber)
      .sort((a, b) => a.number - b.number);

    if (roundsToRegenerate.length === 0) return { regeneratedRounds: [] };

    const regeneratedRoundNumbers: number[] = [];

    // 1. Archive pairing versions for all subsequent rounds
    roundsToRegenerate.forEach((r) => {
      regeneratedRoundNumbers.push(r.number);
      const versions = this.db.pairingVersions.filter((v) => v.roundId === r.id);
      versions.forEach((v) => {
        v.status = 'ARCHIVED';
        v.reason = `Archived due to historical result regeneration from Round ${fromRoundNumber}`;
      });
      r.status = 'DRAFT';
      r.activePairingVersionId = '';
    });

    // 2. Generate new fresh pairings for the starting regeneration round
    this.generateRoundPairings(tournamentId, fromRoundNumber);

    this.addAuditLog(
      'Pairing Regeneration',
      `Regenerated tournament pairings starting from Round ${fromRoundNumber}. Archived historical pairing versions for rounds [${regeneratedRoundNumbers.join(', ')}]`,
      tournamentId,
      fromRoundNumber
    );

    this.saveToStorage(this.db);
    return { regeneratedRounds: regeneratedRoundNumbers };
  }

  // ==========================================================================
  // STANDINGS
  // ==========================================================================
  public getStandings(tournamentId: string): StandingsRow[] {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) return [];

    const players = this.getTournamentPlayers(tournamentId);
    const registrations = this.getTournamentRegistrations(tournamentId);

    // Collect all active pairings for rounds in this tournament
    const roundIds = new Set(this.db.rounds.filter((r) => r.tournamentId === tournamentId).map((r) => r.id));
    const activeVersions = new Set(this.db.rounds.filter((r) => r.tournamentId === tournamentId).map((r) => r.activePairingVersionId));

    const activePairings = this.db.pairings.filter(
      (p) => roundIds.has(p.roundId) && activeVersions.has(p.pairingVersionId)
    );

    return StandingsService.calculateStandings(
      players,
      registrations,
      activePairings,
      tourney.tieBreakOrder
    );
  }

  // ==========================================================================
  // TOURNAMENT COMPLETION PIPELINE
  // ==========================================================================
  public completeTournament(tournamentId: string): {
    standings: StandingsRow[];
    ratingUpdatesCount: number;
  } {
    const tourney = this.getTournamentById(tournamentId);
    if (!tourney) throw new Error('Tournament not found');

    const standings = this.getStandings(tournamentId);
    let ratingUpdatesCount = 0;

    standings.forEach((row) => {
      const player = this.getPlayerById(row.playerId);
      if (player && row.ratingChange !== 0) {
        const { updatedPlayer, historyRecord } = RatingService.applyTournamentRatingUpdate(
          player,
          tourney.id,
          tourney.name,
          tourney.ratingType,
          row.ratingChange
        );

        // Update player in database
        const pIdx = this.db.players.findIndex((p) => p.id === player.id);
        if (pIdx !== -1) {
          this.db.players[pIdx] = updatedPlayer;
        }

        // Store rating history
        this.db.ratingHistories.unshift(historyRecord);
        ratingUpdatesCount++;
      }
    });

    tourney.status = 'COMPLETED';
    this.addAuditLog(
      'Tournament Completed',
      `Final standings verified and official CCI ${tourney.ratingType} ratings published (${ratingUpdatesCount} rating changes applied)`,
      tournamentId
    );

    this.saveToStorage(this.db);
    return { standings, ratingUpdatesCount };
  }

  // ==========================================================================
  // RATING HISTORIES & AUDIT LOGS
  // ==========================================================================
  public getPlayerRatingHistory(playerId: string): RatingHistoryRecord[] {
    return this.db.ratingHistories.filter((rh) => rh.playerId === playerId);
  }

  public getAuditLogs(tournamentId?: string): AuditLog[] {
    if (tournamentId) {
      return this.db.auditLogs.filter((a) => a.tournamentId === tournamentId);
    }
    return [...this.db.auditLogs];
  }

  private addAuditLog(action: string, details: string, tournamentId?: string, roundNumber?: number): void {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorName: this.db.currentUserSession.name,
      actorRole: this.db.currentUserSession.role,
      action,
      tournamentId,
      roundNumber,
      details,
    };
    this.db.auditLogs.unshift(newLog);
  }

  public resetDatabase(): void {
    const seed = createSeedDatabase();
    this.saveToStorage(seed);
  }
}

export const tournamentRepository = new TournamentRepository();
