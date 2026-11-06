import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { contentStore, EditableEventItem, resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  MapPin, 
  Clock, 
  FileText, 
  Trophy, 
  ArrowRight
} from "lucide-react";
import { EventRegistrationModal } from "../events/EventRegistrationModal";

interface EventsViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<EditableEventItem[]>(() => contentStore.getEvents());

  useEffect(() => {
    const sync = () => setEvents(contentStore.getEvents());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing">("all");
  const [activeModalEvent, setActiveModalEvent] = useState<EditableEventItem | null>(null);

  const featuredEvent = events.find((e) => e.isFeatured) || events[0];
  
  const listEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  // Helper to extract clean date parts matching the screenshot
  const getEventDateParts = (eventId: string) => {
    switch (eventId) {
      case "ev-01":
        return { month: "NOV", day: "14-18", year: "2026" };
      case "ev-02":
        return { month: "OCT", day: "11", year: "2026" };
      case "ev-04":
        return { month: "OCT", day: "24", year: "2026" };
      case "ev-03":
        return { month: "DEC", day: "06", year: "2026" };
      default:
        return { month: "OCT", day: "18", year: "2026" };
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-hidden font-sans selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* ========================================================================= */}
      {/* SWEEPING GOLDEN RIBBON CURVES                                             */}
      {/* ========================================================================= */}
      <div className="absolute top-0 inset-x-0 w-full h-full pointer-events-none select-none z-0 opacity-70">
        <svg className="w-full h-full" viewBox="0 0 1440 1200" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="eventsGold1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C69E58" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="eventsGold2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E6C075" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Upper curve looping behind Play title */}
          <path 
            d="M -40,140 C 260,80 540,70 860,170 C 1140,260 1300,160 1500,90" 
            stroke="url(#eventsGold1)" 
            strokeWidth="1.5" 
          />
          {/* Lower accent curve across fixtures */}
          <path 
            d="M -60,820 C 220,700 480,820 780,780 C 1100,740 1300,850 1520,790" 
            stroke="url(#eventsGold2)" 
            strokeWidth="1.3" 
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT CONTAINER                                                    */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-12">
        
        {/* 1. Header Hero Typography & Quote Row */}
        <section className="space-y-4">
          {/* Kicker with warm bronze dash */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
              EVENTS
            </span>
            <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            {/* Left: Play headline & subtitle */}
            <div className="space-y-3 max-w-lg">
              <h1 className="font-serif text-6xl sm:text-7xl lg:text-[88px] font-bold text-[#1C1613] tracking-tight leading-none">
                Play.
              </h1>
              <p className="text-sm sm:text-base text-[#5C534B] font-sans leading-relaxed pt-1">
                Tournaments, meetups, battles and community events designed to bring players together.
              </p>
            </div>

            {/* Right: Editorial Quote with vertical divider */}
            <div className="md:border-l md:border-[#DDD4C7] md:pl-8 space-y-1 text-sm sm:text-base font-serif italic text-[#6E6258] leading-relaxed max-w-xs self-start md:self-end pb-1">
              <p>&ldquo; Same boards.</p>
              <p>&nbsp;&nbsp;New friendships.</p>
              <p>&nbsp;&nbsp;Stronger communities. &rdquo;</p>
            </div>
          </div>
        </section>

        {/* 2. Large Featured Ongoing Event Card */}
        <section className="rounded-3xl p-8 sm:p-10 glass-panel shadow-xl relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Details & 4-Item Meta Grid */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Badge: Category • Ongoing Status */}
              <div className="inline-block">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase bg-[#C5A059]/25 text-[#7D5A1B] border border-[#C5A059]/35">
                  {featuredEvent.category} &bull; ONGOING
                </span>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1613] tracking-tight leading-tight">
                {featuredEvent.title}
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#5C534B] leading-relaxed font-sans max-w-xl">
                {featuredEvent.description}
              </p>

              {/* 4-Item Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[#D9CFC1]">
                
                {/* 1. Venue */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#7A6E63] uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[#A38342] shrink-0" />
                    <span>VENUE</span>
                  </div>
                  <p className="text-xs text-[#1C1613] font-medium leading-snug">
                    CCI Virtual Arbiter Grid &amp; Partner Centers
                  </p>
                  <p className="text-[10px] text-[#7A6E63]">
                    National Online / Central Hubs
                  </p>
                </div>

                {/* 2. Time Control */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#7A6E63] uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-[#A38342] shrink-0" />
                    <span>TIME CONTROL</span>
                  </div>
                  <p className="text-xs text-[#1C1613] font-medium leading-snug">
                    {featuredEvent.timeControl}
                  </p>
                </div>

                {/* 3. Format */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#7A6E63] uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-[#A38342] shrink-0" />
                    <span>FORMAT</span>
                  </div>
                  <p className="text-xs text-[#1C1613] font-medium leading-snug">
                    FIDE Dutch Swiss
                  </p>
                  <p className="text-[10px] text-[#7A6E63]">
                    5 Rounds
                  </p>
                </div>

                {/* 4. Prize Fund */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#7A6E63] uppercase tracking-wider">
                    <Trophy className="w-3.5 h-3.5 text-[#A38342] shrink-0" />
                    <span>PRIZE FUND</span>
                  </div>
                  <p className="text-xs text-[#1C1613] font-medium leading-snug">
                    ₹50,000+ FIDE
                  </p>
                  <p className="text-[10px] text-[#7A6E63]">
                    CCI Medals
                  </p>
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  onClick={() => {
                    sound.playTactileClick();
                    setActiveModalEvent(featuredEvent);
                  }}
                  className="px-7 py-3 rounded-full bg-[#241711] hover:bg-[#38261E] active:scale-95 text-[#FAF7F2] font-sans text-xs font-bold tracking-wider transition-all inline-flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Register for Pass</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F2]" />
                </button>
              </div>

            </div>

            {/* Right Column: Hero Visual with Live ChessManager Badge */}
            <div className="lg:col-span-5 relative h-64 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-md group">
              <img
                src={resolveMediaUrl(featuredEvent?.imageUrl, 'event_' + (featuredEvent?.id || 'ev-01'))}
                alt={featuredEvent?.title || "Live Tournament Arena"}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Live on ChessManager Desk Pill */}
              <button
                onClick={() => {
                  sound.playTactileClick();
                  onNavigate("chess-manager");
                }}
                className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full glass-pill-dark text-[#FAF7F2] text-[10px] font-sans font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live on ChessManager Desk</span>
              </button>
            </div>

          </div>
        </section>

        {/* 3. Upcoming Fixtures Section */}
        <section className="space-y-6 pt-4">
          
          {/* Header Bar with Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDD4C7] pb-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] tracking-tight">
              Upcoming Fixtures
            </h3>

            {/* Filter Pills (ALL, UPCOMING, LIVE) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  sound.playTactileClick();
                  setFilter("all");
                }}
                className={`text-[11px] font-sans font-bold tracking-wider px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-[#241711] text-[#FAF7F2] shadow-xs"
                    : "text-[#7A6E63] hover:text-[#1C1613]"
                }`}
              >
                ALL
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  setFilter("upcoming");
                }}
                className={`text-[11px] font-sans font-bold tracking-wider px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  filter === "upcoming"
                    ? "bg-[#241711] text-[#FAF7F2] shadow-xs"
                    : "text-[#7A6E63] hover:text-[#1C1613]"
                }`}
              >
                UPCOMING
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  setFilter("ongoing");
                }}
                className={`text-[11px] font-sans font-bold tracking-wider px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  filter === "ongoing"
                    ? "bg-[#241711] text-[#FAF7F2] shadow-xs"
                    : "text-[#7A6E63] hover:text-[#1C1613]"
                }`}
              >
                LIVE
              </button>
            </div>
          </div>

          {/* List of Fixture Cards */}
          <div className="space-y-4">
            {listEvents.map((ev) => {
              const dateParts = getEventDateParts(ev.id);

              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    sound.playPieceMove();
                    setActiveModalEvent(ev);
                  }}
                  className="rounded-2xl p-5 sm:p-6 glass-card shadow-xs cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                >
                  
                  {/* Left: Date Block & Main Details */}
                  <div className="flex items-center gap-6">
                    
                    {/* Date Block */}
                    <div className="w-20 sm:w-24 shrink-0 text-center md:text-left pr-4 md:border-r md:border-[#DDD4C7]">
                      <span className="text-[11px] font-sans font-bold uppercase text-[#7A6E63] tracking-wider block">
                        {dateParts.month}
                      </span>
                      <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] leading-tight block">
                        {dateParts.day}
                      </span>
                      <span className="text-[10px] text-[#998D80] font-sans block">
                        {dateParts.year}
                      </span>
                    </div>

                    {/* Fixture Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-[#E2D8CC] text-[#7A5B1D] border border-[#D5C9B8]">
                          {ev.category}
                        </span>
                        <span className="text-xs font-sans text-[#7A6E63] font-medium">
                          {ev.city}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1C1613] group-hover:text-[#7A5B1D] transition-colors leading-snug">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-[#5C534B] font-sans">
                        {ev.venue} &bull; {ev.startsAt}
                      </p>
                    </div>

                  </div>

                  {/* Right: Entry Fee, Time Control & Arrow Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#DDD4C7]/60">
                    <div className="text-left md:text-right font-sans">
                      <span className="font-semibold text-xs sm:text-sm text-[#1C1613] block">
                        {ev.entryFee}
                      </span>
                      <span className="text-[11px] text-[#7A6E63] block">
                        {ev.timeControl}
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#E5DCD0] flex items-center justify-center text-[#5A5046] group-hover:bg-[#C5A059] group-hover:text-[#1C1613] group-hover:translate-x-0.5 transition-all shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </section>

      </div>

      {/* ========================================================================= */}
      {/* REGISTRATION MODAL                                                        */}
      {/* ========================================================================= */}
      {activeModalEvent && (
        <EventRegistrationModal
          event={activeModalEvent}
          onClose={() => setActiveModalEvent(null)}
        />
      )}

    </div>
  );
};

export default EventsView;
