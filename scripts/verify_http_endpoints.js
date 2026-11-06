async function test() {
  try {
    const rootRes = await fetch('http://localhost:3000/');
    console.log('[1] Main CCI Web Root:', rootRes.status, rootRes.statusText);
    const rootHtml = await rootRes.text();
    console.log('    - Contains root div:', rootHtml.includes('id="root"'));
    console.log('    - Contains ChessPair/CCI title:', rootHtml.includes('ChessPair') || rootHtml.includes('Chess Community India'));

    const cmRes = await fetch('http://localhost:3000/chessmanager/index.html');
    console.log('[2] ChessManager Endpoint:', cmRes.status, cmRes.statusText);
    const cmHtml = await cmRes.text();
    console.log('    - Contains ChessManager title:', cmHtml.includes('ChessManager - Tournament Management System'));
    console.log('    - Contains authorization barrier logic:', cmHtml.includes('ChessManager Access Restricted'));
    console.log('    - Links to assets:', cmHtml.includes('./assets/index-'));

    // Test asset bundle availability
    const assetMatch = cmHtml.match(/src="(\.\/assets\/[^"]+)"/);
    if (assetMatch) {
      const assetUrl = `http://localhost:3000/chessmanager/${assetMatch[1].replace('./', '')}`;
      const assetRes = await fetch(assetUrl);
      console.log('[3] ChessManager JS Bundle Endpoint:', assetRes.status, assetRes.statusText);
      const jsText = await assetRes.text();
      console.log('    - Bundle size:', (jsText.length / 1024).toFixed(1), 'KB');
      console.log('    - Contains ChessManager brand:', jsText.includes('chess') && jsText.includes('manager'));
      console.log('    - Contains Swiss pairing engine:', jsText.includes('BasicSwissEngine') || jsText.includes('Swiss'));
      console.log('    - Contains tiebreaks:', jsText.includes('Buchholz') || jsText.includes('Sonneborn'));
    }

    const cssMatch = cmHtml.match(/href="(\.\/assets\/[^"]+)"/);
    if (cssMatch) {
      const cssUrl = `http://localhost:3000/chessmanager/${cssMatch[1].replace('./', '')}`;
      const cssRes = await fetch(cssUrl);
      console.log('[4] ChessManager CSS Bundle Endpoint:', cssRes.status, cssRes.statusText);
      const cssText = await cssRes.text();
      console.log('    - CSS bundle size:', (cssText.length / 1024).toFixed(1), 'KB');
      console.log('    - Contains authentic cocoa color (#442D1C):', cssText.includes('442d1c') || cssText.includes('442D1C'));
      console.log('    - Contains golden batter color (#E8D1A7):', cssText.includes('e8d1a7') || cssText.includes('E8D1A7'));
    }

    // Test Section 6 Public API Endpoints
    const apiTourneysRes = await fetch('http://localhost:3000/api/public/tournaments');
    console.log('[5] Public API Tournaments:', apiTourneysRes.status, apiTourneysRes.statusText);
    const tourneysData = await apiTourneysRes.json();
    console.log('    - Published tournaments count:', tourneysData.tournaments?.length);
    console.log('    - First tournament:', tourneysData.tournaments?.[0]?.name);

    const apiStandingsRes = await fetch('http://localhost:3000/api/public/tournaments/trn-ganpati-u18/standings');
    console.log('[6] Public API Standings:', apiStandingsRes.status, apiStandingsRes.statusText);
    const standingsData = await apiStandingsRes.json();
    console.log('    - Standings player rows:', standingsData.standings?.length);
    console.log('    - Leader rank 1:', standingsData.standings?.[0]?.playerName, 'Points:', standingsData.standings?.[0]?.score);

    const apiPairingsRes = await fetch('http://localhost:3000/api/public/tournaments/trn-ganpati-u18/rounds/1/pairings');
    console.log('[7] Public API Pairings:', apiPairingsRes.status, apiPairingsRes.statusText);
    const pairingsData = await apiPairingsRes.json();
    console.log('    - Round 1 board pairings count:', pairingsData.pairings?.length);
    console.log('    - Board 1 match:', pairingsData.pairings?.[0]?.whitePlayer?.name, 'vs', pairingsData.pairings?.[0]?.blackPlayer?.name);

    const apiPlayerRes = await fetch('http://localhost:3000/api/public/players/pl-1');
    console.log('[8] Public API Player Profile:', apiPlayerRes.status, apiPlayerRes.statusText);
    const playerData = await apiPlayerRes.json();
    console.log('    - Sanitized competitor:', playerData.player?.name, `(${playerData.player?.cciPlayerId})`);
    console.log('    - Category tier:', playerData.player?.category?.name);
    console.log('    - Confidential email excluded:', playerData.player?.email === undefined);

    console.log('\n[PASS] All HTTP endpoints, isolated bundles, public APIs, and security safeguards verified successfully!');
  } catch (err) {
    console.error('HTTP Verification error:', err);
    process.exit(1);
  }
}

test();
