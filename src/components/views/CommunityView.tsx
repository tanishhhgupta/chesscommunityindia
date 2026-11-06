import React, { useState, useEffect } from "react";
import { INITIAL_PLAYERS, PlayerRecord } from "../../lib/storage/mockDatabase";
import { contentStore, resolveMediaUrl } from "../../lib/storage/contentStore";
import { sound } from "../../lib/audio";
import { Users, Search, ArrowRight, ShieldCheck, Trophy, Sparkles } from "lucide-react";
import { HandDrawnUnderline } from "../ui/HandDrawnUnderline";

interface CommunityViewProps {
  onNavigate: (view: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRecord | null>(null);
  const [, setContentTimestamp] = useState(Date.now());

  useEffect(() => {
    const sync = () => setContentTimestamp(Date.now());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const filtered = INITIAL_PLAYERS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.cciId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-6xl mx-auto space-y-24">
      
      {/* 1. Header */}
      <section className="space-y-4 apple-scroll-reveal">
        <span className="text-[11px] font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
          CHESS COMMUNITY INDIA
        </span>
        <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Built Around <HandDrawnUnderline className="text-[#C5A059]" delay={200}>People.</HandDrawnUnderline>
        </h1>
        <p className="text-base sm:text-lg text-[#9CA3A8] font-normal max-w-xl font-sans leading-relaxed">
          Players, organisers, volunteers, mentors and communities come together through chess. From local communities to a growing network across India.
        </p>
      </section>

      {/* 2. Chess Manager Rating System — 6 Categories (0 - 3000 Elo) */}
      <section className="quiet-card rounded-3xl p-8 sm:p-12 space-y-8 apple-scroll-reveal">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(245, 242, 235,0.05)] pb-6">
          <div>
            <span className="text-[10px] font-sans text-[#C5A059] tracking-wider uppercase block font-semibold">
              CHESS MANAGER RATING SYSTEM
            </span>
            <h2 className="text-3xl font-display font-bold text-white mt-1">
              6 Progressive Rating Categories
            </h2>
          </div>
          <span className="text-xs font-sans text-[#9CA3A8]">0 to 3000 Elo &bull; Official Community Batches</span>
        </div>

        <p className="text-xs sm:text-sm text-[#9CA3A8] font-normal leading-relaxed max-w-2xl font-sans">
          Sanctioned offline cafe meetups and FIDE Swiss opens dynamically adjust your verified rating category across 6 official Chess Community India performance tiers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
          <div className="p-4 rounded-xl quiet-surface border border-rose-900/30 space-y-1">
            <span className="text-rose-400/80 block text-[10px] font-mono font-semibold">BATCH 01</span>
            <span className="text-white font-bold block text-sm font-display">Blunder Master</span>
            <span className="text-[#C5A059] text-xs font-medium">0 &ndash; 800 Elo</span>
            <p className="text-[11px] text-slate-400 pt-1">Every legend starts with hanging pieces. Embracing the journey from move one.</p>
          </div>

          <div className="p-4 rounded-xl quiet-surface border border-amber-900/30 space-y-1">
            <span className="text-amber-400/80 block text-[10px] font-mono font-semibold">BATCH 02</span>
            <span className="text-white font-bold block text-sm font-display">Tactical Striker</span>
            <span className="text-[#C5A059] text-xs font-medium">801 &ndash; 1200 Elo</span>
            <p className="text-[11px] text-slate-400 pt-1">Spotting forks, pins, and skewers. Turning tactical awareness into decisive advantage.</p>
          </div>

          <div className="p-4 rounded-xl quiet-surface border border-cyan-900/30 space-y-1">
            <span className="text-cyan-400/80 block text-[10px] font-mono font-semibold">BATCH 03</span>
            <span className="text-white font-bold block text-sm font-display">Positional Strategist</span>
            <span className="text-[#C5A059] text-xs font-medium">1201 &ndash; 1600 Elo</span>
            <p className="text-[11px] text-slate-400 pt-1">Controlling outposts, pawn structures, and navigating middle-game conversions.</p>
          </div>

          <div className="p-4 rounded-xl quiet-surface border border-emerald-900/30 space-y-1">
            <span className="text-emerald-400/80 block text-[10px] font-mono font-semibold">BATCH 04</span>
            <span className="text-white font-bold block text-sm font-display">Vanguard Commander</span>
            <span className="text-[#C5A059] text-xs font-medium">1601 &ndash; 2000 Elo</span>
            <p className="text-[11px] text-slate-400 pt-1">Acute calculation, opening repertoire depth, and fierce tournament resilience.</p>
          </div>

          <div className="p-4 rounded-xl quiet-surface border border-indigo-900/30 space-y-1">
            <span className="text-indigo-400/80 block text-[10px] font-mono font-semibold">BATCH 05</span>
            <span className="text-white font-bold block text-sm font-display">Crown Contender</span>
            <span className="text-[#C5A059] text-xs font-medium">2001 &ndash; 2400 Elo</span>
            <p className="text-[11px] text-slate-400 pt-1">Master-level endgame technique, psychological endurance, and national circuit mastery.</p>
          </div>

          <div className="p-4 rounded-xl quiet-surface border border-[#C5A059]/40 space-y-1">
            <span className="text-[#C5A059] block text-[10px] font-mono font-semibold">BATCH 06</span>
            <span className="text-white font-bold block text-sm font-display">Grand Sovereign</span>
            <span className="text-[#C5A059] text-xs font-medium">2401 &ndash; 3000+ Elo</span>
            <p className="text-[11px] text-slate-400 pt-1">The pinnacle of Indian chess brilliance. Intuition, precision, and immortal play.</p>
          </div>
        </div>
      </section>

      {/* 3. Searchable Player Registry */}
      <section className="space-y-8 apple-scroll-reveal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(245, 242, 235,0.05)] pb-4">
          <h3 className="text-2xl font-serif-editorial font-bold text-white">Player Registry</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#9CA3A8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.slice(0, 10).map((p) => (
            <div
              key={p.id}
              onClick={() => {
                sound.playGlassClick();
                setSelectedPlayer(p);
              }}
              className="py-4 px-3 flex items-center justify-between gap-4 hover:bg-white/[0.01] rounded-xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-black/40 border border-[rgba(245, 242, 235,0.06)] shrink-0">
                  <img src={resolveMediaUrl(p.avatarUrl)} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-serif-editorial font-bold text-white group-hover:text-[#C5A059] transition-colors">
                    {p.name}
                  </h4>
                  <div className="text-[11px] font-mono text-[#9CA3A8]">
                    {p.city} &bull; {p.cciId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-white block">{p.rating} Elo</span>
                  <span className="text-[10px] text-[#C5A059]">{p.tierName}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#C5A059] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Player Detail Drawer / Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay animate-fade-in">
          <div className="relative w-full max-w-lg glass-modal-dark rounded-3xl p-8 space-y-6 shadow-2xl">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[#C5A059]/40">
                <img src={resolveMediaUrl(selectedPlayer.avatarUrl)} alt={selectedPlayer.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-serif-editorial font-bold text-white">{selectedPlayer.name}</h3>
                <span className="text-xs font-mono text-[#C5A059]">{selectedPlayer.tierName} &bull; {selectedPlayer.city}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-[rgba(245, 242, 235,0.04)] text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">CURRENT</span>
                <span className="text-lg font-bold text-white">{selectedPlayer.rating}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">PEAK</span>
                <span className="text-lg font-bold text-[#C5A059]">{selectedPlayer.peakRating}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">RECORD</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">
                  {selectedPlayer.wins}W &bull; {selectedPlayer.draws}D &bull; {selectedPlayer.losses}L
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-6 py-2.5 rounded-full border border-[rgba(245, 242, 235,0.06)] text-xs font-mono text-white hover:bg-white/5"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
