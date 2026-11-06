import React, { useState, useEffect } from "react";
import { MAP_CITIES, MapCityNode } from "../community/IndiaMap";
import { sound } from "../../lib/audio";
import { contentStore, EditableCityChapter, EditableEventItem, resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  MapPin, 
  ArrowRight, 
  X, 
  MessageCircle, 
  Instagram, 
  Star, 
  Users 
} from "lucide-react";

interface CitiesViewProps {
  onNavigate: (view: string, param?: string) => void;
  initialCitySlug?: string;
}

export const CitiesView: React.FC<CitiesViewProps> = ({ onNavigate, initialCitySlug }) => {
  const [cities, setCities] = useState<EditableCityChapter[]>(() => contentStore.getCities());
  const [events, setEvents] = useState<EditableEventItem[]>(() => contentStore.getEvents());

  useEffect(() => {
    const sync = () => {
      setCities(contentStore.getCities());
      setEvents(contentStore.getEvents());
    };
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialCitySlug || null);
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [hoveredCity, setHoveredCity] = useState<MapCityNode | null>(null);

  useEffect(() => {
    if (initialCitySlug) {
      setSelectedSlug(initialCitySlug);
    }
  }, [initialCitySlug]);

  const activeChapter = selectedSlug 
    ? cities.find((c) => c.slug.toLowerCase() === selectedSlug.toLowerCase()) || null
    : null;

  const getCityEvents = (cityName: string) => {
    return events.filter((e) => e.city.toLowerCase().includes(cityName.toLowerCase()));
  };

  const filteredMapCities = activeRegion === "All"
    ? MAP_CITIES
    : MAP_CITIES.filter((c) => c.region === activeRegion);

  const originCity = MAP_CITIES.find((c) => c.isOrigin) || MAP_CITIES[0];

  const regions = ["All", "Central", "North", "West", "South", "East"];

  return (
    <div className="relative w-full min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-hidden font-sans selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* ========================================================================= */}
      {/* SWEEPING GOLDEN RIBBON CURVES                                             */}
      {/* ========================================================================= */}
      <div className="absolute top-0 inset-x-0 w-full h-full pointer-events-none select-none z-0 opacity-70">
        <svg className="w-full h-full" viewBox="0 0 1440 1300" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="citiesGold1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C69E58" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="citiesGold2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E6C075" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Upper curve looping behind Across India title */}
          <path 
            d="M -40,130 C 260,70 540,60 860,160 C 1140,250 1300,160 1500,90" 
            stroke="url(#citiesGold1)" 
            strokeWidth="1.5" 
          />
          {/* Lower accent curve across map & CTA section */}
          <path 
            d="M -60,920 C 220,800 480,920 780,880 C 1100,840 1300,950 1520,890" 
            stroke="url(#citiesGold2)" 
            strokeWidth="1.3" 
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT CONTAINER                                                    */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16 sm:space-y-20">
        
        {/* 1. HERO HEADER: "Across India." */}
        <section className="space-y-4">
          {/* Kicker with warm bronze dash */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
              PAN-INDIA DIRECTORY
            </span>
            <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[76px] font-bold text-[#1C1613] tracking-tight leading-[1.04]">
                Across <span className="font-serif italic font-normal text-[#B88E3E]">India.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#5C534B] font-sans leading-relaxed pt-1">
                From local chapters to nationwide tournaments, Chess Community India connects players through weekly park and cafe meetups across cities.
              </p>
            </div>

            {/* Right Indicator Pill */}
            <div className="self-start sm:self-end pb-1">
              <div 
                onClick={() => {
                  sound.playTactileClick();
                  const mapElement = document.getElementById("geographic-map");
                  if (mapElement) mapElement.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-5 py-2.5 rounded-full glass-pill hover:bg-white/80 text-[#7A5B1D] font-medium text-xs flex items-center gap-2.5 shadow-xs transition-colors cursor-pointer group"
              >
                <span>4 Active Regional Hubs</span>
                <div className="w-5 h-5 rounded-full bg-[#E5DCD0] flex items-center justify-center text-[#5A5046] group-hover:bg-[#C5A059] group-hover:text-[#1C1613] transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE CITY CHAPTERS: 4-Card Horizontal Grid */}
        <section className="space-y-6">
          {/* Section Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] tracking-tight">
                Core City Chapters
              </h2>
              <span className="w-8 h-[1px] bg-[#C5A059]/70" />
            </div>
            <p className="text-xs sm:text-sm text-[#7A6E63] font-sans">
              Our active community hubs anchored with regular arbiters &amp; venues.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cities.map((city) => {
              const isSelected = selectedSlug === city.slug;

              return (
                <div
                  key={city.id}
                  onClick={() => {
                    sound.playPieceMove();
                    setSelectedSlug(city.slug);
                  }}
                  className={`rounded-2xl overflow-hidden glass-card cursor-pointer transition-all flex flex-col justify-between group ${
                    isSelected
                      ? "border-[#C5A059] bg-white/70 shadow-[0_8px_30px_rgba(197,160,89,0.22)] ring-1 ring-[#C5A059]/60"
                      : "shadow-xs"
                  }`}
                >
                  {/* Top Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#D8CFBF]">
                    <img
                      src={resolveMediaUrl(city.imageUrl, 'city_' + city.slug)}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 group-hover:brightness-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Location Tag with MapPin */}
                      <div className="flex items-center gap-1.5 text-[11px] font-sans font-semibold text-[#8C6826] mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#B88E3E] shrink-0" />
                        <span>{city.name}</span>
                      </div>

                      {/* City Title */}
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C1613] tracking-tight mb-2 group-hover:text-[#7A5B1D] transition-colors">
                        {city.name} Chapter
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#5C534B] leading-relaxed font-sans line-clamp-3">
                        {city.description}
                      </p>
                    </div>

                    {/* Bottom Action Link */}
                    <div className="pt-4 mt-4 border-t border-[#DDD4C7] flex items-center justify-between text-xs font-serif font-semibold text-[#8F6E2A] group-hover:text-[#1C1613] transition-colors">
                      <span>Explore Chapter</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. GEOGRAPHIC EXPANSION & INTERACTIVE NATIONWIDE NODES MAP */}
        <section id="geographic-map" className="space-y-6">
          
          {/* Header Bar with Region Filters */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#DDD4C7] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
                  GEOGRAPHIC EXPANSION
                </span>
                <span className="w-8 h-[1px] bg-[#C5A059]/70" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] tracking-tight">
                Explore Nationwide Nodes
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6E63] font-sans">
                Select interactive markers on the national map to view regional circuits, chapter leads, and upcoming events.
              </p>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-end">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => {
                    sound.playTactileClick();
                    setActiveRegion(region);
                  }}
                  className={`text-xs font-sans px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                    activeRegion === region
                      ? "bg-[#8E5830] text-[#FAF7F2] font-semibold shadow-xs"
                      : "text-[#7A6E63] hover:text-[#1C1613] font-medium"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Dark Map Stage Container */}
          <div className="relative rounded-3xl bg-[#100D0B] border border-[#352A22] shadow-2xl p-6 sm:p-10 overflow-hidden">
            
            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Legend Overlay */}
              <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                <div className="p-5 rounded-2xl bg-[#1A1512]/90 border border-[#3A2E26] space-y-3.5 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-xs text-[#FAF7F2] font-sans">
                    <Star className="w-4 h-4 text-[#ECCF96] fill-[#ECCF96] shrink-0" />
                    <span className="font-medium">Jabalpur (Origin &amp; National Hub)</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#FAF7F2] font-sans">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#C5A059] shrink-0" />
                    <span className="font-medium">Active City Chapters</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#FAF7F2] font-sans">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#C5A059] shrink-0" />
                    <span className="font-medium">Upcoming Chapters</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#A89E95] font-sans pt-1 border-t border-[#3A2E26]">
                    <div className="w-6 h-[1.5px] border-t border-dashed border-[#C5A059]/70 shrink-0" />
                    <span>Regional Connection</span>
                  </div>
                </div>
              </div>

              {/* Center Map SVG Canvas */}
              <div className="lg:col-span-6 relative h-[420px] sm:h-[480px] flex items-center justify-center order-1 lg:order-2">
                <svg
                  viewBox="0 0 1000 1000"
                  className="w-full h-full max-h-[480px] object-contain select-none"
                >
                  <defs>
                    <linearGradient id="mapGoldArc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* India Geographic Outline Silhouette */}
                  <path
                    d="M 330 140 Q 370 70 410 75 Q 460 70 470 120 Q 490 145 520 160 Q 560 170 590 190 Q 640 200 660 250 Q 720 270 790 260 Q 860 270 880 320 Q 850 360 820 370 Q 780 380 750 420 Q 740 450 780 470 Q 820 490 800 530 Q 770 550 730 520 Q 690 530 670 570 Q 640 600 600 640 Q 560 700 530 750 Q 500 810 470 890 Q 450 930 440 930 Q 430 910 410 840 Q 390 770 370 720 Q 330 650 300 600 Q 280 570 240 540 Q 200 520 210 470 Q 230 430 260 410 Q 280 370 310 320 Q 320 270 300 220 Z"
                    fill="#181310"
                    stroke="#C5A059"
                    strokeWidth="1.2"
                    strokeOpacity="0.4"
                  />

                  {/* Arcs radiating from Jabalpur Origin Hub */}
                  {filteredMapCities.map((city) => {
                    if (city.id === originCity.id) return null;
                    const startX = originCity.x * 10;
                    const startY = originCity.y * 10;
                    const endX = city.x * 10;
                    const endY = city.y * 10;
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2 - 25;

                    return (
                      <path
                        key={`arc-${city.id}`}
                        d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                        fill="none"
                        stroke="url(#mapGoldArc)"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                        strokeOpacity="0.6"
                      />
                    );
                  })}

                  {/* City Nodes */}
                  {filteredMapCities.map((city) => {
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
                          sound.playTactileClick();
                          setSelectedSlug(city.name.toLowerCase());
                        }}
                      >
                        {/* Interactive Node Marker */}
                        {city.isOrigin ? (
                          <g transform={`translate(${posX - 10}, ${posY - 10})`}>
                            <circle cx="10" cy="10" r="14" fill="#C5A059" fillOpacity="0.25" className="animate-ping" />
                            <circle cx="10" cy="10" r="10" fill="#B88E3E" />
                            <Star className="w-3.5 h-3.5 text-[#1C1613] fill-[#1C1613] -translate-x-[1px] -translate-y-[1px]" />
                          </g>
                        ) : (
                          <circle
                            cx={posX}
                            cy={posY}
                            r={isHovered ? "8" : "5"}
                            fill="#C5A059"
                            stroke="#100D0B"
                            strokeWidth="2"
                            className="transition-all"
                          />
                        )}

                        {/* City Label */}
                        <text
                          x={posX}
                          y={posY - 12}
                          textAnchor="middle"
                          fill="#FAF7F2"
                          fontSize="13"
                          fontWeight="600"
                          fontFamily="sans-serif"
                          className="pointer-events-none drop-shadow-sm select-none"
                        >
                          {city.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Right Summary Info Panel: "Pan-India Network" */}
              <div className="lg:col-span-3 space-y-6 order-3">
                <div className="p-6 rounded-2xl bg-[#1A1512]/90 border border-[#3A2E26] space-y-4 backdrop-blur-md">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F2] mb-1.5">
                      Pan-India Network
                    </h3>
                    <p className="text-xs text-[#A89E95] font-sans leading-relaxed">
                      Building a stronger chess ecosystem by connecting players, colleges, venues and organizers across the country.
                    </p>
                  </div>

                  {/* 3 Metrics Divided by Subtle Lines */}
                  <div className="pt-4 border-t border-[#3A2E26] grid grid-cols-3 gap-2 text-left">
                    <div className="space-y-0.5">
                      <span className="font-serif text-2xl font-bold text-[#ECCF96] block">
                        4
                      </span>
                      <span className="text-[10px] text-[#A89E95] font-sans leading-tight block">
                        Active Chapters
                      </span>
                    </div>

                    <div className="space-y-0.5 border-l border-[#3A2E26] pl-2.5">
                      <span className="font-serif text-2xl font-bold text-[#ECCF96] block">
                        10+
                      </span>
                      <span className="text-[10px] text-[#A89E95] font-sans leading-tight block">
                        Upcoming Chapters
                      </span>
                    </div>

                    <div className="space-y-0.5 border-l border-[#3A2E26] pl-2.5">
                      <span className="font-serif text-2xl font-bold text-[#ECCF96] block">
                        1000+
                      </span>
                      <span className="text-[10px] text-[#A89E95] font-sans leading-tight block">
                        Members Nationwide
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. GET INVOLVED: "Don't see your city listed?" */}
        <section className="rounded-3xl p-8 sm:p-12 bg-[#EDE6DC] border border-[#D9CEBF] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
                GET INVOLVED
              </span>
              <span className="w-8 h-[1px] bg-[#C5A059]/70" />
            </div>

            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1613] tracking-tight">
              Don’t see your city listed?
            </h3>

            <p className="text-xs sm:text-sm text-[#5C534B] font-sans leading-relaxed pt-0.5">
              We provide tournament chess sets, clocks, digital scorecards, and mentorship grants to passionate organizers launching new city chapters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("work-with-us");
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#8E5830] hover:bg-[#784620] active:scale-95 text-[#FAF7F2] font-sans text-xs font-bold tracking-wider transition-all shadow-md cursor-pointer text-center"
            >
              <span>Apply to Launch a City Chapter</span>
              <ArrowRight className="w-3.5 h-3.5 inline ml-2" />
            </button>

            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("work-with-us");
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-[#C5A059]/60 bg-[#F4EFEA]/80 hover:bg-[#F4EFEA] active:scale-95 text-[#1C1613] font-sans text-xs font-bold tracking-wider transition-all shadow-xs cursor-pointer text-center"
            >
              <span>Partner With Us</span>
              <ArrowRight className="w-3.5 h-3.5 inline ml-2 text-[#8E5830]" />
            </button>
          </div>

        </section>

      </div>

      {/* ========================================================================= */}
      {/* CITY CHAPTER DETAILS MODAL (Warm Luxury Theme)                            */}
      {/* ========================================================================= */}
      {activeChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl bg-[#F7F3EE] rounded-3xl border border-[#D5C7B3] p-6 sm:p-10 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedSlug(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#7A7067] hover:text-[#1C1613] hover:bg-[#EAE2D7] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Info */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#8C6826] uppercase block">
                {activeChapter.isOrigin ? "ORIGIN CHAPTER // JABALPUR" : "SANCTIONED REGIONAL CHAPTER"}
              </span>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1613] tracking-tight">
                {activeChapter.name} Chapter
              </h2>

              <p className="text-sm font-serif italic text-[#8F6E2A]">
                &ldquo;{activeChapter.tagline}&rdquo;
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#5C534B] leading-relaxed font-sans">
              {activeChapter.description}
            </p>

            {/* Weekly Gathering Venues */}
            <div className="space-y-2.5 pt-2 border-t border-[#DDD4C7]">
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#1C1613] block">
                Official Weekly Gathering Venues
              </span>
              <div className="space-y-2 text-xs font-sans text-[#5C534B]">
                {activeChapter.weeklyVenues.map((venue, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#EDE6DC] border border-[#D9CEBF] flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#B88E3E] shrink-0" />
                    <span className="font-medium text-[#1C1613]">{venue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Coordination Info */}
            <div className="pt-2 text-xs font-sans text-[#7A6E63] border-t border-[#DDD4C7] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C6826] block">COORDINATION LEAD</span>
                <span className="font-serif font-bold text-sm text-[#1C1613]">{activeChapter.leadName}</span> ({activeChapter.leadRole})
              </div>
            </div>

            {/* Actions: WhatsApp & Instagram */}
            <div className="space-y-3 pt-2">
              {activeChapter.whatsappUrl && (
                <a
                  href={activeChapter.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Join {activeChapter.name} WhatsApp Group</span>
                </a>
              )}

              {activeChapter.instagramUrl && (
                <a
                  href={activeChapter.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-full bg-white hover:bg-[#EDE6DC] border border-[#D5C7B3] text-[#1C1613] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Follow on Instagram</span>
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CitiesView;
