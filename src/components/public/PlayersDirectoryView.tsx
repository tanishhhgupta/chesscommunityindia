import React, { useState, useMemo } from "react";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { Player } from "../../lib/domain/types";
import { CANONICAL_CCI_CATEGORIES } from "../../lib/domain/types";
import { sound } from "../../lib/audio";
import { Search, Trophy, MapPin, ArrowRight, ShieldCheck, Award } from "lucide-react";

interface PlayersDirectoryViewProps {
  initialCategory?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const PlayersDirectoryView: React.FC<PlayersDirectoryViewProps> = ({
  initialCategory,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");

  const players = tournamentRepository.getAllPlayers();

  const cities = useMemo(() => {
    const list = Array.from(new Set(players.map((p) => p.city)));
    return ["ALL", ...list.sort()];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (selectedCategory !== "ALL" && p.currentCategory.name !== selectedCategory) return false;
      if (selectedCity !== "ALL" && p.city !== selectedCity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          p.name.toLowerCase().includes(q) ||
          p.cciPlayerId.toLowerCase().includes(q) ||
          (p.fideId && p.fideId.includes(q)) ||
          p.city.toLowerCase().includes(q) ||
          (p.club && p.club.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [players, selectedCategory, selectedCity, searchQuery]);

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      
      {/* 1. Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
            PLAYER REGISTRY &bull; CHESS COMMUNITY INDIA
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {players.length} Verified Permanent Competitors
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Competitors.
        </h1>

        <p className="text-base sm:text-lg text-[#9CA3A8] font-sans font-normal max-w-2xl leading-relaxed">
          Permanent Chess Community India player profiles connecting FIDE ratings, verified CCI rating categories, tournament appearances, and match histories.
        </p>
      </section>

      {/* 2. Filter Bar */}
      <section className="space-y-4 p-4 sm:p-6 rounded-3xl glass-dark">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              sound.playTactileClick();
              setSelectedCategory("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-[#C5A059] text-[#08161A] shadow-md font-bold"
                : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            All Categories ({players.length})
          </button>

          {CANONICAL_CCI_CATEGORIES.map((c) => {
            const count = players.filter((p) => p.currentCategory.name === c.name).length;
            const isSelected = selectedCategory === c.name;

            return (
              <button
                key={c.tierNumber}
                onClick={() => {
                  sound.playTactileClick();
                  setSelectedCategory(c.name);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#C5A059] text-[#08161A] shadow-md font-bold"
                    : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & City Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[rgba(245, 242, 235,0.06)]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, CCI ID (CCI-000001), FIDE ID, club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-sans">Filter City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs focus:outline-none"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Cities" : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 3. Players Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlayers.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              sound.playTactileClick();
              onNavigate("player-profile", p.id);
            }}
            className="group cursor-pointer rounded-3xl p-6 glass-dark-card transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#C5A059]">
                  {p.cciPlayerId}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-slate-300">
                  {p.currentCategory.name}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-display font-bold text-white group-hover:text-[#C5A059] transition-colors leading-snug">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C5A059]" />
                  <span>{p.city}, {p.state}</span>
                </p>
              </div>

              {/* Rating metrics row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(245, 242, 235,0.06)] text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                  <span className="text-[10px] text-slate-500 block">CCI RATING</span>
                  <span className="text-white font-bold text-sm">{p.cciStandardRating}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                  <span className="text-[10px] text-slate-500 block">FIDE RATING</span>
                  <span className="text-sky-400 font-bold text-sm">{p.fideStandardRating || "Unrated"}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(245, 242, 235,0.06)] flex items-center justify-between text-xs text-slate-400">
              <span>{p.stats.matchesPlayed} Matches &bull; {p.stats.winPercentage}% Win</span>
              <span className="inline-flex items-center gap-1 text-[#C5A059] font-semibold group-hover:translate-x-1 transition-transform">
                <span>Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </section>

    </div>
  );
};
