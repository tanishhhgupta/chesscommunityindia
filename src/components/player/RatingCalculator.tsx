import React, { useState } from "react";
import { Calculator, ArrowRight, Zap, Trophy, ShieldCheck, Sparkles } from "lucide-react";
import { calculateRatingAdjustment, getTierFromRating } from "../../lib/chess/eloEngine";

export const RatingCalculator: React.FC = () => {
  const [myRating, setMyRating] = useState<number>(1200);
  const [oppRating, setOppRating] = useState<number>(1350);
  const [matchesPlayed, setMatchesPlayed] = useState<number>(25);

  const winAdj = calculateRatingAdjustment(myRating, oppRating, 1, matchesPlayed);
  const drawAdj = calculateRatingAdjustment(myRating, oppRating, 0.5, matchesPlayed);
  const lossAdj = calculateRatingAdjustment(myRating, oppRating, 0, matchesPlayed);

  const currentTier = getTierFromRating(myRating);
  const winTier = getTierFromRating(winAdj.newRating);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="calculator">
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-[rgba(245, 242, 235,0.06)] shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[rgba(245, 242, 235,0.06)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-2">
              <Calculator className="w-3.5 h-3.5" />
              Live Elo Mathematics Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Simulate Match Rating Shifts
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Calculate official CCI Elo adjustments based on standard mathematical expected scores and provisional K-factors.
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-[rgba(245, 242, 235,0.06)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Active K-Factor: <strong className="text-white">{matchesPlayed < 20 ? "40 (Provisional)" : myRating >= 2400 ? "10 (Master)" : "20 (Standard)"}</strong>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid md:grid-cols-3 gap-6 my-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Your Current Elo
            </label>
            <input
              type="number"
              value={myRating}
              onChange={(e) => setMyRating(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[rgba(245, 242, 235,0.06)] text-white font-mono text-lg font-bold focus:outline-none focus:border-chess-gold transition-colors"
            />
            <div className="text-xs text-slate-500">
              Current Rank: <span className="text-chess-gold font-medium">{currentTier.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Opponent's Elo
            </label>
            <input
              type="number"
              value={oppRating}
              onChange={(e) => setOppRating(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[rgba(245, 242, 235,0.06)] text-white font-mono text-lg font-bold focus:outline-none focus:border-chess-gold transition-colors"
            />
            <div className="text-xs text-slate-500">
              Win Probability: <span className="text-blue-400 font-mono font-medium">{(winAdj.expectedScore * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Career Games Played
            </label>
            <input
              type="number"
              value={matchesPlayed}
              onChange={(e) => setMatchesPlayed(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-[rgba(245, 242, 235,0.06)] text-white font-mono text-lg font-bold focus:outline-none focus:border-chess-gold transition-colors"
            />
            <div className="text-xs text-slate-500">
              {matchesPlayed < 20 ? "Under 20: High sensitivity K=40" : "Established member"}
            </div>
          </div>
        </div>

        {/* Projected Outcomes Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Win Outcome */}
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Victory (1 - 0)</span>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded-full">
                +{winAdj.ratingDiff} pts
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white font-mono">
                {winAdj.newRating}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                Tier: <span className="text-slate-200 font-medium">{winTier.name}</span>
              </div>
            </div>
          </div>

          {/* Draw Outcome */}
          <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Draw (½ - ½)</span>
              <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full">
                {drawAdj.ratingDiff >= 0 ? `+${drawAdj.ratingDiff}` : drawAdj.ratingDiff} pts
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white font-mono">
                {drawAdj.newRating}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Balanced tactical outcome
              </div>
            </div>
          </div>

          {/* Loss Outcome */}
          <div className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Defeat (0 - 1)</span>
              <span className="text-xs font-mono font-bold text-red-300 bg-red-900/50 px-2 py-0.5 rounded-full">
                {lossAdj.ratingDiff} pts
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white font-mono">
                {lossAdj.newRating}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                A learning step towards mastery
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
