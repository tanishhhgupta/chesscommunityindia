const fs = require('fs');
const path = require('path');
const { SimplePDF } = require('./simplePdf.cjs');

const doc = new SimplePDF();

// Helper colors
const GOLD = [0.78, 0.643, 0.357]; // #C7A45B
const DARK_BG = [0.027, 0.078, 0.094]; // #071418
const TEXT_DARK = [0.12, 0.16, 0.18];
const TEXT_MUTED = [0.42, 0.46, 0.48];
const TEXT_LIGHT = [0.96, 0.95, 0.92];
const CARD_BG = [0.96, 0.97, 0.97];
const GOLD_SOFT = [0.95, 0.92, 0.84];

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

// Draw Header on inner pages
function drawPageHeader(title, pageNum) {
  doc.addRect(0, 800, 595.28, 42, DARK_BG);
  doc.addText("CHESS COMMUNITY INDIA", 40, 818, { size: 9, font: 'F2', color: GOLD });
  doc.addText("— OFFICIAL WEBSITE CONTENT BLUEPRINT", 175, 818, { size: 9, font: 'F1', color: [0.7, 0.7, 0.7] });
  doc.addText(`Page ${pageNum}`, 520, 818, { size: 9, font: 'F1', color: GOLD });
  doc.addRect(0, 798, 595.28, 2, GOLD);
  
  // Footer
  doc.addRect(0, 0, 595.28, 30, [0.95, 0.95, 0.95]);
  doc.addText("Chess Community India (CCI) — More Than a Game | Confidential & Editorial Content Guide", 40, 12, { size: 8, font: 'F1', color: TEXT_MUTED });
}

// ============================================================================
// PAGE 1: COVER
// ============================================================================
doc.addPage();
// Full dark background cover
doc.addRect(0, 0, 595.28, 841.89, DARK_BG);

// Gold frame
doc.addRect(25, 25, 545.28, 791.89, null, GOLD);
doc.addRect(28, 28, 539.28, 785.89, null, [0.35, 0.3, 0.18]);

// Header badge
doc.addRect(45, 730, 140, 24, [0.12, 0.22, 0.25]);
doc.addText("OFFICIAL BLUEPRINT", 55, 738, { size: 9, font: 'F2', color: GOLD });

// Title
doc.addText("CHESS COMMUNITY INDIA", 45, 680, { size: 28, font: 'F2', color: TEXT_LIGHT });
doc.addText("WEBSITE CONTENT STRATEGY & COPY", 45, 646, { size: 18, font: 'F2', color: GOLD });
doc.addText("Comprehensive Page-by-Page Editorial Content & Messaging Architecture", 45, 620, { size: 12, font: 'F1', color: [0.8, 0.8, 0.8] });

// Divider line
doc.addRect(45, 595, 505.28, 1.5, GOLD);

// Summary Box
doc.addRect(45, 340, 505.28, 230, [0.06, 0.14, 0.17], [0.2, 0.35, 0.38]);
doc.addText("DOCUMENT EXECUTIVE SUMMARY", 65, 538, { size: 12, font: 'F2', color: GOLD });

const summaryLines = [
  "This document outlines the official website copy, section breakdowns, and content architecture",
  "for the Chess Community India (CCI) digital ecosystem. It is specifically designed to reflect",
  "the vintage, sophisticated editorial tone established by the 'Briston' typeface while delivering",
  "high conversion, trust, and practical utility for players, arbiters, and organizers.",
  "",
  "CORE MODULES COVERED:",
  "1. Landing Page (Hero, Value Proposition, 6 Rating Categories, Tournaments, Live Tickers)",
  "2. About Us (Grassroots Story, 'More Than a Game' Philosophy, Vision 2030)",
  "3. Tournaments & Standings (Swiss Formats, Rules, Anti-Cheating, Player Briefings)",
  "4. Canonical Rating System (Deep-dive into the 6 proprietary CCI Tiers & Elo scales)",
  "5. City Chapters & Meetups (Offline Café Chess, Community Captain Playbooks)",
  "6. Player Portal, Learn Hub, Merch Store, and Arbiter/Volunteer Application Funnels"
];

