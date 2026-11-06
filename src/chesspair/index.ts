/**
 * Chess Manager / Chess Pair - Backend Module
 * 
 * Provides complete tournament lifecycle management, Swiss & Round Robin pairing engines,
 * tiebreak algorithms (Buchholz, Sonneborn-Berger), multi-tenant data isolation,
 * CSV import/export, and immutable audit logs.
 */

// Core Services
export * from './lib/chessManagerBackend';
export * from './lib/storage';
export * from './lib/mockData';
export * from './lib/csv';
export * from './lib/export';
export * from './lib/supabase';
export * from './lib/cciAdapter';

// Pairing Engines & Algorithms
export * from './engine';

// Domain Types
export type {
  UserRole,
  UserProfile,
  Organization,
  OrganizationMember,
  ChessTitle,
  Player,
  Tournament,
  TournamentPlayer,
  Round,
  RoundStatus,
  Pairing,
  AuditLog,
  TimeControlCategory,
  TournamentStatus,
} from './types';
