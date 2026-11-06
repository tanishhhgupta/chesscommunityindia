import React, { useState } from "react";
import { 
  Award, 
  Sparkles, 
  ShieldAlert, 
  Crown, 
  Compass, 
  ArrowRight, 
  Target,
  Zap
} from "lucide-react";
import { CCI_RATING_CATEGORIES, getTierFromRating } from "../../lib/chess/eloEngine";

export const TierExplorer: React.FC = () => {
  const [testRating, setTestRating] = useState<number>(1450);
  const currentTier = getTierFromRating(testRating);
  const nextTier = CCI_RATING_CATEGORIES.find((t) => t.tierNumber === currentTier.tierNumber + 1);
  const eloToNext = nextTier ? nextTier.minElo - testRating : 0;

  const renderIcon = (tierNum: number) => {
    switch (tierNum) {
      case 1:
        return <ShieldAlert className="w-8 h-8 text-rose-400" />;
      case 2:
        return <Target className="w-8 h-8 text-amber-400" />;
      case 3:
        return <Compass className="w-8 h-8 text-cyan-400" />;
      case 4:
        return <Zap className="w-8 h-8 text-emerald-400" />;
      case 5:
        return <Award className="w-8 h-8 text-indigo-400" />;
      case 6:
      default:
        return <Crown className="w-8 h-8 text-[#C5A059]" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="tiers">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 mb-3 font-sans">
          <Sparkles className="w-4 h-4" />
          Chess Manager Rating System
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
          From <span className="text-rose-400">Blunder Master</span> to <span className="text-[#C5A059]">Grand Sovereign</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-400 mt-3 font-sans">
          Chess Community India simplifies 0 to 3000 Elo into 6 performance categories. Earn your batch tag at weekly cafe arenas and sanctioned Swiss tournaments.
        </p>
      </div>

      {/* Interactive Elo Rank Finder Widget */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-12 border border-[#C5A059]/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 w-full lg:w-1/2">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#C5A059]" />
              Check Your CCI Rating Category
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-sans">
              Drag the slider to preview where your rating lands across the 6 official Chess Community India batches.
            </p>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-sans">
                <span>0 Elo (Blunder Master)</span>
                <span className="text-[#C5A059] font-bold text-base">{testRating} Elo</span>
                <span>3000+ (Grand Sovereign)</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="25"
                value={testRating}
                onChange={(e) => setTestRating(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              />
            </div>
          </div>

          {/* Current Tier Output Card */}
          <div className="w-full lg:w-1/2 glass-card rounded-2xl p-6 border border-[rgba(245, 242, 235,0.06)] flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider font-sans">
                  Batch {currentTier.tierNumber} of 6 &bull; {currentTier.minElo} - {currentTier.maxElo} Elo
                </div>
                <h4 className="text-2xl font-display font-bold text-white mt-1 flex items-center gap-2">
                  {currentTier.name}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm font-sans">
                  {currentTier.description}
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${currentTier.badgeColor} border ${currentTier.borderColor} shrink-0`}>
                {renderIcon(currentTier.tierNumber)}
              </div>
            </div>

            {/* Next Tier Progression */}
            {nextTier ? (
              <div className="mt-5 pt-4 border-t border-[rgba(245, 242, 235,0.06)] flex items-center justify-between text-xs font-sans">
                <span className="text-slate-400">
                  Next Batch: <strong className="text-white font-medium">{nextTier.name}</strong> ({nextTier.minElo} Elo)
                </span>
                <span className="text-[#C5A059] font-semibold flex items-center gap-1">
                  +{eloToNext} Elo needed <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t border-[rgba(245, 242, 235,0.06)] text-xs text-[#C5A059] font-bold font-sans">
                Maximum Category Reached &bull; Grand Sovereign of the 64 Squares
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6 Category Batches Showcase */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold text-white mb-4">6 Rating Categories (0 – 3000 Elo)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CCI_RATING_CATEGORIES.map((tier) => (
            <div
              key={tier.tierNumber}
              className={`p-5 rounded-2xl border transition-all ${
                tier.tierNumber === currentTier.tierNumber
                  ? "bg-[#C5A059]/15 border-[#C5A059] shadow-lg shadow-[#C5A059]/10"
                  : "bg-slate-900/60 border-[rgba(245, 242, 235,0.04)] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-slate-500 font-semibold">BATCH 0{tier.tierNumber}</span>
                <span className="font-sans font-semibold text-[#C5A059]">{tier.minElo} – {tier.maxElo} Elo</span>
              </div>
              <div className="font-display font-bold text-lg text-white">
                {tier.name}
              </div>
              <div className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                {tier.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
