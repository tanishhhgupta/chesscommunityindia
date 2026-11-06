import React from "react";
import { CANONICAL_CCI_CATEGORIES } from "../../lib/domain/types";
import { sound } from "../../lib/audio";
import { ShieldCheck, Target, Compass, Zap, Award, Crown, ArrowRight } from "lucide-react";

interface RatingCategoriesViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const RatingCategoriesView: React.FC<RatingCategoriesViewProps> = ({ onNavigate }) => {
  const getIcon = (badgeIcon: string) => {
    switch (badgeIcon) {
      case "ShieldAlert":
        return <ShieldCheck className="w-5 h-5 text-rose-400" />;
      case "Target":
        return <Target className="w-5 h-5 text-amber-300" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-cyan-300" />;
      case "Zap":
        return <Zap className="w-5 h-5 text-emerald-300" />;
      case "Award":
        return <Award className="w-5 h-5 text-indigo-300" />;
      case "Crown":
        return <Crown className="w-5 h-5 text-[#C5A059]" />;
      default:
        return <Award className="w-5 h-5 text-[#C5A059]" />;
    }
  };

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER (Exact match to reference image specification)              */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] font-sans font-bold tracking-[0.25em] text-[#C5A059] uppercase block">
            CHESS MANAGER RATING SYSTEM
          </span>
          <span className="text-xs sm:text-sm font-sans font-medium text-[#9CA3A8]/90 tracking-wide">
            0 to 3000 Elo &bull; Official Community Batches
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          6 Progressive Rating Categories
        </h1>

        <p className="text-base sm:text-lg text-[#9CA3A8] font-sans font-normal max-w-3xl leading-relaxed pt-2">
          Sanctioned offline cafe meetups and FIDE Swiss opens dynamically adjust your verified rating category across 6 official Chess Community India performance tiers.
        </p>
      </section>

      {/* ========================================================================= */}
      {/* 2. SIX CANONICAL CATEGORY CARDS (Desktop: 3 cols x 2 rows, Tablet: 2, Mobile: 1) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CANONICAL_CCI_CATEGORIES.map((cat) => {
          const batchString = `BATCH ${String(cat.tierNumber).padStart(2, "0")}`;
          const eloRangeString = cat.tierNumber === 6 ? "2401 – 3000+ Elo" : `${cat.minElo} – ${cat.maxElo} Elo`;

          return (
            <div
              key={cat.tierNumber}
              className="group relative rounded-3xl p-8 bg-[#091C20]/80 border border-[rgba(245, 242, 235,0.06)] hover:border-[#C5A059]/50 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xl hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
              {/* Subtle top atmospheric corner glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none group-hover:bg-[#C5A059]/10 transition-colors" />

              <div className="space-y-4 relative z-10">
                {/* Batch Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#C5A059] uppercase">
                    {batchString}
                  </span>
                  <div className="p-2 rounded-xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                    {getIcon(cat.badgeIcon)}
                  </div>
                </div>

                {/* Category Title */}
                <h3 className="text-2xl font-display font-bold text-white group-hover:text-[#F5F2EB] tracking-tight">
                  {cat.name}
                </h3>

                {/* Elo Range */}
                <div className="text-sm font-sans font-semibold text-[#9CA3A8] group-hover:text-white transition-colors">
                  {eloRangeString}
                </div>

                {/* Exact Canonical Description */}
                <p className="text-xs sm:text-sm text-[#9CA3A8] font-sans font-light leading-relaxed pt-1">
                  {cat.description}
                </p>
              </div>

              {/* Bottom Card Footer with Direct Player Filter Link */}
              <div className="pt-4 border-t border-[rgba(245, 242, 235,0.06)] flex items-center justify-between text-xs font-sans text-slate-400">
                <button
                  onClick={() => {
                    sound.playTactileClick();
                    onNavigate("players", cat.name);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] hover:text-white font-semibold transition-colors cursor-button"
                >
                  <span>Explore Competitors</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="font-mono text-[10px] text-slate-500">CCI TIER {cat.tierNumber}/6</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC CATEGORY CALCULATOR (Interactive preview)                      */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0E2126]/90 via-[#0E2126]/90 to-[#0E2126]/90 border border-[rgba(245, 242, 235,0.06)] backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase block">
              REAL-TIME CLASSIFICATION ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Dynamic Rating Evaluation
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA3A8] max-w-xl leading-relaxed">
              Every match result entered dynamically computes expected scores ($E_A$) and $K$-factor adjustments to promote or recalibrate your official community tier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("ratings");
              }}
              className="accent-gold-btn px-6 py-3 rounded-full text-xs font-sans font-semibold tracking-wider uppercase cursor-button shadow-lg"
            >
              View Official Leaderboards
            </button>
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("tournaments");
              }}
              className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-[rgba(245, 242, 235,0.06)] text-xs font-sans font-semibold tracking-wider uppercase transition-colors"
            >
              Browse Tournaments
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
