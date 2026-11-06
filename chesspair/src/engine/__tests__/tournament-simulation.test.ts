import { describe, it, expect } from 'vitest';
import { BasicSwissEngine } from '../SwissEngine';
import { EnginePlayer, EngineRoundHistoryGame, GameResult } from '../types';

describe('Multi-round Swiss Tournament Simulation', () => {
  const engine = new BasicSwissEngine();

  it('runs a complete 3-round tournament with 5 players (odd field) deterministically', () => {
    // 5 players = guaranteed 1 bye per round
    const initialPlayers: EnginePlayer[] = [
      { id: 'p1', name: 'GM Magnus', rating: 2850, seed: 1, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'p2', name: 'IM Eric', rating: 2450, seed: 2, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'p3', name: 'FM Anna', rating: 2300, seed: 3, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'p4', name: 'Bob', rating: 1800, seed: 4, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'p5', name: 'Charlie', rating: 1500, seed: 5, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    ];

    let currentPlayers = [...initialPlayers];
    const previousRounds: EngineRoundHistoryGame[][] = [];
    const byeRecipients: string[] = [];

    // --- ROUND 1 ---
    const r1Pairings = engine.pairRound({
      roundNumber: 1,
      players: currentPlayers,
      previousRounds,
    });

    expect(r1Pairings).toHaveLength(3); // 2 boards + 1 bye
    const r1Bye = r1Pairings.find((p) => p.isBye);
    expect(r1Bye).toBeDefined();
    // Charlie (p5) has lowest rating, gets R1 bye
    expect(r1Bye?.whitePlayerId).toBe('p5');
    byeRecipients.push(r1Bye!.whitePlayerId!);

    // Simulate R1 results:
    // Board 1: p1 vs p3 -> p1 wins (1-0)
    // Board 2: p4 vs p2 -> p2 wins (0-1)
    // Board 3: p5 Bye -> 1-0_BYE (1.0)
    const r1Games: EngineRoundHistoryGame[] = [
      { roundNumber: 1, boardNumber: 1, whitePlayerId: 'p1', blackPlayerId: 'p3', result: '1-0', isBye: false },
      { roundNumber: 1, boardNumber: 2, whitePlayerId: 'p4', blackPlayerId: 'p2', result: '0-1', isBye: false },
      { roundNumber: 1, boardNumber: 3, whitePlayerId: 'p5', blackPlayerId: null, result: '1-0_BYE', isBye: true, byeType: 'full_point' },
    ];
    previousRounds.push(r1Games);

    // Update player state for R2
    currentPlayers = [
      { ...initialPlayers[0], score: 1.0, colorHistory: ['W'], opponentIds: ['p3'] },
      { ...initialPlayers[1], score: 1.0, colorHistory: ['B'], opponentIds: ['p4'] },
      { ...initialPlayers[2], score: 0.0, colorHistory: ['B'], opponentIds: ['p1'] },
      { ...initialPlayers[3], score: 0.0, colorHistory: ['W'], opponentIds: ['p2'] },
      { ...initialPlayers[4], score: 1.0, colorHistory: ['NONE'], opponentIds: [], receivedBye: true },
    ];

    // --- ROUND 2 ---
    const r2Pairings = engine.pairRound({
      roundNumber: 2,
      players: currentPlayers,
      previousRounds,
    });

    expect(r2Pairings).toHaveLength(3);
    const r2Bye = r2Pairings.find((p) => p.isBye);
    expect(r2Bye).toBeDefined();
    // Charlie (p5) cannot get bye again!
    expect(r2Bye?.whitePlayerId).not.toBe('p5');
    byeRecipients.push(r2Bye!.whitePlayerId!);

    // Check no duplicate bye recipients across rounds
    expect(new Set(byeRecipients).size).toBe(2);

    // Simulate R2 results
    const r2Games: EngineRoundHistoryGame[] = r2Pairings.map((p) => ({
      roundNumber: 2,
      boardNumber: p.boardNumber,
      whitePlayerId: p.whitePlayerId,
      blackPlayerId: p.blackPlayerId,
      result: p.isBye ? ('1-0_BYE' as GameResult) : ('0.5-0.5' as GameResult),
      isBye: p.isBye,
      byeType: p.byeType,
    }));
    previousRounds.push(r2Games);

    // Standings calculation check
    const standings = engine.calculateStandings(initialPlayers, previousRounds);
    expect(standings).toHaveLength(5);
    expect(standings[0].score).toBeGreaterThanOrEqual(standings[1].score);
    expect(standings[1].score).toBeGreaterThanOrEqual(standings[2].score);
  });
});
