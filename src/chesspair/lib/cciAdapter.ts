/**
 * Chess Community India × ChessPair Adapter
 * 
 * Implements CCI-specific rating calculations, 6 rating categories,
 * multi-city affiliation, auditable rating histories, and role mapping
 * without modifying any ChessPair engine or pairing algorithms.
 */

import { calculateExpectedScore, getKFactor } from '../../lib/chess/eloEngine';
import { Player, UserRole } from '../types';
import { playerAuthStore, UserAccount } from '../../lib/storage/playerAuthStore';

export interface CCIRatingCategory {
  categoryNumber: number;
  categoryName: string;
  name: string;
  minElo: number;
  maxElo: number;
  badgeClass: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const CCI_CATEGORIES: CCIRatingCategory[] = [
  {
    categoryNumber: 1,
    categoryName: "Category 1",
    name: "Category 1 (Blunder Master)",
    minElo: 0,
    maxElo: 800,
    badgeClass: "bg-rose-950/40 text-rose-300 border-rose-800/40",
    badgeBg: "bg-rose-950/40",
    badgeText: "text-rose-400",
    description: "Ratings 0 to 800. Foundations, opening principles, and tactical discovery.",
  },
  {
    categoryNumber: 2,
    categoryName: "Category 2",
    name: "Category 2 (Tactical Striker)",
    minElo: 801,
    maxElo: 1200,
    badgeClass: "bg-amber-950/40 text-amber-300 border-amber-800/40",
    badgeBg: "bg-amber-950/40",
    badgeText: "text-amber-300",
    description: "Ratings 801 to 1,200. Initial entry tier (1,000 Elo) for newly registered players.",
  },
  {
    categoryNumber: 3,
    categoryName: "Category 3",
    name: "Category 3 (Positional Strategist)",
    minElo: 1201,
    maxElo: 1600,
    badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-800/40",
    badgeBg: "bg-cyan-950/40",
    badgeText: "text-cyan-300",
    description: "Ratings 1,201 to 1,600. Outpost control, pawn structures, and active piece play.",
  },
  {
    categoryNumber: 4,
    categoryName: "Category 4",
    name: "Category 4 (Vanguard Commander)",
    minElo: 1601,
    maxElo: 2000,
    badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
    badgeBg: "bg-emerald-950/40",
    badgeText: "text-emerald-300",
    description: "Ratings 1,601 to 2,000. Concrete calculation, opening repertoire, and club mastery.",
  },
  {
    categoryNumber: 5,
    categoryName: "Category 5",
    name: "Category 5 (Crown Contender)",
    minElo: 2001,
    maxElo: 2400,
    badgeClass: "bg-indigo-950/40 text-indigo-300 border-indigo-800/40",
    badgeBg: "bg-indigo-950/40",
    badgeText: "text-indigo-300",
    description: "Ratings 2,001 to 2,400. Candidate masters, psychological endurance, and national circuit prominence.",
  },
  {
    categoryNumber: 6,
    categoryName: "Category 6",
    name: "Category 6 (Grand Sovereign)",
    minElo: 2401,
    maxElo: 3000,
    badgeClass: "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/60",
    badgeBg: "bg-[#C5A059]/20",
    badgeText: "text-[#C5A059]",
    description: "Ratings 2,401 to 3,000. Pinnacle of competitive Indian chess brilliance and grandmaster-level play.",
  },
];

export const CCI_CORE_CITIES = ["Jabalpur", "Bhopal", "Indore", "Delhi"];

/**
 * Returns the exact CCI Rating Category for any Elo rating.
 * Newly registered player with 1,000 belongs to Category 2.
 */
export function getCCICategory(rating: number): CCIRatingCategory {
  const bounded = Math.max(0, rating);
  for (const cat of CCI_CATEGORIES) {
    if (bounded >= cat.minElo && bounded <= cat.maxElo) {
      return cat;
    }
  }
  if (bounded > 3000) {
    return CCI_CATEGORIES[CCI_CATEGORIES.length - 1];
  }
  return CCI_CATEGORIES[0];
}

export interface CCIRatingHistoryRecord {
  id: string;
  playerId: string;
  playerName: string;
  tournamentId: string;
  tournamentName: string;
  roundNumber?: number;
  boardNumber?: number;
  opponentId?: string;
  opponentName?: string;
  opponentRating?: number;
  previousRating: number;
  ratingChange: number;
  newRating: number;
  categoryBefore: string;
  categoryAfter: string;
  result?: string;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  dedupeKey: string;
}

const STORAGE_RATING_HISTORY_KEY = "cci_chesspair_rating_history_v1";

export class CCIRatingService {
  /**
   * Get all rating history records or filter by player
   */
  public static getRatingHistory(playerId?: string): CCIRatingHistoryRecord[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_RATING_HISTORY_KEY);
      const list: CCIRatingHistoryRecord[] = raw ? JSON.parse(raw) : [];
      if (playerId) {
        return list.filter((r) => r.playerId === playerId);
      }
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Record rating adjustment using official CCI formula and prevent duplicate processing
   */
  public static recordMatchRatingUpdate(params: {
    tournamentId: string;
    tournamentName: string;
    roundNumber: number;
    boardNumber: number;
    whitePlayer: { id: string; name: string; rating: number };
    blackPlayer: { id: string; name: string; rating: number };
    result: string; // '1-0' | '0.5-0.5' | '0-1'
    actorName?: string;
    actorId?: string;
  }): { whiteDelta: number; blackDelta: number } {
    if (typeof localStorage === "undefined") return { whiteDelta: 0, blackDelta: 0 };

    const dedupeKeyBase = `${params.tournamentId}_r${params.roundNumber}_b${params.boardNumber}`;
    const history = this.getRatingHistory();

    // Check if result already recorded for this board
    if (history.some((h) => h.dedupeKey.startsWith(dedupeKeyBase))) {
      return { whiteDelta: 0, blackDelta: 0 }; // Prevent duplicate updates
    }

    let whiteScore: 1 | 0.5 | 0 = 0.5;
    let blackScore: 1 | 0.5 | 0 = 0.5;

    if (params.result === '1-0' || params.result === '1F-0') {
      whiteScore = 1;
      blackScore = 0;
    } else if (params.result === '0-1' || params.result === '0-1F') {
      whiteScore = 0;
      blackScore = 1;
    } else if (params.result === '0.5-0.5' || params.result === '1/2-1/2') {
      whiteScore = 0.5;
      blackScore = 0.5;
    } else {
      return { whiteDelta: 0, blackDelta: 0 };
    }

    const whiteExpected = calculateExpectedScore(params.whitePlayer.rating, params.blackPlayer.rating);
    const blackExpected = calculateExpectedScore(params.blackPlayer.rating, params.whitePlayer.rating);

    const whiteK = getKFactor(25, params.whitePlayer.rating);
    const blackK = getKFactor(25, params.blackPlayer.rating);

    const whiteDelta = Math.round(whiteK * (whiteScore - whiteExpected));
    const blackDelta = Math.round(blackK * (blackScore - blackExpected));

    const newWhiteRating = Math.max(0, params.whitePlayer.rating + whiteDelta);
    const newBlackRating = Math.max(0, params.blackPlayer.rating + blackDelta);

    const whiteCatBefore = getCCICategory(params.whitePlayer.rating);
    const whiteCatAfter = getCCICategory(newWhiteRating);

    const blackCatBefore = getCCICategory(params.blackPlayer.rating);
    const blackCatAfter = getCCICategory(newBlackRating);

    const now = new Date().toISOString();

    const recordWhite: CCIRatingHistoryRecord = {
      id: `rh-${Date.now()}-w`,
      playerId: params.whitePlayer.id,
      playerName: params.whitePlayer.name,
      tournamentId: params.tournamentId,
      tournamentName: params.tournamentName,
      roundNumber: params.roundNumber,
      boardNumber: params.boardNumber,
      opponentId: params.blackPlayer.id,
      opponentName: params.blackPlayer.name,
      opponentRating: params.blackPlayer.rating,
      previousRating: params.whitePlayer.rating,
      ratingChange: whiteDelta,
      newRating: newWhiteRating,
      categoryBefore: whiteCatBefore.categoryName,
      categoryAfter: whiteCatAfter.categoryName,
      result: params.result,
      timestamp: now,
      actorId: params.actorId,
      actorName: params.actorName,
      dedupeKey: `${dedupeKeyBase}_w_${params.whitePlayer.id}`,
    };

    const recordBlack: CCIRatingHistoryRecord = {
      id: `rh-${Date.now()}-b`,
      playerId: params.blackPlayer.id,
      playerName: params.blackPlayer.name,
      tournamentId: params.tournamentId,
      tournamentName: params.tournamentName,
      roundNumber: params.roundNumber,
      boardNumber: params.boardNumber,
      opponentId: params.whitePlayer.id,
      opponentName: params.whitePlayer.name,
      opponentRating: params.whitePlayer.rating,
      previousRating: params.blackPlayer.rating,
      ratingChange: blackDelta,
      newRating: newBlackRating,
      categoryBefore: blackCatBefore.categoryName,
      categoryAfter: blackCatAfter.categoryName,
      result: params.result,
      timestamp: now,
      actorId: params.actorId,
      actorName: params.actorName,
      dedupeKey: `${dedupeKeyBase}_b_${params.blackPlayer.id}`,
    };

    history.unshift(recordWhite, recordBlack);
    localStorage.setItem(STORAGE_RATING_HISTORY_KEY, JSON.stringify(history));

    return { whiteDelta, blackDelta };
  }
}

/**
 * Maps the currently authenticated CCI user session to ChessPair role and profile
 */
export function mapCCISessionToChessPairRole(user: UserAccount | null): {
  role: UserRole;
  isAuthorizedAdmin: boolean;
  canManageTournaments: boolean;
  canInputResults: boolean;
  canManagePlayers: boolean;
} {
  if (!user) {
    return {
      role: 'viewer',
      isAuthorizedAdmin: false,
      canManageTournaments: false,
      canInputResults: false,
      canManagePlayers: false,
    };
  }

  if (user.role === 'admin') {
    return {
      role: 'admin',
      isAuthorizedAdmin: true,
      canManageTournaments: true,
      canInputResults: true,
      canManagePlayers: true,
    };
  }

  if (user.role === 'arbiter') {
    return {
      role: 'arbiter',
      isAuthorizedAdmin: true,
      canManageTournaments: true,
      canInputResults: true,
      canManagePlayers: true,
    };
  }

  // Normal player
  return {
    role: 'viewer',
    isAuthorizedAdmin: false,
    canManageTournaments: false,
    canInputResults: false,
    canManagePlayers: false,
  };
}
