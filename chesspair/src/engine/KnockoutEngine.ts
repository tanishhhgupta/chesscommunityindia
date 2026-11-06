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
 * Knockout / Elimination Tournament Engine
 */
export class KnockoutEngine implements TournamentEngine {
  private swissFallback = new BasicSwissEngine();

  getMetadata(): EngineMetadata {
    return {
      id: 'knockout-engine',
      name: 'Knockout / Single Elimination Engine',
      description: 'Single-elimination knockout tournament bracket with automatic advancement.',
      isFideCertified: false,
      certificationNotice: 'Knockout bracket pairings are seeded by rating and advanced round by round.',
      supportedFormats: ['knockout'],
    };
  }

  pairRound(params: EnginePairRoundParams): EnginePairing[] {
    const { players } = params;
    // In knockout, only active players (who haven't been eliminated) are paired
    const active = players.filter((p) => !p.isWithdrawn);
    const sorted = [...active].sort((a, b) => b.rating - a.rating || a.seed - b.seed);

    const pairings: EnginePairing[] = [];
    const n = sorted.length;
    let boardNumber = 1;

    for (let i = 0; i < Math.floor(n / 2); i++) {
      const p1 = sorted[i];
      const p2 = sorted[n - 1 - i]; // 1 vs N, 2 vs N-1 seeding

      pairings.push({
        boardNumber: boardNumber++,
        whitePlayerId: p1.id,
        blackPlayerId: p2.id,
        isBye: false,
      });
    }

    if (n % 2 !== 0) {
      const byePlayer = sorted[Math.floor(n / 2)];
      pairings.push({
        boardNumber: boardNumber++,
        whitePlayerId: byePlayer.id,
        blackPlayerId: null,
        isBye: true,
        byeType: 'full_point',
        byePoints: 1.0,
        notes: 'Knockout bye advancement',
      });
    }

    return pairings;
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
