import { 
  Player, 
  TournamentRegistration, 
  Pairing, 
  StandingsRow, 
  TieBreakCriterion, 
  TieBreaks 
} from '../types';
import { CategoryService } from './CategoryService';

export class StandingsService {
  /**
   * Derive authoritative standings from all completed pairings across rounds
   */
  public static calculateStandings(
    players: Player[],
    registrations: TournamentRegistration[],
    allPairings: Pairing[],
    tieBreakOrder: TieBreakCriterion[] = ['POINTS', 'BUCHHOLZ_CUT1', 'BUCHHOLZ', 'SONNEBORN_BERGER', 'WINS']
  ): StandingsRow[] {
    const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));
    const regMap = new Map<string, TournamentRegistration>(registrations.map((r) => [r.playerId, r]));

    // Intermediate statistics tracking per player
    interface PlayerStatsCalc {
      playerId: string;
      points: number;
      games: number;
      wins: number;
      draws: number;
      losses: number;
      opponentsPlayed: string[]; // opponent player IDs
      roundScores: number[];     // score after each round for progressive tiebreak
      netDelta: number;
    }

    const statsMap = new Map<string, PlayerStatsCalc>();

    // 1. Initialize all registered players
    registrations.forEach((reg) => {
      statsMap.set(reg.playerId, {
        playerId: reg.playerId,
        points: 0,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        opponentsPlayed: [],
        roundScores: [],
        netDelta: 0,
      });
    });

    // 2. Tally game scores
    allPairings.forEach((m) => {
      if (m.result === 'PENDING') return;

      const white = statsMap.get(m.whitePlayerId);
      const black = m.blackPlayerId ? statsMap.get(m.blackPlayerId) : null;

      if (m.result === 'BYE') {
        if (white) {
          white.points += 1.0;
          white.wins += 1;
        }
        return;
      }

      if (white && black) {
        white.games += 1;
        black.games += 1;
        white.opponentsPlayed.push(black.playerId);
        black.opponentsPlayed.push(white.playerId);

        if (m.whiteDelta) white.netDelta += m.whiteDelta;
        if (m.blackDelta) black.netDelta += m.blackDelta;

        if (m.result === '1-0' || m.result === '1F-0F') {
          white.points += 1.0;
          white.wins += 1;
          black.losses += 1;
        } else if (m.result === '0-1' || m.result === '0F-1F') {
          black.points += 1.0;
          black.wins += 1;
          white.losses += 1;
        } else if (m.result === '1/2-1/2') {
          white.points += 0.5;
          black.points += 0.5;
          white.draws += 1;
          black.draws += 1;
        }
      }
    });

    // 3. Calculate Tie-Breaks
    const standingsRows: StandingsRow[] = [];

    statsMap.forEach((stats) => {
      const player = playerMap.get(stats.playerId);
      const reg = regMap.get(stats.playerId);
      if (!player || !reg) return;

      // Opponent final scores
      const opponentScores = stats.opponentsPlayed.map((oppId) => {
        return statsMap.get(oppId)?.points || 0;
      });

      // Buchholz = sum of opponents' scores
      const buchholz = opponentScores.reduce((sum, s) => sum + s, 0);

      // Buchholz Cut-1 = sum minus lowest score
      let buchholzCut1 = buchholz;
      if (opponentScores.length > 1) {
        const lowestOppScore = Math.min(...opponentScores);
        buchholzCut1 = buchholz - lowestOppScore;
      }

      // Sonneborn-Berger = sum of defeated opponents' scores + half of drawn opponents' scores
      let sonnebornBerger = 0;
      allPairings.forEach((m) => {
        if (m.result === 'PENDING') return;

        if (m.whitePlayerId === stats.playerId && m.blackPlayerId) {
          const oppPoints = statsMap.get(m.blackPlayerId)?.points || 0;
          if (m.result === '1-0' || m.result === '1F-0F') {
            sonnebornBerger += oppPoints;
          } else if (m.result === '1/2-1/2') {
            sonnebornBerger += oppPoints * 0.5;
          }
        } else if (m.blackPlayerId === stats.playerId) {
          const oppPoints = statsMap.get(m.whitePlayerId)?.points || 0;
          if (m.result === '0-1' || m.result === '0F-1F') {
            sonnebornBerger += oppPoints;
          } else if (m.result === '1/2-1/2') {
            sonnebornBerger += oppPoints * 0.5;
          }
        }
      });

      // Progressive score (dummy approximation if rounds not serialized)
      const progressive = stats.points * (stats.games || 1);

      const tieBreaks: TieBreaks = {
        buchholzCut1: Number(buchholzCut1.toFixed(2)),
        buchholz: Number(buchholz.toFixed(2)),
        sonnebornBerger: Number(sonnebornBerger.toFixed(2)),
        progressive: Number(progressive.toFixed(2)),
        wins: stats.wins,
      };

      const startRating = reg.initialRating;
      const liveRating = Math.max(0, startRating + stats.netDelta);
      const category = CategoryService.getCategoryForRating(liveRating);

      standingsRows.push({
        rank: 1, // assigned after sorting
        playerId: player.id,
        player,
        points: stats.points,
        tieBreaks,
        games: stats.games,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        startingRank: reg.seedNumber,
        startRating,
        liveRating,
        ratingChange: stats.netDelta,
        category,
      });
    });

    // 4. Sort Standings by configurable criteria
    standingsRows.sort((a, b) => {
      for (const criterion of tieBreakOrder) {
        if (criterion === 'POINTS' && b.points !== a.points) {
          return b.points - a.points;
        }
        if (criterion === 'BUCHHOLZ_CUT1' && b.tieBreaks.buchholzCut1 !== a.tieBreaks.buchholzCut1) {
          return b.tieBreaks.buchholzCut1 - a.tieBreaks.buchholzCut1;
        }
        if (criterion === 'BUCHHOLZ' && b.tieBreaks.buchholz !== a.tieBreaks.buchholz) {
          return b.tieBreaks.buchholz - a.tieBreaks.buchholz;
        }
        if (criterion === 'SONNEBORN_BERGER' && b.tieBreaks.sonnebornBerger !== a.tieBreaks.sonnebornBerger) {
          return b.tieBreaks.sonnebornBerger - a.tieBreaks.sonnebornBerger;
        }
        if (criterion === 'WINS' && b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        if (criterion === 'PROGRESSIVE' && b.tieBreaks.progressive !== a.tieBreaks.progressive) {
          return b.tieBreaks.progressive - a.tieBreaks.progressive;
        }
      }
      // Fallback tiebreak: highest live rating, then seed number
      if (b.liveRating !== a.liveRating) return b.liveRating - a.liveRating;
      return a.startingRank - b.startingRank;
    });

    // 5. Assign 1-indexed Ranks
    standingsRows.forEach((row, idx) => {
      row.rank = idx + 1;
    });

    return standingsRows;
  }
}
