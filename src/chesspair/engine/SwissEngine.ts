import {
  ChessColor,
  EngineMetadata,
  EnginePairRoundParams,
  EnginePairing,
  EnginePlayer,
  EngineRoundHistoryGame,
  EngineStanding,
  EngineValidationIssue,
  EngineValidationResult,
  GameResult,
  PlayerRoundDetail,
  TiebreakRule,
  TournamentEngine,
} from './types';

/**
 * Result score converter
 */
export function resultToPoints(result: GameResult, forWhite: boolean): number {
  switch (result) {
    case '1-0':
    case '1F-0':
      return forWhite ? 1.0 : 0.0;
    case '0-1':
    case '0-1F':
      return forWhite ? 0.0 : 1.0;
    case '0.5-0.5':
      return 0.5;
    case '0F-0F':
    case '0-0':
      return 0.0;
    case '1-0_BYE':
      return 1.0;
    case '0.5-BYE':
      return 0.5;
    case '0-BYE':
      return 0.0;
    case 'UNPLAYED':
    default:
      return 0.0;
  }
}

/**
 * Basic Swiss Pairing Engine
 *
 * Implements standard Swiss heuristics:
 * - Score grouping
 * - No-repeat opponent constraints
 * - Color alternation and consecutive color limits (max 2 consecutive preferred)
 * - Odd-player bye assignment to lowest eligible score group
 * - Comprehensive tiebreak calculations (Buchholz Cut-1, Median, SB, Direct Encounter)
 *
 * NOTE: Not submitted for or claimed as FIDE certified.
 */
export class BasicSwissEngine implements TournamentEngine {
  getMetadata(): EngineMetadata {
    return {
      id: 'basic-swiss-engine',
      name: 'Basic Swiss Pairing Engine',
      description:
        'Standard score-bracket Swiss engine with color balancing, rematch prevention, and automatic bye allocation.',
      isFideCertified: false,
      certificationNotice:
        'ChessPair v1 uses a Basic Swiss Pairing Engine. While it adheres to core Swiss pairing principles, it is not yet claimed or submitted for official FIDE compliance testing (FIDE Handbook C.04.3.2).',
      supportedFormats: ['basic_swiss'],
    };
  }

  /**
   * Generates pairings for the specified round.
   */
  pairRound(params: EnginePairRoundParams): EnginePairing[] {
    const { roundNumber, players } = params;

    // Filter out withdrawn players
    const activePlayers = players.filter((p) => !p.isWithdrawn);
    if (activePlayers.length === 0) return [];

    let availablePlayers = [...activePlayers];
    const pairings: EnginePairing[] = [];
    let boardNumber = 1;

    // 1. Check if odd number of players - Assign Bye
    if (availablePlayers.length % 2 !== 0) {
      const byePlayer = this.selectByePlayer(availablePlayers);
      if (byePlayer) {
        pairings.push({
          boardNumber: 0, // Assigned board 0 or last board in presentation
          whitePlayerId: byePlayer.id,
          blackPlayerId: null,
          isBye: true,
          byeType: 'full_point',
          byePoints: 1.0,
          notes: 'Odd-player full-point bye assigned to lowest eligible score group',
        });
        availablePlayers = availablePlayers.filter((p) => p.id !== byePlayer.id);
      }
    }

    // 2. Round 1 special high-integrity seeding pairing (top half vs bottom half)
    if (roundNumber === 1 && this.areAllScoresZero(availablePlayers)) {
      const sortedByRating = [...availablePlayers].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.seed - b.seed;
      });

      const half = Math.floor(sortedByRating.length / 2);
      const topHalf = sortedByRating.slice(0, half);
      const bottomHalf = sortedByRating.slice(half);

      for (let i = 0; i < half; i++) {
        const topPlayer = topHalf[i];
        const bottomPlayer = bottomHalf[i];

        // Odd boards: higher seed gets White; Even boards: higher seed gets Black
        const whitePlayer = i % 2 === 0 ? topPlayer : bottomPlayer;
        const blackPlayer = i % 2 === 0 ? bottomPlayer : topPlayer;

        pairings.push({
          boardNumber: boardNumber++,
          whitePlayerId: whitePlayer.id,
          blackPlayerId: blackPlayer.id,
          isBye: false,
        });
      }

