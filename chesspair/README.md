# ChessPair ♚ - Chess Tournament Management Platform

ChessPair is a modern, responsive, mobile-first web application designed for chess clubs, tournament directors, arbiters, and organizers. Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Supabase / PostgreSQL**.

---

## 🌟 Key Features

### 1. Multi-Tenant Organization & Role-Based Access Control (RBAC)
- Support for multiple independent chess clubs and federations with complete data isolation.
- Five distinct operational roles:
  - **Owner**: Full club administration, billing, and member access management.
  - **Admin**: Tournament configuration, organization settings, and staff delegation.
  - **Organizer**: Tournament creation, player registration, and schedule management.
  - **Arbiter**: Round pairing generation, manual board swaps, result input, and forfeits.
  - **Viewer**: Read-only spectator access for club members, players, and parents.
- Interactive **Demo Persona Switcher** in the navigation bar to immediately experience RBAC enforcement across roles.

### 2. Modular Tournament Pairing Engine (`src/engine/`)
- **Strict FIDE Disclaimer**: Explicitly labeled as a **Basic Swiss Pairing Engine**. Does not claim official FIDE Dutch compliance until the full FIDE Handbook C.04.3.2 ruleset passes independent endorsement validation suites.
- **Pluggable Architecture**: Implements a clean `TournamentEngine` interface ready for:
  - `BasicSwissEngine` (Active in v1)
  - `RoundRobinEngine` (Berger cyclic tables)
  - `KnockoutEngine` (Single/Double elimination brackets)
  - `TeamEngine` (Match points and individual board points)
  - `FideSwissEnginePlaceholder` (Reserved certification drop-in slot)
- **High-Integrity Pairing Heuristics**:
  - Score groups & downfloater backtracking
  - Rematch prevention (invariance checking against tournament history)
  - Color balance tracking (history arrays, color balance scores, consecutive color limits)
  - Odd-player bye assignment (allocated to lowest eligible score group; never repeated)
  - Comprehensive tiebreak algorithms (Buchholz Cut-1, Buchholz Total, Sonneborn-Berger, Direct Encounter, Most Blacks, Number of Wins)

### 3. Arbiter Command Desk & Audit Logging
- **Pairing Previews**: Generates draft pairings with interactive validation feedback before publishing.
- **Manual Board Adjustments**: Arbiters can swap boards with mandatory justification reasons permanently saved in audit records.
- **Fast 1-Tap Result Entry**: `1-0`, `½-½`, `0-1`, plus dedicated modal for forfeits (`1F-0`, `0-1F`, `0F-0F`) and unplayed games.
- **Audit Records**: Full chronological ledger of every pairing calculation, result change, and manual swap.

### 4. Player Management & CSV Integration
- Member roster with FIDE IDs, national ratings, official titles (GM, IM, FM, CM, WGM), federation, and status.
- **CSV Bulk Import**: Drag-and-drop file upload with column auto-mapping, error validation reporting, and downloadable sample templates.
- **CSV Export**: One-click download of the active roster or tournament standings.

### 5. Public Spectator Portal
- Mobile-optimized view for players, parents, and spectators on their smartphones at the venue.
- **Instant Player Lookup**: Search by player name or board number to immediately see assigned board, color (♔ White or ♚ Black), and opponent.
- **Live Standings & Tiebreak Math**: Transparent round-by-round math showing how each opponent contributed to Buchholz and Sonneborn-Berger scores.
- **Printable Sheets**: Formatted for physical bulletin board postings at chess clubs.

---

## 🗄️ Database Architecture & PostgreSQL Schema

The production PostgreSQL database schema is defined in [`supabase/schema.sql`](supabase/schema.sql) and includes:

- `public.profiles`: Extends Supabase auth users.
- `public.organizations`: Clubs, federations, and tournament academies.
- `public.organization_members`: User-organization role assignments (`owner`, `admin`, `organizer`, `arbiter`, `viewer`).
- `public.players`: Member roster with ratings and FIDE identifiers.
- `public.tournaments`: Tournament configurations, engine versions, and tiebreak priority lists.
- `public.tournament_players`: Seeded tournament participants with withdrawal tracking.
- `public.rounds`: Round schedules, statuses (`draft`, `published`, `in_progress`, `completed`), and pairing locks.
- `public.pairings`: Board pairings, piece colors, game results, and manual override tracking.
- `public.audit_logs`: Detailed JSON audit trails with actor identity and timestamps.
- **Row Level Security (RLS)**: Fine-grained policies ensuring data isolation between organizations.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+ LTS
- npm 9+

### Installation & Run

```bash
# Clone the repository and install dependencies
npm install

# Run the development server
npm run dev

# Run automated unit tests
npm test

# Build for production
npm run build
```

---

## 🧪 Automated Test Suite

ChessPair includes automated unit tests using Vitest covering:
- **Round 1 Seeding & Color Alternation**: Top-half vs bottom-half matching.
- **Score Groups & Bracket Progression**: Round 2+ score groups.
- **Odd-Player Byes**: Bye assigned to lowest score bracket and guaranteed never given twice to the same player.
- **Consecutive Color Invariants**: Enforces maximum consecutive same colors.
- **Tiebreaks**: Verification of Buchholz, Buchholz Cut-1, and Sonneborn-Berger mathematical correctness.
- **CSV Parser & Validation**: CSV column extraction and error line reporting.
- **RBAC Matrix**: Verification of permissions for all 5 roles.

To run the test suite:
```bash
npm test
```
