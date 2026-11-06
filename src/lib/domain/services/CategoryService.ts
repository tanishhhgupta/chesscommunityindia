import { CANONICAL_CCI_CATEGORIES, getCanonicalCategory } from '../types';
import { CCIRankTier } from '../../chess/eloEngine';

export class CategoryService {
  /**
   * Get all six canonical categories
   */
  public static getAllCategories(): CCIRankTier[] {
    return CANONICAL_CCI_CATEGORIES;
  }

  /**
   * Determine category dynamically from rating
   */
  public static getCategoryForRating(rating: number): CCIRankTier {
    return getCanonicalCategory(rating);
  }

  /**
   * Calculate points needed to ascend to the next higher category
   */
  public static getPointsToNextTier(rating: number): {
    nextTier: CCIRankTier | null;
    pointsNeeded: number;
    progressPercentage: number;
  } {
    const currentTier = this.getCategoryForRating(rating);
    const currentIndex = CANONICAL_CCI_CATEGORIES.findIndex(
      (c) => c.tierNumber === currentTier.tierNumber
    );

    if (currentIndex === -1 || currentIndex === CANONICAL_CCI_CATEGORIES.length - 1) {
      return {
        nextTier: null,
        pointsNeeded: 0,
        progressPercentage: 100,
      };
    }

    const nextTier = CANONICAL_CCI_CATEGORIES[currentIndex + 1];
    const pointsNeeded = Math.max(0, nextTier.minElo - rating);
    const tierSpan = currentTier.maxElo - currentTier.minElo + 1;
    const progressInCurrentTier = Math.max(0, rating - currentTier.minElo);
    const progressPercentage = Math.min(100, Math.round((progressInCurrentTier / tierSpan) * 100));

    return {
      nextTier,
      pointsNeeded,
      progressPercentage,
    };
  }

  /**
   * Detect if a rating change crossed a category boundary
   */
  public static checkCategoryTransition(
    beforeRating: number,
    afterRating: number
  ): {
    hasTransitioned: boolean;
    isPromotion: boolean;
    beforeCategory: CCIRankTier;
    afterCategory: CCIRankTier;
  } {
    const beforeCategory = this.getCategoryForRating(beforeRating);
    const afterCategory = this.getCategoryForRating(afterRating);

    const hasTransitioned = beforeCategory.tierNumber !== afterCategory.tierNumber;
    const isPromotion = afterCategory.tierNumber > beforeCategory.tierNumber;

    return {
      hasTransitioned,
      isPromotion,
      beforeCategory,
      afterCategory,
    };
  }
}
