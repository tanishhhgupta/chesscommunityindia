import React, { useState, useMemo } from "react";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { Tournament, TournamentStatus } from "../../lib/domain/types";
import { sound } from "../../lib/audio";
import { Trophy, Calendar, MapPin, Clock, Users, ArrowRight, Search, ShieldCheck } from "lucide-react";

interface TournamentsListViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const TournamentsListView: React.FC<TournamentsListViewProps> = ({ onNavigate }) => {
  const [filterStatus, setFilterStatus] = useState<"ALL" | TournamentStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [dbTimestamp, setDbTimestamp] = useState<number>(Date.now());

  React.useEffect(() => {
    const handleSync = () => setDbTimestamp(Date.now());
    window.addEventListener("cci-domain-db-synced", handleSync);
    return () => window.removeEventListener("cci-domain-db-synced", handleSync);
  }, []);

  const tournaments = useMemo(() => tournamentRepository.getAllTournaments(), [dbTimestamp]);

  const cities = useMemo(() => {
    const list = Array.from(new Set(tournaments.map((t) => t.city)));
    return ["ALL", ...list];
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
      if (cityFilter !== "ALL" && t.city !== cityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          t.name.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q) ||
          t.venue.toLowerCase().includes(q) ||
          t.organizer.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [tournaments, filterStatus, cityFilter, searchQuery]);

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      
      {/* 1. Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
            TOURNAMENT CIRCUIT &bull; CHESS COMMUNITY INDIA
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("chess-manager");
              }}
              className="px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all"
            >
              Organize / Arbiter Portal
            </button>
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Tournaments.
        </h1>

        <p className="text-base sm:text-lg text-[#9CA3A8] font-sans font-normal max-w-2xl leading-relaxed">
          Sanctioned offline Swiss tournaments, cafe blitz battles, and national championships across India with live FIDE pairings and official CCI rating categories.
        </p>
      </section>

      {/* 2. Filter & Search Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-dark">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                sound.playTactileClick();
                setFilterStatus(status);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === status
                  ? "bg-[#C5A059] text-[#08161A] shadow-md font-bold"
                  : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {status === "ALL" ? "All Fixtures" : status}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tournament, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-white text-xs w-56 sm:w-64 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#08161A] border border-[rgba(245, 242, 235,0.06)] text-slate-300 text-xs focus:outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Cities" : c}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 3. Tournament Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((t) => {
          const regs = tournamentRepository.getTournamentRegistrations(t.id);

          return (
            <div
              key={t.id}
              onClick={() => {
                sound.playTactileClick();
                onNavigate("tournament-detail", t.id);
              }}
              className="group cursor-pointer rounded-3xl p-7 glass-dark-card transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                      t.status === "LIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                        : t.status === "UPCOMING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-white/10 text-slate-400 border border-[rgba(245, 242, 235,0.06)]"
                    }`}
                  >
                    {t.status} &bull; ROUND {t.currentRoundNumber}/{t.rounds}
                  </span>

                  <span className="text-[11px] font-mono text-[#C5A059] font-semibold">
                    {t.ratingType} &bull; {t.baseTime}+{t.increment}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-white group-hover:text-[#C5A059] transition-colors leading-snug">
                  {t.name}
                </h3>

                <p className="text-xs text-[#9CA3A8] line-clamp-2 leading-relaxed font-light">
                  {t.description}
                </p>

                <div className="space-y-2 pt-2 text-xs font-sans text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{t.venue}, {t.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{t.startDate} {t.endDate !== t.startDate ? `– ${t.endDate}` : ""}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(245, 242, 235,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>{regs.length} Competitors</span>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Tournament</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

    </div>
  );
};
