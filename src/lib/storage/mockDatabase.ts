import { TournamentPlayer, BoardMatch } from '../chess/pairingEngine';
import { getTierFromRating } from '../chess/eloEngine';

export interface PlayerRecord {
  id: string;
  cciId: string;
  name: string;
  avatarUrl: string;
  rating: number;
  peakRating: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  city: string;
  state: string;
  fideId?: string;
  chessComUser?: string;
  lichessUser?: string;
  role: 'admin' | 'arbiter' | 'player';
  tierNumber: number;
  tierName: string;
}

export interface TournamentRecord {
  id: string;
  title: string;
  format: 'Swiss System' | 'Round Robin' | 'Single Elimination';
  timeControl: string;
  totalRounds: number;
  currentRound: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  location: string;
  players: TournamentPlayer[];
  rounds: { [roundNumber: number]: BoardMatch[] };
}

export interface CityChapter {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  memberCount: number;
  weeklyVenues: string[];
  leadName: string;
  leadRole: string;
  whatsappUrl: string;
  instagramUrl: string;
  imageUrl: string;
  logoUrl?: string;
  isOrigin?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'National Swiss' | 'City Rapid' | 'Cafe Blitz' | 'College Championship' | 'Youth Workshop';
  city: string;
  venue: string;
  startsAt: string;
  format: string;
  timeControl: string;
  entryFee: string;
  prizePool: string;
  registeredCount: number;
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  isFeatured?: boolean;
  description: string;
}

export interface PartnerItem {
  name: string;
  category: 'Platform Partner' | 'Media Partner' | 'Academic Partner' | 'Association';
  logoUrl: string;
  description: string;
  websiteUrl: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  city: string;
  avatarUrl: string;
  quote: string;
  rating: number;
}

export interface JobPost {
  id: string;
  title: string;
  department: 'Tournament Operations' | 'Community Growth' | 'Technology & Engineering' | 'Design & Media';
  type: 'Full-time' | 'Fellowship' | 'Volunteer Lead' | 'Arbiter Panel';
  location: string;
  compensation: string;
  description: string;
  requirements: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  location: string;
  imageUrl: string;
  year: string;
}

// 1. Initial Community Seed Players
export const INITIAL_PLAYERS: PlayerRecord[] = [
  {
    id: "p-01",
    cciId: "CCI-2026-0001",
    name: "Tanish Gupta",
    avatarUrl: "/logos/cci-logo.png",
    rating: 2210,
    peakRating: 2245,
    matchesPlayed: 84,
    wins: 58,
    draws: 14,
    losses: 12,
    city: "Jabalpur",
    state: "Madhya Pradesh",
    role: "admin",
    fideId: "5049382",
    chessComUser: "tanish_cci",
    tierNumber: 5,
    tierName: "Crown Contender"
  },
  {
    id: "p-02",
    cciId: "CCI-2026-0056",
    name: "Priya Sharma",
    avatarUrl: "/logos/cci-logo.png",
    rating: 1500,
    peakRating: 1540,
    matchesPlayed: 28,
    wins: 17,
    draws: 5,
    losses: 6,
    city: "Jabalpur",
    state: "Madhya Pradesh",
    role: "player",
    tierNumber: 3,
    tierName: "Positional Strategist"
  },
  {
    id: "p-03",
    cciId: "CCI-2026-0055",
    name: "Raman Pratap Singh",
    avatarUrl: "/logos/cci-logo.png",
    rating: 1580,
    peakRating: 1630,
    matchesPlayed: 24,
    wins: 14,
    draws: 4,
    losses: 6,
    city: "Jabalpur",
    state: "Madhya Pradesh",
    role: "player",
    tierNumber: 3,
    tierName: "Positional Strategist"
  },
  {
    id: "p-04",
    cciId: "CCI-2026-0089",
    name: "Ananya Deshpande",
    avatarUrl: "/logos/cci-logo.png",
    rating: 1230,
    peakRating: 1260,
    matchesPlayed: 45,
    wins: 24,
    draws: 7,
    losses: 14,
    city: "Indore",
    state: "Madhya Pradesh",
    role: "player",
    chessComUser: "ananya_chess",
    tierNumber: 2,
    tierName: "Tactical Striker"
  },
  {
    id: "p-05",
    cciId: "CCI-2026-0105",
    name: "Vikramaditya Rao",
    avatarUrl: "/logos/cci-logo.png",
    rating: 1680,
    peakRating: 1710,
    matchesPlayed: 62,
    wins: 38,
    draws: 10,
    losses: 14,
    city: "Bhopal",
    state: "Madhya Pradesh",
    role: "arbiter",
    fideId: "5083112",
    chessComUser: "vikram_arbiter",
    tierNumber: 4,
    tierName: "Vanguard Commander"
  },
  {
    id: "p-06",
    cciId: "CCI-2026-0054",
    name: "Tanay",
    avatarUrl: "/logos/cci-logo.png",
    rating: 1020,
    peakRating: 1030,
    matchesPlayed: 12,
    wins: 6,
    draws: 2,
    losses: 4,
    city: "Jabalpur",
    state: "Madhya Pradesh",
    role: "player",
    tierNumber: 2,
    tierName: "Tactical Striker"
  },
  {
    id: "p-07",
    cciId: "CCI-2026-0199",
    name: "Kavya Menon",
    avatarUrl: "/logos/cci-logo.png",
    rating: 1980,
    peakRating: 2010,
    matchesPlayed: 79,
    wins: 49,
    draws: 15,
    losses: 15,
    city: "Bengaluru",
    state: "Karnataka",
    role: "player",
    fideId: "5099231",
    tierNumber: 4,
    tierName: "Vanguard Commander"
  }
];

