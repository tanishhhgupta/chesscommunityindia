/**
 * Chess Community India — Content Management Store
 * 
 * Persistent source of truth for all editable website content:
 * - Landing Page (Hero, Events, Cities, Why CCI, ChessPair Promo, Get Involved, Newsletter, Partner Logos)
 * - Cities Directory (All city chapters, venues, leads, coordinates, images, status)
 * - Events & Tournaments (Public listings, posters, dates, venues, categories, status)
 * - Hiring (Job posts, requirements, application links)
 * - Work With Us (Tracks, descriptions, partnerships)
 * - About Us (Story, mission, values, images)
 * - Media Library (Uploaded assets with metadata, dimensions, alt text)
 * - Forms & Submissions (Event registrations, newsletter subscribers, partner inquiries)
 * - Global Settings (Site title, SEO metadata, contact info, social links, navigation, footer)
 * - Audit Logs (Ledger of all content and administrative modifications)
 */

import { useState, useEffect } from 'react';
import { INITIAL_CITIES, CityChapter, INITIAL_EVENTS, EventItem, INITIAL_JOBS, JobPost, INITIAL_PARTNERS, PartnerItem } from './mockDatabase';
import { MAP_CITIES, MapCityNode } from '../../components/community/IndiaMap';
import { subscribeNewsletter, isSupabaseConfigured, supabase } from '../supabase/client';

export interface LandingHeroContent {
  announcementText: string;
  announcementHighlight: string;
  announcementLink: string;
  headlineLine1: string;
  headlineHighlight: string;
  headlineLine2: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  pillar1Text: string;
  pillar2Text: string;
  pillar3Text: string;
  showSection: boolean;
}

export interface LandingWhyCCIContent {
  kicker: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  showSection: boolean;
}

export interface LandingChessPairPromoContent {
  kicker: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
  statsNumber: string;
  statsText: string;
  showSection: boolean;
}

export interface LandingGetInvolvedContent {
  kicker: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
  showSection: boolean;
}

export interface LandingNewsletterContent {
  kicker: string;
  title: string;
  description: string;
  buttonText: string;
  showSection: boolean;
}

export interface LandingPageContent {
  hero: LandingHeroContent;
  whyCci: LandingWhyCCIContent;
  chessPairPromo: LandingChessPairPromoContent;
  getInvolved: LandingGetInvolvedContent;
  newsletter: LandingNewsletterContent;
  partnerLogos: { name: string; logoUrl: string; websiteUrl: string }[];
  featuredCitySlugs: string[];
  featuredEventIds: string[];
}

export interface EditableCityChapter extends CityChapter {
  status: 'published' | 'draft';
  order: number;
  region?: string;
  coordinates?: { x: number; y: number };
}

export interface EditableEventItem extends EventItem {
  status: 'upcoming' | 'ongoing' | 'completed';
  publishedStatus: 'published' | 'draft';
  order: number;
  imageUrl?: string;
  registrationLink?: string;
}

export interface EditableJobPost extends JobPost {
  publishedStatus: 'published' | 'draft';
  applicationUrl?: string;
}

export interface AboutPageContent {
  kicker: string;
  headlineLine1: string;
  headlineLine2: string;
  subheadline: string;
  storyHeading: string;
  storyParagraph1: string;
  storyParagraph2: string;
  storyParagraph3: string;
  heroImageUrl: string;
  storyImageUrl: string;
  values: { title: string; description: string; icon: string }[];
}

export interface WorkWithUsContent {
  kicker: string;
  headline: string;
  subheadline: string;
  heroImageUrl: string;
  tracks: {
    id: string;
    title: string;
    badge: string;
    description: string;
  }[];
}

export interface WebsiteSectionSlot {
  slotKey: string;
  sectionName: string;
  category: 'hero' | 'cities' | 'events' | 'about' | 'general' | 'team' | 'partners';
  description: string;
  defaultUrl: string;
}

export const WEBSITE_SECTION_SLOTS: WebsiteSectionSlot[] = [
  {
    slotKey: "homepage_hero_arch",
    sectionName: "Homepage: Hero Architecture Background",
    category: "hero",
    description: "Sunlit classical architectural graphic displayed behind hero and work headers",
    defaultUrl: "/images/redesign/hero-arch.jpg",
  },
  {
    slotKey: "home_why_cci",
    sectionName: "Homepage: Why CCI Knight",
    category: "hero",
    description: "Hand-carved gold chess knight in the 'Why CCI' section on the homepage",
    defaultUrl: "/images/redesign/knight-gold.jpg",
  },
  {
    slotKey: "home_chesspair",
    sectionName: "Homepage: Chess Pair Cafe",
    category: "hero",
    description: "Community players in weekend cafe meetup in the Chess Pair promo section",
    defaultUrl: "/images/redesign/chesspair-cafe.jpg",
  },
  {
    slotKey: "home_get_involved",
    sectionName: "Homepage: Get Involved Gathering",
    category: "general",
    description: "Community gathering and tactical game analysis photo",
    defaultUrl: "/images/redesign/community-discussion.jpg",
  },
  {
    slotKey: "city_jabalpur",
    sectionName: "Cities: Jabalpur Chapter Card",
    category: "cities",
    description: "Visual card and header banner for Jabalpur Origin Chapter",
    defaultUrl: "/images/redesign/city-jabalpur.jpg",
  },
  {
    slotKey: "city_bhopal",
    sectionName: "Cities: Bhopal Chapter Card",
    category: "cities",
    description: "Visual card and header banner for Bhopal Lake Chapter",
    defaultUrl: "/images/redesign/city-bhopal.jpg",
  },
  {
    slotKey: "city_indore",
    sectionName: "Cities: Indore Chapter Card",
    category: "cities",
    description: "Visual card and header banner for Indore Chapter",
    defaultUrl: "/images/redesign/city-indore.jpg",
  },
  {
    slotKey: "city_delhi",
    sectionName: "Cities: Delhi NCR Chapter Card",
    category: "cities",
    description: "Visual card and header banner for Delhi NCR Chapter",
    defaultUrl: "/images/redesign/city-delhi.jpg",
  },
  {
    slotKey: "event_ev-01",
    sectionName: "Events: National Swiss Open 2026",
    category: "events",
    description: "Championship arena poster for CCI National Swiss Open 2026",
    defaultUrl: "/images/redesign/event-swiss.jpg",
  },
  {
    slotKey: "event_ev-02",
    sectionName: "Events: Central India Rapid Grand Prix",
    category: "events",
    description: "Tournament poster for Central India Rapid Grand Prix",
    defaultUrl: "/images/redesign/event-rapid.jpg",
  },
  {
    slotKey: "event_ev-03",
    sectionName: "Events: Upper Lake Coffee & Blitz",
    category: "events",
    description: "Friday evening blitz tournament card",
    defaultUrl: "/images/redesign/event-blitz.jpg",
  },
  {
    slotKey: "about_hero",
    sectionName: "About Us: Hero Wooden Board",
    category: "about",
    description: "Studio shot of wooden chess king in sunlight on the About Us page",
    defaultUrl: "/images/redesign/work-with-us-board.jpg",
  },
  {
    slotKey: "about_story",
    sectionName: "About Us: Origin Story Knight",
    category: "about",
    description: "Classical gold knight statue in the Story of CCI section",
    defaultUrl: "/images/redesign/knight-gold.jpg",
  },
  {
    slotKey: "work_hero",
    sectionName: "Work With Us: Hero Banner",
    category: "about",
    description: "Banner image for Work With Us and collaboration tracks",
    defaultUrl: "/images/redesign/work-with-us-board.jpg",
  },
  {
    slotKey: "hiring_hero",
    sectionName: "Hiring: Careers Arch Graphic",
    category: "general",
    description: "Classical stone arch with chess king on the Careers / Hiring view",
    defaultUrl: "/images/redesign/hiring-king-arch.jpg",
  },
  {
    slotKey: "brand_logo",
    sectionName: "Branding: Official CCI Emblem",
    category: "general",
    description: "Primary Chess Community India official crest / logo emblem",
    defaultUrl: "/logos/cci-logo.png",
  },
  {
    slotKey: "partner_chess_com",
    sectionName: "Partners & Collaborators: Chess.com",
    category: "partners",
    description: "Official logo for Chess.com in the homepage continuous marquee",
    defaultUrl: "/logos/chess-com.png",
  },
  {
    slotKey: "partner_chessbase_india",
    sectionName: "Partners & Collaborators: ChessBase India",
    category: "partners",
    description: "Official logo for ChessBase India in the homepage continuous marquee",
    defaultUrl: "/logos/chessbase-india.png",
  },
  {
    slotKey: "partner_iiitdm_jabalpur",
    sectionName: "Partners & Collaborators: IIITDM Jabalpur",
    category: "partners",
    description: "Official logo for IIITDM Jabalpur in the homepage continuous marquee",
    defaultUrl: "/logos/iiitdm-jabalpur.png",
  },
  {
    slotKey: "partner_sgsits_indore",
    sectionName: "Partners & Collaborators: SGSITS Indore",
    category: "partners",
    description: "Official logo for SGSITS Indore in the homepage continuous marquee",
    defaultUrl: "/logos/sgsits-indore.png",
  },
  {
    slotKey: "partner_iilm_university",
    sectionName: "Partners & Collaborators: IILM University",
    category: "partners",
    description: "Official logo for IILM University in the homepage continuous marquee",
    defaultUrl: "/logos/iilm-university.png",
  },
  {
    slotKey: "partner_jec_jabalpur",
    sectionName: "Partners & Collaborators: Jabalpur Engineering College",
    category: "partners",
    description: "Official logo for Jabalpur Engineering College in the homepage continuous marquee",
    defaultUrl: "/logos/jabalpur-engineering-college.png",
  },
  {
    slotKey: "partner_dcaj",
    sectionName: "Partners & Collaborators: District Chess Association",
    category: "partners",
    description: "Official logo for District Chess Association Jabalpur in the homepage continuous marquee",
    defaultUrl: "/logos/district-chess-association-jabalpur.png",
  },
];

