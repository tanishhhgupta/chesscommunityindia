import React from "react";
import { TournamentManager } from "../tournament/TournamentManager";
import { Sparkles, Shield, Trophy } from "lucide-react";

interface TournamentDeskViewProps {
  onNavigate: (view: string) => void;
}

export const TournamentDeskView: React.FC<TournamentDeskViewProps> = ({ onNavigate }) => {
  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
      
      {/* 1. Header Section adhering to Editorial Typography System */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
            ChessManager Desk
          </span>
          <span className="text-white/20">&bull;</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-sans font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Official FIDE Rules Engine
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#C5A059] text-[11px] font-sans font-semibold">
            Default 1000 Elo Roster
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Tournament Desk.
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-base sm:text-lg text-[#9CA3A8] font-normal max-w-2xl font-sans leading-relaxed">
            Inbuilt tournament software modeled after ChessManager. Generate Swiss pairings, enter live match results, adjust FIDE ratings dynamically, and manage competitors with auto-assigned 1000 Elo base ratings and category batches.
          </p>

          <button
            onClick={() => onNavigate("admin")}
            className="px-6 py-3 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shadow-lg shadow-amber-500/10 cursor-button transition-all"
          >
            <span>Arbiter Backend &amp; Create Tournament</span>
            <span className="text-[10px] font-mono bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">ADMIN</span>
          </button>
        </div>
      </section>

      {/* 2. Embedded Production ChessManager Application */}
      <section className="w-full">
        <TournamentManager onNavigate={onNavigate} />
      </section>

    </div>
  );
};