// 2. City Chapters Data (Authentic from CCI Foundation)
export const INITIAL_CITIES: CityChapter[] = [
  {
    id: "city-jbp",
    slug: "jabalpur",
    name: "Jabalpur",
    tagline: "Where our first twenty players became a nationwide movement.",
    description: "The birthplace of Chess Community India. From weekend park benches to packed auditoriums at IIITDM and JEC, Jabalpur remains our heart.",
    memberCount: 2450,
    weeklyVenues: ["Brew & Stories Cafe, Civil Lines", "IIITDM Campus Boardroom", "High Court Road Gardens"],
    leadName: "Tanish Gupta & Arbiter Team",
    leadRole: "Chapter Founders",
    whatsappUrl: "https://chat.whatsapp.com/chesscommunityjabalpur",
    instagramUrl: "https://instagram.com/chesscommunityjabalpur",
    imageUrl: "/images/cafe.webp",
    logoUrl: "/logos/ccj-logo.png",
    isOrigin: true
  },
  {
    id: "city-bpl",
    slug: "bhopal",
    name: "Bhopal",
    tagline: "Chess finds an electric rhythm in the City of Lakes.",
    description: "Connecting universities, mall open challenges at DB City Mall, and evening lakeside rapid tournaments with hundreds of enthusiasts.",
    memberCount: 1890,
    weeklyVenues: ["DB City Mall Central Atrium", "Ten Downing Cafe", "Upper Lake Promenade"],
    leadName: "Vikramaditya Rao",
    leadRole: "FIDE National Arbiter & City Lead",
    whatsappUrl: "https://chat.whatsapp.com/chesscommunitybhopal",
    instagramUrl: "https://instagram.com/chesscommunitybhopal",
    imageUrl: "/images/mall.webp",
    logoUrl: "/logos/ccb-logo.jpg"
  },
  {
    id: "city-idr",
    slug: "indore",
    name: "Indore",
    tagline: "India's cleanest city is also its most passionate chess hub.",
    description: "Rapid collegiate circuits, cafe blitz marathons, and institutional partnerships with SGSITS and IILM University.",
    memberCount: 3120,
    weeklyVenues: ["SGSITS Indore Auditorium", "Chhappan Dukan Chess Bench", "Vijay Nagar Coffee Tables"],
    leadName: "Ananya Deshpande",
    leadRole: "Indore Regional Director",
    whatsappUrl: "https://chat.whatsapp.com/chesscommunityindore",
    instagramUrl: "https://instagram.com/chesscommunityindore",
    imageUrl: "/images/rows.webp",
    logoUrl: "/logos/cci-indore.png"
  },
  {
    id: "city-del",
    slug: "delhi",
    name: "Delhi NCR",
    tagline: "The capital circuit — connecting masterminds across the metropolis.",
    description: "Open community tables from Connaught Place to Cyber Hub, hosting grand opens, corporate blitz clashes, and student mentorship drives.",
    memberCount: 4600,
    weeklyVenues: ["Connaught Place Central Park", "Cyber Hub Amphitheater", "Lodhi Garden Pavilions"],
    leadName: "Rohan & Delhi Core",
    leadRole: "Capital Circuit Coordinator",
    whatsappUrl: "https://chat.whatsapp.com/chesscommunitydelhi",
    instagramUrl: "https://instagram.com/chesscommunityindia",
    imageUrl: "/images/tournament.webp",
    logoUrl: "/logos/cci-logo.png"
  }
];