export interface PartnerCollaborator {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  category?: string;
  order: number;
  enabled: boolean;
  createdAt: string;
  description?: string;
  slotKey?: string;
}

export const DEFAULT_PARTNERS: PartnerCollaborator[] = [
  {
    id: "partner-01",
    name: "Chess.com",
    category: "Platform Partner",
    logoUrl: "/logos/chess-com.png",
    websiteUrl: "https://chess.com",
    order: 1,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "Global digital chess platform providing verified clubs, arena integration, and platform support.",
    slotKey: "partner_chess_com",
  },
  {
    id: "partner-02",
    name: "ChessBase India",
    category: "Media Partner",
    logoUrl: "/logos/chessbase-india.png",
    websiteUrl: "https://chessbase.in",
    order: 2,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "India's premier chess media house, spotlighting grassroots heroes and national champions.",
    slotKey: "partner_chessbase_india",
  },
  {
    id: "partner-03",
    name: "IIITDM Jabalpur",
    category: "Academic Partner",
    logoUrl: "/logos/iiitdm-jabalpur.png",
    websiteUrl: "https://iiitdmj.ac.in",
    order: 3,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "Premier national institute hosting technical tournaments and student AI analytics initiatives.",
    slotKey: "partner_iiitdm_jabalpur",
  },
  {
    id: "partner-04",
    name: "SGSITS Indore",
    category: "Academic Partner",
    logoUrl: "/logos/sgsits-indore.png",
    websiteUrl: "https://sgsits.ac.in",
    order: 4,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "Central India's leading technology campus fostering inter-college tournaments and chess clubs.",
    slotKey: "partner_sgsits_indore",
  },
  {
    id: "partner-05",
    name: "IILM University",
    category: "Academic Partner",
    logoUrl: "/logos/iilm-university.png",
    websiteUrl: "https://iilm.edu",
    order: 5,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "Academic collaborator fostering executive leadership, strategic thinking, and youth mentorship.",
    slotKey: "partner_iilm_university",
  },
  {
    id: "partner-06",
    name: "Jabalpur Engineering College",
    category: "Academic Partner",
    logoUrl: "/logos/jabalpur-engineering-college.png",
    websiteUrl: "https://jecjabalpur.ac.in",
    order: 6,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "Government engineering institute supporting historic community chess drives.",
    slotKey: "partner_jec_jabalpur",
  },
  {
    id: "partner-07",
    name: "District Chess Association",
    category: "Sports Association",
    logoUrl: "/logos/district-chess-association-jabalpur.png",
    websiteUrl: "#",
    order: 7,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
    description: "FIDE-recognized district sports council governing arbiter certifications and ratings.",
    slotKey: "partner_dcaj",
  },
];

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  dimensions?: string;
  sizeBytes?: number;
  sizeFormatted: string;
  mimeType: string;
  altText: string;
  category: 'hero' | 'cities' | 'events' | 'about' | 'general' | 'team' | 'partners';
  sections?: string[];
  slotKey?: string;
  version?: number;
  uploadedAt: string;
  updatedAt?: string;
  uploadedBy: string;
}

export interface FormSubmission {
  id: string;
  type: 'event-registration' | 'newsletter' | 'work-with-us';
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  subject?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface WebsiteSettings {
  siteTitle: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  socialLinks: {
    whatsapp: string;
    instagram: string;
    twitter: string;
    youtube: string;
    linkedin: string;
  };
  footerCopyright: string;
  footerTagline: string;
}

export interface ContentAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  section: string;
  details: string;
}

const STORAGE_LANDING_KEY = 'cci_content_landing_v2';
const STORAGE_CITIES_KEY = 'cci_content_cities_v2';
const STORAGE_EVENTS_KEY = 'cci_content_events_v2';
const STORAGE_JOBS_KEY = 'cci_content_jobs_v2';
const STORAGE_ABOUT_KEY = 'cci_content_about_v2';
const STORAGE_WORK_KEY = 'cci_content_work_v2';
const STORAGE_MEDIA_KEY = 'cci_content_media_v2';
const STORAGE_FORMS_KEY = 'cci_content_forms_v2';
const STORAGE_SETTINGS_KEY = 'cci_content_settings_v2';
const STORAGE_AUDIT_KEY = 'cci_content_audit_v2';
const STORAGE_PARTNERS_KEY = 'cci_content_partners_v2';

const DEFAULT_LANDING: LandingPageContent = {
  hero: {
    announcementText: "National Swiss Circuit 2026 announced",
    announcementHighlight: "Community Update:",
    announcementLink: "tournaments",
    headlineLine1: "One community to",
    headlineHighlight: "grow",
    headlineLine2: "Indian chess.",
    subheadline: "For grassroots players and seasoned competitors who want sanctioned Swiss tournaments, transparent ratings, and weekend city meetups built and looked after by the same community.",
    primaryCtaText: "Find Your Board",
    primaryCtaLink: "tournaments",
    secondaryCtaText: "Join City Chapter",
    secondaryCtaLink: "cities",
    pillar1Text: "FIDE-standard Swiss pairings with zero politics",
    pillar2Text: "Verified CCI Player ID & 6 canonical rating tiers",
    pillar3Text: "Active weekend café boards & park meetups across India",
    showSection: true,
  },
  whyCci: {
    kicker: "WHY CCI",
    titleLine1: "More than",
    titleLine2: "tournaments.",
    description: "A community that makes chess accessible, competitive, and social — across India.",
    ctaText: "About Us",
    ctaLink: "about",
    imageUrl: "/images/redesign/knight-gold.jpg",
    imageAlt: "Classical Chess Knight",
    pillar1Title: "Growing Chess Network",
    pillar1Desc: "Chapters in multiple cities with 1000+ members and counting.",
    pillar2Title: "Quality Tournaments",
    pillar2Desc: "FIDE standard pairings, transparent ratings, and fair play.",
    pillar3Title: "Community First",
    pillar3Desc: "Café meetups, park sessions and learning opportunities for all levels.",
    showSection: true,
  },
  chessPairPromo: {
    kicker: "CHESS PAIR",
    titleLine1: "Find players.",
    titleLine2: "Find your people.",
    description: "Discover chess partners in your city, from casual players to serious competitors.",
    ctaText: "Go to Chess Pair",
    ctaLink: "chess-pair",
    imageUrl: "/images/redesign/chesspair-cafe.jpg",
    imageAlt: "Chess Pair Meetup in Cafe",
    statsNumber: "1000+",
    statsText: "players already connected",
    showSection: true,
  },
  getInvolved: {
    kicker: "GET INVOLVED",
    title: "Join the movement.",
    description: "Volunteer, represent your city, or work with us to expand chess across India.",
    ctaText: "Hiring & Opportunities",
    ctaLink: "work-with-us",
    imageUrl: "/images/redesign/community-discussion.jpg",
    imageAlt: "Community Group Discussion",
    showSection: true,
  },
  newsletter: {
    kicker: "STAY UPDATED",
    title: "News, events and more.",
    description: "Be the first to know about upcoming tournaments, city meetups and community updates.",
    buttonText: "Subscribe",
    showSection: true,
  },
  partnerLogos: [
    { name: "Chess.com", logoUrl: "/logos/chess-com.png", websiteUrl: "https://chess.com" },
    { name: "ChessBase India", logoUrl: "/logos/chessbase-india.png", websiteUrl: "https://chessbase.in" },
    { name: "IIITDM Jabalpur", logoUrl: "/logos/iiitdm-jabalpur.png", websiteUrl: "https://iiitdmj.ac.in" },
    { name: "SGSITS Indore", logoUrl: "/logos/sgsits-indore.png", websiteUrl: "https://sgsits.ac.in" },
    { name: "IILM University", logoUrl: "/logos/iilm-university.png", websiteUrl: "https://iilm.edu" },
    { name: "Jabalpur Engineering College", logoUrl: "/logos/jabalpur-engineering-college.png", websiteUrl: "https://jecjabalpur.ac.in" },
    { name: "District Chess Association", logoUrl: "/logos/district-chess-association-jabalpur.png", websiteUrl: "#" },
  ],
  featuredCitySlugs: ["jabalpur", "bhopal", "indore", "delhi"],
  featuredEventIds: ["event-01", "event-02", "event-03"],
};

