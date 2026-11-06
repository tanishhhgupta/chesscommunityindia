import { CCIRankTier } from '../chess/eloEngine';

// ============================================================================
// USER & ACCESS CONTROL ROLES
// ============================================================================
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ARBITER' | 'PLAYER' | 'PUBLIC_VIEWER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  playerId?: string; // Linked player profile if role is PLAYER
  assignedTournamentIds?: string[]; // For arbiters with limited assignment
}

// ============================================================================
// CANONICAL 6 CCI RATING CATEGORIES
// ============================================================================
export const CANONICAL_CCI_CATEGORIES: CCIRankTier[] = [
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
    description: "Spotting forks, pins, and skewers. Turning tactical awareness into decisive advantage.",
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
    description: "Controlling outposts, pawn structures, and navigating middlegame conversions.",
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
    description: "Acute calculation, opening repertoire depth, and fierce tournament resilience.",
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
    description: "Master-level endgame technique, psychological endurance, and national circuit mastery.",
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

export function getCanonicalCategory(rating: number): CCIRankTier {
  const bounded = Math.max(0, rating);
  for (const cat of CANONICAL_CCI_CATEGORIES) {
    if (bounded >= cat.minElo && bounded <= cat.maxElo) {
      return cat;
    }
  }
  if (bounded > 3000) {
    return CANONICAL_CCI_CATEGORIES[CANONICAL_CCI_CATEGORIES.length - 1];
  }
  return CANONICAL_CCI_CATEGORIES[0];
}

// ============================================================================
// PLAYER & PROFILE MODELS
// ============================================================================
export interface PlayerStatistics {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  totalPoints: number;
  winPercentage: number;
  tournamentAppearances: number;
  highestCciRating: number;
  currentCciRating: number;
  ratingChangeLast30Days: number;
  averageOpponentRating: number;
}

export interface Player {
  id: string;
  cciPlayerId: string; // Permanent format: CCI-000001
  userId?: string;

  name: string;
  photo: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'Other';

  city: string;
  state: string;
  country: string;

  // FIDE Ratings (Independent from CCI)
  fideId?: string;
  fideStandardRating: number;
  fideRapidRating: number;
  fideBlitzRating: number;

  // CCI Ratings (Separate pools)
  cciStandardRating: number;
  cciRapidRating: number;
  cciBlitzRating: number;

  // Derived Category based on current active rating pool
  currentCategory: CCIRankTier;

  chessComId?: string;
  lichessId?: string;
  chessTitle?: 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM' | 'Candidate';

  club?: string;
  school?: string;
  college?: string;

  status: 'ACTIVE' | 'WITHDRAWN' | 'ABSENT' | 'DISQUALIFIED' | 'COMPLETED';

  stats: PlayerStatistics;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TOURNAMENT MODEL
// ============================================================================
export type TournamentFormat = 'SWISS' | 'ROUND_ROBIN';
export type RatingType = 'STANDARD' | 'RAPID' | 'BLITZ';
export type TournamentStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';
export type TieBreakCriterion = 'POINTS' | 'BUCHHOLZ_CUT1' | 'BUCHHOLZ' | 'SONNEBORN_BERGER' | 'PROGRESSIVE' | 'WINS';

export interface Tournament {
  id: string;
  name: string;
  description: string;

  organizer: string;
  chiefArbiter: string;

  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;

  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;

  format: TournamentFormat;
  rounds: number;

  baseTime: number; // In minutes (e.g. 5, 10, 15, 90)
  increment: number; // In seconds (e.g. 2, 5, 10, 30)

  fideRated: boolean;
  cciRated: boolean;
  ratingType: RatingType;

  registrationDeadline: string;
  maxPlayers: number;

  entryFee: string;
  prizePool: string;

  status: TournamentStatus;
  currentRoundNumber: number;

  tieBreakOrder: TieBreakCriterion[];

  regulations?: string;
  bannerImage?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TOURNAMENT REGISTRATION / PARTICIPANT MODEL
// ============================================================================
export interface TournamentRegistration {
  tournamentId: string;
  playerId: string;
  seedNumber: number;
  initialRating: number;
  currentScore: number;
  status: 'ACTIVE' | 'WITHDRAWN' | 'ABSENT' | 'DISQUALIFIED';
  isConfirmed: boolean;
  attendance: 'PRESENT' | 'ABSENT' | 'WITHDRAWN';
  registeredAt: string;
  notes?: string;
}

// ============================================================================
// ROUND & PAIRING VERSION CONTROL
// ============================================================================
export type RoundStatus = 
  | 'DRAFT' 
  | 'PAIRINGS_GENERATED' 
  | 'LIVE' 
  | 'RESULTS_PARTIAL' 
  | 'RESULTS_COMPLETE' 
  | 'CLOSED';

export interface Round {
  id: string;
  tournamentId: string;
  number: number;
  status: RoundStatus;
  activePairingVersionId: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PairingVersion {
  id: string;
  tournamentId: string;
  roundId: string;
  roundNumber: number;
  versionNumber: number;
  generatedBy: string;
  generatedAt: string;
  reason: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export type MatchResult = 
  | '1-0' 
  | '0-1' 
  | '1/2-1/2' 
  | '1F-0F' 
  | '0F-1F' 
  | '0F-0F' 
  | 'BYE' 
  | 'PENDING';

export interface Pairing {
  id: string;
  roundId: string;
  pairingVersionId: string;
  boardNumber: number;
  whitePlayerId: string;
  blackPlayerId: string | null; // null represents BYE
  result: MatchResult;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  whiteDelta?: number;
  blackDelta?: number;
  recordedBy?: string;
  recordedAt?: string;
  overrideReason?: string;
}

// ============================================================================
// STANDINGS & TIE-BREAKS
// ============================================================================
export interface TieBreaks {
  buchholzCut1: number;
  buchholz: number;
  sonnebornBerger: number;
  progressive: number;
  wins: number;
}

export interface StandingsRow {
  rank: number;
  playerId: string;
  player: Player;
  points: number;
  tieBreaks: TieBreaks;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  startingRank: number;
  startRating: number;
  liveRating: number;
  ratingChange: number;
  category: CCIRankTier;
}

// ============================================================================
// RATING HISTORY & OPPONENT HISTORY
// ============================================================================
export interface RatingHistoryRecord {
  id: string;
  playerId: string;
  tournamentId: string;
  tournamentName: string;
  ratingType: RatingType;
  ratingBefore: number;
  ratingChange: number;
  ratingAfter: number;
  categoryBefore: string;
  categoryAfter: string;
  date: string;
  createdAt: string;
}

export interface PlayerMatchHistoryRecord {
  id: string;
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  boardNumber: number;
  playerColor: 'WHITE' | 'BLACK';
  opponentId: string | null;
  opponentName: string;
  opponentRating: number;
  opponentCategory: string;
  result: MatchResult;
  playerPoints: number;
  ratingChange: number;
  date: string;
}

// ============================================================================
// AUDIT LOGS & DEPENDENCY IMPACT
// ============================================================================
export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  tournamentId?: string;
  tournamentName?: string;
  roundNumber?: number;
  details: string;
  beforeState?: any;
  afterState?: any;
}

export interface HistoricalCorrectionImpact {
  tournamentId: string;
  correctedRoundNumber: number;
  boardNumber: number;
  whitePlayerName: string;
  blackPlayerName: string;
  previousResult: MatchResult;
  newResult: MatchResult;
  affectedRounds: number[];
  affectedPlayerIds: string[];
  affectedPlayerNames: string[];
  warningMessage: string;
  canRegenerate: boolean;
}
