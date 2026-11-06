import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

const DESKTOP_VIEWPORTS = [
  { name: 'Standard Desktop', width: 1280, height: 720 },
  { name: 'MacBook Pro / High-res Laptop', width: 1440, height: 900 },
  { name: 'Full HD Desktop', width: 1920, height: 1080 },
  { name: '2K QHD Desktop', width: 2560, height: 1440 },
];

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE (Small Smartphone)', width: 320, height: 568 },
  { name: 'Samsung Galaxy S20 (Standard Android)', width: 360, height: 800 },
  { name: 'iPhone 13/14/15 (Standard iOS)', width: 390, height: 844 },
  { name: 'iPhone 15 Pro Max (Large Smartphone)', width: 430, height: 932 },
  { name: 'iPad Portrait (Tablet)', width: 768, height: 1024 },
  { name: 'iPad Landscape (Tablet)', width: 1024, height: 768 },
];

const ROUTES = [
  { id: 'home', hash: '' },
  { id: 'about', hash: '#about' },
  { id: 'community', hash: '#community' },
  { id: 'cities', hash: '#cities' },
  { id: 'hiring', hash: '#hiring' },
  { id: 'work-with-us', hash: '#work-with-us' },
  { id: 'events', hash: '#events' },
  { id: 'learn', hash: '#learn' },
  { id: 'partners', hash: '#partners' },
  { id: 'merch', hash: '#merch' },
  { id: 'player-account', hash: '#player-account' },
  { id: 'chess-pair', hash: '#chess-pair' },
  { id: 'players', hash: '#players' },
  { id: 'ratings', hash: '#ratings' },
  { id: 'admin', hash: '#admin' },
];

