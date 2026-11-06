const fs = require('fs');
const path = require('path');
const { SimplePDF } = require('./simplePdf.cjs');

const doc = new SimplePDF();

// Palette
const GOLD = [0.78, 0.643, 0.357]; // #C7A45B
const DARK_BG = [0.027, 0.078, 0.094]; // #071418
const TEXT_DARK = [0.12, 0.16, 0.18];
const TEXT_MUTED = [0.45, 0.49, 0.51];
const TEXT_LIGHT = [0.96, 0.95, 0.92];
const CARD_BG = [0.95, 0.96, 0.97];
const ACCENT_BG = [0.07, 0.16, 0.19];

// Helper to wrap text into multiple lines
function wrapText(text, maxChars = 85) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Page Header
function drawHeader(title, pageNum) {
  doc.addRect(0, 800, 595.28, 42, DARK_BG);
  doc.addText("CHESS COMMUNITY INDIA", 40, 818, { size: 9, font: 'F2', color: GOLD });
  doc.addText("— LANDING PAGE CONTENT & BRISTON CURVE DESIGN", 175, 818, { size: 8.5, font: 'F1', color: [0.75, 0.75, 0.75] });
  doc.addText(`Page ${pageNum}`, 520, 818, { size: 9, font: 'F1', color: GOLD });
  doc.addRect(0, 798, 595.28, 2, GOLD);
  
  // Footer
  doc.addRect(0, 0, 595.28, 30, [0.95, 0.95, 0.95]);
  doc.addText("Chess Community India (CCI) — Confidential Content & Typography Design Specification", 40, 12, { size: 8, font: 'F1', color: TEXT_MUTED });
}

// ============================================================================
// PAGE 1: COVER
// ============================================================================
doc.addPage();
doc.addRect(0, 0, 595.28, 841.89, DARK_BG);

// Gold Borders
doc.addRect(24, 24, 547.28, 793.89, null, GOLD);
doc.addRect(27, 27, 541.28, 787.89, null, [0.35, 0.3, 0.18]);

// Top Badge
doc.addRect(45, 730, 195, 24, [0.12, 0.22, 0.25]);
doc.addText("OFFICIAL EDITORIAL GUIDE", 55, 738, { size: 9, font: 'F2', color: GOLD });

// Title
doc.addText("CHESS COMMUNITY INDIA", 45, 680, { size: 28, font: 'F2', color: TEXT_LIGHT });
doc.addText("LANDING PAGE CONTENT & BRISTON CURVE DESIGN", 45, 646, { size: 14.5, font: 'F2', color: GOLD });

// Draw actual visual curve on cover!
doc.addCurve(45, 634, 180, 622, 360, 624, 520, 636, { color: GOLD, width: 3.5 });
doc.addCurve(48, 630, 180, 620, 360, 622, 515, 632, { color: [0.9, 0.8, 0.5], width: 1.2 });

doc.addText("Complete Website Copywriting & Bespoke Hand-Drawn SVG Swash Specifications", 45, 598, { size: 11, font: 'F1', color: [0.8, 0.8, 0.8] });

// Content Box
doc.addRect(45, 300, 505.28, 270, [0.06, 0.14, 0.17], [0.2, 0.35, 0.38]);
doc.addText("WHAT IS INCLUDED IN THIS BLUEPRINT", 65, 545, { size: 11, font: 'F2', color: GOLD });

const coverBullets = [
  "1. COMPLETE LANDING PAGE COPYWRITING:",
  "   • Hero Section (Taglines, Eyebrow, Primary & Secondary CTAs)",
  "   • Live Metrics Strip (10,000+ players, 24+ chapters, 150+ tournaments, ₹25L+ prize pool)",
  "   • The 3 Value Pillars (Competitive Integrity, Grassroots Revolution, Player Identity)",
  "   • The 6 Canonical Rating Tiers (Blunder Master to Grand Sovereign full descriptions)",
  "   • Tournament Desk & City Chapters Community Showcase",
  "   • Conversion Sign-off ('Your Move.' Invitation)",
  "",
  "2. BRISTON TYPOGRAPHY CURVE DESIGNS (4 VECTOR SPECIFICATIONS):",
  "   • Curve A: The Vintage Arch Underline (Organic dip matching 'a Game' and 'grow')",
  "   • Curve B: The Retro Swash Flourish (Inspired by Briston's alternate 'B' and 'r')",
  "   • Curve C: The Double-Stroke Pen Accent (Parallel hand-drawn strokes)",
  "   • Curve D: The Organic Hand-Drawn Loop (To highlight badges & free entry tags)",
  "",
  "3. READY-TO-USE REACT & SVG CODE SNIPPETS FOR INSTANT INTEGRATION"
];

