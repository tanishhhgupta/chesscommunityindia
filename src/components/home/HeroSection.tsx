import React from "react";
import { Swords, Trophy, Sparkles, ArrowRight, ShieldCheck, Flame, Compass } from "lucide-react";
import { InteractiveChessScene } from "../3d/InteractiveChessScene";

interface HeroSectionProps {
  onOpenAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth }) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text / Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-chess-gold/30 text-xs font-semibold text-chess-gold shadow-lg shadow-chess-gold/5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-chess-gold animate-pulse" />
              <span>Official Platform for Chess Community India</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Master the Squares. <br />
              Rise from <span className="text-red-400">Blundermaster</span> to <span className="gold-gradient-text">Chaturanga Deva</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              India&apos;s home-grown competitive chess system. Experience <strong>ChessManager-grade Swiss pairings</strong>, real-time arbiter scoreboards, and our iconic <strong>45-tier live rating continuum</strong> from 0 to 3000 Elo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#tournaments"
                className="w-full sm:w-auto gold-gradient-btn px-7 py-3.5 rounded-2xl text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl"
              >
                <Swords className="w-5 h-5" />
                Live Tournament Board
              </a>

              <a
                href="#tiers"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center gap-2 transition-colors"
              >
                <Trophy className="w-5 h-5 text-chess-gold" />
                Explore 45 Tiers
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-[rgba(245, 242, 235,0.06)] grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <div className="text-2xl font-black text-white font-mono">45</div>
                <div className="text-xs text-slate-400">Micro-Tier Ranks</div>
              </div>
              <div>
                <div className="text-2xl font-black text-chess-gold font-mono">FIDE</div>
                <div className="text-xs text-slate-400">Dutch Swiss Engine</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-400 font-mono">Realtime</div>
                <div className="text-xs text-slate-400">Arbiter Control</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive 3D Chess Scene */}
          <div className="lg:col-span-5 flex justify-center">
            <InteractiveChessScene />
          </div>
        </div>
      </div>
    </div>
  );
};
