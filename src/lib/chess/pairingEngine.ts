export interface TournamentPlayer {
  id: string;
  cciId: string;
  name: string;
  rating: number;
  startRating?: number;
  tierName: string;
  tierNumber?: number;
  score: number;
  colorHistory: ('W' | 'B')[]; // 'W' = White, 'B' = Black
  opponentsPlayed: string[];   // List of player IDs already faced
  hasReceivedBye: boolean;
  buchholzCut1?: number;
  sonnebornBerger?: number;
  city?: string;
  fideId?: string;
  ratingDelta?: number;        // Cumulative tournament Elo change
  isConfirmed?: boolean;       // Arbiter confirmed for tournament
  attendanceStatus?: 'present' | 'absent' | 'withdrawn'; // Checked-in status
  email?: string;
  phone?: string;
  registeredAt?: string;
  notes?: string;
}

export interface BoardMatch {
  id: string;
  boardNumber: number;
  whitePlayer: TournamentPlayer;
  blackPlayer?: TournamentPlayer; // Undefined if BYE
  result: '1-0' | '0-1' | '1/2-1/2' | '1F-0F' | '0F-1F' | '0F-0F' | 'BYE' | 'PENDING';
  isCompleted: boolean;
  whiteDelta?: number;
  blackDelta?: number;
}

/**
 * Generates Swiss pairings for a given round following FIDE Dutch pairing guidelines:
 * 1. Score brackets: group players by their current point score.
 * 2. Rematch prevention: players cannot face opponents they have already played.
 * 3. Color balancing: alternate colors whenever possible, never assign 3 same colors consecutively.
 * 4. Bye allocation: lowest-ranked player in bottom bracket who hasn't had a bye gets 1.0 point Bye.
 */
export function generateSwissPairings(
  players: TournamentPlayer[],
  currentRound: number
): BoardMatch[] {
  // Sort players primarily by score DESC, secondarily by rating DESC
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.rating - a.rating;
  });

  const pairings: BoardMatch[] = [];
  const unassigned = [...sorted];
  let boardNum = 1;

  // 1. Handle BYE if odd number of players
  if (unassigned.length % 2 !== 0) {
    // Find candidate for bye starting from the bottom of the scoreboard
    let byeIndex = -1;
    for (let i = unassigned.length - 1; i >= 0; i--) {
      const candidate = unassigned[i]!;
      if (!candidate.hasReceivedBye) {
        byeIndex = i;
        break;
      }
    }

    if (byeIndex !== -1) {
      const byePlayer = unassigned.splice(byeIndex, 1)[0]!;
      pairings.push({
        id: `match-r${currentRound}-bye`,
        boardNumber: 0, // 0 signifies Bye board
        whitePlayer: byePlayer,
        result: 'BYE',
        isCompleted: true,
      });
    }
  }

  // 2. Pair remaining players within / across score brackets
  while (unassigned.length >= 2) {
    const playerA = unassigned.shift()!;
    let matchedIndex = -1;

    // Search for the highest eligible opponent who hasn't faced playerA
    for (let i = 0; i < unassigned.length; i++) {
      const candidate = unassigned[i]!;
      if (!playerA.opponentsPlayed.includes(candidate.id)) {
        matchedIndex = i;
        break;
      }
    }

    // Fallback: if strictly no new opponent, pair next available
    if (matchedIndex === -1) {
      matchedIndex = 0;
    }

    const playerB = unassigned.splice(matchedIndex, 1)[0]!;

    // Color Allocation Logic
    // Compute White preference:
    // If playerA had Black last round, prefer White for playerA.
    const lastA = playerA.colorHistory[playerA.colorHistory.length - 1];
    const lastB = playerB.colorHistory[playerB.colorHistory.length - 1];

    let white = playerA;
    let black = playerB;

    if (lastA === 'W' && lastB !== 'W') {
      white = playerB;
      black = playerA;
    } else if (lastB === 'W' && lastA !== 'W') {
      white = playerA;
      black = playerB;
    } else {
      // Balance total counts
      const whitesA = playerA.colorHistory.filter(c => c === 'W').length;
      const whitesB = playerB.colorHistory.filter(c => c === 'W').length;
      if (whitesA > whitesB) {
        white = playerB;
        black = playerA;
      }
    }

    pairings.push({
      id: `match-r${currentRound}-b${boardNum}`,
      boardNumber: boardNum,
      whitePlayer: white,
      blackPlayer: black,
      result: 'PENDING',
      isCompleted: false,
    });

    boardNum++;
  }

  // Sort pairings by boardNumber ASC (with Bye at the end)
  return pairings.sort((a, b) => {
    if (a.boardNumber === 0) return 1;
    if (b.boardNumber === 0) return -1;
    return a.boardNumber - b.boardNumber;
  });
}

/**
 * Calculates Buchholz Cut 1:
 * Sum of all opponents' scores minus the lowest opponent score.
 */
export function calculateBuchholzCut1(
  player: TournamentPlayer,
  allPlayers: Map<string, TournamentPlayer>
): number {
  if (player.opponentsPlayed.length === 0) return 0;

  const opponentScores: number[] = [];
  for (const oppId of player.opponentsPlayed) {
    const opp = allPlayers.get(oppId);
    if (opp) {
      opponentScores.push(opp.score);
    }
  }

  if (opponentScores.length === 0) return 0;
  if (opponentScores.length === 1) return opponentScores[0]!;

  opponentScores.sort((a, b) => a - b);
  // Exclude lowest (first item after ASC sort)
  const cutScores = opponentScores.slice(1);
  return cutScores.reduce((sum, score) => sum + score, 0);
}

/**
 * Calculates Sonneborn-Berger tiebreak:
 * Sum of the scores of opponents defeated + 50% of the scores of opponents drawn.
 */
export function calculateSonnebornBerger(
  playerId: string,
  matches: BoardMatch[],
  allPlayers: Map<string, TournamentPlayer>
): number {
  let sbScore = 0;

  for (const match of matches) {
    if (!match.isCompleted || !match.blackPlayer) continue;

    const isWhite = match.whitePlayer.id === playerId;
    const isBlack = match.blackPlayer.id === playerId;
    if (!isWhite && !isBlack) continue;

    const opponentId = isWhite ? match.blackPlayer.id : match.whitePlayer.id;
    const opponent = allPlayers.get(opponentId);
    if (!opponent) continue;

    if (match.result === '1-0') {
      if (isWhite) sbScore += opponent.score;
    } else if (match.result === '0-1') {
      if (isBlack) sbScore += opponent.score;
    } else if (match.result === '1/2-1/2') {
      sbScore += opponent.score * 0.5;
    }
  }

  return Number(sbScore.toFixed(2));
}