      return this.orderPairings(pairings);
    }

    // 3. Round 2+ Swiss pairing by score groups
    // Group players by score
    const scoreGroups = this.createScoreGroups(availablePlayers);
    const scoreKeys = Object.keys(scoreGroups)
      .map(Number)
      .sort((a, b) => b - a);

    let downfloaters: EnginePlayer[] = [];

    for (const score of scoreKeys) {
      const currentGroup = [...downfloaters, ...scoreGroups[score]];
      downfloaters = [];

      // Try to pair within current group
      const groupPairings = this.pairScoreGroup(currentGroup, roundNumber);

      if (groupPairings.success) {
        for (const pair of groupPairings.pairs) {
          pairings.push({
            boardNumber: boardNumber++,
            whitePlayerId: pair.white.id,
            blackPlayerId: pair.black.id,
            isBye: false,
          });
        }
      } else {
        // Pairing with backtrack and downfloater
        for (const pair of groupPairings.pairs) {
          pairings.push({
            boardNumber: boardNumber++,
            whitePlayerId: pair.white.id,
            blackPlayerId: pair.black.id,
            isBye: false,
          });
        }
        // Remaining unpaired players float down to next score group
        downfloaters = groupPairings.unpaired;
      }
    }

    // If any downfloaters remain in the last group, pair them among themselves
    if (downfloaters.length >= 2) {
      const lastPairs = this.pairScoreGroup(downfloaters, roundNumber, true);
      for (const pair of lastPairs.pairs) {
        pairings.push({
          boardNumber: boardNumber++,
          whitePlayerId: pair.white.id,
          blackPlayerId: pair.black.id,
          isBye: false,
        });
      }
      if (lastPairs.unpaired.length > 0) {
        // Emergency unpairing fallback (should not occur with even number)
        for (const unp of lastPairs.unpaired) {
          pairings.push({
            boardNumber: boardNumber++,
            whitePlayerId: unp.id,
            blackPlayerId: null,
            isBye: true,
            byeType: 'half_point',
            byePoints: 0.5,
            notes: 'Unpaired emergency half-point bye',
          });
        }
      }
    }

    return this.orderPairings(pairings);
  }

  /**
   * Sort pairings so real boards come 1, 2, 3... and byes are placed on the final board.
   */
  private orderPairings(pairings: EnginePairing[]): EnginePairing[] {
    const regularBoards = pairings.filter((p) => !p.isBye);
    const byeBoards = pairings.filter((p) => p.isBye);

    let currentBoard = 1;
    const renumbered: EnginePairing[] = [];

    for (const b of regularBoards) {
      renumbered.push({ ...b, boardNumber: currentBoard++ });
    }
    for (const b of byeBoards) {
      renumbered.push({ ...b, boardNumber: currentBoard++ });
    }

    return renumbered;
  }

  /**
   * Helper: check if all players have 0 points (Round 1)
   */
  private areAllScoresZero(players: EnginePlayer[]): boolean {
    return players.every((p) => p.score === 0);
  }

  /**
   * Groups players by score in descending order
   */
  private createScoreGroups(players: EnginePlayer[]): Record<number, EnginePlayer[]> {
    const groups: Record<number, EnginePlayer[]> = {};
    for (const p of players) {
      if (!groups[p.score]) groups[p.score] = [];
      groups[p.score].push(p);
    }
    // Sort players within each group by rating descending
    for (const score in groups) {
      groups[score].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.seed - b.seed;
      });
    }
    return groups;
  }

  /**
   * Select a player to receive the bye when the field is odd.
   * Standard Swiss rule: Lowest eligible score group, player who has not had a bye, lowest rated.
   */
  private selectByePlayer(players: EnginePlayer[]): EnginePlayer | null {
    const eligible = players.filter((p) => !p.receivedBye);
    if (eligible.length === 0) {
      // If everyone had a bye, select lowest rated overall
      return [...players].sort((a, b) => a.score - b.score || a.rating - b.rating)[0] || null;
    }

    // Sort by: lowest score, then lowest rating, then highest seed
    return [...eligible].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.rating !== b.rating) return a.rating - b.rating;
      return b.seed - a.seed;
    })[0];
  }

  /**
   * Pair players within a score group using backtracking.
   */
  private pairScoreGroup(
    group: EnginePlayer[],
    roundNumber: number,
    allowForcePair = false
  ): {
    success: boolean;
    pairs: { white: EnginePlayer; black: EnginePlayer }[];
    unpaired: EnginePlayer[];
  } {
    const pairs: { white: EnginePlayer; black: EnginePlayer }[] = [];
    const used = new Set<string>();

    const sorted = [...group].sort((a, b) => b.rating - a.rating || a.seed - b.seed);

    // Backtrack search function
    const backtrack = (index: number): boolean => {
      if (index >= sorted.length) return true;

      const p1 = sorted[index];
      if (used.has(p1.id)) {
        return backtrack(index + 1);
      }

      // Try pairing with other available players
      for (let j = index + 1; j < sorted.length; j++) {
        const p2 = sorted[j];
        if (used.has(p2.id)) continue;

        const alreadyPlayed = p1.opponentIds.includes(p2.id);
        if (alreadyPlayed && !allowForcePair) continue;

        // Try this pairing
        used.add(p1.id);
        used.add(p2.id);

        const [white, black] = this.assignColors(p1, p2, roundNumber);
        pairs.push({ white, black });

        if (backtrack(index + 1)) {
          return true;
        }

        // Backtrack
        pairs.pop();
        used.delete(p1.id);
        used.delete(p2.id);
      }

      // If we cannot pair p1 in this group, he might float down
      return false;
    };

    // If group length is even, try full pairing
    if (sorted.length % 2 === 0) {
      const fullSuccess = backtrack(0);
      if (fullSuccess) {
        return { success: true, pairs, unpaired: [] };
      }
    }

    // If odd length or full pair failed, try floating down one player at a time
    for (let floatIdx = sorted.length - 1; floatIdx >= 0; floatIdx--) {
      pairs.length = 0;
      used.clear();

      const candidateFloater = sorted[floatIdx];
      used.add(candidateFloater.id);

      const success = backtrack(0);
      if (success) {
        return {
          success: false,
          pairs,
          unpaired: [candidateFloater],
        };
      }
    }

    // Extreme fallback: pair greedily or float lowest
    pairs.length = 0;
    used.clear();
    const unpaired: EnginePlayer[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const p1 = sorted[i];
      if (used.has(p1.id)) continue;

      let found = false;
      for (let j = i + 1; j < sorted.length; j++) {
        const p2 = sorted[j];
        if (used.has(p2.id)) continue;

        if (!p1.opponentIds.includes(p2.id) || allowForcePair) {
          used.add(p1.id);
          used.add(p2.id);
          const [white, black] = this.assignColors(p1, p2, roundNumber);
          pairs.push({ white, black });
          found = true;
          break;
        }
      }

      if (!found) {
        unpaired.push(p1);
      }
    }

    return {
      success: unpaired.length === 0,
      pairs,
      unpaired,
    };
  }

  /**
   * Determines color assignment between two players.
   * Priority:
   * 1. Consecutive color avoidance (player with 2 Whites must get Black, etc.)
   * 2. Color balance difference (player with more Whites gets Black)
   * 3. Previous round color alternation
   * 4. Rating / Seed order
   */
  public assignColors(p1: EnginePlayer, p2: EnginePlayer, roundNumber: number): [EnginePlayer, EnginePlayer] {
    const p1Balance = this.getColorBalance(p1.colorHistory);
    const p2Balance = this.getColorBalance(p2.colorHistory);

    const p1ConsecutiveW = this.getConsecutiveColor(p1.colorHistory, 'W');
    const p1ConsecutiveB = this.getConsecutiveColor(p1.colorHistory, 'B');
    const p2ConsecutiveW = this.getConsecutiveColor(p2.colorHistory, 'W');
    const p2ConsecutiveB = this.getConsecutiveColor(p2.colorHistory, 'B');

    // Rule 1: Consecutive color hard constraints (2+ in a row)
    if (p1ConsecutiveW >= 2 && p2ConsecutiveW < 2) return [p2, p1]; // p1 MUST get Black
    if (p1ConsecutiveB >= 2 && p2ConsecutiveB < 2) return [p1, p2]; // p1 MUST get White
    if (p2ConsecutiveW >= 2 && p1ConsecutiveW < 2) return [p1, p2]; // p2 MUST get Black
    if (p2ConsecutiveB >= 2 && p1ConsecutiveB < 2) return [p2, p1]; // p2 MUST get White

    // Rule 2: Color balance (higher balance means has had more Whites)
    if (p1Balance > p2Balance) return [p2, p1]; // p2 gets White, p1 gets Black
    if (p2Balance > p1Balance) return [p1, p2]; // p1 gets White, p2 gets Black

    // Rule 3: Alternation based on last round color
    const p1Last = p1.colorHistory[p1.colorHistory.length - 1];
    const p2Last = p2.colorHistory[p2.colorHistory.length - 1];

    if (p1Last === 'W' && p2Last === 'B') return [p2, p1];
    if (p1Last === 'B' && p2Last === 'W') return [p1, p2];

    // Rule 4: Tiebreak by seed/rating and round
    if (p1.seed < p2.seed) {
      return roundNumber % 2 === 1 ? [p1, p2] : [p2, p1];
    } else {
      return roundNumber % 2 === 1 ? [p2, p1] : [p1, p2];
    }
  }

  /**
   * Color balance = White count - Black count
   */
  private getColorBalance(history: ChessColor[]): number {
    let balance = 0;
    for (const c of history) {
      if (c === 'W') balance += 1;
      if (c === 'B') balance -= 1;
    }
    return balance;
  }

  /**
   * Check how many times consecutively a player had a given color in recent rounds
   */
  private getConsecutiveColor(history: ChessColor[], color: ChessColor): number {
    let count = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] === color) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Validates proposed pairings (useful before publishing or during manual arbiter swaps)
   */
  validatePairings(
    pairings: EnginePairing[],
    players: EnginePlayer[],
    previousRounds: EngineRoundHistoryGame[][]
  ): EngineValidationResult {
    const issues: EngineValidationIssue[] = [];
    const playerMap = new Map<string, EnginePlayer>();
    players.forEach((p) => playerMap.set(p.id, p));

    const assignedPlayerIds = new Set<string>();

    for (const pairing of pairings) {
      // Bye validation
      if (pairing.isBye) {
        if (!pairing.whitePlayerId) {
          issues.push({
            type: 'other',
            severity: 'error',
            message: `Board ${pairing.boardNumber}: Bye has no player assigned.`,
            boardNumber: pairing.boardNumber,
          });
          continue;
        }

        const player = playerMap.get(pairing.whitePlayerId);
        if (!player) continue;

        if (player.receivedBye) {
          issues.push({
            type: 'duplicate_bye',
            severity: 'warning',
            message: `Player ${player.name} on board ${pairing.boardNumber} already received a bye in a previous round.`,
            boardNumber: pairing.boardNumber,
            playerIds: [player.id],
          });
        }

        if (assignedPlayerIds.has(player.id)) {
          issues.push({
            type: 'other',
            severity: 'error',
            message: `Player ${player.name} is assigned to multiple boards in the same round!`,
            boardNumber: pairing.boardNumber,
            playerIds: [player.id],
          });
        }
        assignedPlayerIds.add(player.id);
        continue;
      }

      // Normal board validation
      if (!pairing.whitePlayerId || !pairing.blackPlayerId) {
        issues.push({
          type: 'other',
          severity: 'error',
          message: `Board ${pairing.boardNumber}: Both White and Black players must be assigned.`,
          boardNumber: pairing.boardNumber,
        });
        continue;
      }

      if (pairing.whitePlayerId === pairing.blackPlayerId) {
        issues.push({
          type: 'other',
          severity: 'error',
          message: `Board ${pairing.boardNumber}: Player cannot play against themselves!`,
          boardNumber: pairing.boardNumber,
          playerIds: [pairing.whitePlayerId],
        });
        continue;
      }

      const white = playerMap.get(pairing.whitePlayerId);
      const black = playerMap.get(pairing.blackPlayerId);

      if (!white || !black) continue;

      // Duplicate board assignments check
      if (assignedPlayerIds.has(white.id)) {
        issues.push({
          type: 'other',
          severity: 'error',
          message: `Player ${white.name} is assigned to multiple boards in this round.`,
          boardNumber: pairing.boardNumber,
          playerIds: [white.id],
        });
      }
      if (assignedPlayerIds.has(black.id)) {
        issues.push({
          type: 'other',
          severity: 'error',
          message: `Player ${black.name} is assigned to multiple boards in this round.`,
          boardNumber: pairing.boardNumber,
          playerIds: [black.id],
        });
      }
      assignedPlayerIds.add(white.id);
      assignedPlayerIds.add(black.id);

      // Check rematch constraint
      const alreadyPlayed = white.opponentIds.includes(black.id);
      if (alreadyPlayed) {
        issues.push({
          type: 'rematch',
          severity: 'error',
          message: `Board ${pairing.boardNumber}: ${white.name} and ${black.name} have already played each other in a previous round!`,
          boardNumber: pairing.boardNumber,
          playerIds: [white.id, black.id],
        });
      }

      // Check consecutive color violations (3 of same color is a serious violation in Swiss)
      const whiteConsecutiveW = this.getConsecutiveColor(white.colorHistory, 'W');
      if (whiteConsecutiveW >= 2) {
        issues.push({
          type: 'color_consecutive',
          severity: 'warning',
          message: `Board ${pairing.boardNumber}: ${white.name} is assigned White for the ${whiteConsecutiveW + 1}rd consecutive time.`,
          boardNumber: pairing.boardNumber,
          playerIds: [white.id],
        });
      }

      const blackConsecutiveB = this.getConsecutiveColor(black.colorHistory, 'B');
      if (blackConsecutiveB >= 2) {
        issues.push({
          type: 'color_consecutive',
          severity: 'warning',
          message: `Board ${pairing.boardNumber}: ${black.name} is assigned Black for the ${blackConsecutiveB + 1}rd consecutive time.`,
          boardNumber: pairing.boardNumber,
          playerIds: [black.id],
        });
      }

      // Color balance warning (> +2 or < -2)
      const whiteBal = this.getColorBalance(white.colorHistory) + 1;
      const blackBal = this.getColorBalance(black.colorHistory) - 1;
      if (Math.abs(whiteBal) >= 3 || Math.abs(blackBal) >= 3) {
        issues.push({
          type: 'color_imbalance',
          severity: 'warning',
          message: `Board ${pairing.boardNumber}: Extreme color imbalance (White bal: ${whiteBal}, Black bal: ${blackBal}).`,
          boardNumber: pairing.boardNumber,
          playerIds: [white.id, black.id],
        });
      }
    }

    const hasErrors = issues.some((i) => i.severity === 'error');
    const hasWarnings = issues.some((i) => i.severity === 'warning');

    return {
      isValid: !hasErrors,
      hasErrors,
      hasWarnings,
      issues,
    };
  }

  /**
   * Standings and Tiebreak Calculations
   */
  calculateStandings(
    players: EnginePlayer[],
    rounds: EngineRoundHistoryGame[][],
    tiebreakOrder: TiebreakRule[] = [
      'buchholz_cut1',
      'buchholz_median',
      'sonneborn_berger',
      'direct_encounter',
      'most_blacks',
      'wins',
    ]
  ): EngineStanding[] {
    const playerMap = new Map<string, EnginePlayer>();
    players.forEach((p) => playerMap.set(p.id, p));

    // 1. Calculate each player's game points and round details
    const scores = new Map<string, number>();
    const winsMap = new Map<string, number>();
    const blacksMap = new Map<string, number>();
    const playerOpponentsMap = new Map<string, string[]>();
    const playerRoundDetailsMap = new Map<string, PlayerRoundDetail[]>();

    players.forEach((p) => {
      scores.set(p.id, 0);
      winsMap.set(p.id, 0);
      blacksMap.set(p.id, 0);
      playerOpponentsMap.set(p.id, []);
      playerRoundDetailsMap.set(p.id, []);
    });

    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const roundNumber = rIdx + 1;
      const games = rounds[rIdx];

      for (const game of games) {
        if (game.result === 'UNPLAYED') continue;

        if (game.isBye && game.whitePlayerId) {
          const playerId = game.whitePlayerId;
          const byePts =
            game.byeType === 'half_point' ? 0.5 : game.byeType === 'zero_point' ? 0.0 : 1.0;
          scores.set(playerId, (scores.get(playerId) || 0) + byePts);
          if (byePts === 1.0) {
            winsMap.set(playerId, (winsMap.get(playerId) || 0) + 1);
          }

          const details = playerRoundDetailsMap.get(playerId) || [];
          details.push({
            roundNumber,
            boardNumber: game.boardNumber,
            opponentId: null,
            opponentName: 'BYE',
            opponentRating: 0,
            color: 'NONE',
            result: game.result,
            pointsEarned: byePts,
          });
          playerRoundDetailsMap.set(playerId, details);
          continue;
        }

        if (game.whitePlayerId && game.blackPlayerId) {
          const wId = game.whitePlayerId;
          const bId = game.blackPlayerId;

          const wPts = resultToPoints(game.result, true);
          const bPts = resultToPoints(game.result, false);

          scores.set(wId, (scores.get(wId) || 0) + wPts);
          scores.set(bId, (scores.get(bId) || 0) + bPts);

          if (wPts === 1.0) winsMap.set(wId, (winsMap.get(wId) || 0) + 1);
          if (bPts === 1.0) winsMap.set(bId, (winsMap.get(bId) || 0) + 1);

          blacksMap.set(bId, (blacksMap.get(bId) || 0) + 1);

          const wOpps = playerOpponentsMap.get(wId) || [];
          wOpps.push(bId);
          playerOpponentsMap.set(wId, wOpps);

          const bOpps = playerOpponentsMap.get(bId) || [];
          bOpps.push(wId);
          playerOpponentsMap.set(bId, bOpps);

          const wPlayer = playerMap.get(wId);
          const bPlayer = playerMap.get(bId);

          const wDetails = playerRoundDetailsMap.get(wId) || [];
          wDetails.push({
            roundNumber,
            boardNumber: game.boardNumber,
            opponentId: bId,
            opponentName: bPlayer ? bPlayer.name : 'Unknown',
            opponentRating: bPlayer ? bPlayer.rating : 0,
            color: 'W',
            result: game.result,
            pointsEarned: wPts,
          });
          playerRoundDetailsMap.set(wId, wDetails);

          const bDetails = playerRoundDetailsMap.get(bId) || [];
          bDetails.push({
            roundNumber,
            boardNumber: game.boardNumber,
            opponentId: wId,
            opponentName: wPlayer ? wPlayer.name : 'Unknown',
            opponentRating: wPlayer ? wPlayer.rating : 0,
            color: 'B',
            result: game.result,
            pointsEarned: bPts,
          });
          playerRoundDetailsMap.set(bId, bDetails);
        }
      }
    }

    // 2. Compute Tiebreaks
    const rawStandings: EngineStanding[] = players.map((player) => {
      const pScore = scores.get(player.id) || 0;
      const oppIds = playerOpponentsMap.get(player.id) || [];
      const oppScores = oppIds.map((id) => scores.get(id) || 0);

      // Buchholz Total
      const buchholzTotal = oppScores.reduce((acc, s) => acc + s, 0);

      // Buchholz Cut-1 (drop lowest opponent score)
      let buchholzCut1 = 0;
      if (oppScores.length > 0) {
        const sortedOppScores = [...oppScores].sort((a, b) => a - b);
        buchholzCut1 = sortedOppScores.slice(1).reduce((acc, s) => acc + s, 0);
      }

      // Buchholz Median (drop highest and lowest)
      let buchholzMedian = 0;
      if (oppScores.length > 2) {
        const sortedOppScores = [...oppScores].sort((a, b) => a - b);
        buchholzMedian = sortedOppScores.slice(1, -1).reduce((acc, s) => acc + s, 0);
      } else {
        buchholzMedian = buchholzCut1;
      }

      // Sonneborn-Berger (SB):
      // sum(opponent_score for wins) + 0.5 * sum(opponent_score for draws)
      const details = playerRoundDetailsMap.get(player.id) || [];
      let sonnebornBerger = 0;
      for (const d of details) {
        if (!d.opponentId) continue; // Bye does not contribute to regular SB
        const oppScore = scores.get(d.opponentId) || 0;
        if (d.pointsEarned === 1.0) {
          sonnebornBerger += oppScore;
        } else if (d.pointsEarned === 0.5) {
          sonnebornBerger += 0.5 * oppScore;
        }
      }

      return {
        rank: 1,
        playerId: player.id,
        playerName: player.name,
        rating: player.rating,
        title: player.title,
        federation: player.federation,
        score: pScore,
        buchholzCut1,
        buchholzMedian,
        buchholzTotal,
        sonnebornBerger,
        directEncounter: 0, // Computed below for tied groups
        wins: winsMap.get(player.id) || 0,
        blacks: blacksMap.get(player.id) || 0,
        roundDetails: details,
      };
    });

    // 3. Compute Direct Encounter between tied groups
    this.computeDirectEncounters(rawStandings, rounds);

    // 4. Sort standings hierarchically
    rawStandings.sort((a, b) => {
      // Primary: Score
      if (b.score !== a.score) return b.score - a.score;

      // Apply tiebreak rules in priority order
      for (const rule of tiebreakOrder) {
        let diff = 0;
        switch (rule) {
          case 'buchholz_cut1':
            diff = b.buchholzCut1 - a.buchholzCut1;
            break;
          case 'buchholz_median':
            diff = b.buchholzMedian - a.buchholzMedian;
            break;
          case 'buchholz_total':
            diff = b.buchholzTotal - a.buchholzTotal;
            break;
          case 'sonneborn_berger':
            diff = b.sonnebornBerger - a.sonnebornBerger;
            break;
          case 'direct_encounter':
            diff = b.directEncounter - a.directEncounter;
            break;
          case 'most_blacks':
            diff = b.blacks - a.blacks;
            break;
          case 'wins':
            diff = b.wins - a.wins;
            break;
        }
        if (Math.abs(diff) > 0.001) return diff;
      }

      // Final fallback: rating, then name
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.playerName.localeCompare(b.playerName);
    });

    // Assign final ranks
    rawStandings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    return rawStandings;
  }

  /**
   * Calculates head-to-head points among players tied on the same score
   */
  private computeDirectEncounters(
    standings: EngineStanding[],
    rounds: EngineRoundHistoryGame[][]
  ): void {
    const scoreGroups = new Map<number, EngineStanding[]>();
    for (const s of standings) {
      if (!scoreGroups.has(s.score)) scoreGroups.set(s.score, []);
      scoreGroups.get(s.score)!.push(s);
    }

    for (const [, group] of scoreGroups) {
      if (group.length <= 1) continue;

      const groupPlayerIds = new Set(group.map((g) => g.playerId));

      for (const p of group) {
        let headToHeadPoints = 0;

        for (const round of rounds) {
          for (const game of round) {
            if (game.result === 'UNPLAYED') continue;
            if (
              game.whitePlayerId &&
              game.blackPlayerId &&
              groupPlayerIds.has(game.whitePlayerId) &&
              groupPlayerIds.has(game.blackPlayerId)
            ) {
              if (game.whitePlayerId === p.playerId) {
                headToHeadPoints += resultToPoints(game.result, true);
              } else if (game.blackPlayerId === p.playerId) {
                headToHeadPoints += resultToPoints(game.result, false);
              }
            }
          }
        }

        p.directEncounter = headToHeadPoints;
      }
    }
  }
}
