import {
  AuditLog,
  ChessTitle,
  GameResult,
  Organization,
  OrganizationMember,
  Pairing,
  Player,
  Round,
  RoundStatus,
  Tournament,
  TournamentPlayer,
  UserProfile,
  UserRole,
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_MEMBERS,
  INITIAL_ORGANIZATIONS,
  INITIAL_PAIRINGS,
  INITIAL_PLAYERS,
  INITIAL_PROFILES,
  INITIAL_ROUNDS,
  INITIAL_TOURNAMENT_PLAYERS,
  INITIAL_TOURNAMENTS,
} from './mockData';

const STORAGE_KEYS = {
  ORGANIZATIONS: 'chesspair_organizations_v3',
  MEMBERS: 'chesspair_members_v3',
  PROFILES: 'chesspair_profiles_v3',
  PLAYERS: 'chesspair_players_v3',
  TOURNAMENTS: 'chesspair_tournaments_v3',
  TOURNAMENT_PLAYERS: 'chesspair_tournament_players_v3',
  ROUNDS: 'chesspair_rounds_v3',
  PAIRINGS: 'chesspair_pairings_v3',
  AUDIT_LOGS: 'chesspair_audit_logs_v3',
  ACTIVE_ORG_ID: 'chesspair_active_org_id_v3',
  CURRENT_USER_ID: 'chesspair_current_user_id_v3',
};

const memoryStore: Record<string, string> = {};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') {
      const mem = memoryStore[key];
      if (!mem) return defaultValue;
      return JSON.parse(mem);
    }
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') {
      memoryStore[key] = JSON.stringify(value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      // 1. Same-window custom event
      window.dispatchEvent(new CustomEvent('chesspair-data-updated', { detail: { key, timestamp: Date.now() } }));

      // 2. Cross-frame postMessage (if in iframe)
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'CHESSPAIR_DATA_UPDATED', key, timestamp: Date.now() }, '*');
        } catch {}
      }

      // 3. Same-origin cross-tab BroadcastChannel
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('chesspair_sync_channel');
          bc.postMessage({ type: 'CHESSPAIR_DATA_UPDATED', key, timestamp: Date.now() });
          bc.close();
        }
      } catch {}

      // 4. Server-Sent Events notify backend
      try {
        if (typeof fetch !== 'undefined') {
          fetch('/api/public/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'CHESSPAIR_DATA_UPDATED', key, timestamp: Date.now() }),
          }).catch(() => {});
        }
      } catch {}
    }
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

/**
 * Unified Storage & Persistence Repository
 */
