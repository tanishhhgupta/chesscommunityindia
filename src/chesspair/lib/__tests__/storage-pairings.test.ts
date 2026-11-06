import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../storage';
import { INITIAL_PLAYERS, INITIAL_PAIRINGS } from '../mockData';

describe('Storage Pairings Player Resolution', () => {
  beforeEach(() => {
    // Mock minimal localStorage for Node vitest environment
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      length: 0,
      key: () => null,
    };
  });

  it('populates whitePlayer and blackPlayer with names when retrieving pairings', () => {
    const pairings = db.getAllPairingsForTournament('trn-1');
    expect(pairings.length).toBeGreaterThan(0);

    pairings.forEach((p) => {
      if (p.whitePlayerId) {
        expect(p.whitePlayer).toBeDefined();
        expect(p.whitePlayer?.name).toBeTruthy();
        expect(p.whitePlayer?.id).toBe(p.whitePlayerId);
      }
      if (p.blackPlayerId) {
        expect(p.blackPlayer).toBeDefined();
        expect(p.blackPlayer?.name).toBeTruthy();
        expect(p.blackPlayer?.id).toBe(p.blackPlayerId);
      }
    });
  });

  it('populates whitePlayer and blackPlayer in getPairings for a specific round', () => {
    const round1Pairings = db.getPairings('rnd-1');
    expect(round1Pairings.length).toBeGreaterThan(0);

    const firstPairing = round1Pairings[0];
    expect(firstPairing.whitePlayer).toBeDefined();
    expect(firstPairing.whitePlayer?.name).toBeTruthy();
    expect(firstPairing.blackPlayer).toBeDefined();
    expect(firstPairing.blackPlayer?.name).toBeTruthy();
  });

  it('withdraws and reinstates a player correctly in storage', () => {
    const tournamentId = 'trn-1';
    const tournamentPlayers = db.getTournamentPlayers(tournamentId);
    expect(tournamentPlayers.length).toBeGreaterThan(0);

    const testPlayer = tournamentPlayers[0];
    const playerId = testPlayer.playerId;

    // Withdraw player
    db.withdrawPlayer(tournamentId, playerId, 1);
    const afterWithdraw = db.getTournamentPlayers(tournamentId);
    const withdrawnRecord = afterWithdraw.find((tp) => tp.playerId === playerId);
    expect(withdrawnRecord?.isWithdrawn).toBe(true);

    // Reinstate player
    db.reinstatePlayer(tournamentId, playerId);
    const afterReinstate = db.getTournamentPlayers(tournamentId);
    const reinstatedRecord = afterReinstate.find((tp) => tp.playerId === playerId);
    expect(reinstatedRecord?.isWithdrawn).toBe(false);
  });
});
