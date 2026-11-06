/**
 * Chess Community India — Curated Chess Avatar Library
 * 
 * Handcrafted vector illustrations for players:
 * King, Queen, Knight, Bishop, Rook, Pawn, Grandmaster, and Tactician.
 * Rendered using CCI's authentic palette: cocoa (#442D1C), antique gold (#C5A059),
 * warm cream (#FAF7F2), and deep charcoal (#1C1613).
 */

export interface ChessAvatar {
  id: string;
  name: string;
  description: string;
  pieceType: "king" | "queen" | "knight" | "bishop" | "rook" | "pawn" | "grandmaster" | "tactician";
  svg: string;
  dataUri: string;
}

function createDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 1. THE KING
const kingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#442D1C"/>
  <!-- Cross -->
  <path d="M48 18 H52 V28 H48 Z M44 21 H56 V25 H44 Z" fill="#C5A059"/>
  <!-- Crown Head -->
  <path d="M35 34 C35 30, 42 28, 50 28 C58 28, 65 30, 65 34 C65 37, 58 40, 50 40 C42 40, 35 37, 35 34 Z" fill="#E8D1A7"/>
  <!-- Regal Arches -->
  <path d="M36 34 C36 44, 43 56, 46 62 H54 C57 56, 64 44, 64 34 Z" fill="#C5A059"/>
  <circle cx="50" cy="46" r="4" fill="#FAF7F2"/>
  <!-- Waist & Base -->
  <path d="M38 66 C38 63, 62 63, 62 66 L68 76 C68 79, 32 79, 32 76 Z" fill="#E8D1A7"/>
  <path d="M28 78 H72 V82 C72 84, 28 84, 28 82 Z" fill="#C5A059"/>
</svg>`;

// 2. THE QUEEN
const queenSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#362315"/>
  <!-- Coronet Pearls -->
  <circle cx="34" cy="24" r="3" fill="#E8D1A7"/>
  <circle cx="42" cy="21" r="3" fill="#C5A059"/>
  <circle cx="50" cy="19" r="3.5" fill="#E8D1A7"/>
  <circle cx="58" cy="21" r="3" fill="#C5A059"/>
  <circle cx="66" cy="24" r="3" fill="#E8D1A7"/>
  <!-- Crown Points -->
  <path d="M32 36 L34 26 L40 34 L50 22 L60 34 L66 26 L68 36 C68 40, 32 40, 32 36 Z" fill="#C5A059"/>
  <!-- Bodice -->
  <path d="M35 38 C35 48, 43 58, 45 64 H55 C57 58, 65 48, 65 38 Z" fill="#E8D1A7"/>
  <!-- Jewel -->
  <polygon points="50,42 54,48 50,54 46,48" fill="#442D1C"/>
  <!-- Tiered Pedestal -->
  <path d="M36 66 H64 L67 76 H33 Z" fill="#C5A059"/>
  <path d="M28 78 H72 V82 C72 84, 28 84, 28 82 Z" fill="#E8D1A7"/>
</svg>`;

// 3. THE KNIGHT
const knightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#2E1D13"/>
  <!-- Mane & Head Silhouette -->
  <path d="M42 20 C47 18, 54 20, 58 26 C62 31, 65 40, 68 50 C70 57, 70 66, 68 74 H34 C34 68, 36 62, 38 56 C33 54, 30 48, 32 42 C33 39, 36 38, 39 39 C36 35, 36 29, 39 25 C40 23, 41 21, 42 20 Z" fill="#C5A059"/>
  <!-- Inner Detail & Muzzle -->
  <path d="M44 24 C48 24, 53 28, 56 34 C58 40, 60 49, 62 60 H40 C38 54, 36 48, 37 43 C38 41, 41 41, 42 42 C41 38, 41 32, 44 28 Z" fill="#E8D1A7"/>
  <!-- Eye -->
  <circle cx="49" cy="32" r="2.5" fill="#2E1D13"/>
  <!-- Nostril & Bridle line -->
  <path d="M34 45 C35 48, 38 49, 41 48" stroke="#2E1D13" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Heavy Base -->
  <path d="M30 76 H70 L72 82 H28 Z" fill="#E8D1A7"/>
</svg>`;

// 4. THE BISHOP
const bishopSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#3D291C"/>
  <!-- Mitre Orb -->
  <circle cx="50" cy="20" r="4" fill="#E8D1A7"/>
  <!-- Mitre Head with Slash/Cleft -->
  <path d="M50 24 C40 28, 36 38, 38 50 C40 56, 44 62, 46 64 H54 C56 62, 60 56, 62 50 C64 38, 60 28, 50 24 Z" fill="#C5A059"/>
  <!-- Bishop Cleft (Slash) -->
  <path d="M52 32 L44 44" stroke="#3D291C" stroke-width="3" stroke-linecap="round"/>
  <!-- Collar & Base -->
  <path d="M42 64 C42 62, 58 62, 58 64 L62 74 H38 Z" fill="#E8D1A7"/>
  <path d="M30 76 H70 V81 C70 83, 30 83, 30 81 Z" fill="#C5A059"/>
</svg>`;

// 5. THE ROOK
const rookSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#291A10"/>
  <!-- Crenellations / Battlements -->
  <path d="M33 24 H40 V30 H47 V24 H53 V30 H60 V24 H67 V36 H33 Z" fill="#E8D1A7"/>
  <!-- Tower Body -->
  <path d="M36 36 L39 64 H61 L64 36 Z" fill="#C5A059"/>
  <!-- Arrow Slit Window -->
  <rect x="48" y="44" width="4" height="10" rx="2" fill="#291A10"/>
  <!-- Base Tier -->
  <path d="M34 66 H66 L70 76 H30 Z" fill="#E8D1A7"/>
  <path d="M26 78 H74 V82 C74 84, 26 84, 26 82 Z" fill="#C5A059"/>