const DEFAULT_ABOUT: AboutPageContent = {
  kicker: "ABOUT",
  headlineLine1: "More Than",
  headlineLine2: "a Game.",
  subheadline: "Chess Community India (CCI) is the grassroots sanctuary for Indian chess players, arbiters, organizers, and enthusiasts.",
  storyHeading: "The Story Behind Chess Community India",
  storyParagraph1: "Started in Jabalpur with informal weekend café boards and park benches, Chess Community India grew out of a simple observation: India has the world's greatest emerging chess talent, but grassroots competitive opportunities remained fragmented and political.",
  storyParagraph2: "We built Chess Community India to establish transparent ratings, uncorrupted Swiss pairing systems, verified player profiles, and warm city chapters that welcome everyone from complete novices to Candidate Masters.",
  storyParagraph3: "Today, CCI unites active chapters across Central, North, and South India, operating tournaments with strict FIDE Swiss principles and transparent arbiter desks.",
  heroImageUrl: "/images/redesign/work-with-us-board.jpg",
  storyImageUrl: "/images/redesign/knight-gold.jpg",
  values: [
    { title: "Fair Play & Transparency", description: "Zero backroom politics. Pairings and ratings are calculated mathematically with auditable logs.", icon: "ShieldCheck" },
    { title: "Grassroots Inclusivity", description: "From weekend café meetups to 9-round national Swiss opens, every player has a home board.", icon: "Users" },
    { title: "Competitive Excellence", description: "Standardized time controls, certified arbiters, and canonical 6-tier ratings.", icon: "Trophy" },
  ],
};

const DEFAULT_WORK_WITH_US: WorkWithUsContent = {
  kicker: "COLLABORATE",
  headline: "Shape the Future of Indian Chess",
  subheadline: "Whether you want to launch a city chapter, arbitrate competitive opens, create media, or partner with our national tournament circuit, there is a place for you.",
  heroImageUrl: "/images/redesign/work-with-us-board.jpg",
  tracks: [
    {
      id: "city-leadership",
      title: "City Community Leadership",
      badge: "CHAPTER LEADS",
      description: "Launch or lead weekly chess meetups in your city. Partner with local cafés, libraries, and college campuses to build a thriving grassroots hub.",
    },
    {
      id: "event-organization",
      title: "Event Organization",
      badge: "TOURNAMENT DIRECTORS",
      description: "Help orchestrate Swiss opens, collegiate clashes, and public mall chess arenas. Handle venue setup, sensory board management, and player registration.",
    },
    {
      id: "volunteering",
      title: "Volunteering & Community Support",
      badge: "GRASSROOTS CHAMPIONS",
      description: "Introduce novice players to chess, set up boards, assist arbiters, and create a warm, inclusive environment for everyone who steps in.",
    },
    {
      id: "social-media",
      title: "Social Media & Content",
      badge: "MEDIA CREATORS",
      description: "Capture memorable moments across the board through photography, reels, tournament highlights, player interviews, and community stories.",
    },
    {
      id: "partnerships",
      title: "Partnerships & Collaborations",
      badge: "PLATFORM PARTNERS",
      description: "Co-host corporate cups, academic championships, and provide resources or venue spaces to fuel chess development across Indian cities.",
    },
  ],
};

const DEFAULT_SETTINGS: WebsiteSettings = {
  siteTitle: "Chess Community India",
  siteDescription: "Live tournament management, community ratings, and real-time player ecosystem synchronization across India.",
  logoUrl: "/logos/cci-logo.png",
  faviconUrl: "/logos/cci-logo.png",
  contactEmail: "admin@chesscommunity.in",
  contactPhone: "+91 98260 00000",
  address: "Jabalpur Heritage Hub & New Delhi Circuit Center, India",
  seoTitle: "Chess Community India — National Swiss Tournaments & City Chapters",
  seoDescription: "Join Chess Community India. Sanctioned Swiss tournaments, authentic ELO ratings, FIDE pairings, and active weekly café chess meetups.",
  seoKeywords: "chess india, swiss pairing, chess tournament, fide ratings, chess community, jabalpur chess, delhi chess",
  socialLinks: {
    whatsapp: "https://chat.whatsapp.com/GzB19K28vVlFjBfLwQ7xYm",
    instagram: "https://instagram.com/chesscommunityindia",
    twitter: "https://x.com/chessindia",
    youtube: "https://youtube.com/@chesscommunityindia",
    linkedin: "https://linkedin.com/company/chess-community-india",
  },
  footerCopyright: "© 2026 Chess Community India. All rights reserved.",
  footerTagline: "Building the standard for grassroots and sanctioned Indian competitive chess.",
};

