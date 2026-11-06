import { 
  Player, 
  TournamentRegistration, 
  Pairing, 
  PairingVersion, 
  Round, 
  MatchResult 
} from '../types';

export class PairingService {
  /**
   * Generate Swiss pairings according to FIDE Dutch Swiss rules
   */
  public static generateSwissRoundPairings(
    round: Round,
    players: Player[],
    registrations: TournamentRegistration[],
    previousCompletedPairings: Pairing[],
    generatedBy: string = 'Arbiter Console',
    reason: string = 'Automatic Swiss Pairing'
  ): {
    version: PairingVersion;
    pairings: Pairing[];
  } {
    // 1. Filter eligible players: ACTIVE and PRESENT (or confirmed)
    const eligibleRegs = registrations.filter(
      (r) => r.status === 'ACTIVE' && r.attendance !== 'WITHDRAWN' && r.attendance !== 'ABSENT'
    );

    const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

    // 2. Build history per player
    const opponentsPlayed = new Map<string, Set<string>>();
    const colorHistory = new Map<string, ('W' | 'B')[]>();
    const hasBye = new Set<string>();

    eligibleRegs.forEach((r) => {
      opponentsPlayed.set(r.playerId, new Set<string>());
      colorHistory.set(r.playerId, []);
    });

    previousCompletedPairings.forEach((p) => {
      if (p.result === 'BYE') {
        hasBye.add(p.whitePlayerId);
        return;
      }
      if (p.whitePlayerId && p.blackPlayerId) {
        opponentsPlayed.get(p.whitePlayerId)?.add(p.blackPlayerId);
        opponentsPlayed.get(p.blackPlayerId)?.add(p.whitePlayerId);

        colorHistory.get(p.whitePlayerId)?.push('W');
        colorHistory.get(p.blackPlayerId)?.push('B');
      }
    });

    // 3. Sort players by currentScore DESC, then initialRating DESC
    const sortedCandidates = [...eligibleRegs].sort((a, b) => {
      if (b.currentScore !== a.currentScore) return b.currentScore - a.currentScore;
      return b.initialRating - a.initialRating;
    });

    // 4. Handle BYE if odd number of players
    let byePlayerId: string | null = null;
    if (sortedCandidates.length % 2 !== 0) {
      // Find candidate for bye from bottom who hasn't had a bye yet
      for (let i = sortedCandidates.length - 1; i >= 0; i--) {
        const candidate = sortedCandidates[i];
        if (!hasBye.has(candidate.playerId)) {
          byePlayerId = candidate.playerId;
          sortedCandidates.splice(i, 1);
          break;
        }
      }
      // If everyone had a bye, pick the very bottom player
      if (!byePlayerId && sortedCandidates.length > 0) {
        byePlayerId = sortedCandidates.pop()!.playerId;
      }
    }

    // 5. Generate version record
    const versionId = `pv-${Date.now()}`;
    const newVersion: PairingVersion = {
      id: versionId,
      tournamentId: round.tournamentId,
      roundId: round.id,
      roundNumber: round.number,
      versionNumber: 1, // Will be incremented by caller/repository if historical versions exist
      generatedBy,
      generatedAt: new Date().toISOString(),
      reason,
      status: 'ACTIVE',
    };

    // 6. Pairing algorithm by score brackets
    const pairings: Pairing[] = [];
    const paired = new Set<string>();
    let boardNumber = 1;

    for (let i = 0; i < sortedCandidates.length; i++) {
      const p1 = sortedCandidates[i];
      if (paired.has(p1.playerId)) continue;

      let chosenOpponent: TournamentRegistration | null = null;
      let chosenIdx = -1;

      // Find best opponent in list who hasn't been paired and hasn't faced p1 before
      for (let j = i + 1; j < sortedCandidates.length; j++) {
        const p2 = sortedCandidates[j];
        if (paired.has(p2.playerId)) continue;

        const previousFaces = opponentsPlayed.get(p1.playerId);
        if (!previousFaces || !previousFaces.has(p2.playerId)) {
          chosenOpponent = p2;
          chosenIdx = j;
          break;
        }
      }

      // If strict rematch check fails (small tournament), pair with next available
      if (!chosenOpponent) {
        for (let j = i + 1; j < sortedCandidates.length; j++) {
          const p2 = sortedCandidates[j];
          if (!paired.has(p2.playerId)) {
            chosenOpponent = p2;
            chosenIdx = j;
            break;
          }
        }
      }

      if (chosenOpponent) {
        paired.add(p1.playerId);
        paired.add(chosenOpponent.playerId);

        // Determine color balance
        const p1History = colorHistory.get(p1.playerId) || [];
        const p2History = colorHistory.get(chosenOpponent.playerId) || [];

        const p1LastColor = p1History[p1History.length - 1];
        const p2LastColor = p2History[p2History.length - 1];

        let whiteId = p1.playerId;
        let blackId = chosenOpponent.playerId;

        if (p1LastColor === 'W' && p2LastColor !== 'W') {
          whiteId = chosenOpponent.playerId;
          blackId = p1.playerId;
        } else if (p1LastColor !== 'B' && p2LastColor === 'B') {
          whiteId = p1.playerId;
          blackId = chosenOpponent.playerId;
        } else {
          // Default: higher seeded gets alternating
          const p1WhiteCount = p1History.filter((c) => c === 'W').length;
          const p2WhiteCount = p2History.filter((c) => c === 'W').length;
          if (p1WhiteCount > p2WhiteCount) {
            whiteId = chosenOpponent.playerId;
            blackId = p1.playerId;
          }
        }

        pairings.push({
          id: `pair-${round.id}-b${boardNumber}-${Date.now()}`,
          roundId: round.id,
          pairingVersionId: versionId,
          boardNumber,
          whitePlayerId: whiteId,
          blackPlayerId: blackId,
          result: 'PENDING',
          status: 'SCHEDULED',
        });
        boardNumber++;
      }
    }

    // 7. Add Bye match if exists
    if (byePlayerId) {
      pairings.push({
        id: `pair-${round.id}-b${boardNumber}-bye-${Date.now()}`,
        roundId: round.id,
        pairingVersionId: versionId,
        boardNumber,
        whitePlayerId: byePlayerId,
        blackPlayerId: null,
        result: 'BYE',
        status: 'COMPLETED',
      });
    }

    return { version: newVersion, pairings };
  }
}
