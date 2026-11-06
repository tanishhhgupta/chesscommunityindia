export interface CCIRankTier {
  tierNumber: number;
  name: string;
  minElo: number;
  maxElo: number;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  badgeIcon: string;
}

/**
 * Simplified Chess Manager Rating System for Chess Community India
 * 6 progressive performance batches spanning 0 to 3000+ Elo
 */
export const CCI_RATING_CATEGORIES: CCIRankTier[] = [
  {
    tierNumber: 1,
    name: "Blunder Master",
    minElo: 0,
    maxElo: 800,
    badgeColor: "bg-rose-950/40",
    textColor: "text-rose-400",
    borderColor: "border-rose-800/40",
    description: "Every legend starts with hanging pieces. Embracing the journey from move one.",
    badgeIcon: "ShieldAlert"
  },
  {
    tierNumber: 2,
    name: "Tactical Striker",
    minElo: 801,
    maxElo: 1200,
    badgeColor: "bg-amber-950/40",
    textColor: "text-amber-300",
    borderColor: "border-amber-800/40",
    description: "Spotting forks, pins, and skewers. Turning tactical awareness into decisive board advantage.",
    badgeIcon: "Target"
  },
  {
    tierNumber: 3,
    name: "Positional Strategist",
    minElo: 1201,
    maxElo: 1600,
    badgeColor: "bg-cyan-950/40",
    textColor: "text-cyan-300",
    borderColor: "border-cyan-800/40",
    description: "Controlling outposts, pawn structures, and navigating deep middle-game conversions.",
    badgeIcon: "Compass"
  },
  {
    tierNumber: 4,
    name: "Vanguard Commander",
    minElo: 1601,
    maxElo: 2000,
    badgeColor: "bg-emerald-950/40",
    textColor: "text-emerald-300",
    borderColor: "border-emerald-800/40",
    description: "Acute calculation, opening repertoire mastery, and fierce tournament resilience.",
    badgeIcon: "Zap"
  },
  {
    tierNumber: 5,
    name: "Crown Contender",
    minElo: 2001,
    maxElo: 2400,
    badgeColor: "bg-indigo-950/40",
    textColor: "text-indigo-300",
    borderColor: "border-indigo-800/40",
    description: "Master-level endgame technique, psychological endurance, and national circuit prominence.",
    badgeIcon: "Award"
  },
  {
    tierNumber: 6,
    name: "Grand Sovereign",
    minElo: 2401,
    maxElo: 3000,
    badgeColor: "bg-[#C5A059]/20",
    textColor: "text-[#C5A059]",
    borderColor: "border-[#C5A059]/60",
    description: "The pinnacle of Indian chess brilliance. Intuition, precision, and immortal play.",
    badgeIcon: "Crown"
  }
];

// Alias for backwards compatibility with any component referencing CCI_45_TIERS
export const CCI_45_TIERS: CCIRankTier[] = CCI_RATING_CATEGORIES;

/**
 * Returns the exact CCI Rating Category object for any given Elo rating.
 */
export function getTierFromRating(rating: number): CCIRankTier {
  const boundedRating = Math.max(0, rating);
  for (const tier of CCI_RATING_CATEGORIES) {
    if (boundedRating >= tier.minElo && boundedRating <= tier.maxElo) {
      return tier;
    }
  }
  if (boundedRating > 3000) {
    return CCI_RATING_CATEGORIES[CCI_RATING_CATEGORIES.length - 1]!;
  }
  return CCI_RATING_CATEGORIES[0]!;
}

// Official FIDE Default Starting Rating for newly managed players in CCI
export const DEFAULT_PLAYER_RATING = 1000;

/**
 * Standard Elo Expected Score calculation (FIDE Handbook B.02)
 * E = 1 / (1 + 10 ^ ((opponentRating - playerRating) / 400))
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Dynamic FIDE K-Factor determination:
 * - K=40 for new/provisional players (<30 games or rating <= 1200)
 * - K=20 for standard active community members (<2400)
 * - K=10 for master-level players (>=2400 Elo)
 */
export function getKFactor(matchesPlayed: number, currentRating: number): number {
  if (matchesPlayed < 30 || currentRating <= 1200) return 40;
  if (currentRating >= 2400) return 10;
  return 20;
}

/**
 * Calculates simultaneous FIDE rating adjustments for a two-player match
 */
export function calculateMatchFideRatingChanges(
  whiteRating: number,
  blackRating: number,
  result: '1-0' | '0-1' | '1/2-1/2' | '1F-0F' | '0F-1F',
  whiteGames = 25,
  blackGames = 25
): {
  whiteDelta: number;
  blackDelta: number;
  whiteExpected: number;
  blackExpected: number;
  newWhiteRating: number;
  newBlackRating: number;
} {
  const whiteExpected = calculateExpectedScore(whiteRating, blackRating);
  const blackExpected = 1 - whiteExpected;

  let whiteActual = 0.5;
  let blackActual = 0.5;

  if (result === '1-0' || result === '1F-0F') {
    whiteActual = 1;
    blackActual = 0;
  } else if (result === '0-1' || result === '0F-1F') {
    whiteActual = 0;
    blackActual = 1;
  } else if (result === '1/2-1/2') {
    whiteActual = 0.5;
    blackActual = 0.5;
  }

  const whiteK = getKFactor(whiteGames, whiteRating);
  const blackK = getKFactor(blackGames, blackRating);

  const whiteDelta = Math.round(whiteK * (whiteActual - whiteExpected));
  const blackDelta = Math.round(blackK * (blackActual - blackExpected));

  return {
    whiteDelta,
    blackDelta,
    whiteExpected: Number(whiteExpected.toFixed(3)),
    blackExpected: Number(blackExpected.toFixed(3)),
    newWhiteRating: Math.max(0, whiteRating + whiteDelta),
    newBlackRating: Math.max(0, blackRating + blackDelta),
  };
}

/**
 * Calculates new rating and change for an individual match result.
 * resultScore: 1 for Win, 0.5 for Draw, 0 for Loss
 */
export function calculateRatingAdjustment(
  playerRating: number,
  opponentRating: number,
  resultScore: 1 | 0.5 | 0,
  matchesPlayed: number = 25
): { newRating: number; ratingDiff: number; expectedScore: number } {
  const expected = calculateExpectedScore(playerRating, opponentRating);
  const k = getKFactor(matchesPlayed, playerRating);
  const diff = Math.round(k * (resultScore - expected));
  const newRating = Math.max(0, playerRating + diff);

  return {
    newRating,
    ratingDiff: diff,
    expectedScore: Number(expected.toFixed(3)),
  };
}