let cby = 525;
for (const b of coverBullets) {
  const isHeader = b.startsWith('1.') || b.startsWith('2.') || b.startsWith('3.');
  doc.addText(b, 65, cby, { size: 8.5, font: isHeader ? 'F2' : 'F1', color: isHeader ? GOLD : TEXT_LIGHT });
  cby -= 13.5;
}

// Meta info
doc.addText("Typeface: Briston (Vintage Serif by Fenotype)", 45, 255, { size: 9.5, font: 'F2', color: TEXT_LIGHT });
doc.addText("Accent Color: Regal Antique Gold (#C7A45B / RGB 0.78, 0.64, 0.36)", 45, 238, { size: 9.5, font: 'F1', color: GOLD });
doc.addText("Intended Use: Chess Community India Landing Page (localhost:3000)", 45, 221, { size: 9.5, font: 'F1', color: [0.75, 0.75, 0.75] });

// Bottom badge
doc.addRect(45, 65, 505.28, 50, [0.09, 0.18, 0.22]);
doc.addText("ENGINEERED FOR THE ANTIGRAVITY IDE WORKFLOW", 65, 95, { size: 9.5, font: 'F2', color: GOLD });
doc.addText("Drop the code directly into src/components/ui/HandDrawnUnderline.tsx and HomeExperience.tsx", 65, 80, { size: 8, font: 'F1', color: TEXT_LIGHT });

// ============================================================================
// PAGE 2: BRISTON CURVE DESIGN SPECIFICATIONS
// ============================================================================
doc.addPage();
drawHeader("01. BRISTON CURVE DESIGN SPECIFICATIONS", 2);

