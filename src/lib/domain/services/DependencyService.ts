import { 
  Pairing, 
  Round, 
  Player, 
  HistoricalCorrectionImpact, 
  MatchResult 
} from '../types';

export class DependencyService {
  /**
   * Analyze the downstream impact of changing a historical round result
   */
  public static analyzeHistoricalResultImpact(
    tournamentId: string,
    allRounds: Round[],
    allPairings: Pairing[],
    players: Player[],
    correctedPairing: Pairing,
    previousResult: MatchResult,
    newResult: MatchResult
  ): HistoricalCorrectionImpact {
    const roundNumber = allRounds.find((r) => r.id === correctedPairing.roundId)?.number || 1;
    const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

    const whitePlayer = playerMap.get(correctedPairing.whitePlayerId);
    const blackPlayer = correctedPairing.blackPlayerId 
      ? playerMap.get(correctedPairing.blackPlayerId) 
      : null;

    const whiteName = whitePlayer?.name || 'White Player';
    const blackName = blackPlayer?.name || (correctedPairing.result === 'BYE' ? 'BYE' : 'Black Player');

    // Future rounds that were generated after this round
    const futureRounds = allRounds
      .filter((r) => r.number > roundNumber)
      .map((r) => r.number)
      .sort((a, b) => a - b);

    // Affected players: initially the two players whose score changed
    const affectedPlayerIds = [correctedPairing.whitePlayerId];
    if (correctedPairing.blackPlayerId) {
      affectedPlayerIds.push(correctedPairing.blackPlayerId);
    }

    // In Swiss systems, a change in score alters the bracket groupings and floats in subsequent rounds
    const affectedPlayerNames = affectedPlayerIds
      .map((id) => playerMap.get(id)?.name || id);

    let warningMessage = '';
    if (futureRounds.length === 0) {
      warningMessage = `Correction recorded for Round ${roundNumber}. Current round standings have been recalibrated.`;
    } else {
      const roundSpan = futureRounds.length === 1 
        ? `Round ${futureRounds[0]}` 
        : `Rounds ${futureRounds[0]}–${futureRounds[futureRounds.length - 1]}`;
      warningMessage = `This historical correction changes the standings used to generate subsequent rounds. ${roundSpan} pairings and tie-breaks may be affected.`;
    }

    return {
      tournamentId,
      correctedRoundNumber: roundNumber,
      boardNumber: correctedPairing.boardNumber,
      whitePlayerName: whiteName,
      blackPlayerName: blackName,
      previousResult,
      newResult,
      affectedRounds: futureRounds,
      affectedPlayerIds,
      affectedPlayerNames,
      warningMessage,
      canRegenerate: futureRounds.length > 0,
    };
  }
}
