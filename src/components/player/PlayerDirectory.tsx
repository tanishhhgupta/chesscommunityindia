import React, { useState } from "react";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  Users, 
  Search, 
  Filter, 
  Trophy, 
  ExternalLink, 
  Award, 
  CheckCircle, 
  MapPin, 
  TrendingUp, 
  X,
  ShieldAlert,
  Crown
} from "lucide-react";
import { PlayerRecord, loadStoredPlayers } from "../../lib/storage/mockDatabase";
import { getTierFromRating, CCI_45_TIERS } from "../../lib/chess/eloEngine";

export const PlayerDirectory: React.FC = () => {
  const [players] = useState<PlayerRecord[]>(() => loadStoredPlayers());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("all");
  const [activeModalPlayer, setActiveModalPlayer] = useState<PlayerRecord | null>(null);

  // Filter players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cciId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTierFilter === "all") return matchesSearch;
    if (selectedTierFilter === "blundermaster") return matchesSearch && p.rating < 800;
    if (selectedTierFilter === "club") return matchesSearch && p.rating >= 800 && p.rating < 1800;
    if (selectedTierFilter === "master") return matchesSearch && p.rating >= 1800 && p.rating < 2400;
    if (selectedTierFilter === "grandmaster") return matchesSearch && p.rating >= 2400;
    return matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="players">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-chess-gold/10 text-chess-gold border border-chess-gold/20 mb-2">
            <Users className="w-3.5 h-3.5" />
            Official Community Registry
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Chess Community India <span className="gold-gradient-text">Player Database</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl">
            Track official ratings, match history, and tier progressions for all verified community competitors.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold transition-colors w-full sm:w-64"
            />
          </div>

          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-[rgba(245, 242, 235,0.06)] text-white text-sm focus:outline-none focus:border-chess-gold transition-colors"
          >
            <option value="all">All Tiers (0 – 3000+)</option>
            <option value="blundermaster">Blundermasters (&lt; 800)</option>
            <option value="club">Club Competitors (800 – 1799)</option>
            <option value="master">CCI Masters (1800 – 2399)</option>
            <option value="grandmaster">Elite &amp; Grandmasters (2400+)</option>
          </select>
        </div>
      </div>

      {/* Player Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlayers.map((player) => {
          const tier = getTierFromRating(player.rating);
          const winRate =
            player.matchesPlayed > 0
              ? Math.round((player.wins / player.matchesPlayed) * 100)
              : 0;

          return (
            <div
              key={player.id}
              onClick={() => setActiveModalPlayer(player)}
              className="glass-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between group hover:border-chess-gold/40 relative overflow-hidden"
            >
              {/* Subtle top accent bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  player.rating < 800
                    ? "bg-red-500"
                    : player.rating >= 2400
                    ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                    : "bg-blue-500"
                }`}
              />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="relative">
                    <img
                      src={resolveMediaUrl(player.avatarUrl)}
                      alt={player.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[rgba(245, 242, 235,0.06)] group-hover:border-chess-gold/50 transition-colors"
                    />
                    {player.rating >= 2400 && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-black p-1 rounded-full shadow-md">
                        <Crown className="w-3 h-3" />
                      </span>
                    )}
                    {player.rating < 800 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full shadow-md">
                        <ShieldAlert className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tier.badgeColor} ${tier.textColor} border ${tier.borderColor}`}>
                    {tier.name}
                  </span>
                </div>

                <h3 className="font-bold text-white text-lg group-hover:text-chess-gold transition-colors">
                  {player.name}
                </h3>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {player.city}, {player.state} &bull; <span className="font-mono text-slate-500">{player.cciId}</span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-5 pt-4 border-t border-[rgba(245, 242, 235,0.06)] flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500 uppercase tracking-wider text-[10px]">CCI Elo</div>
                  <div className="font-extrabold text-base text-white font-mono">
                    {player.rating}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-500 uppercase tracking-wider text-[10px]">Win Rate</div>
                  <div className="font-bold text-slate-300">
                    {winRate}% <span className="text-slate-500">({player.matchesPlayed} games)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PLAYER PASSPORT MODAL */}
      {activeModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 relative border border-white/20 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalPlayer(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Passport Header */}
            <div className="flex items-center gap-5 pb-6 border-b border-[rgba(245, 242, 235,0.06)]">
              <img
                src={resolveMediaUrl(activeModalPlayer.avatarUrl)}
                alt={activeModalPlayer.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-chess-gold shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-extrabold text-white">
                    {activeModalPlayer.name}
                  </h3>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  CCI Passport ID: <span className="text-chess-gold font-mono font-medium">{activeModalPlayer.cciId}</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-chess-gold/15 text-chess-gold border border-chess-gold/30">
                  <Award className="w-3.5 h-3.5" />
                  {getTierFromRating(activeModalPlayer.rating).name} (Tier {getTierFromRating(activeModalPlayer.rating).tierNumber} / 45)
                </div>
              </div>
            </div>

            {/* Ratings & Career Stats Grid */}
            <div className="grid grid-cols-3 gap-3 py-6 text-center border-b border-[rgba(245, 242, 235,0.06)]">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-[rgba(245, 242, 235,0.04)]">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Current Rating</div>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  {activeModalPlayer.rating}
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-2xl border border-[rgba(245, 242, 235,0.04)]">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Peak Rating</div>
                <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
                  {activeModalPlayer.peakRating}
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-2xl border border-[rgba(245, 242, 235,0.04)]">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Record (W-D-L)</div>
                <div className="text-sm font-bold text-slate-200 mt-1.5">
                  {activeModalPlayer.wins} - {activeModalPlayer.draws} - {activeModalPlayer.losses}
                </div>
              </div>
            </div>

            {/* Community Links */}
            <div className="py-4 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Location:</span>
                <span className="text-white font-medium">{activeModalPlayer.city}, {activeModalPlayer.state}</span>
              </div>
              {activeModalPlayer.fideId && (
                <div className="flex items-center justify-between">
                  <span>FIDE ID:</span>
                  <span className="font-mono text-blue-400 font-medium">{activeModalPlayer.fideId}</span>
                </div>
              )}
              {activeModalPlayer.chessComUser && (
                <div className="flex items-center justify-between">
                  <span>Chess.com Username:</span>
                  <span className="text-emerald-400 font-medium">@{activeModalPlayer.chessComUser}</span>
                </div>
              )}
            </div>

            {/* Close action */}
            <div className="pt-4">
              <button
                onClick={() => setActiveModalPlayer(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Close Passport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