const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "media-1",
    name: "event-swiss.jpg",
    url: "/images/redesign/event-swiss.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.2 MB",
    mimeType: "image/jpeg",
    altText: "CCI National Swiss Open 2026 Championship Arena",
    category: "events",
    slotKey: "event_ev-01",
    sections: ["Events: National Swiss Open 2026", "Homepage: Featured Events Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-2",
    name: "event-rapid.jpg",
    url: "/images/redesign/event-rapid.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "980 KB",
    mimeType: "image/jpeg",
    altText: "Central India Rapid Grand Prix Venue",
    category: "events",
    slotKey: "event_ev-02",
    sections: ["Events: Central India Rapid Grand Prix", "Homepage: Featured Events Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-3",
    name: "event-blitz.jpg",
    url: "/images/redesign/event-blitz.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.1 MB",
    mimeType: "image/jpeg",
    altText: "Upper Lake Coffee and Blitz Cafe Board",
    category: "events",
    slotKey: "event_ev-03",
    sections: ["Events: Upper Lake Coffee & Blitz", "Homepage: Featured Events Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-4",
    name: "city-jabalpur.jpg",
    url: "/images/redesign/city-jabalpur.jpg",
    dimensions: "960 x 1200",
    sizeFormatted: "1.4 MB",
    mimeType: "image/jpeg",
    altText: "Jabalpur Origin Chapter Marble Rocks & Heritage Board",
    category: "cities",
    slotKey: "city_jabalpur",
    sections: ["Cities: Jabalpur Chapter Card", "Homepage: Our Cities Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-5",
    name: "city-bhopal.jpg",
    url: "/images/redesign/city-bhopal.jpg",
    dimensions: "960 x 1200",
    sizeFormatted: "1.3 MB",
    mimeType: "image/jpeg",
    altText: "Bhopal Lake Chapter Meetup",
    category: "cities",
    slotKey: "city_bhopal",
    sections: ["Cities: Bhopal Chapter Card", "Homepage: Our Cities Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-6",
    name: "city-indore.jpg",
    url: "/images/redesign/city-indore.jpg",
    dimensions: "960 x 1200",
    sizeFormatted: "1.2 MB",
    mimeType: "image/jpeg",
    altText: "Indore Chapter Heritage Landmark",
    category: "cities",
    slotKey: "city_indore",
    sections: ["Cities: Indore Chapter Card", "Homepage: Our Cities Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-7",
    name: "city-delhi.jpg",
    url: "/images/redesign/city-delhi.jpg",
    dimensions: "960 x 1200",
    sizeFormatted: "1.5 MB",
    mimeType: "image/jpeg",
    altText: "Delhi NCR Chapter India Gate Monument",
    category: "cities",
    slotKey: "city_delhi",
    sections: ["Cities: Delhi NCR Chapter Card", "Homepage: Our Cities Grid"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-8",
    name: "knight-gold.jpg",
    url: "/images/redesign/knight-gold.jpg",
    dimensions: "900 x 1200",
    sizeFormatted: "1.8 MB",
    mimeType: "image/jpeg",
    altText: "Hand-Carved Luxury Classical Gold Chess Knight",
    category: "hero",
    slotKey: "home_why_cci",
    sections: ["Homepage: Why CCI Knight", "About Us: Origin Story Knight"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-9",
    name: "chesspair-cafe.jpg",
    url: "/images/redesign/chesspair-cafe.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.6 MB",
    mimeType: "image/jpeg",
    altText: "Chess Pair Players in Weekend Cafe Meetup",
    category: "hero",
    slotKey: "home_chesspair",
    sections: ["Homepage: Chess Pair Cafe"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-10",
    name: "community-discussion.jpg",
    url: "/images/redesign/community-discussion.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.3 MB",
    mimeType: "image/jpeg",
    altText: "Community Gathering and Tactical Analysis",
    category: "general",
    slotKey: "home_get_involved",
    sections: ["Homepage: Get Involved Gathering"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-11",
    name: "work-with-us-board.jpg",
    url: "/images/redesign/work-with-us-board.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.7 MB",
    mimeType: "image/jpeg",
    altText: "Wooden Chess King in Sunlit Studio",
    category: "about",
    slotKey: "about_hero",
    sections: ["About Us: Hero Wooden Board", "Work With Us: Hero Banner"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-12",
    name: "cci-logo.png",
    url: "/logos/cci-logo.png",
    dimensions: "512 x 512",
    sizeFormatted: "180 KB",
    mimeType: "image/png",
    altText: "Official Chess Community India Logo Emblem",
    category: "general",
    slotKey: "brand_logo",
    sections: ["Branding: Official CCI Emblem", "Navigation & Header", "Footer"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-13",
    name: "hiring-king-arch.jpg",
    url: "/images/redesign/hiring-king-arch.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.4 MB",
    mimeType: "image/jpeg",
    altText: "Classical Stone Arch & Chess King Graphic",
    category: "general",
    slotKey: "hiring_hero",
    sections: ["Hiring: Careers Arch Graphic"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-14",
    name: "hero-arch.jpg",
    url: "/images/redesign/hero-arch.jpg",
    dimensions: "1280 x 800",
    sizeFormatted: "1.3 MB",
    mimeType: "image/jpeg",
    altText: "Hero Classical Architecture",
    category: "hero",
    slotKey: "homepage_hero_arch",
    sections: ["Homepage: Hero Architecture Background", "Work With Us: Header Graphic"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-1",
    name: "chess-com.png",
    url: "/logos/chess-com.png",
    dimensions: "360 x 120",
    sizeFormatted: "38 KB",
    mimeType: "image/png",
    altText: "Chess.com Logo",
    category: "partners",
    slotKey: "partner_chess_com",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-2",
    name: "chessbase-india.png",
    url: "/logos/chessbase-india.png",
    dimensions: "400 x 120",
    sizeFormatted: "94 KB",
    mimeType: "image/png",
    altText: "ChessBase India Logo",
    category: "partners",
    slotKey: "partner_chessbase_india",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-3",
    name: "iiitdm-jabalpur.png",
    url: "/logos/iiitdm-jabalpur.png",
    dimensions: "300 x 120",
    sizeFormatted: "18 KB",
    mimeType: "image/png",
    altText: "IIITDM Jabalpur Logo",
    category: "partners",
    slotKey: "partner_iiitdm_jabalpur",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-4",
    name: "sgsits-indore.png",
    url: "/logos/sgsits-indore.png",
    dimensions: "300 x 120",
    sizeFormatted: "70 KB",
    mimeType: "image/png",
    altText: "SGSITS Indore Logo",
    category: "partners",
    slotKey: "partner_sgsits_indore",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-5",
    name: "iilm-university.png",
    url: "/logos/iilm-university.png",
    dimensions: "320 x 120",
    sizeFormatted: "24 KB",
    mimeType: "image/png",
    altText: "IILM University Logo",
    category: "partners",
    slotKey: "partner_iilm_university",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-6",
    name: "jabalpur-engineering-college.png",
    url: "/logos/jabalpur-engineering-college.png",
    dimensions: "300 x 120",
    sizeFormatted: "33 KB",
    mimeType: "image/png",
    altText: "Jabalpur Engineering College Logo",
    category: "partners",
    slotKey: "partner_jec_jabalpur",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
  {
    id: "media-partner-7",
    name: "district-chess-association-jabalpur.png",
    url: "/logos/district-chess-association-jabalpur.png",
    dimensions: "300 x 120",
    sizeFormatted: "859 KB",
    mimeType: "image/png",
    altText: "District Chess Association Jabalpur Logo",
    category: "partners",
    slotKey: "partner_dcaj",
    sections: ["Partners & Collaborators Marquee", "Partners View"],
    uploadedAt: "2026-10-10T12:00:00Z",
    uploadedBy: "Admin",
  },
];

class ContentStore {
  private landing: LandingPageContent = DEFAULT_LANDING;
  private cities: EditableCityChapter[] = [];
  private events: EditableEventItem[] = [];
  private jobs: EditableJobPost[] = [];
  private about: AboutPageContent = DEFAULT_ABOUT;
  private work: WorkWithUsContent = DEFAULT_WORK_WITH_US;
  private media: MediaAsset[] = INITIAL_MEDIA_ASSETS;
  private partners: PartnerCollaborator[] = DEFAULT_PARTNERS;
  private forms: FormSubmission[] = [];
  private settings: WebsiteSettings = DEFAULT_SETTINGS;
  private auditLogs: ContentAuditEntry[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      // Landing Content
      const savedLanding = localStorage.getItem(STORAGE_LANDING_KEY);
      if (savedLanding) {
        this.landing = { ...DEFAULT_LANDING, ...JSON.parse(savedLanding) };
      } else {
        this.landing = { ...DEFAULT_LANDING };
        this.persistLanding();
      }

      // Cities
      const savedCities = localStorage.getItem(STORAGE_CITIES_KEY);
      if (savedCities) {
        this.cities = JSON.parse(savedCities);
      } else {
        this.cities = INITIAL_CITIES.map((c, idx) => {
          const mapNode = MAP_CITIES.find(m => m.name.toLowerCase() === c.name.toLowerCase());
          return {
            ...c,
            status: 'published' as const,
            order: idx + 1,
            region: mapNode?.region || 'Central',
            coordinates: mapNode ? { x: mapNode.x, y: mapNode.y } : { x: 50, y: 50 },
          };
        });
        this.persistCities();
      }

      // Events
      const savedEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      } else {
        this.events = INITIAL_EVENTS.map((e, idx) => ({
          ...e,
          publishedStatus: 'published' as const,
          order: idx + 1,
          imageUrl: idx === 0 ? '/images/redesign/event-swiss.jpg' : idx === 1 ? '/images/redesign/event-rapid.jpg' : '/images/redesign/event-blitz.jpg',
          registrationLink: 'tournaments',
        }));
        this.persistEvents();
      }

      // Jobs
      const savedJobs = localStorage.getItem(STORAGE_JOBS_KEY);
      if (savedJobs) {
        this.jobs = JSON.parse(savedJobs);
      } else {
        this.jobs = INITIAL_JOBS.map(j => ({
          ...j,
          publishedStatus: 'published' as const,
          applicationUrl: 'work-with-us',
        }));
        this.persistJobs();
      }

      // About
      const savedAbout = localStorage.getItem(STORAGE_ABOUT_KEY);
      if (savedAbout) {
        this.about = { ...DEFAULT_ABOUT, ...JSON.parse(savedAbout) };
      } else {
        this.about = { ...DEFAULT_ABOUT };
        this.persistAbout();
      }

      // Work With Us
      const savedWork = localStorage.getItem(STORAGE_WORK_KEY);
      if (savedWork) {
        this.work = { ...DEFAULT_WORK_WITH_US, ...JSON.parse(savedWork) };
      } else {
        this.work = { ...DEFAULT_WORK_WITH_US };
        this.persistWork();
      }

      // Media
      const savedMedia = localStorage.getItem(STORAGE_MEDIA_KEY);
      if (savedMedia) {
        this.media = JSON.parse(savedMedia);
      } else {
        this.media = [...INITIAL_MEDIA_ASSETS];
        this.persistMedia();
      }

      // Forms
      const savedForms = localStorage.getItem(STORAGE_FORMS_KEY);
      if (savedForms) {
        this.forms = JSON.parse(savedForms);
      }

      // Settings
      const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
        this.persistSettings();
      }

      // Partners & Collaborators
      const savedPartners = localStorage.getItem(STORAGE_PARTNERS_KEY);
      if (savedPartners) {
        try {
          this.partners = JSON.parse(savedPartners);
        } catch (e) {
          this.partners = [...DEFAULT_PARTNERS];
          this.persistPartners();
        }
      } else {
        this.partners = [...DEFAULT_PARTNERS];
        this.persistPartners();
      }

      // Audit Logs
      const savedAudit = localStorage.getItem(STORAGE_AUDIT_KEY);
      if (savedAudit) {
        this.auditLogs = JSON.parse(savedAudit);
      } else {
        this.auditLogs = [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actor: 'System Admin',
            action: 'Initialized',
            section: 'Content Engine',
            details: 'Core website content loaded and synchronized with persistence store.',
          }
        ];
        this.persistAudit();
      }

      // Reconcile and synchronize all website sections with the Media Library
      this.reconcileWithMediaLibrary();
    } catch (e) {
      console.warn('Error initializing ContentStore:', e);
    }
  }

  /**
   * Reconciles all website section slots with media library assets,
   * guaranteeing that the Media Library is the single authoritative source of truth.
   */
  public reconcileWithMediaLibrary() {
    let mediaChanged = false;
    let citiesChanged = false;
    let eventsChanged = false;
    let landingChanged = false;
    let aboutChanged = false;
    let workChanged = false;
    let settingsChanged = false;

    // 1. Ensure all canonical assets exist with proper slotKey and sections
    INITIAL_MEDIA_ASSETS.forEach(initAsset => {
      const existing = this.media.find(m => m.id === initAsset.id || m.slotKey === initAsset.slotKey);
      if (!existing) {
        this.media.push({ ...initAsset });
        mediaChanged = true;
      } else {
        // Ensure slotKey and sections are backfilled
        if (!existing.slotKey && initAsset.slotKey) {
          existing.slotKey = initAsset.slotKey;
          mediaChanged = true;
        }
        if ((!existing.sections || existing.sections.length === 0) && initAsset.sections) {
          existing.sections = [...initAsset.sections];
          mediaChanged = true;
        }
      }
    });

    // 2. Normalize and bind cities to media library assets
    const citySlotMap: Record<string, string> = {
      jabalpur: 'city_jabalpur',
      bhopal: 'city_bhopal',
      indore: 'city_indore',
      delhi: 'city_delhi',
    };

    this.cities = this.cities.map(c => {
      const slotKey = citySlotMap[c.slug.toLowerCase()];
      if (slotKey) {
        const asset = this.media.find(m => m.slotKey === slotKey || (m.name && m.name.includes(c.slug.toLowerCase())));
        if (asset && (c.imageUrl !== asset.url || c.imageUrl.includes('.webp'))) {
          citiesChanged = true;
          return { ...c, imageUrl: asset.url };
        }
      }
      return c;
    });

    // 3. Normalize and bind events to media library assets
    const eventSlotMap: Record<string, string> = {
      'ev-01': 'event_ev-01',
      'ev-02': 'event_ev-02',
      'ev-03': 'event_ev-03',
    };

    this.events = this.events.map((e, idx) => {
      const slotKey = eventSlotMap[e.id] || (idx === 0 ? 'event_ev-01' : idx === 1 ? 'event_ev-02' : idx === 2 ? 'event_ev-03' : undefined);
      if (slotKey) {
        const asset = this.media.find(m => m.slotKey === slotKey);
        if (asset && (e.imageUrl !== asset.url || !e.imageUrl || e.imageUrl.includes('.webp'))) {
          eventsChanged = true;
          return { ...e, imageUrl: asset.url };
        }
      }
      return e;
    });

    // 4. Normalize landing page slots
    const whyCciAsset = this.media.find(m => m.slotKey === 'home_why_cci');
    if (whyCciAsset && this.landing.whyCci && this.landing.whyCci.imageUrl !== whyCciAsset.url) {
      this.landing.whyCci.imageUrl = whyCciAsset.url;
      landingChanged = true;
    }

    const chessPairAsset = this.media.find(m => m.slotKey === 'home_chesspair');
    if (chessPairAsset && this.landing.chessPairPromo && this.landing.chessPairPromo.imageUrl !== chessPairAsset.url) {
      this.landing.chessPairPromo.imageUrl = chessPairAsset.url;
      landingChanged = true;
    }

    const getInvolvedAsset = this.media.find(m => m.slotKey === 'home_get_involved');
    if (getInvolvedAsset && this.landing.getInvolved && this.landing.getInvolved.imageUrl !== getInvolvedAsset.url) {
      this.landing.getInvolved.imageUrl = getInvolvedAsset.url;
      landingChanged = true;
    }

    // 5. Normalize About Us
    const aboutHeroAsset = this.media.find(m => m.slotKey === 'about_hero');
    if (aboutHeroAsset && this.about.heroImageUrl !== aboutHeroAsset.url) {
      this.about.heroImageUrl = aboutHeroAsset.url;
      aboutChanged = true;
    }
    const aboutStoryAsset = this.media.find(m => m.slotKey === 'about_story');
    if (aboutStoryAsset && this.about.storyImageUrl !== aboutStoryAsset.url) {
      this.about.storyImageUrl = aboutStoryAsset.url;
      aboutChanged = true;
    }

    // 6. Normalize Work With Us
    const workHeroAsset = this.media.find(m => m.slotKey === 'work_hero');
    if (workHeroAsset && this.work.heroImageUrl !== workHeroAsset.url) {
      this.work.heroImageUrl = workHeroAsset.url;
      workChanged = true;
    }

    // 7. Normalize Settings Logo
    const logoAsset = this.media.find(m => m.slotKey === 'brand_logo');
    if (logoAsset && this.settings.logoUrl !== logoAsset.url) {
      this.settings.logoUrl = logoAsset.url;
      settingsChanged = true;
    }

    // 8. Normalize Partners & Collaborators Logos
    let partnersChanged = false;
    this.partners = this.partners.map(p => {
      const match = this.media.find(m => m.slotKey === (p.slotKey || `partner_${p.id}`) || m.url === p.logoUrl);
      if (match && p.logoUrl !== match.url) {
        partnersChanged = true;
        return { ...p, logoUrl: match.url };
      }
      return p;
    });

    if (mediaChanged) this.persistMedia();
    if (citiesChanged) this.persistCities();
    if (eventsChanged) this.persistEvents();
    if (landingChanged) this.persistLanding();
    if (aboutChanged) this.persistAbout();
    if (workChanged) this.persistWork();
    if (settingsChanged) this.persistSettings();
    if (partnersChanged) this.persistPartners();
  }

  // Persistence Helpers
  private persistPartners() {
    try { localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(this.partners)); } catch (e) {}
    this.notify();
  }
  private persistLanding() {
    try { localStorage.setItem(STORAGE_LANDING_KEY, JSON.stringify(this.landing)); } catch (e) {}
    this.notify();
  }
  private persistCities() {
    try { localStorage.setItem(STORAGE_CITIES_KEY, JSON.stringify(this.cities)); } catch (e) {}
    this.notify();
  }
  private persistEvents() {
    try { localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(this.events)); } catch (e) {}
    this.notify();
  }
  private persistJobs() {
    try { localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(this.jobs)); } catch (e) {}
    this.notify();
  }
  private persistAbout() {
    try { localStorage.setItem(STORAGE_ABOUT_KEY, JSON.stringify(this.about)); } catch (e) {}
    this.notify();
  }
  private persistWork() {
    try { localStorage.setItem(STORAGE_WORK_KEY, JSON.stringify(this.work)); } catch (e) {}
    this.notify();
  }
  private persistMedia() {
    try { localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(this.media)); } catch (e) {}
    this.notify();
  }
  private persistForms() {
    try { localStorage.setItem(STORAGE_FORMS_KEY, JSON.stringify(this.forms)); } catch (e) {}
    this.notify();
  }
  private persistSettings() {
    try { localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) {}
    this.notify();
  }
  private persistAudit() {
    try { localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(this.auditLogs)); } catch (e) {}
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cci-content-synced', { detail: { timestamp: Date.now() } }));
    }
    this.listeners.forEach(cb => {
      try { cb(); } catch (err) {}
    });
  }

  public logAudit(actor: string, action: string, section: string, details: string) {
    const entry: ContentAuditEntry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      section,
      details,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.persistAudit();
  }

  // --- Landing Page ---
  public getLandingContent(): LandingPageContent {
    return { ...this.landing };
  }

  public updateLandingContent(partial: Partial<LandingPageContent>, actor = 'Admin'): void {
    this.landing = { ...this.landing, ...partial };
    this.persistLanding();
    this.logAudit(actor, 'Updated', 'Landing Page', 'Modified landing page content sections.');
  }

  // --- Cities ---
  public getCities(includeDrafts = false): EditableCityChapter[] {
    const list = [...this.cities].sort((a, b) => a.order - b.order);
    return includeDrafts ? list : list.filter(c => c.status === 'published');
  }

  public getCityBySlug(slug: string): EditableCityChapter | undefined {
    return this.cities.find(c => c.slug.toLowerCase() === slug.toLowerCase());
  }

  public saveCity(city: EditableCityChapter, actor = 'Admin'): void {
    const idx = this.cities.findIndex(c => c.id === city.id || c.slug === city.slug);
    if (idx >= 0) {
      this.cities[idx] = { ...this.cities[idx], ...city };
      this.logAudit(actor, 'Updated', 'Cities', `Updated city: ${city.name}`);
    } else {
      this.cities.push({
        ...city,
        id: city.id || `city-${Date.now()}`,
        order: this.cities.length + 1,
      });
      this.logAudit(actor, 'Created', 'Cities', `Added new city: ${city.name}`);
    }
    this.persistCities();
  }

  public deleteCity(cityId: string, actor = 'Admin'): void {
    const target = this.cities.find(c => c.id === cityId);
    this.cities = this.cities.filter(c => c.id !== cityId);
    this.persistCities();
    if (target) {
      this.logAudit(actor, 'Deleted', 'Cities', `Removed city: ${target.name}`);
    }
  }

  // --- Events ---
  public getEvents(includeDrafts = false): EditableEventItem[] {
    const list = [...this.events].sort((a, b) => a.order - b.order);
    return includeDrafts ? list : list.filter(e => e.publishedStatus === 'published');
  }

  public saveEvent(event: EditableEventItem, actor = 'Admin'): void {
    const idx = this.events.findIndex(e => e.id === event.id);
    if (idx >= 0) {
      this.events[idx] = { ...this.events[idx], ...event };
      this.logAudit(actor, 'Updated', 'Events', `Updated event: ${event.title}`);
    } else {
      this.events.push({
        ...event,
        id: event.id || `event-${Date.now()}`,
        order: this.events.length + 1,
      });
      this.logAudit(actor, 'Created', 'Events', `Created new event: ${event.title}`);
    }
    this.persistEvents();
  }

  public deleteEvent(eventId: string, actor = 'Admin'): void {
    const target = this.events.find(e => e.id === eventId);
    this.events = this.events.filter(e => e.id !== eventId);
    this.persistEvents();
    if (target) {
      this.logAudit(actor, 'Deleted', 'Events', `Deleted event: ${target.title}`);
    }
  }

  // --- Hiring / Jobs ---
  public getJobs(includeDrafts = false): EditableJobPost[] {
    return includeDrafts ? [...this.jobs] : this.jobs.filter(j => j.publishedStatus === 'published');
  }

  public saveJob(job: EditableJobPost, actor = 'Admin'): void {
    const idx = this.jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      this.jobs[idx] = { ...this.jobs[idx], ...job };
      this.logAudit(actor, 'Updated', 'Hiring', `Updated job: ${job.title}`);
    } else {
      this.jobs.push({ ...job, id: job.id || `job-${Date.now()}` });
      this.logAudit(actor, 'Created', 'Hiring', `Created new job: ${job.title}`);
    }
    this.persistJobs();
  }

  public deleteJob(jobId: string, actor = 'Admin'): void {
    const target = this.jobs.find(j => j.id === jobId);
    this.jobs = this.jobs.filter(j => j.id !== jobId);
    this.persistJobs();
    if (target) {
      this.logAudit(actor, 'Deleted', 'Hiring', `Removed job: ${target.title}`);
    }
  }

  // --- About Us ---
  public getAboutContent(): AboutPageContent {
    return { ...this.about };
  }

  public updateAboutContent(partial: Partial<AboutPageContent>, actor = 'Admin'): void {
    this.about = { ...this.about, ...partial };
    this.persistAbout();
    this.logAudit(actor, 'Updated', 'About Us', 'Updated About Us page copy and assets.');
  }

  // --- Work With Us ---
  public getWorkWithUsContent(): WorkWithUsContent {
    return { ...this.work };
  }

  public updateWorkWithUsContent(partial: Partial<WorkWithUsContent>, actor = 'Admin'): void {
    this.work = { ...this.work, ...partial };
    this.persistWork();
    this.logAudit(actor, 'Updated', 'Work With Us', 'Updated Work With Us page tracks and description.');
  }

  // --- Media Library ---
  public getMediaAssets(): MediaAsset[] {
    return [...this.media];
  }

  public getMediaAssetById(id: string): MediaAsset | undefined {
    return this.media.find(m => m.id === id);
  }

  public getMediaAssetUsage(url: string, assetId?: string): string[] {
    const usages = new Set<string>();
    const asset = assetId ? this.getMediaAssetById(assetId) : this.media.find(m => m.url === url);

    if (asset?.sections && asset.sections.length > 0) {
      asset.sections.forEach(s => usages.add(s));
    }

    if (asset?.slotKey) {
      const slot = WEBSITE_SECTION_SLOTS.find(s => s.slotKey === asset.slotKey);
      if (slot) usages.add(slot.sectionName);
    }

    // Check cities
    this.cities.forEach(c => {
      if (c.imageUrl === url || (asset?.slotKey === `city_${c.slug}`)) {
        usages.add(`Cities: ${c.name} Chapter Card`);
      }
    });

    // Check events
    this.events.forEach(e => {
      if (e.imageUrl === url || (asset?.slotKey === `event_${e.id}`)) {
        usages.add(`Events: ${e.title}`);
      }
    });

    // Check landing
    if (this.landing.whyCci?.imageUrl === url || asset?.slotKey === 'home_why_cci') {
      usages.add('Homepage: Why CCI Knight');
    }
    if (this.landing.chessPairPromo?.imageUrl === url || asset?.slotKey === 'home_chesspair') {
      usages.add('Homepage: Chess Pair Cafe');
    }
    if (this.landing.getInvolved?.imageUrl === url || asset?.slotKey === 'home_get_involved') {
      usages.add('Homepage: Get Involved Gathering');
    }
    if (asset?.slotKey === 'homepage_hero_arch') {
      usages.add('Homepage: Hero Classical Architecture');
    }

    // Check about
    if (this.about.heroImageUrl === url || asset?.slotKey === 'about_hero') {
      usages.add('About Us: Hero Wooden Board');
    }
    if (this.about.storyImageUrl === url || asset?.slotKey === 'about_story') {
      usages.add('About Us: Origin Story Knight');
    }

    // Check work
    if (this.work.heroImageUrl === url || asset?.slotKey === 'work_hero') {
      usages.add('Work With Us: Hero Banner');
    }

    // Check settings
    if (this.settings.logoUrl === url || asset?.slotKey === 'brand_logo') {
      usages.add('Branding: Official CCI Emblem');
    }

    // Check partners
    this.partners.forEach(p => {
      if (p.logoUrl === url || asset?.slotKey === (p.slotKey || `partner_${p.id}`)) {
        usages.add(`Partners Marquee: ${p.name}`);
      }
    });

    return Array.from(usages);
  }

  public assignMediaAssetToSection(assetId: string, slotKey: string, actor = 'Admin'): boolean {
    const asset = this.media.find(m => m.id === assetId);
    const slot = WEBSITE_SECTION_SLOTS.find(s => s.slotKey === slotKey);
    if (!asset || !slot) return false;

    asset.slotKey = slotKey;
    if (!asset.sections) asset.sections = [];
    if (!asset.sections.includes(slot.sectionName)) {
      asset.sections.push(slot.sectionName);
    }
    asset.updatedAt = new Date().toISOString();
    asset.version = Date.now();
    this.persistMedia();

    // Propagate URL to the destination slot
    this.propagateSlotUpdate(slotKey, asset.url);
    this.logAudit(actor, 'Assigned', 'Media Library', `Assigned asset "${asset.name}" to section "${slot.sectionName}".`);
    return true;
  }

  public propagateSlotUpdate(slotKey: string, newUrl: string) {
    if (slotKey.startsWith('city_')) {
      const slug = slotKey.replace('city_', '');
      let changed = false;
      this.cities = this.cities.map(c => {
        if (c.slug.toLowerCase() === slug.toLowerCase()) {
          changed = true;
          return { ...c, imageUrl: newUrl };
        }
        return c;
      });
      if (changed) this.persistCities();
    } else if (slotKey.startsWith('event_')) {
      const eventId = slotKey.replace('event_', '');
      let changed = false;
      this.events = this.events.map(e => {
        if (e.id === eventId) {
          changed = true;
          return { ...e, imageUrl: newUrl };
        }
        return e;
      });
      if (changed) this.persistEvents();
    } else if (slotKey === 'home_why_cci') {
      this.landing.whyCci = { ...this.landing.whyCci, imageUrl: newUrl };
      this.persistLanding();
    } else if (slotKey === 'home_chesspair') {
      this.landing.chessPairPromo = { ...this.landing.chessPairPromo, imageUrl: newUrl };
      this.persistLanding();
    } else if (slotKey === 'home_get_involved') {
      this.landing.getInvolved = { ...this.landing.getInvolved, imageUrl: newUrl };
      this.persistLanding();
    } else if (slotKey === 'about_hero') {
      this.about = { ...this.about, heroImageUrl: newUrl };
      this.persistAbout();
    } else if (slotKey === 'about_story') {
      this.about = { ...this.about, storyImageUrl: newUrl };
      this.persistAbout();
    } else if (slotKey === 'work_hero') {
      this.work = { ...this.work, heroImageUrl: newUrl };
      this.persistWork();
    } else if (slotKey === 'brand_logo') {
      this.settings = { ...this.settings, logoUrl: newUrl };
      this.persistSettings();
    } else if (slotKey.startsWith('partner_')) {
      let changed = false;
      this.partners = this.partners.map(p => {
        if (p.slotKey === slotKey || `partner_${p.id}` === slotKey || slotKey.includes(p.id)) {
          changed = true;
          return { ...p, logoUrl: newUrl };
        }
        return p;
      });
      if (changed) this.persistPartners();
    }
  }

  public addMediaAsset(asset: Omit<MediaAsset, 'id' | 'uploadedAt' | 'uploadedBy'>, actor = 'Admin'): MediaAsset {
    const newAsset: MediaAsset = {
      ...asset,
      id: `media-${Date.now()}`,
      version: Date.now(),
      uploadedAt: new Date().toISOString(),
      uploadedBy: actor,
    };
    this.media.unshift(newAsset);
    this.persistMedia();
    this.logAudit(actor, 'Uploaded', 'Media Library', `Uploaded asset: ${newAsset.name}`);
    return newAsset;
  }

  public updateMediaAsset(id: string, updates: Partial<MediaAsset>, actor = 'Admin'): void {
    const idx = this.media.findIndex(m => m.id === id);
    if (idx >= 0) {
      this.media[idx] = { 
        ...this.media[idx], 
        ...updates,
        updatedAt: new Date().toISOString(),
        version: Date.now(),
      };
      this.persistMedia();

      if (this.media[idx].slotKey && this.media[idx].url) {
        this.propagateSlotUpdate(this.media[idx].slotKey!, this.media[idx].url);
      }

      this.logAudit(actor, 'Updated', 'Media Library', `Updated asset metadata: ${this.media[idx].name}`);
    }
  }

  public replaceMediaAsset(
    id: string,
    updates: Partial<MediaAsset> & { url: string },
    actor = 'Admin'
  ): MediaAsset | undefined {
    const idx = this.media.findIndex(m => m.id === id);
    if (idx < 0) return undefined;

    const oldAsset = this.media[idx];
    const oldUrl = oldAsset.url;
    const newUrl = updates.url;
    const newVersion = Date.now();

    // Update media asset record with stable ID and incremented cache-invalidation version
    this.media[idx] = {
      ...oldAsset,
      ...updates,
      id: oldAsset.id, // keep stable ID
      version: newVersion,
      updatedAt: new Date().toISOString(),
      uploadedBy: actor,
    };
    this.persistMedia();

    // Propagate URL update across all website sections
    if (newUrl && newUrl !== oldUrl) {
      // 1. If oldAsset is bound to a slotKey, update that slot immediately
      if (oldAsset.slotKey) {
        this.propagateSlotUpdate(oldAsset.slotKey, newUrl);
      }

      // 2. Propagate across all collections by oldUrl matching
      let citiesChanged = false;
      this.cities = this.cities.map(c => {
        if (c.imageUrl === oldUrl) {
          citiesChanged = true;
          return { ...c, imageUrl: newUrl };
        }
        return c;
      });
      if (citiesChanged) this.persistCities();

      let eventsChanged = false;
      this.events = this.events.map(e => {
        if (e.imageUrl === oldUrl) {
          eventsChanged = true;
          return { ...e, imageUrl: newUrl };
        }
        return e;
      });
      if (eventsChanged) this.persistEvents();

      let landingChanged = false;
      const newLanding = { ...this.landing };
      if (newLanding.whyCci?.imageUrl === oldUrl) {
        newLanding.whyCci = { ...newLanding.whyCci, imageUrl: newUrl };
        landingChanged = true;
      }
      if (newLanding.chessPairPromo?.imageUrl === oldUrl) {
        newLanding.chessPairPromo = { ...newLanding.chessPairPromo, imageUrl: newUrl };
        landingChanged = true;
      }
      if (newLanding.getInvolved?.imageUrl === oldUrl) {
        newLanding.getInvolved = { ...newLanding.getInvolved, imageUrl: newUrl };
        landingChanged = true;
      }
      if (newLanding.partnerLogos) {
        newLanding.partnerLogos = newLanding.partnerLogos.map(p => {
          if (p.logoUrl === oldUrl) {
            landingChanged = true;
            return { ...p, logoUrl: newUrl };
          }
          return p;
        });
      }
      if (landingChanged) {
        this.landing = newLanding;
        this.persistLanding();
      }

      let aboutChanged = false;
      const newAbout = { ...this.about };
      if (newAbout.heroImageUrl === oldUrl) {
        newAbout.heroImageUrl = newUrl;
        aboutChanged = true;
      }
      if (newAbout.storyImageUrl === oldUrl) {
        newAbout.storyImageUrl = newUrl;
        aboutChanged = true;
      }
      if (aboutChanged) {
        this.about = newAbout;
        this.persistAbout();
      }

      let workChanged = false;
      const newWork = { ...this.work };
      if (newWork.heroImageUrl === oldUrl) {
        newWork.heroImageUrl = newUrl;
        workChanged = true;
      }
      if (workChanged) {
        this.work = newWork;
        this.persistWork();
      }

      let settingsChanged = false;
      const newSettings = { ...this.settings };
      if (newSettings.logoUrl === oldUrl) {
        newSettings.logoUrl = newUrl;
        settingsChanged = true;
      }
      if (newSettings.faviconUrl === oldUrl) {
        newSettings.faviconUrl = newUrl;
        settingsChanged = true;
      }
      if (settingsChanged) {
        this.settings = newSettings;
        this.persistSettings();
      }

      let partnersChanged = false;
      this.partners = this.partners.map(p => {
        if (p.logoUrl === oldUrl || (oldAsset.slotKey && (p.slotKey === oldAsset.slotKey || `partner_${p.id}` === oldAsset.slotKey))) {
          partnersChanged = true;
          return { ...p, logoUrl: newUrl };
        }
        return p;
      });
      if (partnersChanged) {
        this.persistPartners();
      }

      // Maintain persistent URL replacement dictionary for instantaneous frontend resolution
      if (typeof window !== 'undefined') {
        try {
          const mapStr = localStorage.getItem('cci_media_replacements_map') || '{}';
          const map = JSON.parse(mapStr);
          map[oldUrl] = newUrl;
          map[oldAsset.id] = newUrl;
          if (oldAsset.slotKey) map[oldAsset.slotKey] = newUrl;
          if (oldAsset.name) map[oldAsset.name] = newUrl;
          const oldBase = oldUrl.split('/').pop();
          if (oldBase) map[oldBase] = newUrl;
          localStorage.setItem('cci_media_replacements_map', JSON.stringify(map));
        } catch (e) {}
      }
    }

    this.logAudit(
      actor,
      'Replaced',
      'Media Library',
      `Replaced asset "${oldAsset.name}" with "${updates.name || oldAsset.name}". All referencing views updated.`
    );
    return this.media[idx];
  }

  public deleteMediaAsset(id: string, actor = 'Admin'): void {
    const target = this.media.find(m => m.id === id);
    this.media = this.media.filter(m => m.id !== id);
    this.persistMedia();
    if (target) {
      this.logAudit(actor, 'Deleted', 'Media Library', `Deleted media asset: ${target.name}`);
    }
  }

  // --- Partners & Collaborators ---
  public getPartners(includeDisabled = false): PartnerCollaborator[] {
    const list = [...this.partners].sort((a, b) => a.order - b.order);
    return includeDisabled ? list : list.filter(p => p.enabled);
  }

  public getPartnerById(id: string): PartnerCollaborator | undefined {
    return this.partners.find(p => p.id === id);
  }

  public savePartner(
    partnerData: Partial<PartnerCollaborator> & { name: string; logoUrl: string },
    actor = 'Admin'
  ): PartnerCollaborator {
    let saved: PartnerCollaborator;
    const existingIdx = this.partners.findIndex(p => p.id === partnerData.id);

    if (existingIdx >= 0) {
      saved = {
        ...this.partners[existingIdx],
        ...partnerData,
      };
      this.partners[existingIdx] = saved;
      this.logAudit(actor, 'Updated', 'Partners & Collaborators', `Updated partner details for "${saved.name}".`);
    } else {
      const maxOrder = this.partners.length > 0 ? Math.max(...this.partners.map(p => p.order || 0)) : 0;
      saved = {
        id: partnerData.id || `partner-${Date.now()}`,
        name: partnerData.name,
        logoUrl: partnerData.logoUrl,
        websiteUrl: partnerData.websiteUrl || '#',
        category: partnerData.category || 'Institutional Partner',
        order: partnerData.order ?? (maxOrder + 1),
        enabled: partnerData.enabled ?? true,
        createdAt: new Date().toISOString(),
        description: partnerData.description || '',
        slotKey: partnerData.slotKey || `partner_${(partnerData.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      };
      this.partners.push(saved);
      this.logAudit(actor, 'Created', 'Partners & Collaborators', `Added new partner: "${saved.name}".`);
    }

    this.persistPartners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cci-content-synced'));
    }

    // Sync to Supabase partners table
    if (isSupabaseConfigured) {
      Promise.resolve(
        supabase
          .from('partners')
          .upsert(
            {
              name: saved.name,
              category: saved.category,
              logo_url: saved.logoUrl,
              website_url: saved.websiteUrl,
              display_order: saved.order,
              is_active: saved.enabled,
            },
            { onConflict: 'name' }
          )
      ).catch((err: any) => console.warn('Supabase partner sync warning:', err));
    }

    return saved;
  }

  public deletePartner(id: string, actor = 'Admin'): boolean {
    const p = this.partners.find(item => item.id === id);
    if (!p) return false;
    this.partners = this.partners.filter(item => item.id !== id);
    this.logAudit(actor, 'Deleted', 'Partners & Collaborators', `Removed partner: "${p.name}".`);
    this.persistPartners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cci-content-synced'));
    }

    // Sync deletion from Supabase
    if (isSupabaseConfigured && p) {
      Promise.resolve(
        supabase
          .from('partners')
          .delete()
          .eq('name', p.name)
      ).catch((err: any) => console.warn('Supabase partner delete warning:', err));
    }

    return true;
  }

  public togglePartner(id: string, actor = 'Admin'): boolean {
    const p = this.partners.find(item => item.id === id);
    if (!p) return false;
    p.enabled = !p.enabled;
    this.logAudit(actor, 'Toggled', 'Partners & Collaborators', `${p.enabled ? 'Enabled' : 'Disabled'} display for partner "${p.name}".`);
    this.persistPartners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cci-content-synced'));
    }

    // Sync active state to Supabase
    if (isSupabaseConfigured && p) {
      Promise.resolve(
        supabase
          .from('partners')
          .update({ is_active: p.enabled })
          .eq('name', p.name)
      ).catch((err: any) => console.warn('Supabase partner toggle warning:', err));
    }

    return true;
  }

  public reorderPartners(orderedIds: string[], actor = 'Admin'): void {
    orderedIds.forEach((id, index) => {
      const p = this.partners.find(item => item.id === id);
      if (p) p.order = index + 1;
    });
    this.partners.sort((a, b) => a.order - b.order);
    this.logAudit(actor, 'Reordered', 'Partners & Collaborators', 'Updated display sequence of partner logos.');
    this.persistPartners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cci-content-synced'));
    }
  }

  // --- Forms & Submissions ---
  public getFormSubmissions(): FormSubmission[] {
    return [...this.forms].reverse();
  }

  public saveFormSubmission(sub: Omit<FormSubmission, 'id' | 'createdAt'>): FormSubmission {
    const entry: FormSubmission = {
      ...sub,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.forms.push(entry);
    this.persistForms();

    // Sync to Supabase newsletter subscribers table
    if (sub.type === 'newsletter' && sub.email && isSupabaseConfigured) {
      subscribeNewsletter(sub.email).catch((err: any) =>
        console.warn('Supabase newsletter subscription sync warning:', err)
      );
    }

    return entry;
  }

  public deleteFormSubmission(id: string, actor = 'Admin'): void {
    this.forms = this.forms.filter(f => f.id !== id);
    this.persistForms();
    this.logAudit(actor, 'Deleted', 'Forms & Submissions', `Removed submission ID: ${id}`);
  }

  // --- Website Settings ---
  public getSettings(): WebsiteSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<WebsiteSettings>, actor = 'Admin'): void {
    this.settings = { ...this.settings, ...updates };
    this.persistSettings();
    this.logAudit(actor, 'Updated', 'Settings', 'Updated global website configuration.');
  }

  // --- Audit Logs ---
  public getAuditLogs(): ContentAuditEntry[] {
    return [...this.auditLogs];
  }
}

export const contentStore = new ContentStore();

export function getSectionSlots(): WebsiteSectionSlot[] {
  return [...WEBSITE_SECTION_SLOTS];
}

export function getSectionSlotByKey(slotKey: string): WebsiteSectionSlot | undefined {
  return WEBSITE_SECTION_SLOTS.find(s => s.slotKey === slotKey);
}

/**
 * Resolves an image URL against the media library and replacement ledger.
 * Resolves by slot key, asset ID, legacy URL, or filename.
 * Appends version timestamp parameter (?v=...) to prevent browser caching stale images.
 */
export function resolveMediaUrl(url?: string, assetNameOrIdOrSlot?: string): string {
  if (!url && !assetNameOrIdOrSlot) return '';
  if (typeof window === 'undefined') return url || '';

  // 1. Resolve by slot key or asset ID from contentStore
  if (assetNameOrIdOrSlot) {
    const assets = contentStore.getMediaAssets();
    const found = assets.find(
      a => a.slotKey === assetNameOrIdOrSlot || a.id === assetNameOrIdOrSlot || a.name === assetNameOrIdOrSlot
    );
    if (found?.url) {
      const v = found.version ? `?v=${found.version}` : '';
      return found.url.includes('?') ? found.url : `${found.url}${v}`;
    }
  }

  // 2. Check local replacement ledger
  try {
    const mapStr = localStorage.getItem('cci_media_replacements_map');
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (assetNameOrIdOrSlot && map[assetNameOrIdOrSlot]) return map[assetNameOrIdOrSlot];
      if (url && map[url]) return map[url];
      if (url) {
        const baseName = url.split('/').pop() || '';
        if (map[baseName]) return map[baseName];
      }
    }
  } catch (e) {}

  // 3. Find asset by exact URL or base filename
  if (url) {
    const assets = contentStore.getMediaAssets();
    const cleanUrl = url.split('?')[0];
    const exact = assets.find(a => a.url.split('?')[0] === cleanUrl);
    if (exact?.url) {
      const v = exact.version ? `?v=${exact.version}` : '';
      return exact.url.includes('?') ? exact.url : `${exact.url}${v}`;
    }

    const baseName = cleanUrl.split('/').pop() || '';
    const matching = assets.find(a => a.name === baseName);
    if (matching?.url && (matching.url.startsWith('/uploads/') || matching.url !== url)) {
      const v = matching.version ? `?v=${matching.version}` : '';
      return matching.url.includes('?') ? matching.url : `${matching.url}${v}`;
    }
  }

  return url || '';
}

/**
 * React hook to reactively resolve and bind an image URL on the frontend.
 * Automatically re-renders with the new image whenever an asset is replaced or uploaded.
 */
export function useResolvedMediaUrl(defaultUrl?: string, assetNameOrIdOrSlot?: string): string {
  const [url, setUrl] = useState(() => resolveMediaUrl(defaultUrl, assetNameOrIdOrSlot));

  useEffect(() => {
    const sync = () => setUrl(resolveMediaUrl(defaultUrl, assetNameOrIdOrSlot));
    window.addEventListener('cci-content-synced', sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener('cci-content-synced', sync);
      unsub();
    };
  }, [defaultUrl, assetNameOrIdOrSlot]);

  return url || '';
}
