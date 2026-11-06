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
 * Round Robin Tournament Engine (Berger tables / cyclic method)
 */
export class RoundRobinEngine implements TournamentEngine {
  private swissFallback = new BasicSwissEngine();

  getMetadata(): EngineMetadata {
    return {
      id: 'round-robin-engine',
      name: 'Round Robin Engine (Berger Tables)',
      description: 'All-play-all schedule where every participant plays every other participant once.',
      isFideCertified: true,
      certificationNotice: 'Berger cyclic pairing is a standard mathematical all-play-all schedule.',
      supportedFormats: ['round_robin'],
    };
  }

  pairRound(params: EnginePairRoundParams): EnginePairing[] {
    const { roundNumber, players } = params;
    const n = players.length;
    if (n < 2) return [];

    // Berger tables circle algorithm
    // If n is odd, add a dummy player for bye
    const isOdd = n % 2 !== 0;
    const playerList = [...players];
    const totalSlots = isOdd ? n + 1 : n;

    // Create array of player indices [0, 1, 2, ..., totalSlots - 1]
    const indices: (number | null)[] = [];
    for (let i = 0; i < n; i++) indices.push(i);
    if (isOdd) indices.push(null); // Bye slot

    const roundIndex = (roundNumber - 1) % (totalSlots - 1);

    // Rotate indices for roundIndex
    const roundOrder: (number | null)[] = [indices[0]];
    const rotating = indices.slice(1);
    const rotationShift = roundIndex % rotating.length;
    const rotated = [
      ...rotating.slice(rotationShift),
      ...rotating.slice(0, rotationShift),
    ];
    roundOrder.push(...rotated);

    const pairings: EnginePairing[] = [];
    let boardNumber = 1;

    for (let i = 0; i < totalSlots / 2; i++) {
      const idx1 = roundOrder[i];
      const idx2 = roundOrder[totalSlots - 1 - i];

      if (idx1 === null || idx2 === null) {
        // Bye
        const realIdx = idx1 !== null ? idx1 : idx2!;
        const byePlayer = playerList[realIdx];
        pairings.push({
          boardNumber: 0,
          whitePlayerId: byePlayer.id,
          blackPlayerId: null,
          isBye: true,
          byeType: 'full_point',
          byePoints: 1.0,
          notes: `Round Robin scheduled bye for Round ${roundNumber}`,
        });
      } else {
        const p1 = playerList[idx1];
        const p2 = playerList[idx2];
        // Alternate colors by round
        const white = (i + roundNumber) % 2 === 0 ? p1 : p2;
        const black = (i + roundNumber) % 2 === 0 ? p2 : p1;

        pairings.push({
          boardNumber: boardNumber++,
          whitePlayerId: white.id,
          blackPlayerId: black.id,
          isBye: false,
        });
      }
    }

    // Sort so byes are on the last board
    const regular = pairings.filter((p) => !p.isBye);
    const byes = pairings.filter((p) => p.isBye);
    let bCount = 1;
    const finalPairings: EnginePairing[] = [];
    regular.forEach((p) => finalPairings.push({ ...p, boardNumber: bCount++ }));
    byes.forEach((p) => finalPairings.push({ ...p, boardNumber: bCount++ }));

    return finalPairings;
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
    // In round robin, Sonneborn-Berger and Direct Encounter are premier tiebreaks
    const defaultOrder: TiebreakRule[] = tiebreakOrder || [
      'sonneborn_berger',
      'direct_encounter',
      'wins',
      'most_blacks',
      'buchholz_total',
    ];
    return this.swissFallback.calculateStandings(players, rounds, defaultOrder);
  }
}
