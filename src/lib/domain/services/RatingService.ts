import { MatchResult, RatingType, RatingHistoryRecord, Player } from '../types';
import { CategoryService } from './CategoryService';

export class RatingService {
  /**
   * Determine official FIDE/CCI K-Factor based on rating and experience
   */
  public static getKFactor(rating: number, matchesPlayed: number = 50): number {
    if (matchesPlayed < 30) return 40; // Provisional
    if (rating >= 2400) return 10;     // Master tier
    return 20;                        // Standard active
  }

  /**
   * Calculate expected score using the standard logistic Elo formula
   */
  public static calculateExpectedScore(playerRating: number, opponentRating: number): number {
    const diff = opponentRating - playerRating;
    return 1 / (1 + Math.pow(10, diff / 400));
  }

  /**
   * Calculate real-time integer rating change for a single game match
   */
  public static calculateMatchDeltas(
    whiteRating: number,
    blackRating: number,
    result: MatchResult,
    whiteMatches: number = 40,
    blackMatches: number = 40
  ): { whiteDelta: number; blackDelta: number } {
    if (result === 'PENDING' || result === 'BYE' || result === '0F-0F') {
      return { whiteDelta: 0, blackDelta: 0 };
    }

    const whiteExpected = this.calculateExpectedScore(whiteRating, blackRating);
    const blackExpected = this.calculateExpectedScore(blackRating, whiteRating);

    let whiteActual = 0.5;
    let blackActual = 0.5;

    if (result === '1-0' || result === '1F-0F') {
      whiteActual = 1.0;
      blackActual = 0.0;
    } else if (result === '0-1' || result === '0F-1F') {
      whiteActual = 0.0;
      blackActual = 1.0;
    } else if (result === '1/2-1/2') {
      whiteActual = 0.5;
      blackActual = 0.5;
    }

    const kW = this.getKFactor(whiteRating, whiteMatches);
    const kB = this.getKFactor(blackRating, blackMatches);

    const whiteDelta = Math.round(kW * (whiteActual - whiteExpected));
    const blackDelta = Math.round(kB * (blackActual - blackExpected));

    return { whiteDelta, blackDelta };
  }

  /**
   * Retrieve player's specific rating pool value
   */
  public static getPlayerRatingByPool(player: Player, pool: RatingType): number {
    switch (pool) {
      case 'STANDARD':
        return player.cciStandardRating;
      case 'RAPID':
        return player.cciRapidRating;
      case 'BLITZ':
        return player.cciBlitzRating;
      default:
        return player.cciStandardRating;
    }
  }

  /**
   * Create an immutable rating history record and updated player profile
   */
  public static applyTournamentRatingUpdate(
    player: Player,
    tournamentId: string,
    tournamentName: string,
    ratingType: RatingType,
    netRatingChange: number
  ): {
    updatedPlayer: Player;
    historyRecord: RatingHistoryRecord;
  } {
    const ratingBefore = this.getPlayerRatingByPool(player, ratingType);
    const ratingAfter = Math.max(0, ratingBefore + netRatingChange);

    const categoryBefore = CategoryService.getCategoryForRating(ratingBefore);
    const categoryAfter = CategoryService.getCategoryForRating(ratingAfter);

    const historyRecord: RatingHistoryRecord = {
      id: `rh-${Date.now()}-${player.id}`,
      playerId: player.id,
      tournamentId,
      tournamentName,
      ratingType,
      ratingBefore,
      ratingChange: netRatingChange,
      ratingAfter,
      categoryBefore: categoryBefore.name,
      categoryAfter: categoryAfter.name,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    // Clone and update the corresponding pool
    const updatedPlayer: Player = {
      ...player,
      cciStandardRating: ratingType === 'STANDARD' ? ratingAfter : player.cciStandardRating,
      cciRapidRating: ratingType === 'RAPID' ? ratingAfter : player.cciRapidRating,
      cciBlitzRating: ratingType === 'BLITZ' ? ratingAfter : player.cciBlitzRating,
      currentCategory: categoryAfter,
      stats: {
        ...player.stats,
        currentCciRating: ratingAfter,
        highestCciRating: Math.max(player.stats.highestCciRating, ratingAfter),
        ratingChangeLast30Days: player.stats.ratingChangeLast30Days + netRatingChange,
      },
      updatedAt: new Date().toISOString(),
    };

    return { updatedPlayer, historyRecord };
  }
}