let sumY = 515;
for (const line of summaryLines) {
  doc.addText(line, 65, sumY, { size: 9.5, font: line.startsWith('CORE') ? 'F2' : 'F1', color: line.startsWith('CORE') ? GOLD : TEXT_LIGHT });
  sumY -= 17;
}

// Meta details
doc.addText("Organization: Chess Community India (CCI)", 45, 270, { size: 10, font: 'F2', color: TEXT_LIGHT });
doc.addText("Brand Tagline: 'More Than a Game'", 45, 252, { size: 10, font: 'F1', color: GOLD });
doc.addText("Target Audience: Grassroots Players, FIDE Rated Competitors, Arbiters, City Captains", 45, 234, { size: 9.5, font: 'F1', color: [0.75, 0.75, 0.75] });
doc.addText("Typography Pairing: Briston (Vintage Display Serif) with Inter / Garamond (Body)", 45, 216, { size: 9.5, font: 'F1', color: [0.75, 0.75, 0.75] });
doc.addText("Platform Status: Live Tournament & Community Ecosystem", 45, 198, { size: 9.5, font: 'F1', color: [0.75, 0.75, 0.75] });

// Bottom badge
doc.addRect(45, 70, 505.28, 45, [0.09, 0.18, 0.22]);
doc.addText("Prepared for Antigravity IDE Implementation | Ready for Direct Website Copy Deployment", 65, 88, { size: 9, font: 'F2', color: GOLD });

// ============================================================================
// PAGE 2: LANDING PAGE COPY (HERO & CORE SECTIONS)
// ============================================================================
doc.addPage();
drawPageHeader("01. LANDING PAGE CONTENT ARCHITECTURE", 2);

