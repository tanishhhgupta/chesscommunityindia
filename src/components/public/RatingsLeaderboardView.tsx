import React, { useState, useMemo } from "react";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { RatingType, Player, CANONICAL_CCI_CATEGORIES } from "../../lib/domain/types";
import { RatingService } from "../../lib/domain/services/RatingService";
import { sound } from "../../lib/audio";
import { Search, Trophy, Filter, ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface RatingsLeaderboardViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const RatingsLeaderboardView: React.FC<RatingsLeaderboardViewProps> = ({ onNavigate }) => {
  const [activePool, setActivePool] = useState<RatingType>("RAPID");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const allPlayers = tournamentRepository.getAllPlayers();

  const cities = useMemo(() => {
    const list = Array.from(new Set(allPlayers.map((p) => p.city)));
    return ["ALL", ...list.sort()];
  }, [allPlayers]);

  // Ranked and sorted for the selected pool
  const rankedPlayers = useMemo(() => {
    const filtered = allPlayers.filter((p) => {
      if (categoryFilter !== "ALL" && p.currentCategory.name !== categoryFilter) return false;
      if (cityFilter !== "ALL" && p.city !== cityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          p.name.toLowerCase().includes(q) ||
          p.cciPlayerId.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.club && p.club.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });

    return filtered
      .map((p) => ({
        player: p,
        rating: RatingService.getPlayerRatingByPool(p, activePool),
      }))
      .sort((a, b) => b.rating - a.rating)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
  }, [allPlayers, activePool, categoryFilter, cityFilter, searchQuery]);

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
      
      {/* 1. Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
            NATIONAL CIRCUIT LEADERBOARD
          </span>
          <button
            onClick={() => {
              sound.playTactileClick();
              onNavigate("rating-categories");
            }}
            className="text-xs font-semibold text-[#C5A059] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>Learn About the 6 Batches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          CCI Ratings.
        </h1>

        <p className="text-base sm:text-lg text-[#9CA3A8] font-sans font-normal max-w-2xl leading-relaxed">
          Official community ranking pools maintained separately for Standard, Rapid, and Blitz time controls.
        </p>
      </section>

      {/* 2. Rating Pool Tabs (Section 35: Never mix pools!) */}
      <div className="flex items-center gap-3 border-b border-[rgba(245, 242, 235,0.06)] pb-4">
        {(["STANDARD", "RAPID", "BLITZ"] as const).map((pool) => (
          <button
            key={pool}
            onClick={() => {
              sound.playTactileClick();
              setActivePool(pool);
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-sans font-bold tracking-wider uppercase transition-all ${
              activePool === pool
                ? "bg-[#C5A059] text-[#08161A] shadow-lg"
                : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            {pool} POOL
          </button>
        ))}
      </div>

      {/* 3. Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-dark">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search competitor name, CCI ID, club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {CANONICAL_CCI_CATEGORIES.map((c) => (
              <option key={c.tierNumber} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs focus:outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === "ALL" ? "All India" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Leaderboard Table */}
      <div className="glass-dark rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E2126] text-slate-400 uppercase font-mono text-[10px] border-b border-[rgba(245, 242, 235,0.06)]">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Competitor</th>
                <th className="py-3.5 px-4 font-mono">CCI {activePool}</th>
                <th className="py-3.5 px-4">Category Batch</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4 font-mono">Games</th>
                <th className="py-3.5 px-4 font-mono">Win %</th>
                <th className="py-3.5 px-4 font-mono text-right">30D Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-slate-200">
              {rankedPlayers.map((item) => {
                const p = item.player;
                const trend = p.stats.ratingChangeLast30Days;

                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      sound.playTactileClick();
                      onNavigate("player-profile", p.id);
                    }}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                      {item.rank}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.cciPlayerId} {p.club ? `• ${p.club}` : ""}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-base text-white">
                      {item.rating}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-[rgba(245, 242, 235,0.06)]">
                        {p.currentCategory.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{p.city}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{p.stats.matchesPlayed}</td>
                    <td className="py-3.5 px-4 font-mono text-sky-400">{p.stats.winPercentage}%</td>
                    <td className="py-3.5 px-4 font-mono text-right">
                      {trend > 0 ? (
                        <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          +{trend}
                        </span>
                      ) : trend < 0 ? (
                        <span className="text-rose-400 font-bold inline-flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          {trend}
                        </span>
                      ) : (
                        <span className="text-slate-500 inline-flex items-center gap-0.5">
                          <Minus className="w-3 h-3" />
                          0
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
