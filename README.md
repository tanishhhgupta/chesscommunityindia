# Chess Community India (CCI) — Official Platform

Welcome to the **Chess Community India (CCI)** web application and tournament management platform, built for **Tanish** and the Indian chess community.

---

## 🌟 Key Features

### 1. ♟️ Built-in "ChessManager" Tournament System
- **FIDE Dutch Swiss Pairing Engine**:
  - Automatically groups competitors into score brackets.
  - Balances White and Black piece colors (prevents 3 consecutive same colors).
  - Rematch prevention (players cannot face each other twice in the same Swiss event).
  - Odd-player count automatic 1.0 point Bye allocation.
- **Real-Time Arbiter Operations**:
  - Arbiter mode toggle directly on board cards.
  - 1-click result entry: `1 - 0`, `0 - 1`, `½ - ½`, `BYE`.
  - Automatic re-computation of **Buchholz (Cut 1)** and **Sonneborn-Berger** tiebreaks.
  - Printable round pairing sheets and wall charts.

### 2. 🏆 The 45-Tier CCI Elo Rating Continuum (0 to 3000 Elo)
- Specially tailored 45-tier progression:
  - **Tier 1 (0 – 799 Elo)**: **Blundermaster**
  - **Tiers 2 – 9 (800 – 1199 Elo)**: Tactical learners (*Scholar's Mate Survivor*, *Fork Apprentice*, etc.)
  - **Tiers 10 – 21 (1200 – 1799 Elo)**: Club battlers (*Club Challenger*, *Rook Lifter*, *Endgame Grinder*)
  - **Tiers 22 – 33 (1800 – 2399 Elo)**: Masters (*Candidate Master*, *CCI Master*, *Vishy's Prodigy*)
  - **Tiers 34 – 45 (2400 – 3000+ Elo)**: Grandmasters & Legends up to **Avatar of Chess (Chaturanga Deva)**.
- **Dynamic Elo Engine**:
  - Mathematical expected score calculation: $E = \frac{1}{1 + 10^{(R_{opp} - R)/400}}$.
  - Dynamic K-factors ($K=40$ for provisional players under 20 games, $K=20$ for standard, $K=10$ for masters).

### 3. 👥 Player Database & Passports
- Searchable registry by player name, CCI ID, and city.
- Filter by rank (Blundermasters, Club, Master, Grandmaster).
- Interactive **Player Passport** modal displaying career win rates, peak ratings, and FIDE/Chess.com handles.

### 4. 🎲 Dynamic 3D Hero & Visual Aesthetics
- **Interactive Three.js 3D Chessboard**:
  - Custom rendered gold and obsidian pieces on an illuminated board with ambient stardust particles.
  - Real-time mouse-tracking tilt dynamics.
- **Luxury Dark Chess Design System**:
  - Deep obsidian (`#07090E`), royal gold (`#D4AF37`), sapphire and emerald accents.
  - Custom glassmorphic blur panels and hover glow effects.

### 5. 🔐 Authentication & Role Management
- Sign In & Sign Up with Email, Google, Chess.com, or Lichess handles.
- Roles: **Player**, **Arbiter / Director**, and **Super Admin**.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

The application will be live at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```text
CCI Web/
├── src/
│   ├── components/
│   │   ├── 3d/
│   │   │   └── InteractiveChessScene.tsx  # Three.js 3D board & pieces
│   │   ├── auth/
│   │   │   └── AuthModal.tsx              # Login & Role selector
│   │   ├── home/
│   │   │   └── HeroSection.tsx            # Main hero with 3D canvas
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                 # Navigation header
│   │   │   └── Footer.tsx                 # Platform footer
│   │   ├── player/
│   │   │   ├── PlayerDirectory.tsx        # Player registry & passports
│   │   │   ├── TierExplorer.tsx           # 45-tier visual catalog & slider
│   │   │   └── RatingCalculator.tsx       # Live match Elo simulator
│   │   └── tournament/
│   │       └── TournamentManager.tsx      # ChessManager Swiss pairing engine
│   ├── lib/
│   │   ├── chess/
│   │   │   ├── eloEngine.ts               # 45-tier resolver & Elo math
│   │   │   └── pairingEngine.ts           # Swiss Dutch algorithm & tiebreaks
│   │   ├── storage/
│   │   │   └── mockDatabase.ts            # LocalStorage persistence & seed data
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── components.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