// 3. Events & Tournaments Calendar
export const INITIAL_EVENTS: EventItem[] = [
  {
    id: "ev-01",
    title: "CCI All-India Grand Open 2026",
    category: "National Swiss",
    city: "National Online / Central Hubs",
    venue: "CCI Virtual Arbiter Grid & Partner Centers",
    startsAt: "Live Now &bull; Round 3 of 5",
    format: "FIDE Dutch Swiss &bull; 5 Rounds",
    timeControl: "15 min + 10 sec Rapid",
    entryFee: "₹0 (Free Community Drive)",
    prizePool: "₹50,000 + FIDE CCI Medals",
    registeredCount: 64,
    capacity: 64,
    status: "ongoing",
    isFeatured: true,
    description: "The premier multi-city Swiss showdown featuring international titled masters, collegiate stars, and verified amateur contenders."
  },
  {
    id: "ev-02",
    title: "Jabalpur Community Chess Sunday #48",
    category: "Cafe Blitz",
    city: "Jabalpur",
    venue: "Brew & Stories Cafe, Civil Lines",
    startsAt: "Sunday, 4:00 PM IST",
    format: "Arena Blitz &bull; 7 Rounds",
    timeControl: "3 min + 2 sec Blitz",
    entryFee: "₹100 (Includes Beverage)",
    prizePool: "Custom Chess Board & Certificates",
    registeredCount: 42,
    capacity: 60,
    status: "upcoming",
    isFeatured: true,
    description: "Friendly pairings, beginner training masterclass with senior arbiters, and our iconic community king-of-the-hill blitz challenge."
  },
  {
    id: "ev-03",
    title: "Bhopal Lake City Mall Open",
    category: "City Rapid",
    city: "Bhopal",
    venue: "DB City Mall Central Court",
    startsAt: "Saturday 11th Oct, 10:00 AM",
    format: "Swiss System &bull; 6 Rounds",
    timeControl: "10 min + 5 sec Rapid",
    entryFee: "Free Entry",
    prizePool: "₹25,000 Cash Pool",
    registeredCount: 88,
    capacity: 120,
    status: "upcoming",
    description: "Spectator-friendly public chess spectacle bringing together players from ages 6 to 75 on high-grade sensory wooden boards."
  },
  {
    id: "ev-04",
    title: "Indore Inter-Collegiate Rapid Clash",
    category: "College Championship",
    city: "Indore",
    venue: "SGSITS Sports Complex",
    startsAt: "Friday 24th Oct, 9:00 AM",
    format: "Team & Individual Swiss",
    timeControl: "15 min + 10 sec",
    entryFee: "Institutional Registration",
    prizePool: "Rolling Championship Trophy & CCI Tiers",
    registeredCount: 96,
    capacity: 100,
    status: "upcoming",
    description: "Over 18 regional engineering & management institutions competing for the central zone collegiate crown."
  },
  {
    id: "ev-05",
    title: "The First Twenty: CCI Founding Meet",
    category: "National Swiss",
    city: "Jabalpur",
    venue: "Public Park Benches, Jabalpur",
    startsAt: "Historic Origin &bull; 2024",
    format: "Casual Round Robin",
    timeControl: "Untimed / Classic",
    entryFee: "Free",
    prizePool: "The Birth of Chess Community India",
    registeredCount: 20,
    capacity: 20,
    status: "completed",
    description: "The unforgettable afternoon where twenty passionate players sat under the afternoon sun and decided to democratize Indian chess."
  }
];

