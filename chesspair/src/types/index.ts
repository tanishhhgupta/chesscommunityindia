export type {
  GameResult,
  ByeType,
  TiebreakRule,
  ChessColor,
  EngineStanding,
  EnginePairing,
  EngineValidationResult,
  EnginePlayer,
  EngineRoundHistoryGame,
} from '../engine/types';

export type UserRole = 'owner' | 'admin' | 'organizer' | 'arbiter' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  fideId?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  country: string;
  website?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  user: UserProfile;
  joinedAt: string;
}

export type ChessTitle = 'GM' | 'IM' | 'WGM' | 'FM' | 'WIM' | 'CM' | 'WCM' | 'None';

export interface Player {
  id: string;
  organizationId: string;
  name: string;
  surname?: string;
  birthdate?: string;
  sex?: 'Male' | 'Female' | 'Other' | '';
  fideId?: string;
  nationalId?: string;
  localId?: string;
  rating: number;
  ratingClassic?: number;
  ratingRapid?: number;
  ratingBlitz?: number;
  ratingLocal?: number;
  ratingLocalRapid?: number;
  ratingLocalBlitz?: number;
  title: ChessTitle;
  federation: string;
  club?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  labels?: string;
  notes?: string;
  isActive: boolean;
  entryFeePaid?: boolean;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type TournamentFormat = 'basic_swiss' | 'round_robin' | 'knockout' | 'team' | 'fide_swiss';
export type TimeControlCategory = 'blitz' | 'rapid' | 'classical' | 'bullet' | 'custom';
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'archived';

export interface Tournament {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  format: TournamentFormat;
  engineVersion: string;
  timeControlCategory: TimeControlCategory;
  timeControlString: string;
  roundsCount: number;
  currentRound: number;
  status: TournamentStatus;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  tiebreakRules: any[];
  isPublic: boolean;
  venue?: string;
  city?: string;
  federation?: string;
  chiefArbiter?: string;
  deputyArbiter?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  playersCount?: number;
  showOnCalendar?: boolean;
  allowPlayerSignup?: boolean;
  isFideRated?: boolean;
  isLocalRated?: boolean;
  timeMinutes?: number;
  timeUnit?: string;
  incrementSeconds?: number;
  incrementUnit?: string;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  playerId: string;
  seedNumber: number;
  initialRating: number;
  isWithdrawn: boolean;
  withdrawnAtRound?: number;
  player?: Player;
  createdAt: string;
  isConfirmed?: boolean;
  isPaused?: boolean;
}

export type RoundStatus = 'draft' | 'published' | 'in_progress' | 'completed';

export interface Round {
  id: string;
  tournamentId: string;
  roundNumber: number;
  status: RoundStatus;
  pairingsLocked: boolean;
  pairedAt?: string;
  publishedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Pairing {
  id: string;
  roundId: string;
  tournamentId: string;
  boardNumber: number;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  whitePlayer?: Player;
  blackPlayer?: Player;
  result: any;
  isBye: boolean;
  byeType?: any;
  isManualOverride: boolean;
  manualReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  tournamentId?: string;
  actorId: string;
  actorName: string;
  action: 'GENERATE_PAIRINGS' | 'PUBLISH_ROUND' | 'ENTER_RESULT' | 'MANUAL_SWAP' | 'UPDATE_SETTINGS' | 'REGISTER_PLAYER' | 'WITHDRAW_PLAYER' | 'REINSTATE_PLAYER';
  details: Record<string, unknown>;
  createdAt: string;
}

export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canManageOrg: boolean;
    canInviteMembers: boolean;
    canManageTournaments: boolean;
    canManageRounds: boolean;
    canEnterResults: boolean;
    canManagePlayers: boolean;
    canViewAuditLogs: boolean;
  }
> = {
  owner: {
    canManageOrg: true,
    canInviteMembers: true,
    canManageTournaments: true,
    canManageRounds: true,
    canEnterResults: true,
    canManagePlayers: true,
    canViewAuditLogs: true,
  },
  admin: {
    canManageOrg: true,
    canInviteMembers: true,
    canManageTournaments: true,
    canManageRounds: true,
    canEnterResults: true,
    canManagePlayers: true,
    canViewAuditLogs: true,
  },
  organizer: {
    canManageOrg: false,
    canInviteMembers: false,
    canManageTournaments: true,
    canManageRounds: true,
    canEnterResults: true,
    canManagePlayers: true,
    canViewAuditLogs: true,
  },
  arbiter: {
    canManageOrg: false,
    canInviteMembers: false,
    canManageTournaments: false,
    canManageRounds: true,
    canEnterResults: true,
    canManagePlayers: true,
    canViewAuditLogs: true,
  },
  viewer: {
    canManageOrg: false,
    canInviteMembers: false,
    canManageTournaments: false,
    canManageRounds: false,
    canEnterResults: false,
    canManagePlayers: false,
    canViewAuditLogs: false,
  },
};
