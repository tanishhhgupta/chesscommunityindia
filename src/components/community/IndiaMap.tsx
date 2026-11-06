import React, { useState } from "react";
import { MapPin, Users, Calendar, ArrowRight, Sparkles, Navigation } from "lucide-react";
import { sound } from "../../lib/audio";

export interface MapCityNode {
  id: string;
  name: string;
  region: "Central" | "North" | "West" | "South" | "East";
  x: number; // Percentage on SVG map (0-100)
  y: number; // Percentage on SVG map (0-100)
  members: number;
  eventsCount: number;
  tagline: string;
  isOrigin?: boolean;
  lead: string;
}

export const MAP_CITIES: MapCityNode[] = [
  {
    id: "city-jbp",
    name: "Jabalpur",
    region: "Central",
    x: 52,
    y: 49,
    members: 2450,
    eventsCount: 48,
    tagline: "Birthplace & Heart of CCI Movement",
    isOrigin: true,
    lead: "Tanish Gupta & Founding Core",
  },
  {
    id: "city-bpl",
    name: "Bhopal",
    region: "Central",
    x: 44,
    y: 48,
    members: 1890,
    eventsCount: 32,
    tagline: "Lake City Blitz Circuit & Mall Opens",
    lead: "Vikramaditya Rao (NA)",
  },
  {
    id: "city-idr",
    name: "Indore",
    region: "Central",
    x: 39,
    y: 52,
    members: 3120,
    eventsCount: 41,
    tagline: "Cleanest City, Purest Chess Passion",
    lead: "Ananya Deshpande",
  },
  {
    id: "city-del",
    name: "Delhi NCR",
    region: "North",
    x: 43,
    y: 28,
    members: 4600,
    eventsCount: 65,
    tagline: "National Capital Grand Open Circuit",
    lead: "Rohan & Delhi Core",
  },
  {
    id: "city-bom",
    name: "Mumbai",
    region: "West",
    x: 33,
    y: 63,
    members: 3800,
    eventsCount: 52,
    tagline: "Coastal Rapid Clashes & Corporate Cups",
    lead: "Siddharth Mehta",
  },
  {
    id: "city-blr",
    name: "Bengaluru",
    region: "South",
    x: 45,
    y: 78,
    members: 4200,
    eventsCount: 58,
    tagline: "Silicon Valley Grandmaster Guild",
    lead: "Karthik Ramanujan",
  },
  {
    id: "city-pne",
    name: "Pune",
    region: "West",
    x: 36,
    y: 65,
    members: 2100,
    eventsCount: 29,
    tagline: "Collegiate Championships & Cafe Arena",
    lead: "Neha Kulkarni",
  },
  {
    id: "city-hyd",
    name: "Hyderabad",
    region: "South",
    x: 48,
    y: 65,
    members: 2750,
    eventsCount: 36,
    tagline: "Cyber City Classical Swiss Standings",
    lead: "Arjun Reddy",
  },
  {
    id: "city-ccu",
    name: "Kolkata",
    region: "East",
    x: 74,
    y: 48,
    members: 3300,
    eventsCount: 44,
    tagline: "Gariahat Heritage & Open Park Chess",
    lead: "Debashis Mukherjee",
  },
];