// 4. Institutional Partners & Organizations
export const INITIAL_PARTNERS: PartnerItem[] = [
  {
    name: "Chess.com",
    category: "Platform Partner",
    logoUrl: "/logos/chess-com.png",
    description: "Global digital chess platform providing verified clubs, arena integration, and platform support.",
    websiteUrl: "https://chess.com"
  },
  {
    name: "ChessBase India",
    category: "Media Partner",
    logoUrl: "/logos/chessbase-india.png",
    description: "India's premier chess media house, spotlighting grassroots heroes and national champions.",
    websiteUrl: "https://chessbase.in"
  },
  {
    name: "IIITDM Jabalpur",
    category: "Academic Partner",
    logoUrl: "/logos/iiitdm-jabalpur.png",
    description: "Premier national institute hosting technical tournaments and student AI analytics initiatives.",
    websiteUrl: "https://iiitdmj.ac.in"
  },
  {
    name: "SGSITS Indore",
    category: "Academic Partner",
    logoUrl: "/logos/sgsits-indore.png",
    description: "Central India's leading technology campus fostering inter-college tournaments and chess clubs.",
    websiteUrl: "https://sgsits.ac.in"
  },
  {
    name: "IILM University",
    category: "Academic Partner",
    logoUrl: "/logos/iilm-university.png",
    description: "Academic collaborator fostering executive leadership, strategic thinking, and youth mentorship.",
    websiteUrl: "https://iilm.edu"
  },
  {
    name: "Jabalpur Engineering College",
    category: "Academic Partner",
    logoUrl: "/logos/jabalpur-engineering-college.png",
    description: "Government engineering institute supporting historic community chess drives.",
    websiteUrl: "https://jecjabalpur.ac.in"
  },
  {
    name: "District Chess Association",
    category: "Association",
    logoUrl: "/logos/district-chess-association-jabalpur.png",
    description: "FIDE-recognized district sports council governing arbiter certifications and ratings.",
    websiteUrl: "#"
  }
];

// 5. Authentic Testimonials
export const INITIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "test-01",
    name: "Tanish Gupta",
    role: "Founder, Chess Community India",
    city: "Jabalpur",
    avatarUrl: "/logos/cci-logo.png",
    quote: "CCI started with informal park meets in Jabalpur. Building transparent Swiss systems, fair pairings, and accessible ratings is our lifelong dedication to Indian chess.",
    rating: 5
  },
  {
    id: "test-02",
    name: "Vikramaditya Rao",
    role: "Chief Arbiter & FIDE Arbiter",
    city: "Bhopal",
    avatarUrl: "/logos/cci-logo.png",
    quote: "The Swiss engine CCI operates follows strict FIDE Dutch Swiss protocols with real-time Buchholz calculations, ensuring zero bias across all tournament boards.",
    rating: 5
  },
  {
    id: "test-03",
    name: "Ananya Deshpande",
    role: "Chapter Organizer",
    city: "Indore",
    avatarUrl: "/logos/cci-logo.png",
    quote: "Grassroots chess thrives when players feel like part of an inspiring community rather than arbitrary registration numbers.",
    rating: 5
  }
];

// 6. Community Photo Gallery
export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: "gal-01",
    title: "Cafe Blitz Sundays",
    caption: "Casual coffee, ticking clocks, and deep calculations at Brew & Stories.",
    location: "Civil Lines, Jabalpur",
    imageUrl: "/images/cafe.webp",
    year: "2026"
  },
  {
    id: "gal-02",
    title: "DB City Mall Grand Arena",
    caption: "Over 100 simultaneous boards surrounded by curious shoppers and young prodigies.",
    location: "Bhopal Central",
    imageUrl: "/images/mall.webp",
    year: "2026"
  },
  {
    id: "gal-03",
    title: "Simultaneous Board Rows",
    caption: "Silence takes over the hall as the arbiter sounds the opening bell.",
    location: "SGSITS, Indore",
    imageUrl: "/images/rows.webp",
    year: "2026"
  },
  {
    id: "gal-04",
    title: "National Swiss Championship",
    caption: "Top-board contenders fighting down to the final king and pawn endgame.",
    location: "Delhi Circuit",
    imageUrl: "/images/tournament.webp",
    year: "2026"
  },
  {
    id: "gal-05",
    title: "Grassroots Youth Drive",
    caption: "Teaching foundational opening principles to the next generation of champions.",
    location: "Community Center",
    imageUrl: "/images/community.webp",
    year: "2025"
  },
  {
    id: "gal-06",
    title: "The First Twenty Pioneers",
    caption: "The historic gathering that launched Chess Community India.",
    location: "Origin Grounds",
    imageUrl: "/images/group.webp",
    year: "2024"
  }
];

