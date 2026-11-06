import React, { useMemo } from "react";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { playerAuthStore } from "../../lib/storage/playerAuthStore";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { CategoryService } from "../../lib/domain/services/CategoryService";
import { sound } from "../../lib/audio";
import {
  ArrowLeft,
  MapPin,
  Trophy,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface PlayerPublicProfileViewProps {
  playerId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const PlayerPublicProfileView: React.FC<PlayerPublicProfileViewProps> = ({
  playerId,
  onNavigate,
}) => {
  const player = tournamentRepository.getPlayerById(playerId) || tournamentRepository.getAllPlayers()[0];
  const ratingHistories = tournamentRepository.getPlayerRatingHistory(player.id);
  const tournaments = tournamentRepository.getAllTournaments();

  // Next category progression
  const tierProgress = useMemo(() => {
    return CategoryService.getPointsToNextTier(player.cciStandardRating);
  }, [player.cciStandardRating]);

  // Check if player has an authenticated account with a custom chess avatar & chess.com username
  const matchedUser = useMemo(() => {
    const allUsers = playerAuthStore.getAllUsers();
    return allUsers.find(
      (u) =>
        u.linkedPlayerId === player.id ||
        u.cciPlayerId.toLowerCase() === player.cciPlayerId.toLowerCase() ||
        u.fullName.toLowerCase() === player.name.toLowerCase()
    );
  }, [player]);

  // Display avatar with media library resolution
  const avatarSrc = resolveMediaUrl(matchedUser?.avatarUrl || player.photo);

  return (
    <div className="relative w-full z-10 pt-28 sm:pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 font-sans text-[#1C1613]">
      {/* Back button */}
      <div>
        <button
          onClick={() => {
            sound.playTactileClick();
            onNavigate("players");
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E5830] hover:text-[#58371C] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Competitors</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. HEADER & VERIFIED IDENTITY                                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 glass-panel shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#D5C4B0] bg-white shrink-0 p-1 shadow-sm">
              <img
                src={avatarSrc}
                alt={player.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EFE8DD] text-[#442D1C] border border-[#D5C4B0]">
                  {player.cciPlayerId}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#594B40] border border-[#D5C4B0]">
                  {player.currentCategory.name} &bull; Batch {String(player.currentCategory.tierNumber).padStart(2, "0")}
                </span>

                {player.chessTitle && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#442D1C] text-[#FAF7F2]">
                    {player.chessTitle}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1C1613]">
                {player.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#594B40]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8E5830]" />
                  {player.city}, {player.state}
                </span>
                <span>&bull;</span>
                <span>Club: {player.club || "Chess Community India"}</span>
                {matchedUser?.chessComUser && (
                  <>
                    <span>&bull;</span>
                    <a
                      href={`https://www.chess.com/member/${encodeURIComponent(matchedUser.chessComUser)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8E5830] hover:text-[#58371C] font-medium flex items-center gap-1"
                    >
                      <span>chess.com/{matchedUser.chessComUser}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
                {player.fideId && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono text-[#594B40]">FIDE ID: {player.fideId}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Ascension Indicator */}
          {tierProgress.nextTier && (
            <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-2 min-w-[220px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#594B40]">Next Milestone:</span>
                <span className="font-bold text-[#8E5830]">{tierProgress.nextTier.name}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#EAE2D5] overflow-hidden">
                <div
                  className="h-full bg-[#8E5830] rounded-full"
                  style={{ width: `${tierProgress.progressPercentage}%` }}
                />
              </div>
              <span className="text-[11px] text-[#594B40] block text-right">
                <strong className="text-[#1C1613] font-mono">{tierProgress.pointsNeeded}</strong> rating points to ascend
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. RATINGS COMPARISON (CCI vs FIDE)                                       */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CCI Rating Pool */}
        <div className="p-5 sm:p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#8E5830] uppercase block">
                COMMUNITY CIRCUIT
              </span>
              <h3 className="text-base font-serif font-bold text-[#1C1613]">
                CCI Rating System
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFE8DD] text-[#442D1C] border border-[#D5C4B0]">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-0.5">
              <span className="text-[10px] font-medium text-[#6B5E52] uppercase block">Standard</span>
              <span className="text-xl font-mono font-bold text-[#1C1613] block">{player.cciStandardRating}</span>
              <span className="text-[10px] text-[#8D8D8D] block">Classic Elo</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-0.5">
              <span className="text-[10px] font-medium text-[#8E5830] uppercase block font-semibold">Rapid</span>
              <span className="text-xl font-mono font-bold text-[#8E5830] block">{player.cciRapidRating}</span>
              <span className="text-[10px] text-[#8D8D8D] block">Active Pool</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-0.5">
              <span className="text-[10px] font-medium text-[#6B5E52] uppercase block">Blitz</span>
              <span className="text-xl font-mono font-bold text-[#1C1613] block">{player.cciBlitzRating}</span>
              <span className="text-[10px] text-[#8D8D8D] block">Speed Elo</span>
            </div>
          </div>
        </div>

        {/* FIDE Rating Pool */}
        <div className="p-5 sm:p-6 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#594B40] uppercase block">
                INTERNATIONAL FEDERATION
              </span>
              <h3 className="text-base font-serif font-bold text-[#1C1613]">
                FIDE World Ratings
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF7F2] text-[#594B40] border border-[#D5C4B0]">
              {player.fideId ? `ID: ${player.fideId}` : "Domestic"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-0.5">
              <span className="text-[10px] font-medium text-[#6B5E52] uppercase block">Standard</span>
              <span className="text-xl font-mono font-bold text-[#1C1613] block">{player.fideStandardRating || "—"}</span>
              <span className="text-[10px] text-[#8D8D8D] block">FIDE Card</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-0.5">
              <span className="text-[10px] font-medium text-[#6B5E52] uppercase block">Rapid</span>
              <span className="text-xl font-mono font-bold text-[#1C1613] block">{player.fideRapidRating || "—"}</span>
              <span className="text-[10px] text-[#8D8D8D] block">FIDE Rapid</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE2D5] space-y-0.5">
              <span className="text-[10px] font-medium text-[#6B5E52] uppercase block">Blitz</span>
              <span className="text-xl font-mono font-bold text-[#1C1613] block">{player.fideBlitzRating || "—"}</span>
              <span className="text-[10px] text-[#8D8D8D] block">FIDE Blitz</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PERFORMANCE STATISTICS & WIN RATES                                      */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
          <span className="text-[10px] font-medium text-[#6B5E52] uppercase block">Matches</span>
          <span className="text-xl font-serif font-bold text-[#1C1613] block">{player.stats.matchesPlayed}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
          <span className="text-[10px] font-medium text-emerald-800 uppercase block font-semibold">Wins</span>
          <span className="text-xl font-serif font-bold text-emerald-800 block">{player.stats.wins}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
          <span className="text-[10px] font-medium text-[#8E5830] uppercase block">Draws</span>
          <span className="text-xl font-serif font-bold text-[#8E5830] block">{player.stats.draws}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
          <span className="text-[10px] font-medium text-[#594B40] uppercase block">Losses</span>
          <span className="text-xl font-serif font-bold text-[#594B40] block">{player.stats.losses}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
          <span className="text-[10px] font-medium text-emerald-800 uppercase block font-semibold">Win Rate</span>
          <span className="text-xl font-serif font-bold text-emerald-800 block">{player.stats.winPercentage}%</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
          <span className="text-[10px] font-medium text-[#8E5830] uppercase block font-semibold">Peak Rating</span>
          <span className="text-xl font-serif font-bold text-[#8E5830] block">{player.stats.highestCciRating}</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RATING HISTORY TIMELINE                                                */}
      {/* ========================================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] space-y-4">
        <h3 className="font-serif font-bold text-base text-[#1C1613]">
          Rating History &amp; Category Progression
        </h3>

        {ratingHistories.length === 0 ? (
          <p className="text-xs text-[#594B40] py-4 text-center">
            Provisional rating established. Confirmed tournament delta records will be published here.
          </p>
        ) : (
          <div className="space-y-2.5">
            {ratingHistories.map((rh) => (
              <div
                key={rh.id}
                className="p-3.5 rounded-xl bg-white border border-[#D5C4B0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8E5830] font-semibold uppercase">{rh.ratingType}</span>
                    <span className="text-[#8D8D8D]">&bull;</span>
                    <span className="text-[#594B40]">{rh.date}</span>
                  </div>
                  <h4 className="font-bold text-[#1C1613]">{rh.tournamentName}</h4>
                  <div className="text-[11px] text-[#594B40]">
                    Category: <span>{rh.categoryBefore}</span> &rarr;{" "}
                    <span className="text-[#8E5830] font-semibold">{rh.categoryAfter}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-[#8D8D8D] block">BEFORE / AFTER</span>
                    <span className="text-[#594B40]">
                      {rh.ratingBefore} &rarr; <strong className="text-[#1C1613]">{rh.ratingAfter}</strong>
                    </span>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-lg text-center font-bold text-xs ${
                      rh.ratingChange >= 0
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {rh.ratingChange >= 0 ? `+${rh.ratingChange}` : rh.ratingChange}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PlayerPublicProfileView;