interface IndiaMapProps {
  onSelectCity?: (city: MapCityNode) => void;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({ onSelectCity }) => {
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [hoveredCity, setHoveredCity] = useState<MapCityNode | null>(null);

  const filteredCities = activeRegion === "All"
    ? MAP_CITIES
    : MAP_CITIES.filter((c) => c.region === activeRegion);

  const originCity = MAP_CITIES.find((c) => c.isOrigin) || MAP_CITIES[0];

  return (
    <div className="w-full relative glass-panel rounded-3xl p-6 sm:p-10 border border-[#C9A45C]/20 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A45C]/5 blur-[120px] pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-[#C9A45C]/30 text-xs font-semibold text-[#E0C895] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Pan-India Telemetry</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-serif-editorial tracking-wide">
            Interactive Chapter Map &amp; Real-time Nodes
          </h3>
          <p className="text-xs sm:text-sm text-[#8D8D8D] mt-1 max-w-lg">
            Hover over any golden node to inspect local membership metrics, weekly tournament frequency, and chapter leadership.
          </p>
        </div>

        {/* Region Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#121212] border border-[rgba(245, 242, 235,0.06)]">
          {["All", "Central", "North", "West", "South", "East"].map((region) => (
            <button
              key={region}
              onClick={() => {
                sound.playTactileClick();
                setActiveRegion(region);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRegion === region
                  ? "bg-[#C9A45C] text-[#080808] shadow-md shadow-[#C9A45C]/20"
                  : "text-[#8D8D8D] hover:text-[#F5F1E8] hover:bg-white/5"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Map Interactive Canvas Stage */}
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-2xl bg-[#0c0c0c] border border-[rgba(245, 242, 235,0.04)] flex items-center justify-center overflow-hidden">
        {/* Subtle Map Grid lines */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #C9A45C 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Scalable Vector Map of India & Connecting Vectors */}
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full max-h-[620px] object-contain select-none"
        >
          <defs>
            <linearGradient id="goldBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0C895" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#C9A45C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C9A45C" stopOpacity="0.1" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* India Boundary Stylized Vector Silhouette */}
          <path
            d="M 330 140 Q 370 70 410 75 Q 460 70 470 120 Q 490 145 520 160 Q 560 170 590 190 Q 640 200 660 250 Q 720 270 790 260 Q 860 270 880 320 Q 850 360 820 370 Q 780 380 750 420 Q 740 450 780 470 Q 820 490 800 530 Q 770 550 730 520 Q 690 530 670 570 Q 640 600 600 640 Q 560 700 530 750 Q 500 810 470 890 Q 450 930 440 930 Q 430 910 410 840 Q 390 770 370 720 Q 330 650 300 600 Q 280 570 240 540 Q 200 520 210 470 Q 230 430 260 410 Q 280 370 310 320 Q 320 270 300 220 Z"
            fill="#121212"
            stroke="#C9A45C"
            strokeWidth="1.5"
            strokeOpacity="0.35"
            className="transition-all duration-500"
          />

          {/* Connecting Gold Route Arcs from Jabalpur Origin to all other cities */}
          {filteredCities.map((city) => {
            if (city.id === originCity.id) return null;
            const startX = originCity.x * 10;
            const startY = originCity.y * 10;
            const endX = city.x * 10;
            const endY = city.y * 10;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2 - 40;

            const isHovered = hoveredCity?.id === city.id;

            return (
              <g key={`arc-${city.id}`}>
                <path
                  d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                  fill="none"
                  stroke={isHovered ? "#E0C895" : "#C9A45C"}
                  strokeWidth={isHovered ? "2.5" : "1"}
                  strokeOpacity={isHovered ? "0.9" : "0.3"}
                  strokeDasharray={isHovered ? "none" : "4 4"}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* City Nodes */}
          {filteredCities.map((city) => {
            const posX = city.x * 10;
            const posY = city.y * 10;
            const isHovered = hoveredCity?.id === city.id;

            return (
              <g
                key={city.id}
                className="cursor-pointer group"
                onMouseEnter={() => {
                  sound.playPieceMove();
                  setHoveredCity(city);
                }}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() => {
                  sound.playGlassClick();
                  if (onSelectCity) onSelectCity(city);
                }}
              >
                {/* Outer Pulsing Ring */}
                <circle
                  cx={posX}
                  cy={posY}
                  r={city.isOrigin ? "22" : isHovered ? "18" : "12"}
                  fill="none"
                  stroke={city.isOrigin ? "#E0C895" : "#C9A45C"}
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  className="animate-ping"
                  style={{ transformOrigin: `${posX}px ${posY}px`, animationDuration: city.isOrigin ? "2s" : "3s" }}
                />

                {/* Secondary halo */}
                <circle
                  cx={posX}
                  cy={posY}
                  r={isHovered ? "14" : "9"}
                  fill="rgba(201, 164, 92, 0.2)"
                  stroke="#C9A45C"
                  strokeWidth="1"
                  filter="url(#glow)"
                  className="transition-all duration-300"
                />

                {/* Center Core Dot */}
                <circle
                  cx={posX}
                  cy={posY}
                  r={city.isOrigin ? "5.5" : "4"}
                  fill={city.isOrigin ? "#FFFFFF" : isHovered ? "#FFFFFF" : "#E0C895"}
                  className="transition-all duration-200"
                />

                {/* City Label */}
                <text
                  x={posX}
                  y={posY - 16}
                  textAnchor="middle"
                  fill={isHovered || city.isOrigin ? "#FFFFFF" : "#C9A45C"}
                  fontSize={city.isOrigin ? "14" : "12"}
                  fontWeight={isHovered || city.isOrigin ? "800" : "600"}
                  letterSpacing="0.05em"
                  className="select-none pointer-events-none transition-colors"
                >
                  {city.name} {city.isOrigin && "★"}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Detail Tooltip on Hover */}
        {hoveredCity && (
          <div
            className="absolute z-30 pointer-events-none p-4 rounded-2xl bg-[#121212]/95 border border-[#C9A45C]/40 backdrop-blur-2xl shadow-2xl animate-fade-in text-left max-w-xs"
            style={{
              left: `${Math.min(75, Math.max(15, hoveredCity.x))}%`,
              top: `${Math.min(70, Math.max(18, hoveredCity.y - 12))}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[rgba(245, 242, 235,0.06)] pb-2 mb-2">
              <div className="flex items-center gap-1.5 font-black text-sm text-white">
                <MapPin className="w-3.5 h-3.5 text-[#C9A45C]" />
                {hoveredCity.name} Chapter
              </div>
              {hoveredCity.isOrigin && (
                <span className="px-2 py-0.5 rounded-full bg-[#C9A45C] text-black font-extrabold text-[9px] uppercase">
                  Birthplace
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#E0C895] italic mb-2">
              "{hoveredCity.tagline}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/40 p-2 rounded-xl border border-[rgba(245, 242, 235,0.04)] mb-2">
              <div>
                <span className="text-[#8D8D8D] block">Players</span>
                <span className="text-white font-mono font-bold">{hoveredCity.members.toLocaleString()}+</span>
              </div>
              <div>
                <span className="text-[#8D8D8D] block">Events</span>
                <span className="text-[#C9A45C] font-mono font-bold">{hoveredCity.eventsCount} Played</span>
              </div>
            </div>

            <div className="text-[10px] text-[#8D8D8D] flex items-center justify-between">
              <span>Lead: <strong className="text-white">{hoveredCity.lead}</strong></span>
              <span className="text-[#C9A45C] font-bold flex items-center gap-1">Click to view <ArrowRight className="w-2.5 h-2.5" /></span>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/70 border border-[rgba(245, 242, 235,0.06)] backdrop-blur-md text-[11px] text-[#8D8D8D] space-y-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border border-[#C9A45C] shadow-sm" />
            <span className="text-white font-semibold">Jabalpur (Origin &amp; National Hub)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C9A45C]" />
            <span>Active City Chapters &amp; Weekly Meets</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 border-t border-dashed border-[#C9A45C]/60" />
            <span>FIDE Swiss Inter-Chapter Circuit</span>
          </div>
        </div>

      </div>
    </div>
  );
};