let y = 750;
doc.addText("THE ANATOMY OF BRISTON & ORGANIC CURVE ACCENTS", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

const introCurves = [
  "The 'Briston' typeface is characterized by dramatic calligraphic curves, teardrop terminals, and",
  "nostalgic 1970s editorial warmth. A rigid horizontal line breaks that vintage aesthetic. To achieve",
  "a human-crafted, bespoke look, we design organic vector curves that flow with Briston's baseline."
];
for (const ic of introCurves) {
  doc.addText(ic, 40, y, { size: 9, font: 'F1', color: TEXT_DARK });
  y -= 13;
}
y -= 10;

// Curve 1
doc.addRect(40, y - 68, 515, 74, CARD_BG, [0.88, 0.88, 0.88]);
doc.addText("CURVE A: THE VINTAGE ARCH UNDERLINE (The 'a Game' / 'grow' Curve)", 52, y - 14, { size: 9.5, font: 'F2', color: GOLD });
doc.addText("Best used under: 'a Game.', 'grow', 'Together'. Gentle sag in the middle, soft upward flick at ends.", 52, y - 27, { size: 8.5, font: 'F1', color: TEXT_MUTED });

// Visual representation
doc.addText("Preview:  More Than a Game.", 52, y - 48, { size: 12, font: 'F4', color: TEXT_DARK });
doc.addCurve(135, y - 56, 170, y - 63, 215, y - 63, 240, y - 56, { color: GOLD, width: 3.2 });
doc.addText("SVG Path: d=\"M 4 14 C 45 22, 115 23, 165 14 C 185 10, 205 13, 220 16\"", 280, y - 48, { size: 7.5, font: 'F1', color: TEXT_DARK });
y -= 84;

// Curve 2
doc.addRect(40, y - 68, 515, 74, CARD_BG, [0.88, 0.88, 0.88]);
doc.addText("CURVE B: THE CALLIGRAPHIC S-SWASH (Alternate 'B' & 'R' Echo)", 52, y - 14, { size: 9.5, font: 'F2', color: GOLD });
doc.addText("Best used under: 'Revolution', 'Champions', 'Grand Sovereign'. Subtle wave mimicking fountain pen.", 52, y - 27, { size: 8.5, font: 'F1', color: TEXT_MUTED });

// Visual representation
doc.addText("Preview:  The Revolution", 52, y - 48, { size: 12, font: 'F4', color: TEXT_DARK });
doc.addCurve(125, y - 56, 155, y - 62, 185, y - 52, 225, y - 58, { color: GOLD, width: 2.8 });
doc.addText("SVG Path: d=\"M 2 12 C 30 4, 80 20, 130 18 C 170 16, 200 8, 225 14\"", 280, y - 48, { size: 7.5, font: 'F1', color: TEXT_DARK });
y -= 84;

// Curve 3
doc.addRect(40, y - 68, 515, 74, CARD_BG, [0.88, 0.88, 0.88]);
doc.addText("CURVE C: THE DOUBLE-STROKE SKETCH UNDERLINE (Editorial Accent)", 52, y - 14, { size: 9.5, font: 'F2', color: GOLD });
doc.addText("Best used under: 'Your Move.', '10,000+ Players'. Two slightly offset strokes simulating hand sketching.", 52, y - 27, { size: 8.5, font: 'F1', color: TEXT_MUTED });

// Visual representation
doc.addText("Preview:  Your Move.", 52, y - 48, { size: 12, font: 'F4', color: TEXT_DARK });
doc.addCurve(118, y - 54, 145, y - 60, 175, y - 60, 195, y - 54, { color: GOLD, width: 2.0 });
doc.addCurve(122, y - 58, 148, y - 63, 172, y - 63, 192, y - 58, { color: [0.9, 0.78, 0.5], width: 1.4 });
doc.addText("SVG: Dual layered paths with 3px vertical offset and slight end divergence.", 280, y - 48, { size: 7.5, font: 'F1', color: TEXT_DARK });
y -= 84;

// Curve 4
doc.addRect(40, y - 68, 515, 74, CARD_BG, [0.88, 0.88, 0.88]);
doc.addText("CURVE D: THE ORGANIC HAND-DRAWN LOOP (Callout Highlight)", 52, y - 14, { size: 9.5, font: 'F2', color: GOLD });
doc.addText("Best used around: 'FREE', 'LIVE', 'NEW', 'INDIA'. An imperfect hand-drawn oval encircling a word.", 52, y - 27, { size: 8.5, font: 'F1', color: TEXT_MUTED });

// Visual representation
doc.addText("Preview:  Open To All", 52, y - 48, { size: 12, font: 'F4', color: TEXT_DARK });
// Hand drawn loop around "All"
doc.addCurve(145, y - 45, 142, y - 36, 175, y - 36, 185, y - 45, { color: GOLD, width: 2.0 });
doc.addCurve(185, y - 45, 188, y - 57, 145, y - 58, 143, y - 47, { color: GOLD, width: 2.0 });
doc.addText("SVG Path: d=\"M 10 14 C 8 2, 60 2, 90 6 C 98 14, 90 24, 50 25 C 10 26, 6 18, 12 12\"", 280, y - 48, { size: 7.5, font: 'F1', color: TEXT_DARK });
y -= 80;

// Implementation Note Box
doc.addRect(40, y - 44, 515, 48, ACCENT_BG);
doc.addText("DESIGN PRINCIPLE: HUMAN IMPERFECTION", 55, y - 14, { size: 9, font: 'F2', color: GOLD });
doc.addText("Never use pure straight lines (width: 100%, height: 2px). The beauty of human websites comes from", 55, y - 27, { size: 8, font: 'F1', color: TEXT_LIGHT });
doc.addText("subtle bezier curvature, round stroke caps (stroke-linecap: round), and slight thickness variations.", 55, y - 38, { size: 8, font: 'F1', color: TEXT_LIGHT });

// ============================================================================
// PAGE 3: LANDING PAGE COPY — HERO & VALUE PILLARS
// ============================================================================
doc.addPage();
drawHeader("02. LANDING PAGE CONTENT — HERO & PILLARS", 3);

y = 750;
doc.addText("HERO SECTION: THE SUBMISSION OF CHESS TO HUMAN SPIRIT", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

doc.addText("Pre-Header Eyebrow:", 40, y, { size: 9.5, font: 'F2', color: GOLD });
doc.addText("CHESS COMMUNITY INDIA  •  THE NATIONAL CIRCUIT", 180, y, { size: 9, font: 'F1', color: TEXT_MUTED });
y -= 18;

doc.addText("Main H1 Headline:", 40, y, { size: 9.5, font: 'F2', color: TEXT_DARK });
y -= 18;
doc.addRect(40, y - 34, 515, 46, CARD_BG);
doc.addText('More Than', 55, y - 10, { size: 18, font: 'F4', color: TEXT_DARK });
doc.addText('a Game.', 155, y - 10, { size: 18, font: 'F4', color: GOLD });
doc.addCurve(155, y - 22, 185, y - 28, 220, y - 28, 240, y - 22, { color: GOLD, width: 3.5 });
doc.addText("(Rendered in Briston Vintage Serif with Hand-Drawn Gold Curve Underneath)", 55, y - 30, { size: 8, font: 'F3', color: TEXT_MUTED });
y -= 52;

doc.addText("Hero Narrative Body Copy:", 40, y, { size: 9.5, font: 'F2', color: TEXT_DARK });
y -= 14;
const heroNarrative = [
  "From bustling street-corner tea stalls to high-voltage national championship halls, chess in India",
  "is more than a calculated sport—it is a shared heartbeat.",
  "",
  "Chess Community India is on a mission to build a unified, transparent national chess ecosystem.",
  "Whether you are playing your first rated tournament or battling on top board for a grandmaster norm,",
  "we provide sanctioned Swiss tournaments, live digital pairings, authentic Elo ratings, and vibrant",
  "city chapters across India. Every move matters. Every player counts."
];
for (const hn of heroNarrative) {
  if (hn === '') {
    y -= 6;
  } else {
    doc.addText(hn, 40, y, { size: 9, font: 'F1', color: TEXT_DARK });
    y -= 13;
  }
}
y -= 10;

doc.addText("Action Buttons Copy & Microcopy:", 40, y, { size: 9.5, font: 'F2', color: TEXT_DARK });
y -= 16;
doc.addText("• Button 1 (Primary Gold): 'Enter the Arena'  [Sub: Explore Upcoming Swiss Tournaments]", 55, y, { size: 8.5, font: 'F2', color: GOLD });
y -= 14;
doc.addText("• Button 2 (Glass Outline): 'Find Your City Chapter'  [Sub: Join Weekly Meetups & WhatsApp]", 55, y, { size: 8.5, font: 'F1', color: TEXT_DARK });
y -= 24;

doc.addText("LIVE COMMUNITY METRICS TICKER", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const tickerItems = [
  { n: "10,000+", l: "VERIFIED PLAYERS", d: "Active competitors with official CCI Player IDs" },
  { n: "24+", l: "CITY CHAPTERS", d: "Spanning metro hubs & Tier-2 grassroots cities" },
  { n: "150+", l: "SANCTIONED SWISS", d: "Tournaments organized with certified arbiters" },
  { n: "INR 25L+", l: "PRIZE POOL AWARDED", d: "Direct cash rewards distributed to champions" }
];

let tx = 40;
for (const ti of tickerItems) {
  doc.addRect(tx, y - 48, 122, 54, CARD_BG, [0.85, 0.85, 0.85]);
  doc.addText(ti.n, tx + 10, y - 14, { size: 13, font: 'F2', color: GOLD });
  doc.addText(ti.l, tx + 10, y - 27, { size: 7, font: 'F2', color: TEXT_DARK });
  doc.addText(ti.d, tx + 10, y - 40, { size: 6.5, font: 'F1', color: TEXT_MUTED });
  tx += 130;
}
y -= 65;

doc.addText("THE THREE VALUE PILLARS", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

const pList = [
  { h: "1. FIDE-Standard Swiss Integrity:", c: "Neutral Swiss pairing algorithms, public version rollback auditing, and zero tolerance for unfair play." },
  { h: "2. Beyond the Metros:", c: "Prioritizing tournaments and training in Jabalpur, Indore, Ranchi, Surat, and Coimbatore where talent is hungry." },
  { h: "3. Identity That Motivates:", c: "Ditching boring spreadsheets. Players earn badges across 6 canonical tiers from Blunder Master to Grand Sovereign." }
];

for (const pl of pList) {
  doc.addText(pl.h, 40, y, { size: 9, font: 'F2', color: GOLD });
  doc.addText(pl.c, 195, y, { size: 8.5, font: 'F1', color: TEXT_DARK });
  y -= 15;
}

// ============================================================================
// PAGE 4: LANDING PAGE COPY — THE 6 CANONICAL TIERS SHOWCASE
// ============================================================================
doc.addPage();
drawHeader("03. LANDING PAGE — THE 6 CANONICAL TIERS", 4);

y = 750;
doc.addText("FEATURE SECTION: THE 6 CANONICAL CCI RATING TIERS", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

doc.addText("Section Eyebrow: 'A RATING THAT TELLS YOUR STORY'", 40, y, { size: 9, font: 'F2', color: GOLD });
y -= 13;
doc.addText("Section Heading: 'From Your First Blunder to Immortal Play.'", 40, y, { size: 14, font: 'F4', color: TEXT_DARK });
y -= 18;

const all6Tiers = [
  {
    name: "01. BLUNDER MASTER",
    elo: "0 – 800 Elo",
    tagline: "Every legend starts with hanging pieces.",
    copy: "Move one isn't about opening theory—it is about the courage to sit down. This tier celebrates curiosity, learning the basics, and surviving without hanging your queen. Wear it like armor."
  },
  {
    name: "02. TACTICAL STRIKER",
    elo: "801 – 1200 Elo",
    tagline: "Spotting forks, pins, and skewers in the fog of battle.",
    copy: "Your eyes now see the geometry of the board. You exploit unprotected pieces, unleash back-rank checks, and punish opponent inaccuracies with decisive tactical strikes."
  },
  {
    name: "03. POSITIONAL STRATEGIST",
    elo: "1201 – 1600 Elo",
    tagline: "Pawn structures, quiet outposts, and rook files.",
    copy: "Impulsive moves give way to grand strategy. You maneuver knights into outposts, control open files, understand piece harmony, and convert technical endgames with calm assurance."
  },
  {
    name: "04. VANGUARD COMMANDER",
    elo: "1601 – 2000 Elo",
    tagline: "Repertoire depth and ferocious tournament stamina.",
    copy: "Dangerous club and state competitors. You possess prepared opening novelties, calculate deeply under clock pressure, and endure grueling 5-hour classical battles."
  },
  {
    name: "05. CROWN CONTENDER",
    elo: "2001 – 2400 Elo",
    tagline: "National circuit mastery and master-class precision.",
    copy: "Semi-professional contenders. Masterful endgame theory, psychological resilience against titled players, and consistent podium finishes on the national circuit."
  },
  {
    name: "06. GRAND SOVEREIGN",
    elo: "2401 – 3000 Elo",
    tagline: "The pinnacle of Indian chess brilliance.",
    copy: "Grandmasters and international stars whose games are studied across the world. Intuition honed by millions of moves—the sovereign elite of Indian mind sports."
  }
];

for (const t of all6Tiers) {
  doc.addRect(40, y - 56, 515, 62, CARD_BG, [0.88, 0.88, 0.88]);
  doc.addText(t.name, 50, y - 12, { size: 9.5, font: 'F2', color: GOLD });
  doc.addText(t.elo, 430, y - 12, { size: 9, font: 'F2', color: TEXT_DARK });
  doc.addText(`"${t.tagline}"`, 50, y - 26, { size: 8, font: 'F3', color: TEXT_MUTED });
  const cLines = wrapText(t.copy, 92);
  let cy = y - 38;
  for (const cl of cLines) {
    doc.addText(cl, 50, cy, { size: 8, font: 'F1', color: TEXT_DARK });
    cy -= 11;
  }
  y -= 68;
}

// ============================================================================
// PAGE 5: LANDING PAGE COPY — TOURNAMENTS, CITIES, & TESTIMONIALS
// ============================================================================
doc.addPage();
drawHeader("04. LANDING PAGE — TOURNAMENTS & CHAPTERS", 5);

y = 750;
doc.addText("FEATURE SECTION: UPCOMING SANCTIONED TOURNAMENTS", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

doc.addText("Section Eyebrow: 'COMPETE WITH HONOUR'", 40, y, { size: 9, font: 'F2', color: GOLD });
y -= 13;
doc.addText("Section Heading: 'Live Arena & FIDE-Standard Circuit'", 40, y, { size: 14, font: 'F4', color: TEXT_DARK });
y -= 18;

const sampleTourneys = [
  {
    title: "CCI NATIONAL SWISS OPEN 2026",
    city: "New Delhi & Online Broadcast | Classical (90+30)",
    date: "November 14 – 18, 2026",
    prize: "₹5,00,000 Total Prize Pool",
    rounds: "9 Rounds Swiss • Certified FIDE Arbiters"
  },
  {
    title: "CENTRAL INDIA RAPID GRAND PRIX",
    city: "Jabalpur (Founding City Arena) | Rapid (15+10)",
    date: "December 05 – 06, 2026",
    prize: "₹1,50,000 Total Prize Pool",
    rounds: "7 Rounds Swiss • Open to all Elo categories"
  }
];

for (const st of sampleTourneys) {
  doc.addRect(40, y - 50, 515, 56, CARD_BG, [0.85, 0.85, 0.85]);
  doc.addText(st.title, 50, y - 12, { size: 10, font: 'F2', color: TEXT_DARK });
  doc.addText(st.prize, 410, y - 12, { size: 9, font: 'F2', color: GOLD });
  doc.addText(st.city, 50, y - 26, { size: 8.5, font: 'F1', color: TEXT_MUTED });
  doc.addText(`${st.date}  •  ${st.rounds}`, 50, y - 40, { size: 8, font: 'F1', color: TEXT_DARK });
  y -= 64;
}
y -= 8;

doc.addText("COMMUNITY SPOTLIGHT: CITY CHAPTERS & CAFÉ CHESS", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

doc.addText("Section Eyebrow: 'GRASSROOTS REVOLUTION'", 40, y, { size: 9, font: 'F2', color: GOLD });
y -= 13;
doc.addText("Section Heading: 'Built Around People. Played Around India.'", 40, y, { size: 14, font: 'F4', color: TEXT_DARK });
y -= 16;

const chapterCopy = [
  "You don't need a formal stadium to play great chess. Every weekend across Jabalpur, Delhi,",
  "Bengaluru, Mumbai, Pune, and Kolkata, CCI members gather in quiet cafés, library corners,",
  "and sunny parks. Grab a tea, bring a board, and play blitz against neighbors who love the game."
];
for (const cc of chapterCopy) {
  doc.addText(cc, 40, y, { size: 8.5, font: 'F1', color: TEXT_DARK });
  y -= 12;
}
y -= 12;

doc.addText("COMMUNITY VOICES: REAL PLAYERS, REAL STORIES", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

const testimonials = [
  {
    quote: '"Before CCI, small-town players had to travel 800 km just to get a rated game. Having sanctioned Swiss tournaments right here in Jabalpur with real arbiters has completely changed our lives."',
    author: "— Rajesh S., Tactical Striker (Jabalpur Chapter)"
  },
  {
    quote: '"The 6 Canonical Tiers gave our academy students something real to aim for. A child graduating from Blunder Master to Tactical Striker celebrates like they won the Olympiad."',
    author: "— Meenakshi K., Certified Arbiter & Coach (Bengaluru)"
  }
];

for (const t of testimonials) {
  doc.addRect(40, y - 44, 515, 50, CARD_BG, [0.88, 0.88, 0.88]);
  const qLines = wrapText(t.quote, 95);
  let qy = y - 12;
  for (const ql of qLines) {
    doc.addText(ql, 50, qy, { size: 8, font: 'F3', color: TEXT_DARK });
    qy -= 10.5;
  }
  doc.addText(t.author, 50, y - 36, { size: 8, font: 'F2', color: GOLD });
  y -= 56;
}

// ============================================================================
// PAGE 6: LANDING PAGE COPY — INVITATION & REACT COMPONENT CODE
// ============================================================================
doc.addPage();
drawHeader("05. INVITATION FINALE & REACT SVG CODE", 6);

y = 750;
doc.addText("CONVERSION FINALE: 'YOUR MOVE.' (JOIN CTA)", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

doc.addRect(40, y - 76, 515, 84, [0.06, 0.14, 0.17]);
doc.addText("INVITATION", 55, y - 16, { size: 8.5, font: 'F2', color: GOLD });
doc.addText("Your Move.", 55, y - 36, { size: 22, font: 'F4', color: TEXT_LIGHT });
// Curve under Move
doc.addCurve(98, y - 46, 120, y - 52, 145, y - 52, 160, y - 46, { color: GOLD, width: 3.2 });
doc.addText("Claim your verified CCI Player ID, join your city's active WhatsApp group,", 55, y - 56, { size: 8.5, font: 'F1', color: [0.8, 0.8, 0.8] });
doc.addText("and sit across the board at the next sanctioned Swiss tournament.", 55, y - 68, { size: 8.5, font: 'F1', color: [0.8, 0.8, 0.8] });
y -= 94;

doc.addText("PRODUCTION REACT COMPONENT: HandDrawnUnderline.tsx", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

const reactCode = [
  "import React from 'react';",
  "",
  "interface HandDrawnUnderlineProps {",
  "  children: React.ReactNode;",
  "  variant?: 'arch' | 'swash' | 'double' | 'loop';",
  "  color?: string;",
  "  className?: string;",
  "}",
  "",
  "export const HandDrawnUnderline: React.FC<HandDrawnUnderlineProps> = ({",
  "  children,",
  "  variant = 'arch',",
  "  color = '#C7A45B',",
  "  className = ''",
  "}) => {",
  "  return (",
  "    <span className={`relative inline-block ${className}`}>",
  "      {children}",
  "      {variant === 'arch' && (",
  "        <svg viewBox='0 0 220 24' fill='none' preserveAspectRatio='none'",
  "             className='absolute -bottom-2.5 left-0 w-full h-3 overflow-visible pointer-events-none'>",
  "          <path d='M 4 14 C 45 22, 115 23, 165 14 C 185 10, 205 13, 220 16'",
  "                stroke={color} strokeWidth='3.2' strokeLinecap='round' />",
  "        </svg>",
  "      )}",
  "      {variant === 'swash' && (",
  "        <svg viewBox='0 0 225 24' fill='none' preserveAspectRatio='none'",
  "             className='absolute -bottom-2.5 left-0 w-full h-3 overflow-visible pointer-events-none'>",
  "          <path d='M 2 12 C 30 4, 80 20, 130 18 C 170 16, 200 8, 225 14'",
  "                stroke={color} strokeWidth='2.8' strokeLinecap='round' />",
  "        </svg>",
  "      )}",
  "    </span>",
  "  );",
  "};"
];

doc.addRect(40, y - 275, 515, 285, [0.03, 0.08, 0.10]);
let rcy = y - 16;
for (const line of reactCode) {
  doc.addText(line, 50, rcy, { size: 7.5, font: 'F1', color: line.includes('import') || line.includes('interface') || line.includes('export') ? GOLD : TEXT_LIGHT });
  rcy -= 9.5;
}

// Generate PDF buffer
const pdfBuffer = doc.build();
const outputPath = path.join(__dirname, '..', 'CCI_Landing_Page_Content_And_Design_Guide.pdf');
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`[OK] Generated Landing Page PDF: ${outputPath} (${pdfBuffer.length} bytes)`);

// Also save to brain/artifacts directory
const brainDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\b892911b-a855-4b7d-bded-e6bacf61b2ca';
const brainPdfPath = path.join(brainDir, 'CCI_Landing_Page_Content_And_Design_Guide.pdf');
fs.writeFileSync(brainPdfPath, pdfBuffer);
console.log(`[OK] Copied to brain artifacts at: ${brainPdfPath}`);