</svg>`;

// 6. THE PAWN
const pawnSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#402C1E"/>
  <!-- Spherical Head -->
  <circle cx="50" cy="30" r="13" fill="#E8D1A7"/>
  <!-- Neck Ring -->
  <ellipse cx="50" cy="44" rx="11" ry="3.5" fill="#C5A059"/>
  <!-- Body -->
  <path d="M42 46 C42 56, 36 66, 36 72 H64 C64 66, 58 56, 58 46 Z" fill="#C5A059"/>
  <!-- Base -->
  <path d="M32 74 H68 L71 80 H29 Z" fill="#E8D1A7"/>
  <rect x="28" y="81" width="44" height="3" rx="1.5" fill="#C5A059"/>
</svg>`;

// 7. THE GRANDMASTER
const grandmasterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#221711"/>
  <!-- Golden Laurel Wreath Leaves -->
  <path d="M32 46 C28 36, 34 26, 44 24" stroke="#C5A059" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M68 46 C72 36, 66 26, 56 24" stroke="#C5A059" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Grandmaster Profile Silhouette -->
  <circle cx="50" cy="38" r="12" fill="#E8D1A7"/>
  <!-- Chessboard Grid Base -->
  <path d="M30 68 H70 L74 80 H26 Z" fill="#C5A059"/>
  <rect x="34" y="70" width="6" height="4" fill="#221711"/>
  <rect x="46" y="70" width="6" height="4" fill="#221711"/>
  <rect x="58" y="70" width="6" height="4" fill="#221711"/>
  <rect x="40" y="74" width="6" height="4" fill="#221711"/>
  <rect x="52" y="74" width="6" height="4" fill="#221711"/>
  <rect x="64" y="74" width="6" height="4" fill="#221711"/>
  <!-- Center Star -->
  <polygon points="50,22 52,27 57,27 53,30 55,35 50,32 45,35 47,30 43,27 48,27" fill="#C5A059"/>
</svg>`;

// 8. THE TACTICIAN
const tacticianSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FAF7F2" stroke="#D5C4B0" stroke-width="2"/>
  <circle cx="50" cy="50" r="44" fill="#1C140E"/>
  <!-- Tactical Compass Grid -->
  <circle cx="50" cy="50" r="28" stroke="#C5A059" stroke-width="1.5" stroke-dasharray="3,3" fill="none"/>
  <!-- Geometric Chess Piece Synthesis -->
  <polygon points="50,22 64,48 50,42 36,48" fill="#E8D1A7"/>
  <polygon points="50,44 66,74 50,68 34,74" fill="#C5A059"/>
  <!-- Central Target Point -->
  <circle cx="50" cy="50" r="3.5" fill="#FAF7F2"/>
  <circle cx="50" cy="50" r="1.5" fill="#1C140E"/>
  <!-- Base Line -->
  <rect x="30" y="77" width="40" height="4" rx="2" fill="#E8D1A7"/>
</svg>`;

export const CHESS_AVATARS: ChessAvatar[] = [
  {
    id: "king",
    name: "The King",
    description: "Sovereign presence and strategic command",
    pieceType: "king",
    svg: kingSvg,
    dataUri: createDataUri(kingSvg),
  },
  {
    id: "queen",
    name: "The Queen",
    description: "Supreme tactical dynamism and authority",
    pieceType: "queen",
    svg: queenSvg,
    dataUri: createDataUri(queenSvg),
  },
  {
    id: "knight",
    name: "The Knight",
    description: "Unorthodox trajectories and tactical leaps",
    pieceType: "knight",
    svg: knightSvg,
    dataUri: createDataUri(knightSvg),
  },
  {
    id: "bishop",
    name: "The Bishop",
    description: "Diagonal precision and long-range mastery",
    pieceType: "bishop",
    svg: bishopSvg,
    dataUri: createDataUri(bishopSvg),
  },
  {
    id: "rook",
    name: "The Rook",
    description: "Unyielding fortress and open-file domination",
    pieceType: "rook",
    svg: rookSvg,
    dataUri: createDataUri(rookSvg),
  },
  {
    id: "pawn",
    name: "The Pawn",
    description: "Resolute structure with path to promotion",
    pieceType: "pawn",
    svg: pawnSvg,
    dataUri: createDataUri(pawnSvg),
  },
  {
    id: "grandmaster",
    name: "The Grandmaster",
    description: "Deep calculation and timeless classical mastery",
    pieceType: "grandmaster",
    svg: grandmasterSvg,
    dataUri: createDataUri(grandmasterSvg),
  },
  {
    id: "tactician",
    name: "The Tactician",
    description: "Geometric precision and sharp combination play",
    pieceType: "tactician",
    svg: tacticianSvg,
    dataUri: createDataUri(tacticianSvg),
  },
];

export const DEFAULT_CHESS_AVATAR = CHESS_AVATARS[2]; // The Knight as default

export function getChessAvatarById(id?: string): ChessAvatar {
  if (!id) return DEFAULT_CHESS_AVATAR;
  const found = CHESS_AVATARS.find((a) => a.id.toLowerCase() === id.toLowerCase());
  return found || DEFAULT_CHESS_AVATAR;
}

export function getChessAvatarByUrl(url?: string): ChessAvatar {
  if (!url) return DEFAULT_CHESS_AVATAR;
  const match = CHESS_AVATARS.find((a) => a.dataUri === url || url.includes(a.id));
  return match || DEFAULT_CHESS_AVATAR;
}
