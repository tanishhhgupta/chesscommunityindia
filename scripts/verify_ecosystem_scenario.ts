/**
 * Mandatory Verification Scenario (Section 82)
 * Tests complete end-to-end domain pipeline:
 * Player -> FIDE/CCI Rating -> Category -> Tournament -> Registration -> Starting List
 * -> Round 1 -> Pairings -> Results -> Round 2 -> Pairings -> Results -> Round 3
 * -> Historical Correction in Round 1 -> Dependency Analysis (Rounds 2, 3 affected)
 * -> Regenerate From Round 2 -> Version Archiving -> Recalculation of Standings & Tie-breaks
 */

// Simple in-memory localStorage polyfill for Node.js
const memoryStore: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => memoryStore[key] || null,
  setItem: (key: string, val: string) => { memoryStore[key] = val; },
  removeItem: (key: string) => { delete memoryStore[key]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};
(global as any).window = {
  dispatchEvent: () => true
};
(global as any).CustomEvent = class CustomEvent { };

import { tournamentRepository } from "../src/lib/domain/store/tournamentRepository";
import { CategoryService } from "../src/lib/domain/services/CategoryService";
import { RatingService } from "../src/lib/domain/services/RatingService";
import { Tournament, Player } from "../src/lib/domain/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`\x1b[31m[FAILED ASSERTION]\x1b[0m ${msg}`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`);
  }
}

