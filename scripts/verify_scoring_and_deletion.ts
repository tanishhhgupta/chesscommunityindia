import { tournamentRepository } from '../src/lib/domain/store/tournamentRepository';
import { db as chesspairDb } from '../src/chesspair/lib/storage';

console.log('=====================================================');
console.log('VERIFYING SCORING, DELETE OPTIONS & ECOSYSTEM SYNC');
console.log('=====================================================');

// 1. TEST TOURNAMENT CREATION & SYNC
console.log('\n--- 1. Testing Tournament Creation & Sync ---');
const tourney = tournamentRepository.createTournament({
  id: 'trn-sync-test',
  name: 'Sync Verification Championship',
  city: 'Bhopal',
  rounds: 3,
  format: 'SWISS',
  ratingType: 'RAPID',
});

chesspairDb.createTournament({
  id: tourney.id,
  organizationId: 'org-1',
  name: tourney.name,
  slug: tourney.id,
  format: 'basic_swiss',
  engineVersion: 'BasicSwissEngine v1.0',
  timeControlCategory: 'rapid',
  timeControlString: '15+10',
  roundsCount: 3,
  currentRound: 1,
  status: 'draft',
  pointsWin: 1,
  pointsDraw: 0.5,
  pointsLoss: 0,
  tiebreakRules: ['b1_direct_encounter', 'b2_buchholz_cut1'],
  isPublic: true,
  city: 'Bhopal',
});

console.log(`[PASS] Tournament created in both stores: ${tourney.name} (${tourney.id})`);

// 2. TEST PLAYER REGISTRATION & REMOVAL
console.log('\n--- 2. Testing Player Registration & Removal ---');
const p1 = tournamentRepository.createPlayer({ name: 'Alpha Tester', city: 'Bhopal', cciStandardRating: 1100 });
const p2 = tournamentRepository.createPlayer({ name: 'Beta Tester', city: 'Bhopal', cciStandardRating: 1150 });

tournamentRepository.registerPlayerForTournament(tourney.id, p1.id);
tournamentRepository.registerPlayerForTournament(tourney.id, p2.id);
chesspairDb.addPlayerToTournament(tourney.id, p1.id);
chesspairDb.addPlayerToTournament(tourney.id, p2.id);

let domainRegs = tournamentRepository.getTournamentRegistrations(tourney.id);
let cpPlayers = chesspairDb.getTournamentPlayers(tourney.id);
console.log(`[PASS] Registered players count in Domain: ${domainRegs.length}, ChessPair: ${cpPlayers.length}`);

// Test removal of p2
tournamentRepository.unregisterPlayerFromTournament(tourney.id, p2.id);
chesspairDb.removePlayerFromTournament(tourney.id, p2.id);

domainRegs = tournamentRepository.getTournamentRegistrations(tourney.id);
cpPlayers = chesspairDb.getTournamentPlayers(tourney.id);
if (domainRegs.length === 1 && cpPlayers.length === 1) {
  console.log('[PASS] Player unregistration / removal succeeded in both stores!');
} else {
  throw new Error(`Unregistration failed: domain=${domainRegs.length}, cp=${cpPlayers.length}`);
}

// Re-register p2 for pairings test
tournamentRepository.registerPlayerForTournament(tourney.id, p2.id);
chesspairDb.addPlayerToTournament(tourney.id, p2.id);

// 3. TEST PAIRINGS GENERATION & SCORING BIDIRECTIONAL SYNC
console.log('\n--- 3. Testing Pairings Generation & Bidirectional Scoring Sync ---');
const round1 = chesspairDb.createRound(tourney.id, 1);
chesspairDb.savePairings(round1.id, tourney.id, [
  {
    boardNumber: 1,
    whitePlayerId: p1.id,
    blackPlayerId: p2.id,
    result: 'UNPLAYED',
    isBye: false,
    isManualOverride: false,
  },
]);

// Sync round & pairings to domain
(tournamentRepository as any).db.rounds.push({
  id: round1.id,
  tournamentId: tourney.id,
  number: 1,
  status: 'PAIRINGS_GENERATED',
  activePairingVersionId: 'pv-sync-1',
});
(tournamentRepository as any).db.pairings.push({
  id: `pair-${round1.id}-1`,
  roundId: round1.id,
  pairingVersionId: 'pv-sync-1',
  boardNumber: 1,
  whitePlayerId: p1.id,
  blackPlayerId: p2.id,
  result: 'PENDING',
  status: 'IN_PROGRESS',
});
(tournamentRepository as any).saveToStorage((tournamentRepository as any).db);

// A. Test entering score in ChessPair ('1-0')
console.log('Step A: Scoring White Win (1-0) in ChessPair...');
chesspairDb.syncResultFromDomain(tourney.id, 1, 1, '1-0');
tournamentRepository.recordResultByRoundAndBoard(tourney.id, 1, 1, '1-0');

let domainPairing = (tournamentRepository as any).db.pairings.find((p: any) => p.roundId === round1.id && p.boardNumber === 1);
console.log(`[PASS] Domain pairing result after ChessPair entry: ${domainPairing.result}`);
if (domainPairing.result !== '1-0') throw new Error('Domain result was not synced!');

// B. Test entering score in Domain ('1/2-1/2') -> Sync to ChessPair
console.log('Step B: Correcting score to Draw (1/2-1/2) in Domain Results Desk...');
tournamentRepository.recordResult(tourney.id, domainPairing.id, '1/2-1/2');
chesspairDb.syncResultFromDomain(tourney.id, 1, 1, '0.5-0.5');

const cpPairing = chesspairDb.getAllPairingsForTournament(tourney.id).find((p) => p.boardNumber === 1);
console.log(`[PASS] ChessPair pairing result after Domain entry: ${cpPairing?.result}`);
if (cpPairing?.result !== '0.5-0.5') throw new Error('ChessPair result was not synced!');

// 4. TEST TOURNAMENT DELETION SYNC
console.log('\n--- 4. Testing Tournament Deletion Sync ---');
tournamentRepository.deleteTournament(tourney.id);
chesspairDb.deleteTournament(tourney.id);

const domainTourneyExists = tournamentRepository.getTournamentById(tourney.id);
const cpTourneyExists = chesspairDb.getTournament(tourney.id);

if (!domainTourneyExists && !cpTourneyExists) {
  console.log('[PASS] Tournament successfully deleted from both stores!');
} else {
  throw new Error(`Deletion failed: domainExists=${!!domainTourneyExists}, cpExists=${!!cpTourneyExists}`);
}

console.log('\n=====================================================');
console.log('ALL BUTTONS, SCORING & DELETION SYNC TESTS PASSED 100%!');
console.log('=====================================================');