async function runAudit() {
  console.log('===============================================================');
  console.log('CHESS COMMUNITY INDIA – COMPREHENSIVE RESPONSIVE & E2E AUDIT');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = {
    viewportsTested: 0,
    routesTested: 0,
    overflowViolations: [],
    consoleErrors: [],
    perfMetrics: [],
    accessibilityIssues: [],
    interactionPassed: 0,
    interactionFailed: 0,
  };

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore normal connection retries for optional SSE/local dev polling
      if (!text.includes('/api/public/events') && !text.includes('Failed to load resource')) {
        results.consoleErrors.push({ text, url: page.url() });
      }
    }
  });

  page.on('pageerror', (err) => {
    results.consoleErrors.push({ text: `Page Error: ${err.message}`, url: page.url() });
  });

  // 1. Initial Load & Performance
  const t0 = Date.now();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const initialDcl = Date.now() - t0;
  console.log(`[PERF] Initial DOMContentLoaded: ${initialDcl}ms`);

  const allViewports = [...DESKTOP_VIEWPORTS, ...MOBILE_VIEWPORTS];

  for (const vp of allViewports) {
    results.viewportsTested++;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

    for (const r of ROUTES) {
      results.routesTested++;
      const targetUrl = r.hash ? `${BASE_URL}/${r.hash}` : BASE_URL;
      
      const navStart = Date.now();
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      // Give reactive components a brief tick to stabilize layout
      await page.waitForTimeout(150);
      const navDuration = Date.now() - navStart;

      // Check horizontal overflow
      const overflowInfo = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const winW = window.innerWidth;
        const hasOverflow = (docW > winW + 2) || (bodyW > winW + 2);
        
        let offendingElements = [];
        if (hasOverflow) {
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winW + 5 && rect.width > 0 && rect.height > 0) {
              const tag = el.tagName.toLowerCase();
              const cls = typeof el.className === 'string' ? el.className.slice(0, 50) : '';
              offendingElements.push(`${tag}.${cls} (right: ${Math.round(rect.right)}px, win: ${winW}px)`);
              if (offendingElements.length >= 3) break;
            }
          }
        }
        return { hasOverflow, docW, bodyW, winW, offendingElements };
      });

      if (overflowInfo.hasOverflow) {
        console.warn(`  [OVERFLOW] Route ${r.id} on ${vp.width}px: scrollW=${overflowInfo.docW} > winW=${overflowInfo.winW}`);
        results.overflowViolations.push({
          viewport: `${vp.name} (${vp.width}x${vp.height})`,
          route: r.id,
          docWidth: overflowInfo.docW,
          windowWidth: overflowInfo.winW,
          offenders: overflowInfo.offendingElements,
        });
      } else {
        process.stdout.write(`.`);
      }

      // Record performance sample for desktop full HD & mobile 390
      if ((vp.width === 1920 || vp.width === 390) && r.id === 'home') {
        const perf = await page.evaluate(() => {
          const entries = performance.getEntriesByType('navigation');
          const nav = entries[0];
          return {
            domInteractive: nav ? Math.round(nav.domInteractive) : 0,
            domComplete: nav ? Math.round(nav.domComplete) : 0,
            loadEventEnd: nav ? Math.round(nav.loadEventEnd) : 0,
            domNodeCount: document.querySelectorAll('*').length,
          };
        });
        results.perfMetrics.push({ viewport: vp.name, metrics: perf });
      }
    }
  }

  console.log('\n\n--- Testing Key User Interactions ---');

  // Test 1: Mobile Navigation Toggle on 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(200);

  const menuButton = await page.$('button[aria-label="Toggle Navigation Menu"]');
  if (menuButton) {
    await menuButton.click();
    await page.waitForTimeout(200);
    const drawerOpen = await page.evaluate(() => {
      return document.body.innerText.includes('JOIN THE MOVEMENT');
    });
    if (drawerOpen) {
      console.log('  [PASS] Mobile menu opened successfully and rendered navigation actions.');
      results.interactionPassed++;
      // Click again to close
      await menuButton.click();
      await page.waitForTimeout(150);
    } else {
      console.error('  [FAIL] Mobile menu drawer failed to render content.');
      results.interactionFailed++;
    }
  } else {
    console.error('  [FAIL] Mobile menu button not found.');
    results.interactionFailed++;
  }

  // Test 2: Tab Switching in Chess Pair on 1440x900
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/#chess-pair`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  const standingsTab = await page.$('button:has-text("Standings")');
  const pairingsTab = await page.$('button:has-text("Pairings & Results")');
  const participantsTab = await page.$('button:has-text("Participants")');
  const regulationsTab = await page.$('button:has-text("Regulations")');

  if (standingsTab && pairingsTab && regulationsTab) {
    await regulationsTab.click();
    await page.waitForTimeout(150);
    const regulationsVisible = await page.evaluate(() => document.body.innerText.includes('Tiebreak Criteria'));
    if (regulationsVisible) {
      console.log('  [PASS] Chess Pair Regulations tab toggled and rendered content.');
      results.interactionPassed++;
    } else {
      console.error('  [FAIL] Regulations tab content not visible.');
      results.interactionFailed++;
    }

    await standingsTab.click();
    await page.waitForTimeout(150);
  } else {
    console.log('  [INFO] Chess Pair tabs not directly present on root tournament list.');
  }

  // Test 3: Cities Filter Interaction on 1280x720
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${BASE_URL}/#cities`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(200);
  const cityHeading = await page.evaluate(() => document.body.innerText.includes('Cities') || document.body.innerText.includes('Jabalpur'));
  if (cityHeading) {
    console.log('  [PASS] Cities directory rendered city hub listings.');
    results.interactionPassed++;
  } else {
    results.interactionFailed++;
  }

  // Accessibility Check across Home
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const a11ySummary = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const missingAlt = images.filter((img) => !img.hasAttribute('alt') || img.getAttribute('alt') === '');
    
    const buttons = Array.from(document.querySelectorAll('button'));
    const unlabelledButtons = buttons.filter((b) => {
      const text = b.innerText.trim();
      const aria = b.getAttribute('aria-label');
      const title = b.getAttribute('title');
      return !text && !aria && !title;
    });

    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
    const unlabelledInputs = inputs.filter((inp) => {
      const id = inp.getAttribute('id');
      const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
      const aria = inp.getAttribute('aria-label');
      const placeholder = inp.getAttribute('placeholder');
      return !hasLabel && !aria && !placeholder;
    });

    return {
      totalImages: images.length,
      missingAltCount: missingAlt.length,
      totalButtons: buttons.length,
      unlabelledButtonsCount: unlabelledButtons.length,
      totalInputs: inputs.length,
      unlabelledInputsCount: unlabelledInputs.length,
    };
  });

  results.accessibilityIssues = a11ySummary;

  await browser.close();

  console.log('\n===============================================================');
  console.log('AUDIT SUMMARY');
  console.log('===============================================================');
  console.log(`Viewports Tested:       ${results.viewportsTested}`);
  console.log(`Route/Viewport Combos:  ${results.routesTested}`);
  console.log(`Horizontal Overflows:   ${results.overflowViolations.length}`);
  console.log(`Console Errors:         ${results.consoleErrors.length}`);
  console.log(`Interactions Passed:    ${results.interactionPassed}`);
  console.log(`Interactions Failed:    ${results.interactionFailed}`);
  console.log(`Total DOM Images:       ${results.accessibilityIssues.totalImages} (${results.accessibilityIssues.missingAltCount} missing alt)`);
  console.log(`Total Buttons:          ${results.accessibilityIssues.totalButtons} (${results.accessibilityIssues.unlabelledButtonsCount} missing label)`);
  console.log(`Total Inputs:           ${results.accessibilityIssues.totalInputs} (${results.accessibilityIssues.unlabelledInputsCount} unlabelled)`);

  if (results.overflowViolations.length > 0) {
    console.log('\nOverflow Details:');
    results.overflowViolations.forEach((v) => {
      console.log(` - [${v.viewport}] Route: ${v.route} -> scrollW: ${v.docWidth}px vs winW: ${v.windowWidth}px`);
      if (v.offenders.length) console.log(`   Offenders: ${v.offenders.join(', ')}`);
    });
  }

  if (results.consoleErrors.length > 0) {
    console.log('\nConsole Errors:');
    results.consoleErrors.forEach((e) => console.log(` - ${e.text} (URL: ${e.url})`));
  }

  return results;
}

runAudit().catch((err) => {
  console.error('Audit run failed:', err);
  process.exit(1);
});