let y = 750;
doc.addText("SECTION 1: HERO / FIRST IMPRESSION", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

doc.addText("Pre-Header Eyebrow:", 40, y, { size: 9, font: 'F2', color: GOLD });
doc.addText("CHESS COMMUNITY INDIA  |  EST. 2024", 160, y, { size: 9, font: 'F1', color: TEXT_MUTED });
y -= 16;

doc.addText("Primary Headline (H1):", 40, y, { size: 10, font: 'F2', color: TEXT_DARK });
y -= 18;
doc.addRect(40, y - 22, 515, 36, CARD_BG);
doc.addText('"More Than a Game. The Heartbeat of Indian Chess."', 55, y - 8, { size: 14, font: 'F4', color: TEXT_DARK });
y -= 38;

doc.addText("Subheadline Copy:", 40, y, { size: 10, font: 'F2', color: TEXT_DARK });
y -= 14;
const heroSub = [
  "From street-corner tea stalls to championship stages across the subcontinent, Chess Community",
  "India brings players together. We host competitive Swiss tournaments, build thriving city",
  "chapters, and engineer a grassroots ecosystem where every move matters."
];
for (const line of heroSub) {
  doc.addText(line, 40, y, { size: 9.5, font: 'F1', color: TEXT_DARK });
  y -= 14;
}
y -= 6;

doc.addText("Call to Action (CTA) Pair:", 40, y, { size: 10, font: 'F2', color: TEXT_DARK });
doc.addText("• Primary: 'Enter the Arena' (Directs to Tournaments / Register)", 60, y - 14, { size: 9, font: 'F1', color: TEXT_DARK });
doc.addText("• Secondary: 'Find Your City Chapter' (Opens City WhatsApp & Meetups)", 60, y - 28, { size: 9, font: 'F1', color: TEXT_DARK });
y -= 44;

doc.addText("SECTION 2: LIVE METRICS TICKER", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const metrics = [
  { val: "10,000+", lbl: "Active Indian Players" },
  { val: "24+", lbl: "City Chapters Active" },
  { val: "150+", lbl: "Rated Tournaments Held" },
  { val: "INR 25L+", lbl: "Total Prize Pool Disbursed" }
];
let mx = 40;
for (const m of metrics) {
  doc.addRect(mx, y - 32, 120, 38, CARD_BG, [0.85, 0.85, 0.85]);
  doc.addText(m.val, mx + 10, y - 14, { size: 12, font: 'F2', color: GOLD });
  doc.addText(m.lbl, mx + 10, y - 27, { size: 7.5, font: 'F1', color: TEXT_MUTED });
  mx += 130;
}
y -= 52;

doc.addText("SECTION 3: THREE PILLARS OF CCI", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const pillars = [
  { title: "01. COMPETITIVE INTEGRITY", desc: "FIDE-standard Swiss pairings, certified national arbiters, and zero tolerance for unfair play. Clear rating progressions and immediate results." },
  { title: "02. GRASSROOTS REVOLUTION", desc: "Expanding beyond metro hubs into Tier-2 and Tier-3 cities. We empower local clubs, schools, and café groups to build sanctioned chess cultures." },
  { title: "03. RECOGNITION & IDENTITY", desc: "Every member receives a verified CCI Player ID, tracking Elo, match history, and progression through our 6 canonical competitive tiers." }
];

for (const p of pillars) {
  doc.addText(p.title, 40, y, { size: 10, font: 'F2', color: GOLD });
  y -= 13;
  const pLines = wrapText(p.desc, 90);
  for (const pl of pLines) {
    doc.addText(pl, 40, y, { size: 9, font: 'F1', color: TEXT_DARK });
    y -= 13;
  }
  y -= 6;
}

// ============================================================================
// PAGE 3: ABOUT US & PHILOSOPHY
// ============================================================================
doc.addPage();
drawPageHeader("02. ABOUT US & MANIFESTO", 3);

y = 750;
doc.addText("THE CCI MANIFESTO: MORE THAN A GAME", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const manifesto = [
  "In India, chess was never just an idle pastime. Born on our soil as Chaturanga centuries ago,",
  "it is an art of patience, warfare of the intellect, and a mirror to life itself.",
  "",
  "Today, India stands as an undeniable global superpower of chess, producing the youngest grandmasters",
  "and Olympiad champions in world history. But behind the grandmasters are millions of passionate",
  "players across school halls, public parks, college hostels, and quiet neighborhood cafés.",
  "",
  "Chess Community India was formed with a singular dedication: to build the missing bridges.",
  "We ensure that a player in Jabalpur, Indore, Ranchi, or Coimbatore has the exact same tournament",
  "infrastructure, certified arbiter standards, and rating recognition as a player in Chennai or Mumbai.",
  "",
  "We believe chess cultivates discipline, emotional resilience, strategic foresight, and mutual respect.",
  "When you sit across the 64 squares, differences of age, background, and language vanish.",
  "It is more than a game. It is our collective journey."
];

for (const m of manifesto) {
  if (m === '') {
    y -= 8;
  } else {
    doc.addText(m, 40, y, { size: 9.5, font: 'F1', color: TEXT_DARK });
    y -= 14;
  }
}
y -= 10;

doc.addText("OUR THREE-FOLD MISSION", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 20;

const missions = [
  {
    title: "1. Access to Sanctioned Competition:",
    body: "Eliminate the geographic and financial barriers to rated tournament play. Guaranteeing transparent Swiss pairings and punctual rounds."
  },
  {
    title: "2. The 6-Tier Player Ladder:",
    body: "Provide a transparent, motivational tier framework that celebrates progress at every milestone—from your first tactical fork to national mastership."
  },
  {
    title: "3. Community Ownership:",
    body: "Support local chess captains with organizer toolkits, pairing software, digital clocks, and marketing support to create self-sustaining local chapters."
  }
];

for (const ms of missions) {
  doc.addText(ms.title, 40, y, { size: 10, font: 'F2', color: GOLD });
  y -= 14;
  const msLines = wrapText(ms.body, 90);
  for (const msl of msLines) {
    doc.addText(msl, 40, y, { size: 9, font: 'F1', color: TEXT_DARK });
    y -= 13;
  }
  y -= 8;
}

// ============================================================================
// PAGE 4: CANONICAL 6 RATING TIERS (DEEP DIVE)
// ============================================================================
doc.addPage();
drawPageHeader("03. THE 6 CANONICAL CCI RATING TIERS", 4);

y = 750;
doc.addText("RATINGS WITH IDENTITY: CELEBRATING EVERY STAGE", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 16;

doc.addText("Unlike sterile number-only ratings, CCI assigns every competitor a distinctive Rank Badge.", 40, y, { size: 9, font: 'F1', color: TEXT_MUTED });
y -= 20;

const tiers = [
  {
    name: "TIER 1: BLUNDER MASTER",
    elo: "Rating: 0 – 800 Elo",
    tagline: "Every grandmaster was once a beginner who refused to quit.",
    desc: "Embraces the reality of move one. Focuses on basic piece safety, king protection, and surviving the opening without hanging queen or rook. A badge worn with pride."
  },
  {
    name: "TIER 2: TACTICAL STRIKER",
    elo: "Rating: 801 – 1200 Elo",
    tagline: "The board reveals hidden diagonals and double attacks.",
    desc: "Players who spot tactical motifs: forks, pins, skewers, and back-rank vulnerabilities. Capable of punishing opponent inaccuracies in rapid time controls."
  },
  {
    name: "TIER 3: POSITIONAL STRATEGIST",
    elo: "Rating: 1201 – 1600 Elo",
    tagline: "Mastering pawn structures, outposts, and open files.",
    desc: "The transition from impulsive play to deliberate planning. Understanding piece activity, space advantages, and converting rook endgames with technical calm."
  },
  {
    name: "TIER 4: VANGUARD COMMANDER",
    elo: "Rating: 1601 – 2000 Elo",
    tagline: "Deep opening repertoire and fierce tournament endurance.",
    desc: "Formidable club-level players. Deep calculation depth, acute awareness of king safety, opening traps, and psychological stamina across 5-round Swiss marathons."
  },
  {
    name: "TIER 5: CROWN CONTENDER",
    elo: "Rating: 2001 – 2400 Elo",
    tagline: "National circuit mastery and master-class precision.",
    desc: "Semi-professional and titled candidates. Impeccable endgame theory, dynamic piece sacrifices, and consistent podium placements on state and national circuits."
  },
  {
    name: "TIER 6: GRAND SOVEREIGN",
    elo: "Rating: 2401 – 3000 Elo",
    tagline: "The pinnacle of Indian chess brilliance.",
    desc: "Grandmasters and international masters whose intuition and immortal games shape the future of Indian sports on the global stage."
  }
];

for (const t of tiers) {
  doc.addRect(40, y - 56, 515, 62, CARD_BG, [0.88, 0.88, 0.88]);
  doc.addText(t.name, 50, y - 12, { size: 10, font: 'F2', color: GOLD });
  doc.addText(t.elo, 420, y - 12, { size: 9, font: 'F2', color: TEXT_DARK });
  doc.addText(`"${t.tagline}"`, 50, y - 26, { size: 8.5, font: 'F3', color: TEXT_MUTED });
  const dLines = wrapText(t.desc, 92);
  let dy = y - 38;
  for (const dl of dLines) {
    doc.addText(dl, 50, dy, { size: 8.5, font: 'F1', color: TEXT_DARK });
    dy -= 11;
  }
  y -= 70;
}

// ============================================================================
// PAGE 5: TOURNAMENTS & ARBITER REGULATIONS
// ============================================================================
doc.addPage();
drawPageHeader("04. TOURNAMENTS & ARBITER REGULATIONS", 5);

y = 750;
doc.addText("TOURNAMENT OPERATIONS & PLAYER CODE OF CONDUCT", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const tourneySections = [
  {
    title: "1. FIDE Dutch Swiss System Pairing Rules:",
    lines: [
      "All CCI tournaments strictly follow the FIDE Dutch Swiss system. No player will face the same",
      "opponent twice. Color balance is enforced (+1/-1 alternation). The Chief Arbiter's pairing",
      "versions are publicly audited to guarantee absolute neutrality."
    ]
  },
  {
    title: "2. Official Time Controls:",
    lines: [
      "• Classical Championship: 90 Minutes + 30 Seconds Increment from Move 1",
      "• Rapid Grand Prix: 15 Minutes + 10 Seconds Increment",
      "• Blitz Battle Arena: 3 Minutes + 2 Seconds Increment",
      "• School & Youth Circuit: 25 Minutes Flat (Rapid format)"
    ]
  },
  {
    title: "3. Official Tiebreak Order (Standard):",
    lines: [
      "When players finish on equal game points, podium positions are decided in order:",
      "1. Direct Encounter (Head-to-head result between tied players)",
      "2. Buchholz Cut 1 (Sum of opponents' scores excluding the lowest)",
      "3. Buchholz Full (Sum of all opponents' scores)",
      "4. Sonneborn-Berger Score (Sum of defeated opponents' scores + half of drawn)",
      "5. Greater Number of Victories"
    ]
  },
  {
    title: "4. Fair Play & Anti-Cheating Protocol:",
    lines: [
      "Strict ban on all electronic watches, mobile devices, or recording apparatus in the playing hall.",
      "Arbiters hold authority to conduct random screening. Any player found receiving outside assistance",
      "faces immediate forfeiture, blacklisting from the national circuit, and formal notification to AICF."
    ]
  }
];

for (const ts of tourneySections) {
  doc.addText(ts.title, 40, y, { size: 10, font: 'F2', color: GOLD });
  y -= 14;
  for (const l of ts.lines) {
    doc.addText(l, 40, y, { size: 9, font: 'F1', color: TEXT_DARK });
    y -= 13;
  }
  y -= 8;
}

// ============================================================================
// PAGE 6: CITY CHAPTERS & COMMUNITY PLAYBOOK
// ============================================================================
doc.addPage();
drawPageHeader("05. CITY CHAPTERS & COMMUNITY PLAYBOOK", 6);

y = 750;
doc.addText("GRASSROOTS EXPANSION: HOW TO RUN A CCI CHAPTER", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const chapterCopy = [
  "Chess flourishes when it is rooted in local spaces. A CCI City Chapter is not a bureaucracy—",
  "it is a group of friends, mentors, and rivals meeting every weekend over wooden boards and chai."
];
for (const c of chapterCopy) {
  doc.addText(c, 40, y, { size: 9.5, font: 'F1', color: TEXT_DARK });
  y -= 14;
}
y -= 10;

const chapterSteps = [
  {
    step: "STEP 1: SECURE A WELCOMING VENUE",
    desc: "Partner with a quiet local café, library, co-working space, or city park. Ensure adequate lighting, seating, and permission to host casual players for 2-3 hours on weekends."
  },
  {
    step: "STEP 2: FORM YOUR OFFICIAL WHATSAPP COMMUNITY",
    desc: "Create an official 'CCI [Your City]' WhatsApp group or Telegram channel. Appoint 2-3 verified Community Captains to moderate conversations and publish weekly game announcements."
  },
  {
    step: "STEP 3: HOST YOUR FIRST FREE CASUAL BLITZ MEET",
    desc: "Start with non-rated casual games, puzzle challenges, and rapid matches. Provide boards and pieces if possible, and encourage players of all ages (7 to 70) to participate."
  },
  {
    step: "STEP 4: APPLY FOR CCI SANCTIONED STATUS",
    desc: "Once your chapter has 25+ regular attendees, submit an application via the CCI Portal. We provide digital chess clocks, scorebooks, official tournament software access, and listing on the national map."
  }
];

for (const cs of chapterSteps) {
  doc.addRect(40, y - 48, 515, 54, CARD_BG, [0.88, 0.88, 0.88]);
  doc.addText(cs.step, 50, y - 12, { size: 9.5, font: 'F2', color: GOLD });
  const csLines = wrapText(cs.desc, 92);
  let csy = y - 26;
  for (const csl of csLines) {
    doc.addText(csl, 50, csy, { size: 8.5, font: 'F1', color: TEXT_DARK });
    csy -= 11;
  }
  y -= 62;
}

doc.addText("FEATURED LAUNCH CITIES IN 2026:", 40, y, { size: 10, font: 'F2', color: TEXT_DARK });
y -= 16;
doc.addText("Jabalpur (Founding Chapter) • New Delhi • Bengaluru • Mumbai • Pune • Kolkata • Hyderabad • Chennai", 40, y, { size: 9, font: 'F1', color: GOLD });

// ============================================================================
// PAGE 7: CONVERSION COPY & INVITATION (JOIN PAGE)
// ============================================================================
doc.addPage();
drawPageHeader("06. CONVERSION COPY & CALLS TO ACTION", 7);

y = 750;
doc.addText("PAGE COPY: 'YOUR MOVE' (JOIN THE COMMUNITY)", 40, y, { size: 13, font: 'F2', color: TEXT_DARK });
y -= 6;
doc.addRect(40, y, 515, 1, GOLD);
y -= 18;

const joinCards = [
  {
    role: "FOR PLAYERS:",
    headline: "Step Onto the National Stage.",
    body: "Register your CCI Player ID today. Track your official Elo across Classical, Rapid, and Blitz. Earn your canonical Rank Badge, discover local city meetups, and claim your seat at sanctioned Swiss tournaments."
  },
  {
    role: "FOR CHAPTER CAPTAINS:",
    headline: "Lead the Revolution in Your Hometown.",
    body: "Bring Chess Community India to your city. We equip you with pairing technology, tournament guidelines, marketing assets, and national leaderboard recognition to build a legendary local club."
  },
  {
    role: "FOR ARBITERS & OFFICIALS:",
    headline: "Uphold the Integrity of the Royal Game.",
    body: "Join our accredited national arbiter network. Officiate regional championships, manage Swiss pairings on the CCI Control Center, and guide the next generation of competitors."
  },
  {
    role: "FOR SPONSORS & PARTNERS:",
    headline: "Invest in the Future of Indian Mind Sports.",
    body: "Partner with India's fastest-growing chess network. Sponsor grand prix prize pools, brand tournament arenas, and empower thousands of aspiring young champions."
  }
];

for (const jc of joinCards) {
  doc.addRect(40, y - 56, 515, 62, CARD_BG, [0.88, 0.88, 0.88]);
  doc.addText(jc.role, 50, y - 12, { size: 9.5, font: 'F2', color: GOLD });
  doc.addText(jc.headline, 180, y - 12, { size: 9.5, font: 'F2', color: TEXT_DARK });
  const jcLines = wrapText(jc.body, 92);
  let jcy = y - 27;
  for (const jcl of jcLines) {
    doc.addText(jcl, 50, jcy, { size: 8.5, font: 'F1', color: TEXT_DARK });
    jcy -= 11;
  }
  y -= 70;
}

// Sign-off box
doc.addRect(40, y - 40, 515, 46, [0.06, 0.14, 0.17]);
doc.addText("CHESS COMMUNITY INDIA — MORE THAN A GAME", 55, y - 16, { size: 10, font: 'F2', color: GOLD });
doc.addText("Official Web: localhost:3000 | Contact: connect@chesscommunityindia.org | Est. 2024", 55, y - 30, { size: 8.5, font: 'F1', color: TEXT_LIGHT });

// Write out the PDF
const pdfBuffer = doc.build();
const outputPath = path.join(__dirname, '..', 'Chess_Community_India_Content_Blueprint.pdf');
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`[OK] PDF generated successfully at: ${outputPath} (${pdfBuffer.length} bytes)`);

// Also save to brain/artifacts directory
const brainDir = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\b892911b-a855-4b7d-bded-e6bacf61b2ca';
const brainPdfPath = path.join(brainDir, 'Chess_Community_India_Content_Blueprint.pdf');
fs.writeFileSync(brainPdfPath, pdfBuffer);
console.log(`[OK] PDF copied to brain artifacts at: ${brainPdfPath}`);
