import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { ArrowRight } from "lucide-react";
import { contentStore, AboutPageContent, resolveMediaUrl } from "../../lib/storage/contentStore";

interface AboutViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const [about, setAbout] = useState<AboutPageContent>(() => contentStore.getAboutContent());

  useEffect(() => {
    const sync = () => setAbout(contentStore.getAboutContent());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);
  return (
    <div className="relative w-full min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-hidden font-sans selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* ========================================================================= */}
      {/* TOP-RIGHT ARCHITECTURAL BACKGROUND GRAPHIC (Carved Chess King in Sunlight) */}
      {/* ========================================================================= */}
      <div className="absolute top-0 right-0 w-full lg:w-[52%] h-[480px] sm:h-[580px] pointer-events-none select-none z-0 overflow-hidden">
        <img
          src={resolveMediaUrl(about.heroImageUrl, 'about_hero')}
          alt="Classical Chess King"
          className="w-full h-full object-cover object-center opacity-85 scale-105"
        />

        {/* Soft Radial & Linear Gradients Blending into Warm Ivory Canvas */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4EFEA] via-[#F4EFEA]/80 sm:via-[#F4EFEA]/45 to-transparent to-55%" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F4EFEA] via-[#F4EFEA]/65 to-transparent to-75%" />
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#F4EFEA] via-[#F4EFEA]/70 to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* SWEEPING GOLDEN RIBBON CURVES                                             */}
      {/* ========================================================================= */}
      <div className="absolute top-0 inset-x-0 w-full h-full pointer-events-none select-none z-0 opacity-70">
        <svg className="w-full h-full" viewBox="0 0 1440 1100" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="aboutGoldLine1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C69E58" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="aboutGoldLine2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E6C075" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {/* Upper swooping bezier curve looping behind hero headline */}
          <path 
            d="M -40,120 C 240,60 520,70 820,160 C 1120,250 1280,170 1480,90" 
            stroke="url(#aboutGoldLine1)" 
            strokeWidth="1.5" 
          />
          {/* Middle/Bottom swooping curve wrapping around Our Story & Journey Banner */}
          <path 
            d="M -60,680 C 200,600 480,720 780,670 C 1080,620 1300,740 1500,690" 
            stroke="url(#aboutGoldLine2)" 
            strokeWidth="1.3" 
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT CONTAINER                                                    */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16 sm:space-y-20">
        
        {/* 1. HERO STATEMENT: "More Than a Game." */}
        <section className="space-y-4 max-w-2xl">
          {/* Kicker with warm bronze dash */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
              ABOUT
            </span>
            <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
          </div>

          {/* Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-[76px] font-bold text-[#1C1613] tracking-tight leading-[1.04]">
            More Than<br />
            a Game.
          </h1>

          {/* Subtitle */}
          <div className="space-y-2 text-sm sm:text-base text-[#5C534B] font-sans leading-relaxed pt-2 max-w-xl">
            <p className="font-medium text-[#1C1613]">
              Chess brings people together.
            </p>
            <p>
              Chess Community India is building communities where people can play, learn, compete and grow together.
            </p>
          </div>
        </section>

        {/* 2. OUR STORY: "Jabalpur, 2024" */}
        <section className="border-t border-[#DDD4C7] pt-12 sm:pt-16">
          <div className="grid md:grid-cols-12 gap-8 sm:gap-12 items-start">
            
            {/* Left Column: Heading */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
                  OUR STORY
                </span>
                <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
              </div>

              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#1C1613] tracking-tight">
                Jabalpur, 2024
              </h2>
            </div>

            {/* Right Column: Narrative with subtle divider border */}
            <div className="md:col-span-7 md:border-l md:border-[#DDD4C7] md:pl-10 space-y-5 text-sm sm:text-base text-[#5C534B] font-sans leading-relaxed">
              <p>
                Founded by <strong className="text-[#1C1613] font-semibold">Tanish Gupta</strong> alongside a handful of passionate collegiate players, the initial gathering began with wooden boards and players sharing stories over chai on stone park benches.
              </p>
              <p>
                Within months, the gatherings expanded from cafes into auditoriums at IIITDM Jabalpur and Jabalpur Engineering College, before growing organically to Bhopal, Indore, Delhi NCR, and across India.
              </p>
            </div>

          </div>
        </section>

        {/* 3. PRINCIPLES: 01, 02, 03 Grid */}
        <section className="border-t border-[#DDD4C7] pt-12 sm:pt-16 space-y-8">
          {/* Principles Kicker */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
              PRINCIPLES
            </span>
            <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
          </div>

          {/* 3-Column Pillars */}
          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            
            {/* Principle 01 */}
            <div className="space-y-3">
              <span className="font-serif text-3xl sm:text-4xl text-[#B88E3E] font-medium block">
                01
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1C1613] tracking-tight">
                Democratic Access
              </h3>
              <p className="text-xs sm:text-sm text-[#5C534B] leading-relaxed font-sans">
                Every person is entitled to play and learn. We supply tournament sets to community hubs and public parks across the country.
              </p>
            </div>

            {/* Principle 02 */}
            <div className="space-y-3 md:border-l md:border-[#DDD4C7] md:pl-8">
              <span className="font-serif text-3xl sm:text-4xl text-[#B88E3E] font-medium block">
                02
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1C1613] tracking-tight">
                Swiss Precision
              </h3>
              <p className="text-xs sm:text-sm text-[#5C534B] leading-relaxed font-sans">
                We never compromise on tournament integrity. Every round follows strict Swiss pairing standards and verified tiebreaks.
              </p>
            </div>

            {/* Principle 03 */}
            <div className="space-y-3 md:border-l md:border-[#DDD4C7] md:pl-8">
              <span className="font-serif text-3xl sm:text-4xl text-[#B88E3E] font-medium block">
                03
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1C1613] tracking-tight">
                Community First
              </h3>
              <p className="text-xs sm:text-sm text-[#5C534B] leading-relaxed font-sans">
                Before medals, ratings, or prize funds, we celebrate the human bond across the board. Respect for every opponent is paramount.
              </p>
            </div>

          </div>
        </section>

        {/* 4. CALL TO ACTION BANNER: "Be part of the journey." */}
        <section className="rounded-3xl p-8 sm:p-10 glass-panel shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] tracking-tight">
              Be part of the journey.
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6158] font-sans pt-1">
              Find your local chapter or register for upcoming events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("cities");
              }}
              className="px-6 py-3 rounded-full glass-pill hover:bg-white/80 active:scale-95 text-[#1C1613] font-sans text-xs font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer w-full sm:w-auto"
            >
              <span>Explore Cities</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1C1613]" />
            </button>

            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("work-with-us");
              }}
              className="px-7 py-3 rounded-full bg-[#241711] hover:bg-[#38261E] active:scale-95 text-[#FAF7F2] font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer w-full sm:w-auto"
            >
              <span>Join the Community</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F2]" />
            </button>
          </div>
        </section>

      </div>

    </div>
  );
};

export default AboutView;