// 7. Career & Volunteer Positions
export const INITIAL_JOBS: JobPost[] = [
  {
    id: "job-01",
    title: "City Chapter Lead (Multiple Cities)",
    department: "Community Growth",
    type: "Fellowship",
    location: "Bangalore, Pune, Hyderabad, Lucknow",
    compensation: "Stipend + Event Revenue Share",
    description: "Lead weekend chess meetups, build cafe partnerships, and represent Chess Community India as the regional face in your city.",
    requirements: [
      "Deep passion for grassroots chess culture",
      "Organized, empathetic, and communicative",
      "Experience running community tables or college societies"
    ]
  },
  {
    id: "job-02",
    title: "FIDE / National Arbiter Panelist",
    department: "Tournament Operations",
    type: "Arbiter Panel",
    location: "Pan-India / Hybrid",
    compensation: "Per-Tournament Honorarium",
    description: "Supervise official FIDE Dutch Swiss pairing, verify scorecards, handle appeals, and mentor apprentice arbiters.",
    requirements: [
      "FIDE Arbiter (FA), National Arbiter (NA), or verified club director experience",
      "Deep familiarity with FIDE Handbook & Swiss pairing protocols",
      "Calm demeanor under competitive dispute conditions"
    ]
  },
  {
    id: "job-03",
    title: "Full-Stack Creative Developer",
    department: "Technology & Engineering",
    type: "Full-time",
    location: "Remote (India)",
    compensation: "Competitive + Equity Opportunity",
    description: "Architect Next.js, WebGL/Three.js 3D board visualizations, real-time WebSockets pairing telemetry, and mobile experiences.",
    requirements: [
      "Mastery of React, TypeScript, Tailwind CSS, Canvas & Three.js",
      "High design taste (Awwwards-level visual sensibilities)",
      "Passion for game theory and tournament algorithms"
    ]
  }
];

// Helper to convert player record to tournament participant
export function createTournamentParticipant(p: PlayerRecord, score = 0): TournamentPlayer {
  const tier = getTierFromRating(p.rating);
  return {
    id: p.id,
    cciId: p.cciId,
    name: p.name,
    rating: p.rating,
    tierName: tier.name,
    score,
    colorHistory: [],
    opponentsPlayed: [],
    hasReceivedBye: false,
    buchholzCut1: 0,
    sonnebornBerger: 0,
  };
}

