import { describe, it, expect } from 'vitest';
import { BasicSwissEngine } from '../SwissEngine';
import { EnginePlayer, EngineRoundHistoryGame } from '../types';

describe('BasicSwissEngine', () => {
  const engine = new BasicSwissEngine();

  const mock8Players: EnginePlayer[] = [
    { id: 'p1', name: 'Magnus Carlsen', rating: 2830, seed: 1, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p2', name: 'Hikaru Nakamura', rating: 2800, seed: 2, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p3', name: 'Fabiano Caruana', rating: 2790, seed: 3, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p4', name: 'Alireza Firouzja', rating: 2760, seed: 4, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p5', name: 'Wesley So', rating: 2750, seed: 5, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p6', name: 'Ding Liren', rating: 2740, seed: 6, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p7', name: 'Ian Nepomniachtchi', rating: 2730, seed: 7, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    { id: 'p8', name: 'Anish Giri', rating: 2720, seed: 8, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
  ];

  it('correctly pairs Round 1 top-half against bottom-half', () => {
    const pairings = engine.pairRound({
      roundNumber: 1,
      players: mock8Players,
      previousRounds: [],
    });

    expect(pairings).toHaveLength(4);

    // Board 1: Seed 1 (p1) vs Seed 5 (p5)
    expect(pairings[0].whitePlayerId).toBe('p1');
    expect(pairings[0].blackPlayerId).toBe('p5');

    // Board 2: Seed 2 (p2) vs Seed 6 (p6), alternating colors: Seed 6 gets White, Seed 2 gets Black
    expect(pairings[1].whitePlayerId).toBe('p6');
    expect(pairings[1].blackPlayerId).toBe('p2');

    // Board 3: Seed 3 (p3) vs Seed 7 (p7)
    expect(pairings[2].whitePlayerId).toBe('p3');
    expect(pairings[2].blackPlayerId).toBe('p7');

    // Board 4: Seed 4 (p4) vs Seed 8 (p8)
    expect(pairings[3].whitePlayerId).toBe('p8');
    expect(pairings[3].blackPlayerId).toBe('p4');
  });

  it('allocates bye to lowest-rated player when player count is odd', () => {
    const odd7Players = mock8Players.slice(0, 7); // p1 to p7

    const pairings = engine.pairRound({
      roundNumber: 1,
      players: odd7Players,
      previousRounds: [],
    });

    expect(pairings).toHaveLength(4); // 3 regular boards + 1 bye board

    const byeBoard = pairings.find((p) => p.isBye);
    expect(byeBoard).toBeDefined();
    expect(byeBoard?.whitePlayerId).toBe('p7'); // p7 is lowest rated
    expect(byeBoard?.byePoints).toBe(1.0);
  });

  it('never assigns a second bye to a player who already received one', () => {
    const odd7Players = mock8Players.slice(0, 7).map((p) => {
      if (p.id === 'p7') {
        return {
          ...p,
          score: 1.0,
          receivedBye: true,
          colorHistory: ['NONE' as const],
          opponentIds: [],
        };
      }
      return {
        ...p,
        score: 1.0,
        receivedBye: false,
        colorHistory: ['W' as const],
        opponentIds: ['opp'],
      };
    });

    const pairings = engine.pairRound({
      roundNumber: 2,
      players: odd7Players,
      previousRounds: [],
    });

    const byeBoard = pairings.find((p) => p.isBye);
    expect(byeBoard).toBeDefined();
    // p7 already received bye, so p7 CANNOT receive the bye in Round 2
    expect(byeBoard?.whitePlayerId).not.toBe('p7');
  });

  it('pairs Round 2 strictly within score groups and prevents rematches', () => {
    // Round 1 results:
    // p1 won vs p5
    // p2 won vs p6
    // p3 won vs p7
    // p4 won vs p8
    const r2Players: EnginePlayer[] = [
      { ...mock8Players[0], score: 1.0, colorHistory: ['W'], opponentIds: ['p5'] },
      { ...mock8Players[1], score: 1.0, colorHistory: ['B'], opponentIds: ['p6'] },
      { ...mock8Players[2], score: 1.0, colorHistory: ['W'], opponentIds: ['p7'] },
      { ...mock8Players[3], score: 1.0, colorHistory: ['B'], opponentIds: ['p8'] },
      { ...mock8Players[4], score: 0.0, colorHistory: ['B'], opponentIds: ['p1'] },
      { ...mock8Players[5], score: 0.0, colorHistory: ['W'], opponentIds: ['p2'] },
      { ...mock8Players[6], score: 0.0, colorHistory: ['B'], opponentIds: ['p3'] },
      { ...mock8Players[7], score: 0.0, colorHistory: ['W'], opponentIds: ['p4'] },
    ];

    const r2Pairings = engine.pairRound({
      roundNumber: 2,
      players: r2Players,
      previousRounds: [],
    });

    expect(r2Pairings).toHaveLength(4);

    // Winners (p1, p2, p3, p4) must play each other on boards 1 and 2
    const winnerIds = new Set(['p1', 'p2', 'p3', 'p4']);
    expect(winnerIds.has(r2Pairings[0].whitePlayerId!)).toBe(true);
    expect(winnerIds.has(r2Pairings[0].blackPlayerId!)).toBe(true);
    expect(winnerIds.has(r2Pairings[1].whitePlayerId!)).toBe(true);
    expect(winnerIds.has(r2Pairings[1].blackPlayerId!)).toBe(true);

    // Losers (p5, p6, p7, p8) must play each other on boards 3 and 4
    const loserIds = new Set(['p5', 'p6', 'p7', 'p8']);
    expect(loserIds.has(r2Pairings[2].whitePlayerId!)).toBe(true);
    expect(loserIds.has(r2Pairings[2].blackPlayerId!)).toBe(true);
    expect(loserIds.has(r2Pairings[3].whitePlayerId!)).toBe(true);
    expect(loserIds.has(r2Pairings[3].blackPlayerId!)).toBe(true);

    // No repeat matches
    for (const p of r2Pairings) {
      const white = r2Players.find((pl) => pl.id === p.whitePlayerId)!;
      expect(white.opponentIds).not.toContain(p.blackPlayerId);
    }
  });

  it('validates manual arbiter swaps and flags rematches as errors', () => {
    const playersWithHistory: EnginePlayer[] = [
      { ...mock8Players[0], opponentIds: ['p2'] },
      { ...mock8Players[1], opponentIds: ['p1'] },
    ];

    const illegalPairing = [
      {
        boardNumber: 1,
        whitePlayerId: 'p1',
        blackPlayerId: 'p2',
        isBye: false,
      },
    ];

    const validation = engine.validatePairings(illegalPairing, playersWithHistory, []);
    expect(validation.isValid).toBe(false);
    expect(validation.hasErrors).toBe(true);
    expect(validation.issues.some((i) => i.type === 'rematch')).toBe(true);
  });

  it('calculates accurate tournament standings and tiebreaks', () => {
    // 4 players, 2 rounds
    const players: EnginePlayer[] = [
      { id: 'A', name: 'Alice', rating: 2000, seed: 1, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'B', name: 'Bob', rating: 1900, seed: 2, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'C', name: 'Charlie', rating: 1800, seed: 3, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
      { id: 'D', name: 'Diana', rating: 1700, seed: 4, score: 0, colorHistory: [], opponentIds: [], receivedBye: false },
    ];

    // Round 1:
    // Board 1: Alice (W) vs Charlie (B) -> Alice wins 1-0
    // Board 2: Bob (W) vs Diana (B) -> Bob wins 1-0
    const round1: EngineRoundHistoryGame[] = [
      { roundNumber: 1, boardNumber: 1, whitePlayerId: 'A', blackPlayerId: 'C', result: '1-0', isBye: false },
      { roundNumber: 1, boardNumber: 2, whitePlayerId: 'B', blackPlayerId: 'D', result: '1-0', isBye: false },
    ];

    // Round 2:
    // Board 1: Alice (W) vs Bob (B) -> Alice wins 1-0
    // Board 2: Charlie (W) vs Diana (B) -> Draw 0.5-0.5
    const round2: EngineRoundHistoryGame[] = [
      { roundNumber: 2, boardNumber: 1, whitePlayerId: 'A', blackPlayerId: 'B', result: '1-0', isBye: false },
      { roundNumber: 2, boardNumber: 2, whitePlayerId: 'C', blackPlayerId: 'D', result: '0.5-0.5', isBye: false },
    ];

    const standings = engine.calculateStandings(players, [round1, round2]);

    // Alice: 2.0 pts (defeated C [0.5] and B [1.0]) -> Buchholz = 1.5, SB = 1.5
    // Bob: 1.0 pt (defeated D [0.5], lost to A [2.0]) -> Buchholz = 2.5, SB = 0.5
    // Charlie: 0.5 pt (lost to A [2.0], drew D [0.5]) -> Buchholz = 2.5, SB = 0.25
    // Diana: 0.5 pt (lost to B [1.0], drew C [0.5]) -> Buchholz = 1.5, SB = 0.25

    expect(standings[0].playerId).toBe('A');
    expect(standings[0].score).toBe(2.0);
    expect(standings[0].buchholzTotal).toBe(1.5);
    expect(standings[0].sonnebornBerger).toBe(1.5);

    expect(standings[1].playerId).toBe('B');
    expect(standings[1].score).toBe(1.0);
    expect(standings[1].buchholzTotal).toBe(2.5);
    expect(standings[1].sonnebornBerger).toBe(0.5);

    expect(standings[2].playerId).toBe('C');
    expect(standings[2].score).toBe(0.5);

    expect(standings[3].playerId).toBe('D');
    expect(standings[3].score).toBe(0.5);
  });
});
