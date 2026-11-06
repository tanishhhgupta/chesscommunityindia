/**
 * Chess Community India — ChessManager to ChessPair Real-Time Synchronization Bridge
 * 
 * Provides an authoritative bidirectional synchronization between the ChessManager
 * tournament desk (backend operations) and the public Chess Pair platform.
 * 
 * Guarantees:
 * 1. Single authoritative data source using shared storage.
 * 2. Instant real-time updates across iframe / cross-tab storage events.
 * 3. Exact reflection of publication permissions (drafts stay hidden).
 * 4. Deduplication of player registries and tournament entities.
 */

import { db } from './storage';
import { chessManagerBackend } from './chessManagerBackend';
import { tournamentRepository } from '../../lib/domain/store/tournamentRepository';
import { getCCICategory } from './cciAdapter';
import { TournamentStatus as DomainTournamentStatus, MatchResult } from '../../lib/domain/types';

export class ChessPairSyncBridge {
  private static isInitialized = false;

  /**
   * Synchronizes all published ChessManager tournaments and master players into tournamentRepository.
   */
  public static syncAllChessManagerDataToDomain(): void {
    try {
      const orgId = db.getActiveOrgId();
      const cpTournaments = db.getTournaments(orgId);
      const cpPlayers = db.getPlayers(orgId);

      // 1. Synchronize Players into Domain Repository
      for (const cpPlayer of cpPlayers) {
        const existing = tournamentRepository.getPlayerById(cpPlayer.id) || 
                         (cpPlayer.fideId ? tournamentRepository.getAllPlayers().find(p => p.fideId === cpPlayer.fideId) : null);
        
        const rating = cpPlayer.rating || 1000;
        const category = getCCICategory(rating);
        const cciPlayerId = (cpPlayer as any).cciPlayerId || cpPlayer.localId || `CCI-${cpPlayer.id.replace(/[^0-9]/g, '').slice(-6).padStart(6, '0')}`;

        if (!existing) {
          try {
            tournamentRepository.createPlayer({
              id: cpPlayer.id,
              name: cpPlayer.name,
              cciPlayerId,
              email: cpPlayer.email || '',
              phone: cpPlayer.phone || '',
              city: (cpPlayer as any).city || cpPlayer.club || 'Jabalpur',
              fideId: cpPlayer.fideId,
              chessTitle: cpPlayer.title !== 'None' ? (cpPlayer.title as any) : undefined,
              fideStandardRating: cpPlayer.ratingClassic || rating,
              fideRapidRating: cpPlayer.ratingRapid || rating,
              fideBlitzRating: cpPlayer.ratingBlitz || rating,
              cciStandardRating: rating,
              cciRapidRating: cpPlayer.ratingRapid || rating,
              cciBlitzRating: cpPlayer.ratingBlitz || rating,
            });
          } catch {
            // Already handled
          }
        } else {
          tournamentRepository.updatePlayer(existing.id, {
            name: cpPlayer.name,
            cciStandardRating: rating,
            fideStandardRating: cpPlayer.ratingClassic || rating,
            fideRapidRating: cpPlayer.ratingRapid || rating,
            fideBlitzRating: cpPlayer.ratingBlitz || rating,
            city: (cpPlayer as any).city || cpPlayer.club || existing.city,
            fideId: cpPlayer.fideId || existing.fideId,
            chessTitle: cpPlayer.title !== 'None' ? (cpPlayer.title as any) : existing.chessTitle,
          });
        }
      }

      // 2. Synchronize Tournaments
      for (const cpTourney of cpTournaments) {
        const isPublic = cpTourney.isPublic !== false;
        const existingTourney = tournamentRepository.getTournamentById(cpTourney.id);

        let domainStatus: DomainTournamentStatus = 'UPCOMING';
        if (cpTourney.status === 'in_progress') domainStatus = 'LIVE';
        else if (cpTourney.status === 'completed' || cpTourney.status === 'archived') domainStatus = 'COMPLETED';
        else if (cpTourney.status === 'draft') domainStatus = 'DRAFT' as any;

        if (existingTourney) {
          if (!isPublic) {
            // If unpublished, mark draft / private
            existingTourney.status = 'DRAFT' as any;
          } else {
            existingTourney.name = cpTourney.name;
            existingTourney.city = cpTourney.city || existingTourney.city;
            existingTourney.venue = cpTourney.venue || existingTourney.venue;
            existingTourney.chiefArbiter = cpTourney.chiefArbiter || existingTourney.chiefArbiter;
            existingTourney.rounds = cpTourney.roundsCount;
            existingTourney.status = domainStatus;
          }
        } else if (isPublic) {
          try {
            tournamentRepository.createTournament({
              id: cpTourney.id,
              name: cpTourney.name,
              description: cpTourney.description || 'Sanctioned Swiss Tournament',
              city: cpTourney.city || 'Jabalpur',
              rounds: cpTourney.roundsCount,
              format: cpTourney.format === 'round_robin' ? 'ROUND_ROBIN' : 'SWISS',
              status: domainStatus,
              ratingType: cpTourney.timeControlCategory === 'blitz' ? 'BLITZ' : 'RAPID',
              venue: cpTourney.venue || 'CCI Chess Arena',
              organizer: 'Chess Community India',
              chiefArbiter: cpTourney.chiefArbiter || 'Chief Arbiter',
            });
          } catch {
            // Already created
          }
        }
      }

      tournamentRepository.notifyListeners();
    } catch (err) {
      console.warn('[ChessPairSyncBridge] sync error:', err);
    }
  }

  /**
   * Initializes listeners for storage events and cross-frame messages.
   */
  public static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Initial synchronization pass
    this.syncAllChessManagerDataToDomain();

    // Listen for custom event from same window
    window.addEventListener('chesspair-data-updated', () => {
      this.syncAllChessManagerDataToDomain();
      window.dispatchEvent(new CustomEvent('cci-domain-db-synced', { detail: { timestamp: Date.now() } }));
    });

    // Listen for storage events from cross-tab / iframe
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('chesspair_')) {
        this.syncAllChessManagerDataToDomain();
        window.dispatchEvent(new CustomEvent('cci-domain-db-synced', { detail: { timestamp: Date.now() } }));
      }
    });

    // Listen for postMessage from ChessManager iframe
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'CHESSPAIR_DATA_UPDATED') {
        this.syncAllChessManagerDataToDomain();
        window.dispatchEvent(new CustomEvent('cci-domain-db-synced', { detail: { timestamp: Date.now() } }));
      }
    });
  }
}