// Initial Sample Tournament (CCI Grand Open - Swiss)
export function getInitialTournament(): TournamentRecord {
  const participants: TournamentPlayer[] = [
    {
      id: "p-01",
      cciId: "CCI-2026-0001",
      name: "Tanish Gupta (Admin)",
      rating: 2210,
      tierName: "Crown Contender",
      score: 2.0,
      colorHistory: ['W', 'B'],
      opponentsPlayed: ['p-05', 'p-07'],
      hasReceivedBye: false,
      buchholzCut1: 1.5,
      sonnebornBerger: 2.0
    },
    {
      id: "p-02",
      cciId: "CCI-2026-0012",
      name: "Arjun Erigaisi",
      rating: 2805,
      tierName: "Grand Sovereign",
      score: 2.0,
      colorHistory: ['B', 'W'],
      opponentsPlayed: ['p-06', 'p-04'],
      hasReceivedBye: false,
      buchholzCut1: 1.0,
      sonnebornBerger: 2.0
    },
    {
      id: "p-07",
      cciId: "CCI-2026-0199",
      name: "Kavya Menon",
      rating: 1980,
      tierName: "Vanguard Commander",
      score: 1.0,
      colorHistory: ['W', 'W'],
      opponentsPlayed: ['p-08', 'p-01'],
      hasReceivedBye: false,
      buchholzCut1: 2.0,
      sonnebornBerger: 1.0
    },
    {
      id: "p-05",
      cciId: "CCI-2026-0105",
      name: "Vikramaditya Rao",
      rating: 1680,
      tierName: "Vanguard Commander",
      score: 1.0,
      colorHistory: ['B', 'W'],
      opponentsPlayed: ['p-01', 'p-08'],
      hasReceivedBye: false,
      buchholzCut1: 2.0,
      sonnebornBerger: 1.0
    },
    {
      id: "p-04",
      cciId: "CCI-2026-0089",
      name: "Ananya Deshpande",
      rating: 1230,
      tierName: "Positional Strategist",
      score: 1.0,
      colorHistory: ['W', 'B'],
      opponentsPlayed: ['p-03', 'p-02'],
      hasReceivedBye: false,
      buchholzCut1: 2.0,
      sonnebornBerger: 1.0
    },
    {
      id: "p-06",
      cciId: "CCI-2026-0142",
      name: "Aarav Patel",
      rating: 1180,
      tierName: "Tactical Striker",
      score: 1.0,
      colorHistory: ['W', 'B'],
      opponentsPlayed: ['p-02', 'p-03'],
      hasReceivedBye: false,
      buchholzCut1: 2.0,
      sonnebornBerger: 1.0
    },
    {
      id: "p-08",
      cciId: "CCI-2026-0240",
      name: "Devansh Singhania",
      rating: 830,
      tierName: "Tactical Striker",
      score: 0.0,
      colorHistory: ['B', 'B'],
      opponentsPlayed: ['p-07', 'p-05'],
      hasReceivedBye: false,
      buchholzCut1: 2.0,
      sonnebornBerger: 0.0
    },
    {
      id: "p-03",
      cciId: "CCI-2026-0044",
      name: "Rohan 'Blunder' Sharma",
      rating: 740,
      tierName: "Blunder Master",
      score: 0.0,
      colorHistory: ['B', 'W'],
      opponentsPlayed: ['p-04', 'p-06'],
      hasReceivedBye: false,
      buchholzCut1: 2.0,
      sonnebornBerger: 0.0
    }
  ];

  const round3Matches: BoardMatch[] = [
    {
      id: "m-r3-b1",
      boardNumber: 1,
      whitePlayer: participants[0]!, // Tanish (2.0)
      blackPlayer: participants[1]!, // Arjun (2.0)
      result: 'PENDING',
      isCompleted: false
    },
    {
      id: "m-r3-b2",
      boardNumber: 2,
      whitePlayer: participants[3]!, // Vikramaditya (1.0)
      blackPlayer: participants[2]!, // Kavya (1.0)
      result: 'PENDING',
      isCompleted: false
    },
    {
      id: "m-r3-b3",
      boardNumber: 3,
      whitePlayer: participants[5]!, // Aarav (1.0)
      blackPlayer: participants[4]!, // Ananya (1.0)
      result: 'PENDING',
      isCompleted: false
    },
    {
      id: "m-r3-b4",
      boardNumber: 4,
      whitePlayer: participants[7]!, // Rohan (0.0)
      blackPlayer: participants[6]!, // Devansh (0.0)
      result: 'PENDING',
      isCompleted: false
    }
  ];

  return {
    id: "tourney-cci-blitz-2026",
    title: "CCI All-India Grand Open 2026",
    format: "Swiss System",
    timeControl: "15 Min + 10 Sec Rapid",
    totalRounds: 5,
    currentRound: 3,
    status: "ongoing",
    startDate: "2026-10-01",
    location: "National Swiss Grid & Local Hubs",
    players: participants,
    rounds: {
      3: round3Matches
    }
  };
}

// Storage Keys
const STORAGE_PLAYERS_KEY = "cci_players_store_v2";
const STORAGE_TOURNEY_KEY = "cci_tourney_store_v2";
const STORAGE_REGISTRATIONS_KEY = "cci_registrations_store_v2";

export function loadStoredPlayers(): PlayerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLAYERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read local storage, using initial seed data", e);
  }
  return INITIAL_PLAYERS;
}

export function saveStoredPlayers(players: PlayerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(players));
  } catch (e) {
    console.error("Could not write to local storage", e);
  }
}

export function loadStoredTournament(): TournamentRecord {
  try {
    const raw = localStorage.getItem(STORAGE_TOURNEY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read local storage tournament, using initial", e);
  }
  return getInitialTournament();
}

export function saveStoredTournament(tourney: TournamentRecord): void {
  try {
    localStorage.setItem(STORAGE_TOURNEY_KEY, JSON.stringify(tourney));
  } catch (e) {
    console.error("Could not write tournament to local storage", e);
  }
}

// Event Registrations
export interface RegistrationRecord {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  fideId?: string;
  timestamp: string;
}

export function loadEventRegistrations(): RegistrationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTRATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load registrations", e);
  }
  return [];
}

export function saveEventRegistration(reg: Omit<RegistrationRecord, 'id' | 'timestamp'>): RegistrationRecord {
  const all = loadEventRegistrations();
  const newReg: RegistrationRecord = {
    ...reg,
    id: `reg-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  all.push(newReg);
  try {
    localStorage.setItem(STORAGE_REGISTRATIONS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Could not save registration", e);
  }
  return newReg;
}