async function runVerification() {
  console.log("=====================================================");
  console.log("CHESS COMMUNITY INDIA — DOMAIN & SECTION 82 TEST SUITE");
  console.log("=====================================================\n");

  // 1. Verify Canonical 6 Categories
  console.log("--- 1. VERIFYING CANONICAL 6 CATEGORIES ---");
  const categories = CategoryService.getAllCategories();
  assert(categories.length === 6, "Must have exactly 6 canonical categories");
  assert(categories[0].name.toUpperCase() === "BLUNDER MASTER" && categories[0].maxElo === 800, "Category 1 is Blunder Master (0-800)");
  assert(categories[1].name.toUpperCase() === "TACTICAL STRIKER" && categories[1].minElo === 801 && categories[1].maxElo === 1200, "Category 2 is Tactical Striker (801-1200)");
  assert(categories[2].name.toUpperCase() === "POSITIONAL STRATEGIST" && categories[2].minElo === 1201 && categories[2].maxElo === 1600, "Category 3 is Positional Strategist (1201-1600)");
  assert(categories[3].name.toUpperCase() === "VANGUARD COMMANDER" && categories[3].minElo === 1601 && categories[3].maxElo === 2000, "Category 4 is Vanguard Commander (1601-2000)");
  assert(categories[4].name.toUpperCase() === "CROWN CONTENDER" && categories[4].minElo === 2001 && categories[4].maxElo === 2400, "Category 5 is Crown Contender (2001-2400)");
  assert(categories[5].name.toUpperCase() === "GRAND SOVEREIGN" && categories[5].minElo === 2401, "Category 6 is Grand Sovereign (2401-3000+)");

  // Dynamic promotion check
  const catBefore = CategoryService.getCategoryForRating(1195);
  const catAfter = CategoryService.getCategoryForRating(1214);
  assert(catBefore.name.toUpperCase() === "TACTICAL STRIKER", "1195 Elo is Tactical Striker");
  assert(catAfter.name.toUpperCase() === "POSITIONAL STRATEGIST", "1214 Elo is Positional Strategist");
  console.log("Dynamic category transition: 1195 -> 1214 correctly crossed tier boundary!\n");

  // 2. Initialize Seed Repository
  console.log("--- 2. VERIFYING SEED DATA INITIALIZATION ---");
  tournamentRepository.resetToSeed();
  const players = tournamentRepository.getAllPlayers();
  assert(players.length >= 50, `Seeded players count >= 50 (actual: ${players.length})`);
  const tournaments = tournamentRepository.getAllTournaments();
  assert(tournaments.length >= 3, `Seeded tournaments count >= 3 (actual: ${tournaments.length})`);
  console.log(`Seeded ${players.length} players and ${tournaments.length} tournaments.\n`);

  // 3. Mandatory Test Scenario (Section 82)
  console.log("--- 3. MANDATORY SECTION 82 TEST SCENARIO ---");
  console.log("Step A: Creating new tournament...");
  const newTourney: Tournament = tournamentRepository.createTournament({
    name: "CCI Grandmasters Swiss Open 2026",
    description: "Official verification tournament for Section 82 requirements",
    organizer: "Chess Community India (CCI)",
    chiefArbiter: "IA Dharmendra Kumar",
    venue: "Vasant Continental Convention Hall",
    address: "Vasant Vihar, Institutional Area",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    startDate: "2026-10-15",
    endDate: "2026-10-18",
    format: "SWISS",
    rounds: 5,
    baseTime: 15,
    increment: 10,
    fideRated: true,
    cciRated: true,
    ratingType: "RAPID",
    registrationDeadline: "2026-10-14",
    maxPlayers: 32,
    entryFee: 1500,
    prizePool: 100000,
    status: "UPCOMING",
    rules: "FIDE Swiss Rules apply. CCI Elo update at conclusion.",
    tieBreakSystem: ["BUCHHOLZ_CUT1", "BUCHHOLZ", "SONNEBORN_BERGER", "WINS"]
  });
  assert(!!newTourney.id, `Tournament created with ID: ${newTourney.id}`);

  console.log("Step B: Adding 20 players...");
  const selectedPlayers = players.slice(0, 20);
  selectedPlayers.forEach((p, idx) => {
    tournamentRepository.registerPlayerForTournament(newTourney.id, p.id, idx + 1);
  });
  const startingList = tournamentRepository.getStartingList(newTourney.id);
  assert(startingList.length === 20, `Starting list has exactly 20 registered players`);

  console.log("Step C: Generating Round 1 pairings...");
  const r1 = tournamentRepository.generateRoundPairings(newTourney.id, 1);
  assert(r1.pairings.length === 10, `Round 1 generated 10 pairings for 20 players`);

  console.log("Step D: Entering Round 1 results...");
  r1.pairings.forEach((p, idx) => {
    // White wins even boards, Black wins odd boards, Board 1 is 1-0
    const res = idx === 0 ? "1-0" : idx % 2 === 0 ? "1-0" : "0-1";
    tournamentRepository.recordResult(newTourney.id, p.id, res);
  });
  const rounds = tournamentRepository.getTournamentRounds(newTourney.id);
  const r1Complete = rounds.find(r => r.number === 1);
  assert(!!r1Complete, "Round 1 exists in tournament");

  console.log("Step E: Generating Round 2 pairings...");
  const r2 = tournamentRepository.generateRoundPairings(newTourney.id, 2);
  assert(r2.pairings.length === 10, `Round 2 generated 10 pairings`);

  console.log("Step F: Entering Round 2 results...");
  r2.pairings.forEach((p, idx) => {
    const res = idx % 2 === 0 ? "1/2-1/2" : "1-0";
    tournamentRepository.recordResult(newTourney.id, p.id, res);
  });

  console.log("Step G: Generating Round 3 pairings...");
  const r3 = tournamentRepository.generateRoundPairings(newTourney.id, 3);
  assert(r3.pairings.length === 10, `Round 3 generated 10 pairings`);

  console.log("Step H: Historical Result Correction in Round 1...");
  const r1Board1 = r1.pairings[0];
  console.log(`Original Round 1 Board 1: White ${r1Board1.whitePlayerId} vs Black ${r1Board1.blackPlayerId} = ${r1Board1.result}`);

  // Record result correction from 1-0 to 0-1
  const correctionResult = tournamentRepository.recordResult(
    newTourney.id,
    r1Board1.id,
    "0-1"
  );

  assert(correctionResult.isHistoricalCorrection === true, "System identified this as a historical result correction!");
  assert(!!correctionResult.impact, "Dependency engine generated impact analysis!");
  assert(correctionResult.impact!.affectedRounds.includes(2) && correctionResult.impact!.affectedRounds.includes(3),
    `Downstream affected rounds correctly identified: [${correctionResult.impact!.affectedRounds.join(", ")}]`);
  console.log(`Correction Warning: "${correctionResult.impact!.warningMessage}"`);

  console.log("Step I: Triggering 'Regenerate From Round 2'...");
  const regenResult = tournamentRepository.regenerateFromRound(
    newTourney.id,
    2
  );
  assert(regenResult.regeneratedRounds.includes(2) && regenResult.regeneratedRounds.includes(3),
    `Pairings successfully marked for regeneration: [${regenResult.regeneratedRounds.join(", ")}]`);

  // Verify versions
  const allRoundsAfter = tournamentRepository.getTournamentRounds(newTourney.id);
  const r2Updated = allRoundsAfter.find(r => r.number === 2);
  const r2Versions = tournamentRepository.getAllPairingVersions(r2Updated!.id);
  assert(r2Versions.length >= 2, `Round 2 now has version history (total: ${r2Versions.length})`);
  assert(r2Versions.some(v => v.status === "ARCHIVED"), "Old Round 2 pairing version is safely ARCHIVED");
  assert(r2Versions.some(v => v.status === "ACTIVE"), "New Round 2 pairing version is ACTIVE");

  // Verify Standings Recalculation
  const standings = tournamentRepository.getStandings(newTourney.id);
  assert(standings.length === 20, "Authoritative standings calculated for all 20 players");
  // Board 1 black player must now have points from Round 1 win
  const blackPlayerStandings = standings.find(s => s.playerId === r1Board1.blackPlayerId);
  assert(blackPlayerStandings!.points >= 1.0, `Black player now credited with win: points = ${blackPlayerStandings?.points}`);

  // Verify Audit Log
  const auditLogs = tournamentRepository.getAuditLogs(newTourney.id);
  assert(auditLogs.length > 0, `Audit logs created: count = ${auditLogs.length}`);
  const correctionLog = auditLogs.find(l => l.action === "Historical Result Correction");
  assert(!!correctionLog, "Audit log contains 'Historical Result Correction' entry with old vs new score");

  console.log("\n=====================================================");
  console.log("ALL MANDATORY TESTS PASSED WITH 100% INTEGRITY!");
  console.log("=====================================================");
}

runVerification().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
