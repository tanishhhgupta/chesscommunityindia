/**
 * ChessPair Engine Types
 * Clean modular abstractions for Tournament Pairing Engines
 */

export type ChessColor = 'W' | 'B' | 'NONE';

export type GameResult =
  | '1-0'      // White wins
  | '0.5-0.5'  // Draw
  | '0-1'      // Black wins
  | '0-0'      // Double loss (0.0 pts each)
  | '1F-0'     // White wins by forfeit
  | '0-1F'     // Black wins by forfeit
  | '0F-0F'    // Double forfeit (0 pts each)
  | '1-0_BYE'  // Full-point bye (1.0 pt)
  | '0.5-BYE'  // Half-point bye (0.5 pt)
  | '0-BYE'    // Zero-point bye (0.0 pt)
  | 'UNPLAYED';// Game not yet played

export type ByeType = 'full_point' | 'half_point' | 'zero_point';

export type TiebreakRule =
  | 'buchholz_cut1'
  | 'buchholz_median'
  | 'buchholz_total'
  | 'sonneborn_berger'
  | 'direct_encounter'
  | 'most_blacks'
  | 'wins';

export interface EnginePlayer {
  id: string;
  name: string;
  rating: number;
  title?: string;
  federation?: string;
  seed: number;
  score: number;
  colorHistory: ChessColor[]; // History of colors per round
  opponentIds: string[];      // Opponents played so far
  receivedBye: boolean;       // Has player received a full/half bye already?
  isWithdrawn?: boolean;
}

export interface EnginePairing {
  boardNumber: number;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  isBye: boolean;
  byeType?: ByeType;
  byePoints?: number;
  notes?: string;
}

export interface EngineRoundHistoryGame {
  roundNumber: number;
  boardNumber: number;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  result: GameResult;
  isBye: boolean;
  byeType?: ByeType;
}

export interface EnginePairRoundParams {
  roundNumber: number;
  players: EnginePlayer[];
  previousRounds: EngineRoundHistoryGame[][];
  allowDownfloats?: boolean;
}

export interface EngineValidationIssue {
  type: 'rematch' | 'color_consecutive' | 'color_imbalance' | 'duplicate_bye' | 'unplayed_games' | 'other';
  severity: 'error' | 'warning' | 'info';
  message: string;
  boardNumber?: number;
  playerIds?: string[];
}

export interface EngineValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: EngineValidationIssue[];
}

export interface PlayerRoundDetail {
  roundNumber: number;
  boardNumber: number;
  opponentId: string | null;
  opponentName: string;
  opponentRating: number;
  color: ChessColor;
  result: GameResult;
  pointsEarned: number;
}

export interface EngineStanding {
  rank: number;
  playerId: string;
  playerName: string;
  rating: number;
  title?: string;
  federation?: string;
  score: number;
  buchholzCut1: number;
  buchholzMedian: number;
  buchholzTotal: number;
  sonnebornBerger: number;
  directEncounter: number;
  wins: number;
  blacks: number;
  roundDetails: PlayerRoundDetail[];
}

export interface EngineMetadata {
  id: string;
  name: string;
  description: string;
  isFideCertified: boolean;
  certificationNotice: string;
  supportedFormats: ('basic_swiss' | 'round_robin' | 'knockout' | 'team')[];
}

/**
 * Tournament Engine Interface
 * All pairing engines implement this contract.
 */
export interface TournamentEngine {
  getMetadata(): EngineMetadata;
  pairRound(params: EnginePairRoundParams): EnginePairing[];
  validatePairings(
    pairings: EnginePairing[],
    players: EnginePlayer[],
    previousRounds: EngineRoundHistoryGame[][]
  ): EngineValidationResult;
  calculateStandings(
    players: EnginePlayer[],
    rounds: EngineRoundHistoryGame[][],
    tiebreakOrder?: TiebreakRule[]
  ): EngineStanding[];
}
