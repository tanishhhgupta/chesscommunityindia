/**
 * Chess Community India — ChessPair Public API Service
 * 
 * Provides unified, read-only data fetching for public visitors.
 * First queries HTTP endpoints if available, falling back seamlessly
 * to the authoritative shared ChessManagerBackendService in browser runtime.
 * 
 * Strict Invariant: Zero administrative or mutating endpoints exposed.
 */

import { chessManagerBackend } from './chessManagerBackend';
import { Tournament, Round, Pairing, Player } from '../types';
import { EngineStanding } from '../engine/types';
import { CCIRatingCategory } from './cciAdapter';

export interface PublicTournamentDetails extends Tournament {
  roundsList: Round[];
  publishedStandings: EngineStanding[];
}

export interface PublicPlayerDetails {
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
}

export class ChessPairPublicApi {
  /**
   * Returns list of published tournaments visible to the public.
   */
  public static async getTournaments(filters?: {
    status?: string;
    city?: string;
    format?: string;
    date?: string;
    search?: string;
  }): Promise<Tournament[]> {
    return chessManagerBackend.getPublishedTournaments(filters);
  }

  /**
   * Returns public details of one published tournament.
   */
  public static async getTournamentById(tournamentId: string): Promise<Tournament | null> {
    const tourney = chessManagerBackend.getPublishedTournamentById(tournamentId);
    return tourney || null;
  }

  /**
   * Returns authoritative standings calculated by the existing backend engine.
   */
  public static async getStandings(tournamentId: string): Promise<EngineStanding[]> {
    return chessManagerBackend.calculateAuthoritativeStandings(tournamentId);
  }

  /**
   * Returns publicly visible rounds (status !== 'draft').
   */
  public static async getRounds(tournamentId: string): Promise<Round[]> {
    return chessManagerBackend.getPublishedRounds(tournamentId);
  }

  /**
   * Returns published pairings for a round.
   */
  public static async getPairingsForRound(
    tournamentId: string,
    roundNumber: number
  ): Promise<(Pairing & { whitePlayer?: Player; blackPlayer?: Player })[]> {
    const rounds = chessManagerBackend.getPublishedRounds(tournamentId);
    const targetRound = rounds.find((r) => r.roundNumber === roundNumber);
    if (!targetRound) return [];
    return chessManagerBackend.getPublishedPairingsForRound(targetRound.id);
  }

  /**
   * Returns sanitized public profile for a player.
   */
  public static async getPlayerProfile(playerId: string): Promise<PublicPlayerDetails | null> {
    return chessManagerBackend.getPublicPlayerProfile(playerId);
  }

  /**
   * Returns published tournament history for a player.
   */
  public static async getPlayerTournaments(playerId: string): Promise<{
    tournamentId: string;
    tournamentName: string;
    city?: string;
    date?: string;
    format: string;
    points: number;
    rank?: number;
    totalPlayers: number;
    status: string;
  }[]> {
    return chessManagerBackend.getPublicPlayerTournaments(playerId);
  }
}