export class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  public ensureInitialized(): void {
    if (typeof localStorage === 'undefined') {
      if (!memoryStore[STORAGE_KEYS.ORGANIZATIONS]) {
        this.resetToDefaults();
      }
      return;
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults(): void {
    setStored(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    setStored(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
    setStored(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    setStored(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    setStored(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    setStored(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    setStored(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStored(STORAGE_KEYS.ACTIVE_ORG_ID, INITIAL_ORGANIZATIONS[0].id);
    setStored(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_PROFILES[0].id); // Tanay Trait (tanay.trait@gmail.com)
  }

  // --- Profiles & Current User ---
  getProfiles(): UserProfile[] {
    return getStored(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  getCurrentUserId(): string {
    return getStored(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_PROFILES[0].id);
  }

  setCurrentUserId(id: string): void {
    setStored(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  // --- Organizations ---
  getOrganizations(): Organization[] {
    return getStored(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
  }

  getActiveOrgId(): string {
    return getStored(STORAGE_KEYS.ACTIVE_ORG_ID, INITIAL_ORGANIZATIONS[0].id);
  }

  setActiveOrgId(id: string): void {
    setStored(STORAGE_KEYS.ACTIVE_ORG_ID, id);
  }

  createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const orgs = this.getOrganizations();
    const newOrg: Organization = {
      ...data,
      id: `org-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orgs.push(newOrg);
    setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);

    // Add creator as owner member
    const currentUserId = this.getCurrentUserId();
    const profiles = this.getProfiles();
    const currentUser = profiles.find((p) => p.id === currentUserId) || profiles[0];

    this.addMember({
      organizationId: newOrg.id,
      userId: currentUser.id,
      role: 'owner',
      user: currentUser,
    });

    this.setActiveOrgId(newOrg.id);
    return newOrg;
  }

  // --- Members & Roles ---
  getMembers(orgId: string): OrganizationMember[] {
    const all = getStored<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    return all.filter((m) => m.organizationId === orgId);
  }

  addMember(data: Omit<OrganizationMember, 'id' | 'joinedAt'>): OrganizationMember {
    const members = getStored<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const newMember: OrganizationMember = {
      ...data,
      id: `mem-${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };
    members.push(newMember);
    setStored(STORAGE_KEYS.MEMBERS, members);
    return newMember;
  }

  updateMemberRole(memberId: string, role: UserRole): void {
    const members = getStored<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const updated = members.map((m) => (m.id === memberId ? { ...m, role } : m));
    setStored(STORAGE_KEYS.MEMBERS, updated);
  }

  removeMember(memberId: string): void {
    const members = getStored<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    setStored(
      STORAGE_KEYS.MEMBERS,
      members.filter((m) => m.id !== memberId)
    );
  }

  // --- Players (Roster) ---
  getPlayers(orgId: string): Player[] {
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    return players.filter((p) => p.organizationId === orgId);
  }

  getPlayer(id: string): Player | undefined {
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    return players.find((p) => p.id === id);
  }

  createPlayer(data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Player {
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const newPlayer: Player = {
      ...data,
      id: data.id || `pl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    players.push(newPlayer);
    setStored(STORAGE_KEYS.PLAYERS, players);
    return newPlayer;
  }

  updatePlayer(id: string, updates: Partial<Player>): Player {
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    let index = players.findIndex((p) => p.id === id);
    let existingPlayer: Player;

    if (index !== -1) {
      existingPlayer = players[index];
    } else {
      const fromInitial = INITIAL_PLAYERS.find((p) => p.id === id);
      if (fromInitial) {
        existingPlayer = fromInitial;
      } else {
        existingPlayer = {
          id,
          organizationId: '',
          name: updates.name || 'Player',
          title: (updates.title as ChessTitle) || 'None',
          federation: updates.federation || 'FID',
          rating: updates.rating || 1200,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      players.push(existingPlayer);
      index = players.length - 1;
    }

    const updated: Player = {
      ...existingPlayer,
      ...updates,
      id,
      title: (updates.title as ChessTitle) || existingPlayer.title,
      federation: updates.federation || existingPlayer.federation,
      updatedAt: new Date().toISOString(),
    };

    if (index !== -1) {
      players[index] = updated;
    } else {
      players.push(updated);
    }
    setStored(STORAGE_KEYS.PLAYERS, players);

    // Also synchronize tournament player records and rating
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    let tPlayersChanged = false;
    const updatedTPlayers = tPlayers.map((tp) => {
      if (tp.playerId === id) {
        tPlayersChanged = true;
        return {
          ...tp,
          initialRating: updates.rating !== undefined ? updates.rating : tp.initialRating,
        };
      }
      return tp;
    });
    if (tPlayersChanged) {
      setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, updatedTPlayers);
    }

    return updated;
  }

  deletePlayer(id: string): void {
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    setStored(
      STORAGE_KEYS.PLAYERS,
      players.filter((p) => p.id !== id)
    );
  }

  importPlayers(orgId: string, imported: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[]): Player[] {
    const existing = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const createdList: Player[] = [];

    imported.forEach((p, idx) => {
      const newP: Player = {
        ...p,
        id: `pl-imp-${Date.now()}-${idx}`,
        organizationId: orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdList.push(newP);
      existing.push(newP);
    });

    setStored(STORAGE_KEYS.PLAYERS, existing);
    return createdList;
  }

  // --- Tournaments ---
  getTournaments(orgId: string): Tournament[] {
    const all = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const filtered = all.filter((t) => t.organizationId === orgId);
    // Enrich with players count
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    return filtered.map((t) => ({
      ...t,
      playersCount: tPlayers.filter((tp) => tp.tournamentId === t.id && !tp.isWithdrawn).length,
    }));
  }

  getTournament(id: string): Tournament | undefined {
    const all = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const t = all.find((item) => item.id === id);
    if (!t) return undefined;
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    return {
      ...t,
      playersCount: tPlayers.filter((tp) => tp.tournamentId === t.id && !tp.isWithdrawn).length,
    };
  }

  createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Tournament {
    const all = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const newTournament: Tournament = {
      ...data,
      id: data.id || `trn-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(newTournament);
    setStored(STORAGE_KEYS.TOURNAMENTS, all);
    return newTournament;
  }

  updateTournament(id: string, updates: Partial<Tournament>): Tournament {
    const all = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tournament not found');

    const updated = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    setStored(STORAGE_KEYS.TOURNAMENTS, all);
    return updated;
  }

  deleteTournament(id: string): void {
    const all = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    setStored(
      STORAGE_KEYS.TOURNAMENTS,
      all.filter((t) => t.id !== id)
    );
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    setStored(
      STORAGE_KEYS.TOURNAMENT_PLAYERS,
      tPlayers.filter((tp) => tp.tournamentId !== id)
    );
    const rounds = getStored<Round[]>(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    setStored(
      STORAGE_KEYS.ROUNDS,
      rounds.filter((r) => r.tournamentId !== id)
    );
    const pairings = getStored<Pairing[]>(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    setStored(
      STORAGE_KEYS.PAIRINGS,
      pairings.filter((p) => p.tournamentId !== id)
    );
  }

  // --- Tournament Players ---
  getTournamentPlayers(tournamentId: string): (TournamentPlayer & { player: Player })[] {
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const allPlayers = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

    return tPlayers
      .filter((tp) => tp.tournamentId === tournamentId)
      .map((tp) => ({
        ...tp,
        player: playerMap.get(tp.playerId) || {
          id: tp.playerId,
          organizationId: '',
          name: 'Unknown Player',
          rating: tp.initialRating,
          title: 'None',
          federation: 'FID',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      }))
      .sort((a, b) => (b.player?.rating || 0) - (a.player?.rating || 0));
  }

  setTournamentPlayers(tournamentId: string, playerIds: string[]): void {
    const existing = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const filtered = existing.filter((tp) => tp.tournamentId !== tournamentId);

    // Sort players by rating descending for seeding
    const sorted = [...playerIds]
      .map((id) => playerMap.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.rating - a.rating);

    sorted.forEach((p, idx) => {
      filtered.push({
        id: `tp-${Date.now()}-${idx}`,
        tournamentId,
        playerId: p.id,
        seedNumber: idx + 1,
        initialRating: p.rating,
        isWithdrawn: false,
        createdAt: new Date().toISOString(),
      });
    });

    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, filtered);
  }

  addPlayerToTournament(tournamentId: string, playerId: string): TournamentPlayer {
    const existing = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const players = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const player = players.find((p) => p.id === playerId);
    const currentTPlayers = existing.filter((tp) => tp.tournamentId === tournamentId);

    const newTP: TournamentPlayer = {
      id: `tp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tournamentId,
      playerId,
      seedNumber: currentTPlayers.length + 1,
      initialRating: player?.rating || 1200,
      isWithdrawn: false,
      createdAt: new Date().toISOString(),
    };

    existing.push(newTP);
    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, existing);

    // Update playersCount in tournament
    const tournaments = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const tIdx = tournaments.findIndex((t) => t.id === tournamentId);
    if (tIdx !== -1) {
      tournaments[tIdx] = {
        ...tournaments[tIdx],
        playersCount: existing.filter((tp) => tp.tournamentId === tournamentId).length,
      };
      setStored(STORAGE_KEYS.TOURNAMENTS, tournaments);
    }

    return newTP;
  }

  withdrawPlayer(tournamentId: string, playerId: string, roundNumber: number): void {
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const updated = tPlayers.map((tp) => {
      if (tp.tournamentId === tournamentId && tp.playerId === playerId) {
        return { ...tp, isWithdrawn: true, withdrawnAtRound: roundNumber };
      }
      return tp;
    });
    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, updated);

    // Update playersCount in tournament
    const tournaments = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const tIdx = tournaments.findIndex((t) => t.id === tournamentId);
    if (tIdx !== -1) {
      tournaments[tIdx] = {
        ...tournaments[tIdx],
        playersCount: updated.filter((tp) => tp.tournamentId === tournamentId && !tp.isWithdrawn).length,
      };
      setStored(STORAGE_KEYS.TOURNAMENTS, tournaments);
    }
  }

  reinstatePlayer(tournamentId: string, playerId: string): void {
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const updated = tPlayers.map((tp) => {
      if (tp.tournamentId === tournamentId && tp.playerId === playerId) {
        return {
          ...tp,
          isWithdrawn: false,
          withdrawnAtRound: undefined,
          isPaused: false,
          isConfirmed: true,
        };
      }
      return tp;
    });
    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, updated);

    // Update playersCount in tournament
    const tournaments = getStored<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const tIdx = tournaments.findIndex((t) => t.id === tournamentId);
    if (tIdx !== -1) {
      tournaments[tIdx] = {
        ...tournaments[tIdx],
        playersCount: updated.filter((tp) => tp.tournamentId === tournamentId && !tp.isWithdrawn).length,
      };
      setStored(STORAGE_KEYS.TOURNAMENTS, tournaments);
    }
  }

  updateTournamentPlayer(tournamentId: string, playerId: string, updates: Partial<TournamentPlayer>): void {
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const updated = tPlayers.map((tp) => {
      if (tp.tournamentId === tournamentId && tp.playerId === playerId) {
        return { ...tp, ...updates };
      }
      return tp;
    });
    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, updated);
  }

  batchUpdateTournamentPlayers(
    tournamentId: string,
    playerIds: string[],
    updates: Partial<TournamentPlayer>
  ): void {
    const targetSet = new Set(playerIds);
    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    const updated = tPlayers.map((tp) => {
      if (tp.tournamentId === tournamentId && targetSet.has(tp.playerId)) {
        return { ...tp, ...updates };
      }
      return tp;
    });
    setStored(STORAGE_KEYS.TOURNAMENT_PLAYERS, updated);
  }

  // --- Rounds ---
  getAllRounds(): Round[] {
    return getStored<Round[]>(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
  }

  getRounds(tournamentId: string): Round[] {
    const all = getStored<Round[]>(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    return all
      .filter((r) => r.tournamentId === tournamentId)
      .sort((a, b) => a.roundNumber - b.roundNumber);
  }

  createRound(tournamentId: string, roundNumber: number): Round {
    const rounds = getStored<Round[]>(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    const newRound: Round = {
      id: `rnd-${Date.now()}`,
      tournamentId,
      roundNumber,
      status: 'draft',
      pairingsLocked: false,
      pairedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    rounds.push(newRound);
    setStored(STORAGE_KEYS.ROUNDS, rounds);
    return newRound;
  }

  updateRoundStatus(roundId: string, status: RoundStatus): void {
    const rounds = getStored<Round[]>(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    const updated = rounds.map((r) => {
      if (r.id === roundId) {
        const changes: Partial<Round> = { status };
        if (status === 'published') {
          changes.publishedAt = new Date().toISOString();
        } else if (status === 'completed') {
          changes.completedAt = new Date().toISOString();
          changes.pairingsLocked = true;
        }
        return { ...r, ...changes };
      }
      return r;
    });
    setStored(STORAGE_KEYS.ROUNDS, updated);
  }

  // --- Pairings ---
  getPairings(roundId: string): (Pairing & { whitePlayer?: Player; blackPlayer?: Player })[] {
    const allPairings = getStored<Pairing[]>(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    const allPlayers = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
    INITIAL_PLAYERS.forEach((p) => {
      if (!playerMap.has(p.id)) {
        playerMap.set(p.id, p);
      }
    });

    return allPairings
      .filter((p) => p.roundId === roundId)
      .sort((a, b) => a.boardNumber - b.boardNumber)
      .map((p) => ({
        ...p,
        whitePlayer: p.whitePlayerId ? playerMap.get(p.whitePlayerId) : undefined,
        blackPlayer: p.blackPlayerId ? playerMap.get(p.blackPlayerId) : undefined,
      }));
  }

  getAllPairingsForTournament(tournamentId: string): (Pairing & { whitePlayer?: Player; blackPlayer?: Player })[] {
    const all = getStored<Pairing[]>(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    const allPlayers = getStored<Player[]>(STORAGE_KEYS.PLAYERS, INITIAL_PLAYERS);
    const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
    INITIAL_PLAYERS.forEach((p) => {
      if (!playerMap.has(p.id)) {
        playerMap.set(p.id, p);
      }
    });

    const tPlayers = getStored<TournamentPlayer[]>(STORAGE_KEYS.TOURNAMENT_PLAYERS, INITIAL_TOURNAMENT_PLAYERS);
    tPlayers.filter((tp) => tp.tournamentId === tournamentId).forEach((tp) => {
      if (!playerMap.has(tp.playerId)) {
        playerMap.set(tp.playerId, {
          id: tp.playerId,
          organizationId: '',
          name: 'Player ' + tp.seedNumber,
          rating: tp.initialRating,
          title: 'None',
          federation: 'FID',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        });
      }
    });

    return all
      .filter((p) => p.tournamentId === tournamentId)
      .sort((a, b) => a.boardNumber - b.boardNumber)
      .map((p) => ({
        ...p,
        whitePlayer: p.whitePlayerId ? playerMap.get(p.whitePlayerId) : undefined,
        blackPlayer: p.blackPlayerId ? playerMap.get(p.blackPlayerId) : undefined,
      }));
  }

  savePairings(
    roundId: string,
    tournamentId: string,
    pairings: Omit<Pairing, 'id' | 'roundId' | 'tournamentId' | 'createdAt' | 'updatedAt'>[]
  ): Pairing[] {
    const all = getStored<Pairing[]>(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    const filtered = all.filter((p) => p.roundId !== roundId);

    const created: Pairing[] = pairings.map((p, idx) => ({
      ...p,
      id: `pr-${roundId}-${idx + 1}-${Date.now()}`,
      roundId,
      tournamentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setStored(STORAGE_KEYS.PAIRINGS, [...filtered, ...created]);
    return created;
  }

  updatePairingResult(pairingId: string, result: GameResult): void {
    const pairings = getStored<Pairing[]>(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    const updated = pairings.map((p) =>
      p.id === pairingId ? { ...p, result, updatedAt: new Date().toISOString() } : p
    );
    setStored(STORAGE_KEYS.PAIRINGS, updated);
  }

  swapPairing(
    pairing1Id: string,
    pairing2Id: string,
    swapWhite: boolean,
    reason: string
  ): void {
    const pairings = getStored<Pairing[]>(STORAGE_KEYS.PAIRINGS, INITIAL_PAIRINGS);
    const p1 = pairings.find((p) => p.id === pairing1Id);
    const p2 = pairings.find((p) => p.id === pairing2Id);

    if (!p1 || !p2) return;

    if (swapWhite) {
      const temp = p1.whitePlayerId;
      p1.whitePlayerId = p2.whitePlayerId;
      p2.whitePlayerId = temp;
    } else {
      const temp = p1.blackPlayerId;
      p1.blackPlayerId = p2.blackPlayerId;
      p2.blackPlayerId = temp;
    }

    p1.isManualOverride = true;
    p1.manualReason = reason;
    p2.isManualOverride = true;
    p2.manualReason = reason;
    p1.updatedAt = new Date().toISOString();
    p2.updatedAt = new Date().toISOString();

    setStored(STORAGE_KEYS.PAIRINGS, pairings);
  }

  // --- Audit Logs ---
  getAuditLogs(orgId: string, tournamentId?: string): AuditLog[] {
    const all = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    return all
      .filter((log) => {
        if (log.organizationId !== orgId) return false;
        if (tournamentId && log.tournamentId !== tournamentId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const logs = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      ...data,
      id: `aud-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }
}

export const db = new StorageService();
