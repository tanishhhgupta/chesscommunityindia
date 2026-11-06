import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { 
  ArrowRight, 
  MapPin, 
  Trophy, 
  Users, 
  Heart, 
  BarChart3, 
  Check, 
  ChevronRight
} from "lucide-react";
import { FirstScrollLoopAnimation } from "../home/FirstScrollLoopAnimation";
import { PartnersMarquee } from "../home/PartnersMarquee";
import { contentStore, LandingPageContent, EditableEventItem, EditableCityChapter, resolveMediaUrl } from "../../lib/storage/contentStore";

interface HomeExperienceProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectCity?: (cityId: string) => void;
  onSelectEvent?: (eventId: string) => void;
}

export const HomeExperience: React.FC<HomeExperienceProps> = ({ 
  onNavigate 
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Synchronized state with ContentStore
  const [landingContent, setLandingContent] = useState<LandingPageContent>(() => contentStore.getLandingContent());
  const [publishedEvents, setPublishedEvents] = useState<EditableEventItem[]>(() => contentStore.getEvents());
  const [publishedCities, setPublishedCities] = useState<EditableCityChapter[]>(() => contentStore.getCities());

  useEffect(() => {
    const syncContent = () => {
      setLandingContent(contentStore.getLandingContent());
      setPublishedEvents(contentStore.getEvents());
      setPublishedCities(contentStore.getCities());
    };

    window.addEventListener("cci-content-synced", syncContent);
    const unsub = contentStore.subscribe(syncContent);
    return () => {
      window.removeEventListener("cci-content-synced", syncContent);
      unsub();
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      sound.playGoldenChord();
      contentStore.saveFormSubmission({
        type: "newsletter",
        email: emailInput.trim(),
      });
      setSubscribed(true);
      setEmailInput("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const hero = landingContent.hero;
  const whyCci = landingContent.whyCci;
  const chessPairPromo = landingContent.chessPairPromo;
  const getInvolved = landingContent.getInvolved;
  const newsletter = landingContent.newsletter;

  return (
    <div className="relative w-full bg-[#F4EFEA] text-[#1C1613] overflow-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* SECTION 1: HERO (First Scroll with Looping Background Animation)          */}
      {/* ========================================================================= */}
      <section className="relative min-h-[92vh] pt-28 pb-14 px-6 sm:px-12 flex flex-col justify-between overflow-hidden">
        
        {/* Background Looping Left-to-Right Animated Video Pixels/Frames */}
        <FirstScrollLoopAnimation />

        {/* Hero Content (Cleanly positioned in foreground with rich contrast) */}
        <div className="relative z-20 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
          
          <div className="max-w-2xl lg:max-w-3xl space-y-6 pt-4 sm:pt-8 pb-10">
            
            {/* Announcement Pill Badge */}
            {hero.showSection && (
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-[#1A120D]/85 hover:bg-[#251A13] transition-all cursor-pointer shadow-md group backdrop-blur-md"
                onClick={() => {
                  sound.playTactileClick();
                  onNavigate(hero.announcementLink || "tournaments");
                }}
              >
                <span className="w-2 h-2 rounded-full bg-[#E6B86A] shrink-0 animate-pulse" />
                <span className="text-[11px] font-sans font-medium text-[#FAF7F2] tracking-tight">
                  <strong className="font-semibold text-[#E6B86A]">{hero.announcementHighlight || "Community Update:"}</strong> {hero.announcementText}
                </span>
                <ArrowRight className="w-3 h-3 text-[#E6B86A] group-hover:translate-x-0.5 transition-transform" />
              </div>
            )}

            {/* Main Headline (Luminous ivory on dark cinematic video background) */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[72px] font-bold text-[#FAF7F2] tracking-tight leading-[1.05] drop-shadow-sm">
              {hero.headlineLine1 || "One community to"}<br />
              build, run, and <span className="font-serif italic text-[#E6B86A] font-normal underline decoration-[#E6B86A]/50 decoration-1 underline-offset-4">{hero.headlineHighlight || "grow"}</span><br />
              {hero.headlineLine2 || "Indian chess."}
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-[#DCD1C2] max-w-xl font-sans leading-relaxed">
              {hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  sound.playTactileClick();
                  onNavigate(hero.primaryCtaLink || "tournaments");
                }}
                className="px-7 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] active:scale-95 text-[#0E0A08] font-sans text-xs font-bold tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#C5A059]/25 cursor-button"
              >
                <span>{hero.primaryCtaText || "Find Your Board"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0E0A08]" />
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  onNavigate(hero.secondaryCtaLink || "cities");
                }}
                className="px-7 py-3.5 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 active:scale-95 text-[#FAF7F2] font-sans text-xs font-semibold tracking-wider transition-all cursor-button shadow-xs backdrop-blur-md"
              >
                {hero.secondaryCtaText || "Join City Chapter"}
              </button>
            </div>

          </div>

        </div>

        {/* 3 Pillar Feature Badges at Bottom of First Scroll */}
        <div className="relative z-20 max-w-7xl mx-auto w-full pt-4">
          <div className="pt-6 border-t border-[#C5A059]/25 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-sans">
            
            <div className="flex items-center gap-3.5 glass-dark-card p-3.5 rounded-2xl shadow-lg">
              <div className="w-9 h-9 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0 text-[#E6B86A] font-bold text-sm">
                ♜
              </div>
              <p className="font-medium text-[#FAF7F2] leading-snug">
                {hero.pillar1Text}
              </p>
            </div>

            <div className="flex items-center gap-3.5 glass-dark-card p-3.5 rounded-2xl shadow-lg">
              <div className="w-9 h-9 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0 text-[#E6B86A]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <p className="font-medium text-[#FAF7F2] leading-snug">
                {hero.pillar2Text}
              </p>
            </div>

            <div className="flex items-center gap-3.5 glass-dark-card p-3.5 rounded-2xl shadow-lg">
              <div className="w-9 h-9 rounded-full bg-[#C5A059]/20 flex items-center justify-center shrink-0 text-[#E6B86A]">
                <Users className="w-4 h-4" />
              </div>
              <p className="font-medium text-[#FAF7F2] leading-snug">
                {hero.pillar3Text}
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: UPCOMING EVENTS (Curved Golden Ribbon Begins Here)              */}
      {/* ========================================================================= */}
      <section className="relative py-20 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E3D8CB]">
        
        {/* Sweeping Golden Ribbon flowing across Events */}
        <div className="absolute top-0 right-0 w-[550px] h-[350px] pointer-events-none opacity-65 z-0">
          <svg className="w-full h-full" viewBox="0 0 550 350" fill="none">
            <defs>
              <linearGradient id="goldRibbonEvents" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#C69E58" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#8E5830" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path 
              d="M 540,10 C 380,40 240,130 140,260 C 90,320 40,340 0,350" 
              stroke="url(#goldRibbonEvents)" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />
            <path 
              d="M 550,25 C 400,60 270,150 170,275 C 120,330 70,350 20,360" 
              stroke="url(#goldRibbonEvents)" 
              strokeWidth="1.2" 
              strokeOpacity="0.5" 
            />
          </svg>
        </div>

        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold block mb-1">
              UPCOMING
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1613]">
              Events
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("events");
              }}
              className="w-8 h-8 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] flex items-center justify-center text-[#2E221B] transition-all cursor-button"
              aria-label="View previous events"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("events");
              }}
              className="flex items-center gap-2 text-xs font-sans font-semibold tracking-wider text-[#1C1613] hover:text-[#8E5830] transition-colors cursor-link"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Events Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: CCI National Swiss Open 2026 */}
          <div 
            onClick={() => {
              sound.playTactileClick();
              onNavigate("tournament-detail", "tourney-national-swiss-2026");
            }}
            className="group rounded-2xl overflow-hidden glass-card p-3.5 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-[#DDD2C2]">
                <img
                  src={resolveMediaUrl(publishedEvents[0]?.imageUrl, 'event_ev-01')}
                  alt={publishedEvents[0]?.title || "CCI National Swiss Open"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B5E52] mb-1.5 font-sans">
                <span className="px-2.5 py-0.5 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] text-[10px] font-bold tracking-wider text-[#2E221B] uppercase">
                  SWISS RD-10
                </span>
                <span>Nov 14-16, 2026</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1C1613] group-hover:text-[#8E5830] transition-colors leading-tight mb-3">
                {publishedEvents[0]?.title || "CCI National Swiss Open 2026"}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DDD2C2] text-xs font-sans">
              <span className="font-bold text-[#1C1613]">₹5,00,000 Pool</span>
              <span className="text-[#6B5E52]">9 Rounds</span>
              <div className="w-7 h-7 rounded-full bg-[#2E221B] text-[#F7F3EE] flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Central India Rapid Grand Prix */}
          <div 
            onClick={() => {
              sound.playTactileClick();
              onNavigate("tournament-detail", "tourney-central-rapid-gp");
            }}
            className="group rounded-2xl overflow-hidden glass-card p-3.5 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-[#DDD2C2]">
                <img
                  src={resolveMediaUrl(publishedEvents[1]?.imageUrl, 'event_ev-02')}
                  alt={publishedEvents[1]?.title || "Central India Rapid Grand Prix"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B5E52] mb-1.5 font-sans">
                <span className="px-2.5 py-0.5 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] text-[10px] font-bold tracking-wider text-[#2E221B] uppercase">
                  RAPID
                </span>
                <span>Dec 05-06, 2026</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1C1613] group-hover:text-[#8E5830] transition-colors leading-tight mb-3">
                {publishedEvents[1]?.title || "Central India Rapid Grand Prix"}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DDD2C2] text-xs font-sans">
              <span className="font-bold text-[#1C1613]">₹1,50,000 Pool</span>
              <span className="text-[#6B5E52]">7 Rounds</span>
              <div className="w-7 h-7 rounded-full bg-[#2E221B] text-[#F7F3EE] flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Card 3: Upper Lake Coffee & Blitz */}
          <div 
            onClick={() => {
              sound.playTactileClick();
              onNavigate("events");
            }}
            className="group rounded-2xl overflow-hidden glass-card p-3.5 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-[#DDD2C2]">
                <img
                  src={resolveMediaUrl(publishedEvents[2]?.imageUrl, 'event_ev-03')}
                  alt={publishedEvents[2]?.title || "Upper Lake Coffee & Blitz"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B5E52] mb-1.5 font-sans">
                <span className="px-2.5 py-0.5 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] text-[10px] font-bold tracking-wider text-[#2E221B] uppercase">
                  BLITZ
                </span>
                <span>Every Friday</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1C1613] group-hover:text-[#8E5830] transition-colors leading-tight mb-3">
                {publishedEvents[2]?.title || "Upper Lake Coffee & Blitz"}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DDD2C2] text-xs font-sans">
              <span className="font-bold text-[#1C1613]">Bhopal Chapter</span>
              <span className="text-[#6B5E52]">Open Friendly</span>
              <div className="w-7 h-7 rounded-full bg-[#2E221B] text-[#F7F3EE] flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: OUR CITIES                                                     */}
      {/* ========================================================================= */}
      <section className="relative py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E3D8CB]">
        
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold block mb-1">
              OUR
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1613]">
              Cities
            </h2>
          </div>

          <button
            onClick={() => {
              sound.playTactileClick();
              onNavigate("cities");
            }}
            className="flex items-center gap-2 text-xs font-sans font-semibold tracking-wider text-[#1C1613] hover:text-[#8E5830] transition-colors cursor-link"
          >
            <span>View All Cities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Cities Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Jabalpur */}
          <div
            onClick={() => {
              sound.playTactileClick();
              onNavigate("cities", "jabalpur");
            }}
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#D5C4B0] bg-[#EAE2D5] cursor-pointer shadow-xs hover:shadow-md"
          >
            <img
              src={resolveMediaUrl(publishedCities.find(c => c.slug === 'jabalpur')?.imageUrl, 'city_jabalpur')}
              alt="Jabalpur Heritage"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wide">
                Jabalpur
              </span>
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Bhopal */}
          <div
            onClick={() => {
              sound.playTactileClick();
              onNavigate("cities", "bhopal");
            }}
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#D5C4B0] bg-[#EAE2D5] cursor-pointer shadow-xs hover:shadow-md"
          >
            <img
              src={resolveMediaUrl(publishedCities.find(c => c.slug === 'bhopal')?.imageUrl, 'city_bhopal')}
              alt="Bhopal Heritage"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wide">
                Bhopal
              </span>
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Indore */}
          <div
            onClick={() => {
              sound.playTactileClick();
              onNavigate("cities", "indore");
            }}
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#D5C4B0] bg-[#EAE2D5] cursor-pointer shadow-xs hover:shadow-md"
          >
            <img
              src={resolveMediaUrl(publishedCities.find(c => c.slug === 'indore')?.imageUrl, 'city_indore')}
              alt="Indore Heritage"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wide">
                Indore
              </span>
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Delhi */}
          <div
            onClick={() => {
              sound.playTactileClick();
              onNavigate("cities", "delhi");
            }}
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#D5C4B0] bg-[#EAE2D5] cursor-pointer shadow-xs hover:shadow-md"
          >
            <img
              src={resolveMediaUrl(publishedCities.find(c => c.slug === 'delhi')?.imageUrl, 'city_delhi')}
              alt="Delhi Monument"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-wide">
                Delhi
              </span>
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#8E5830] transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: WHY CCI / More than tournaments. (Curved Golden Ribbon Accent) */}
      {/* ========================================================================= */}
      <section className="relative py-20 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E3D8CB] overflow-hidden">
        
        {/* Curving Golden Ribbon weaving behind the Knight Piece */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[450px] h-[450px] pointer-events-none opacity-50 z-0">
          <svg className="w-full h-full" viewBox="0 0 450 450" fill="none">
            <defs>
              <linearGradient id="goldRibbonWhyCCI" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#C69E58" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path 
              d="M 430,30 C 310,90 200,230 140,410" 
              stroke="url(#goldRibbonWhyCCI)" 
              strokeWidth="2.4" 
              strokeLinecap="round" 
            />
            <path 
              d="M 440,50 C 330,110 220,250 160,430" 
              stroke="url(#goldRibbonWhyCCI)" 
              strokeWidth="1.2" 
              strokeOpacity="0.5" 
            />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Why CCI Story */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold block">
              {whyCci.kicker || "WHY CCI"}
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1613] leading-tight">
              {whyCci.titleLine1 || "More than"}<br />
              {whyCci.titleLine2 || "tournaments."}
            </h2>

            <p className="text-sm sm:text-base text-[#4D4137] leading-relaxed">
              {whyCci.description}
            </p>

            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate(whyCci.ctaLink || "about");
              }}
              className="px-6 py-3 rounded-full bg-[#2E221B] hover:bg-[#1A130F] active:scale-95 text-[#F7F3EE] font-sans text-xs font-semibold tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-button"
            >
              <span>{whyCci.ctaText || "About Us"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center Column: 3 Pillars with Icons */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EAE2D5] border border-[#DDD2C2] flex items-center justify-center shrink-0 text-[#8E5830] mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-[#1C1613]">
                  {whyCci.pillar1Title || "Growing Chess Network"}
                </h4>
                <p className="text-xs text-[#594B40] mt-1 leading-relaxed">
                  {whyCci.pillar1Desc || "Chapters in multiple cities with 1000+ members and counting."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EAE2D5] border border-[#DDD2C2] flex items-center justify-center shrink-0 text-[#8E5830] mt-0.5">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-[#1C1613]">
                  {whyCci.pillar2Title || "Quality Tournaments"}
                </h4>
                <p className="text-xs text-[#594B40] mt-1 leading-relaxed">
                  {whyCci.pillar2Desc || "FIDE standard pairings, transparent ratings, and fair play."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EAE2D5] border border-[#DDD2C2] flex items-center justify-center shrink-0 text-[#8E5830] mt-0.5">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-[#1C1613]">
                  {whyCci.pillar3Title || "Community First"}
                </h4>
                <p className="text-xs text-[#594B40] mt-1 leading-relaxed">
                  {whyCci.pillar3Desc || "Café meetups, park sessions and learning opportunities for all levels."}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Golden Knight Piece */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden border border-[#D5C4B0] shadow-xl bg-[#EAE2D5]">
              <img
                src={resolveMediaUrl(whyCci.imageUrl, 'home_why_cci')}
                alt={whyCci.imageAlt || "Classical Chess Knight"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F4EFEA]/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: CHESS PAIR / Find players. Find your people. (Curved Ribbon)   */}
      {/* ========================================================================= */}
      {chessPairPromo?.showSection && (
        <section className="relative py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E3D8CB]">
        
        {/* Curving decorative gold banner border */}
        <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-10 shadow-md">
          
          {/* Subtle curved golden wave across the card */}
          <div className="absolute top-0 right-1/4 w-[380px] h-[200px] pointer-events-none opacity-45">
            <svg className="w-full h-full" viewBox="0 0 380 200" fill="none">
              <path 
                d="M 370,10 C 260,30 180,90 10,190" 
                stroke="#C69E58" 
                strokeWidth="1.8" 
                strokeLinecap="round" 
              />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Photo */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#D5C4B0] shadow-md bg-[#DDD2C2]">
                <img
                  src={resolveMediaUrl(chessPairPromo.imageUrl, 'home_chesspair')}
                  alt={chessPairPromo.imageAlt || "Chess Pair Meetup in Cafe"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Copy & CTA */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[10px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold block">
                {chessPairPromo.kicker || "CHESS PAIR"}
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1613] leading-tight">
                {chessPairPromo.titleLine1 || "Find players."}<br />
                {chessPairPromo.titleLine2 || "Find your people."}
              </h2>

              <p className="text-sm text-[#4D4137] leading-relaxed max-w-md">
                {chessPairPromo.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-3">
                <button
                  onClick={() => {
                    sound.playTactileClick();
                    onNavigate(chessPairPromo.ctaLink || "chess-pair");
                  }}
                  className="px-6 py-3 rounded-full bg-[#754422] hover:bg-[#5C3317] active:scale-95 text-[#F7F3EE] font-sans text-xs font-semibold tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-button"
                >
                  <span>{chessPairPromo.ctaText || "Go to Chess Pair"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Overlapping Avatars */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                      alt="CCI community member" 
                      className="w-8 h-8 rounded-full border-2 border-[#FAF7F2] object-cover" 
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                      alt="CCI competitive player" 
                      className="w-8 h-8 rounded-full border-2 border-[#FAF7F2] object-cover" 
                    />
                    <img 
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80" 
                      alt="CCI tournament participant" 
                      className="w-8 h-8 rounded-full border-2 border-[#FAF7F2] object-cover" 
                    />
                  </div>
                  <span className="text-xs text-[#594B40] font-sans">
                    <strong>{chessPairPromo.statsNumber || "1000+"}</strong> {chessPairPromo.statsText || "players already connected"}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: GET INVOLVED / Join the movement. (Curved Ribbon)              */}
      {/* ========================================================================= */}
      <section className="relative py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E3D8CB]">
        
        {/* Curving golden ribbon dividing Get Involved and Footer */}
        <div className="absolute top-1/3 left-1/3 w-[420px] h-[250px] pointer-events-none opacity-40 z-0">
          <svg className="w-full h-full" viewBox="0 0 420 250" fill="none">
            <path 
              d="M 10,240 C 140,180 260,90 410,20" 
              stroke="#C69E58" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Copy & CTA */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold block">
              {getInvolved.kicker || "GET INVOLVED"}
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1613] leading-tight">
              {getInvolved.title || "Join the movement."}
            </h2>

            <p className="text-sm text-[#4D4137] leading-relaxed max-w-md">
              {getInvolved.description}
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  sound.playTactileClick();
                  onNavigate(getInvolved.ctaLink || "work-with-us");
                }}
                className="px-6 py-3 rounded-full bg-[#754422] hover:bg-[#5C3317] active:scale-95 text-[#F7F3EE] font-sans text-xs font-semibold tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-button"
              >
                <span>{getInvolved.ctaText || "Hiring & Opportunities"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Rounded Photo Card */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#D5C4B0] shadow-md bg-[#DDD2C2]">
              <img
                src={resolveMediaUrl(getInvolved.imageUrl, 'home_get_involved')}
                alt={getInvolved.imageAlt || "Community Group Discussion"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: STAY UPDATED / News, events and more. (Up to Footer)            */}
      {/* ========================================================================= */}
      <section className="relative py-16 px-6 sm:px-12 max-w-7xl mx-auto border-t border-[#E3D8CB] mb-12">
        
        {/* Curving golden line flowing down toward the footer */}
        <div className="absolute -bottom-8 right-10 w-[300px] h-[150px] pointer-events-none opacity-40">
          <svg className="w-full h-full" viewBox="0 0 300 150" fill="none">
            <path 
              d="M 20,10 C 120,50 200,90 280,140" 
              stroke="#C69E58" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
            />
          </svg>
        </div>

        <div className="relative z-10 rounded-3xl p-8 sm:p-12 glass-panel flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-lg">
          
          <div className="space-y-2 max-w-md">
            <span className="text-[10px] sm:text-xs font-sans tracking-[0.25em] text-[#8E5830] uppercase font-bold block">
              {newsletter.kicker || "STAY UPDATED"}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613]">
              {newsletter.title || "News, events and more."}
            </h2>
            <p className="text-xs sm:text-sm text-[#4D4137] leading-relaxed">
              {newsletter.description}
            </p>
          </div>

          <div className="w-full md:max-w-md">
            {subscribed ? (
              <div className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#E0D7C9] text-xs font-semibold text-[#2E221B] border border-[#C5B49E]">
                <Check className="w-4 h-4 text-[#8E5830]" />
                <span>Thank you for subscribing to Chess Community India!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:relative sm:items-center">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email address for updates"
                  required
                  className="w-full pl-5 pr-5 sm:pr-32 py-3 rounded-full bg-[#FAF7F2] border border-[#D5C7B5] text-xs text-[#1C1613] placeholder-[#8C7E72] focus:outline-none focus:border-[#8E5830] transition-colors"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto sm:absolute sm:right-1.5 px-5 py-2.5 sm:py-2 rounded-full bg-[#754422] hover:bg-[#5C3317] active:scale-95 text-[11px] font-sans tracking-wider uppercase font-semibold text-[#F7F3EE] transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                >
                  <span>{newsletter.buttonText || "Subscribe"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: CONTINUOUS PARTNERS & COLLABORATORS LOGO MARQUEE               */}
      {/* ========================================================================= */}
      <PartnersMarquee onNavigate={onNavigate} />

    </div>
  );
};

export default HomeExperience;
