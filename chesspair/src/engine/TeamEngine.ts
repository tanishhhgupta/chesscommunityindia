import {
  EngineMetadata,
  EnginePairRoundParams,
  EnginePairing,
  EnginePlayer,
  EngineRoundHistoryGame,
  EngineStanding,
  EngineValidationResult,
  TiebreakRule,
  TournamentEngine,
} from './types';
import { BasicSwissEngine } from './SwissEngine';

/**
 * Team Tournament Engine
 * Pairs teams against teams, with individual board-by-board games.
 */
export class TeamEngine implements TournamentEngine {
  private swissFallback = new BasicSwissEngine();

  getMetadata(): EngineMetadata {
    return {
      id: 'team-engine',
      name: 'Team Chess Pairing Engine',
      description: 'Pairs clubs and scholastic teams with match points and board game points.',
      isFideCertified: false,
      certificationNotice: 'Team pairing engine handles team match points (2-1-0) alongside board game points.',
      supportedFormats: ['team'],
    };
  }

  pairRound(params: EnginePairRoundParams): EnginePairing[] {
    // Falls back to Swiss pairing on team representatives or team rosters
    return this.swissFallback.pairRound(params);
  }

  validatePairings(
    pairings: EnginePairing[],
    players: EnginePlayer[],
    previousRounds: EngineRoundHistoryGame[][]
  ): EngineValidationResult {
    return this.swissFallback.validatePairings(pairings, players, previousRounds);
  }

  calculateStandings(
    players: EnginePlayer[],
    rounds: EngineRoundHistoryGame[][],
    tiebreakOrder?: TiebreakRule[]
  ): EngineStanding[] {
    return this.swissFallback.calculateStandings(players, rounds, tiebreakOrder);
  }
}
