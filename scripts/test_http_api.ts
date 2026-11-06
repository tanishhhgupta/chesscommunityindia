/**
 * HTTP Integration Test for Public API Endpoints & Real-Time Sync
 */

async function testHttpEndpoints() {
  const baseUrl = 'http://localhost:3000';
  console.log('Testing live HTTP endpoints on', baseUrl);

  // 1. GET /api/public/sync-status
  const statusRes = await fetch(`${baseUrl}/api/public/sync-status`);
  const statusJson = await statusRes.json();
  console.log('1. /api/public/sync-status:', statusRes.status, statusJson);
  if (statusRes.status !== 200 || statusJson.status !== 'synced') {
    throw new Error('sync-status failed');
  }

  // 2. GET /api/public/tournaments
  const tourneysRes = await fetch(`${baseUrl}/api/public/tournaments`);
  const tourneysJson = await tourneysRes.json();
  console.log('2. /api/public/tournaments count:', tourneysJson.tournaments?.length);
  if (tourneysRes.status !== 200 || !Array.isArray(tourneysJson.tournaments)) {
    throw new Error('tournaments fetch failed');
  }

  const sampleTourney = tourneysJson.tournaments[0];
  if (sampleTourney) {
    // 3. GET /api/public/tournaments/:id/standings
    const standingsRes = await fetch(`${baseUrl}/api/public/tournaments/${sampleTourney.id}/standings`);
    const standingsJson = await standingsRes.json();
    console.log(`3. /api/public/tournaments/${sampleTourney.id}/standings status:`, standingsRes.status, 'standings count:', standingsJson.standings?.length);

    // 4. GET /api/public/tournaments/:id/rounds
    const roundsRes = await fetch(`${baseUrl}/api/public/tournaments/${sampleTourney.id}/rounds`);
    const roundsJson = await roundsRes.json();
    console.log(`4. /api/public/tournaments/${sampleTourney.id}/rounds status:`, roundsRes.status, 'rounds count:', roundsJson.rounds?.length);
  }

  // 5. POST /api/public/events
  const postEventRes = await fetch(`${baseUrl}/api/public/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'CHESSPAIR_DATA_UPDATED', key: 'chesspair_pairings_v3' }),
  });
  const postEventJson = await postEventRes.json();
  console.log('5. POST /api/public/events status:', postEventRes.status, postEventJson);
  if (postEventRes.status !== 200 || !postEventJson.success) {
    throw new Error('POST /api/public/events failed');
  }

  // 6. Test Security: Unpublished/fake tournament returns 404
  const secretRes = await fetch(`${baseUrl}/api/public/tournaments/non-existent-secret-tourney`);
  console.log('6. Security check (404 expected for invalid tourney):', secretRes.status);
  if (secretRes.status !== 404) {
    throw new Error('Security check failed: expected 404');
  }

  console.log('\nAll Live HTTP API tests passed successfully!');
}

testHttpEndpoints().catch((err) => {
  console.error('HTTP test failed:', err);
  process.exit(1);
});
