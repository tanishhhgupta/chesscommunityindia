import React from "react";
import { sound } from "../../lib/audio";
import { GraduationCap, Award, CheckCircle2, ArrowRight } from "lucide-react";

interface LearnViewProps {
  onNavigate: (view: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({ onNavigate }) => {
  const masterclasses = [
    {
      title: "Mastering FIDE Dutch Swiss & Arbiter Protocols",
      mentor: "Vikramaditya Rao (FIDE National Arbiter)",
      tier: "Arbiter Certification",
      duration: "6 Weeks &bull; 18 Sessions",
      summary: "Swiss pairing mathematics, color balancing rules, repeat-pairing avoidance, and live ChessManager digital pairings desk deployment.",
    },
    {
      title: "Dynamic Sicilian & King's Indian Masterclass",
      mentor: "GM Pravin Thipsay & Senior Master Faculty",
      tier: "1800+ Elo Masterclass",
      duration: "8 Weeks &bull; 24 Sessions",
      summary: "Combative pawn structures, dynamic king-safety imbalances, deep calculation shortcuts, and grandmaster prophylaxis.",
    },
    {
      title: "Positional Strategy & Middle-Game Conversion",
      mentor: "Ananya Deshpande (WIM)",
      tier: "1200-1800 Elo Intermediate",
      duration: "4 Weeks &bull; 12 Sessions",
      summary: "Outpost exploitation, isolated queen pawn plans, rook endgame technique (Lucena & Philidor), and active defense.",
    },
  ];

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-24">
      
      {/* 1. Header */}
      <section className="space-y-4 apple-scroll-reveal">
        <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
          Academy
        </span>
        <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Learn.
        </h1>
        <p className="text-base sm:text-lg text-[#9CA3A8] font-normal max-w-xl font-sans leading-relaxed">
          Coaching, workshops and learning resources designed to help players improve.
        </p>
      </section>

      {/* 2. Masterclass Modules */}
      <section className="space-y-8 apple-scroll-reveal">
        <div className="divide-y divide-white/[0.05]">
          {masterclasses.map((m, idx) => (
            <div key={idx} className="py-10 space-y-4 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#C5A059] uppercase tracking-wider">
                  {m.tier}
                </span>
                <span className="text-xs font-mono text-[#9CA3A8]">{m.duration}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white group-hover:text-[#C5A059] transition-colors">
                {m.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#9CA3A8] font-light leading-relaxed max-w-2xl">
                {m.summary}
              </p>

              <div className="pt-2 text-xs font-mono text-[#F5F2EB]">
                Faculty: <strong className="text-white">{m.mentor}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Subsidized Grant Philosophy */}
      <section className="border-t border-[rgba(245, 242, 235,0.05)] pt-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h3 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white">
            Subsidized Community Seats.
          </h3>
          <p className="text-xs sm:text-sm text-[#9CA3A8] font-light leading-relaxed">
            Financial hardship should never extinguish chess potential. Through our academy grant fund, passionate junior players and student arbiters receive full tuition waivers.
          </p>
        </div>

        <div className="p-6 rounded-2xl quiet-card text-center space-y-4">
          <GraduationCap className="w-8 h-8 text-[#C5A059] mx-auto" />
          <h4 className="text-lg font-serif-editorial font-bold text-white">Apply for Fellowship</h4>
          <p className="text-xs text-[#9CA3A8] font-light">
            Tell us about your chess goals and local community work.
          </p>
          <button
            onClick={() => onNavigate("join")}
            className="accent-gold-btn px-6 py-2.5 rounded-full text-xs font-mono font-bold text-black"
          >
            Apply for Fellowship
          </button>
        </div>
      </section>

    </div>
  );
};
