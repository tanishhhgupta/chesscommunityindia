import React, { useState, useMemo } from "react";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { Player } from "../../lib/domain/types";
import { CategoryService } from "../../lib/domain/services/CategoryService";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { sound } from "../../lib/audio";
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Swords, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  UserCheck
} from "lucide-react";

interface PlayerPortalViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PlayerPortalView: React.FC<PlayerPortalViewProps> = ({ onNavigate }) => {
  const allPlayers = tournamentRepository.getAllPlayers();
  const [activePlayerId, setActivePlayerId] = useState<string>(() => allPlayers[0]?.id || "p-01");

  const player = useMemo(() => {
    return allPlayers.find((p) => p.id === activePlayerId) || allPlayers[0];
  }, [allPlayers, activePlayerId]);

  const ratingHistories = tournamentRepository.getPlayerRatingHistory(player.id);
  const tournaments = tournamentRepository.getAllTournaments();

  // Next category progression
  const tierProgress = useMemo(() => {
    return CategoryService.getPointsToNextTier(player.cciStandardRating);
  }, [player.cciStandardRating]);

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-10">
      
      {/* Top Persona Switcher Bar for testing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-dark">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-sans">
            Logged in as Competitor: <strong className="text-white">{player.name}</strong> ({player.cciPlayerId})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Switch Player:</span>
          <select
            value={activePlayerId}
            onChange={(e) => {
              sound.playTactileClick();
              setActivePlayerId(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C5A059]"
          >
            {allPlayers.slice(0, 20).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.currentCategory.name} - {p.cciStandardRating} Elo)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PLAYER HERO (Editorial & Clean - Section 36)                           */}
      {/* ========================================================================= */}
      <section className="glass-dark p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#C5A059]/60 shadow-[0_0_24px_rgba(199,164,91,0.25)] shrink-0 bg-black/60">
              <img
                src={resolveMediaUrl(player.photo)}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30">
                  {player.cciPlayerId}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-[rgba(245, 242, 235,0.06)]">
                  {player.currentCategory.name}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
                {player.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-sans">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  {player.city}, {player.state}
                </span>
                <span>&bull;</span>
                <span className="font-mono text-sky-400">FIDE Rating: {player.fideStandardRating || "Unrated"}</span>
              </div>
            </div>
          </div>

          {/* Rating Cards */}
          <div className="flex items-center gap-4 font-mono">
            <div className="p-4 rounded-2xl bg-black/40 border border-[#C5A059]/30 text-center min-w-[120px]">
              <span className="text-[10px] text-[#C5A059] block font-bold">CCI RATING</span>
              <span className="text-3xl font-bold text-white block mt-0.5">{player.cciStandardRating}</span>
              <span className="text-[10px] text-slate-400 block">{player.currentCategory.name}</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.06)] text-center min-w-[120px]">
              <span className="text-[10px] text-sky-400 block font-bold">FIDE ELO</span>
              <span className="text-3xl font-bold text-slate-200 block mt-0.5">{player.fideStandardRating || "—"}</span>
              <span className="text-[10px] text-slate-500 block">International</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW                                                         */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-[#091C20] border border-[rgba(245, 242, 235,0.06)] text-center space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">GAMES PLAYED</span>
          <span className="text-2xl font-display font-bold text-white block">{player.stats.matchesPlayed}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091C20] border border-[rgba(245, 242, 235,0.06)] text-center space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block">VICTORIES</span>
          <span className="text-2xl font-display font-bold text-emerald-400 block">{player.stats.wins}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091C20] border border-[rgba(245, 242, 235,0.06)] text-center space-y-1">
          <span className="text-[10px] font-mono text-amber-400 uppercase block">DRAWS</span>
          <span className="text-2xl font-display font-bold text-amber-400 block">{player.stats.draws}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091C20] border border-[rgba(245, 242, 235,0.06)] text-center space-y-1">
          <span className="text-[10px] font-mono text-rose-400 uppercase block">LOSSES</span>
          <span className="text-2xl font-display font-bold text-rose-400 block">{player.stats.losses}</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091C20] border border-[rgba(245, 242, 235,0.06)] text-center space-y-1">
          <span className="text-[10px] font-mono text-sky-400 uppercase block">WIN RATE</span>
          <span className="text-2xl font-display font-bold text-sky-400 block">{player.stats.winPercentage}%</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091C20] border border-[rgba(245, 242, 235,0.06)] text-center space-y-1">
          <span className="text-[10px] font-mono text-[#C5A059] uppercase block">CAREER PEAK</span>
          <span className="text-2xl font-display font-bold text-[#C5A059] block">{player.stats.highestCciRating}</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MY TOURNAMENTS & RATING HISTORY TIMELINE                               */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active & Past Tournaments */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-[rgba(245, 242, 235,0.06)] bg-[#08161A]/90 space-y-6">
          <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-4">
            <h3 className="text-lg font-display font-bold text-white">Registered Tournaments</h3>
            <button
              onClick={() => onNavigate("tournaments")}
              className="text-xs text-[#C5A059] font-semibold hover:text-white transition-colors"
            >
              Browse Tournaments &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {tournaments.slice(0, 3).map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigate("tournament-detail", t.id)}
                className="p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.04)] hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {t.status}
                    </span>
                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.venue}, {t.city} &bull; {t.format} &bull; {t.baseTime}+{t.increment}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </div>
            ))}
          </div>
        </div>

        {/* Rating Timeline */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-[rgba(245, 242, 235,0.06)] bg-[#08161A]/90 space-y-6">
          <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-4">
            <h3 className="text-lg font-display font-bold text-white">Official Rating Updates</h3>
          </div>

          {ratingHistories.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No rating changes recorded yet. Complete official rounds to record permanent rating adjustments.
            </p>
          ) : (
            <div className="space-y-3">
              {ratingHistories.map((rh) => (
                <div key={rh.id} className="p-3.5 rounded-xl bg-black/40 border border-[rgba(245, 242, 235,0.04)] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rh.tournamentName}</span>
                    <span className={`font-mono font-bold ${rh.ratingChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {rh.ratingChange >= 0 ? `+${rh.ratingChange}` : rh.ratingChange}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>{rh.ratingBefore} &rarr; {rh.ratingAfter}</span>
                    <span className="text-[#C5A059]">{rh.categoryAfter}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

    </div>
  );
};
