import React, { useState, useEffect, useMemo } from "react";
import { sound } from "../../lib/audio";
import { chessManagerBackend } from "../../chesspair/lib/chessManagerBackend";
import { ChessPairSyncBridge } from "../../chesspair/lib/syncBridge";
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  ArrowLeft,
  Swords,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";

interface ChessPairPublicViewProps {
  onNavigate: (view: string, param?: string) => void;
  initialTournamentId?: string;
}

export const ChessPairPublicView: React.FC<ChessPairPublicViewProps> = ({
  onNavigate,
  initialTournamentId,
}) => {
  // Sync state timestamp
  const [syncTimestamp, setSyncTimestamp] = useState<number>(Date.now());
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(() => {
    if (initialTournamentId) return initialTournamentId;
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "").trim();
      const parts = hash.split("/");
      if ((parts[0] === "chess-pair" || parts[0] === "tournaments" || parts[0] === "tournament-detail") && parts.length > 1) {
        return parts[1];
      }
    }
    return null;
  });

  // Filter and view states
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "UPCOMING" | "COMPLETED">("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Tournament detail tab state
  const [detailTab, setDetailTab] = useState<"standings" | "pairings" | "players" | "regulations">("standings");
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [roundSearchQuery, setRoundSearchQuery] = useState("");
  const [standingsSearchQuery, setStandingsSearchQuery] = useState("");

  // Player Profile Modal state
  const [inspectPlayerId, setInspectPlayerId] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<number>(Date.now());

  // Initialize Real-time synchronization
  useEffect(() => {
    ChessPairSyncBridge.init();

    const triggerSync = () => {
      setIsSyncing(true);
      setSyncTimestamp(Date.now());
      setLastSyncedTime(Date.now());
      setTimeout(() => setIsSyncing(false), 400);
    };

    // 1. Same-window custom event
    window.addEventListener("chesspair-data-updated", triggerSync);

    // 2. Storage event (cross-tab / iframe)
    window.addEventListener("storage", triggerSync);

    // 3. Cross-frame postMessage
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "CHESSPAIR_DATA_UPDATED") {
        triggerSync();
      }
    };
    window.addEventListener("message", handleMsg);

    // 4. Same-origin BroadcastChannel (instant tab-to-tab sync)
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("chesspair_sync_channel");
        bc.onmessage = () => {
          triggerSync();
        };
      }
    } catch { }

    // 5. Server-Sent Events (SSE) for cross-browser, cross-device live streaming
    let eventSource: EventSource | null = null;
    let sseTimeout: any = null;

    const connectSSE = () => {
      try {
        if (typeof EventSource !== "undefined") {
          eventSource = new EventSource("/api/public/events");
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "CHESSPAIR_DATA_UPDATED" || data.type === "CONNECTED") {
                triggerSync();
              }
            } catch { }
          };
          eventSource.onerror = () => {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            // Auto reconnect with backoff
            clearTimeout(sseTimeout);
            sseTimeout = setTimeout(connectSSE, 4000);
          };
        }
      } catch { }
    };

    connectSSE();

    // 6. Adaptive reconciliation on window focus & online
    const handleReconcile = () => {
      triggerSync();
    };
    window.addEventListener("focus", handleReconcile);
    window.addEventListener("online", handleReconcile);

    // 7. Periodic background reconciliation poll (guarantees recovery even if SSE is dropped)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    }, 4000);

    return () => {
      window.removeEventListener("chesspair-data-updated", triggerSync);
      window.removeEventListener("storage", triggerSync);
      window.removeEventListener("message", handleMsg);
      window.removeEventListener("focus", handleReconcile);
      window.removeEventListener("online", handleReconcile);
      clearInterval(pollInterval);
      clearTimeout(sseTimeout);
      if (bc) {
        try {
          bc.close();
        } catch { }
      }
      if (eventSource) {
        try {
          eventSource.close();
        } catch { }
      }
    };
  }, []);

  // Update selected tournament if initialTournamentId prop changes
  useEffect(() => {
    if (initialTournamentId) {
      setSelectedTournamentId(initialTournamentId);
    }
  }, [initialTournamentId]);

  // Sync hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      const parts = hash.split("/");
      if ((parts[0] === "chess-pair" || parts[0] === "tournaments" || parts[0] === "tournament-detail") && parts.length > 1) {
        setSelectedTournamentId(parts[1]);
      } else if (parts[0] === "chess-pair" || parts[0] === "tournaments") {
        setSelectedTournamentId(null);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Published Tournaments (strictly excludes drafts and uncommitted tournaments)
  const publishedTournaments = useMemo(() => {
    return chessManagerBackend.getPublishedTournaments();
  }, [syncTimestamp]);

  // Cities list from published tournaments
  const cities = useMemo(() => {
    const set = new Set<string>();
    publishedTournaments.forEach((t) => {
      if (t.city) set.add(t.city);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [publishedTournaments]);

  // Filtered tournament directory
  const filteredTournaments = useMemo(() => {
    return publishedTournaments.filter((t) => {
      if (statusFilter === "LIVE" && t.status !== "in_progress") return false;
      if (statusFilter === "UPCOMING" && (t.status as string) !== "upcoming" && t.status !== "registration") return false;
      if (statusFilter === "COMPLETED" && t.status !== "completed" && t.status !== "archived") return false;
      if (cityFilter !== "ALL" && t.city?.toLowerCase() !== cityFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          t.name.toLowerCase().includes(q) ||
          (t.city && t.city.toLowerCase().includes(q)) ||
          (t.venue && t.venue.toLowerCase().includes(q)) ||
          (t.chiefArbiter && t.chiefArbiter.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [publishedTournaments, statusFilter, cityFilter, searchQuery]);

  // Currently Selected Tournament
  const activeTournament = useMemo(() => {
    if (!selectedTournamentId) return null;
    return publishedTournaments.find((t) => t.id === selectedTournamentId) || null;
  }, [selectedTournamentId, publishedTournaments]);

  // Published Rounds for Active Tournament (status !== 'draft')
  const publishedRounds = useMemo(() => {
    if (!activeTournament) return [];
    return chessManagerBackend.getPublishedRounds(activeTournament.id);
  }, [activeTournament, syncTimestamp]);

  // Set default selected round to latest published round
  useEffect(() => {
    if (publishedRounds.length > 0) {
      const exists = publishedRounds.some((r) => r.roundNumber === selectedRoundNumber);
      if (!exists) {
        setSelectedRoundNumber(publishedRounds[publishedRounds.length - 1].roundNumber);
      }
    } else {
      setSelectedRoundNumber(1);
    }
  }, [publishedRounds, selectedRoundNumber]);

  // Active Round object
  const activeRound = useMemo(() => {
    return publishedRounds.find((r) => r.roundNumber === selectedRoundNumber) || publishedRounds[0] || null;
  }, [publishedRounds, selectedRoundNumber]);

  // Pairings for active round
  const activePairings = useMemo(() => {
    if (!activeRound) return [];
    return chessManagerBackend.getPublishedPairingsForRound(activeRound.id);
  }, [activeRound, syncTimestamp]);

  // Filtered Pairings
  const filteredPairings = useMemo(() => {
    if (!roundSearchQuery.trim()) return activePairings;
    const q = roundSearchQuery.toLowerCase();
    return activePairings.filter((p) => {
      const wName = p.whitePlayer?.name?.toLowerCase() || "";
      const bName = p.blackPlayer?.name?.toLowerCase() || "";
      const boardStr = String(p.boardNumber);
      return wName.includes(q) || bName.includes(q) || boardStr === q;
    });
  }, [activePairings, roundSearchQuery]);

  // Authoritative Standings from Backend Engine
  const authoritativeStandings = useMemo(() => {
    if (!activeTournament) return [];
    return chessManagerBackend.calculateAuthoritativeStandings(activeTournament.id);
  }, [activeTournament, syncTimestamp]);

  // Filtered Standings
  const filteredStandings = useMemo(() => {
    if (!standingsSearchQuery.trim()) return authoritativeStandings;
    const q = standingsSearchQuery.toLowerCase();
    return authoritativeStandings.filter((s) => s.playerName.toLowerCase().includes(q));
  }, [authoritativeStandings, standingsSearchQuery]);

  // Published participants
  const publishedParticipants = useMemo(() => {
    if (!activeTournament) return [];
    return chessManagerBackend.getPublishedTournamentPlayers(activeTournament.id);
  }, [activeTournament, syncTimestamp]);

  // Selected Player Profile Modal Data
  const inspectedPlayerProfile = useMemo(() => {
    if (!inspectPlayerId) return null;
    return chessManagerBackend.getPublicPlayerProfile(inspectPlayerId);
  }, [inspectPlayerId, syncTimestamp]);

  // Player's tournament appearances
  const inspectedPlayerTournaments = useMemo(() => {
    if (!inspectPlayerId) return [];
    return chessManagerBackend.getPublicPlayerTournaments(inspectPlayerId);
  }, [inspectPlayerId, syncTimestamp]);

  // Helper formatting for score display (standard, readable chess notation)
  const formatResultDisplay = (result?: string, isBye?: boolean) => {
    if (isBye || result === "1-0_BYE") return "1 – 0 (Bye)";
    if (result === "0.5-BYE") return "½ – ½ (Bye)";
    if (result === "0-BYE") return "0 – 0 (Bye)";
    if (!result || result === "UNPLAYED") return "– : –";
    if (result === "1-0") return "1 – 0";
    if (result === "0.5-0.5" || result === "1/2-1/2") return "½ – ½";
    if (result === "0-1") return "0 – 1";
    if (result === "1F-0") return "1F – 0";
    if (result === "0-1F") return "0 – 1F";
    return result;
  };

  // Clean, restrained status badge
  const renderStatusBadge = (status?: string) => {
    if (status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Live
        </span>
      );
    }
    if (status === "registration" || status === "upcoming") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFE8DD] text-[#594B40] border border-[#D5C4B0]">
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
        Completed
      </span>
    );
  };

  const handleSelectTournament = (tourneyId: string) => {
    sound.playTactileClick();
    setSelectedTournamentId(tourneyId);
    if (typeof window !== "undefined") {
      window.location.hash = `chess-pair/${tourneyId}`;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDirectory = () => {
    sound.playTactileClick();
    setSelectedTournamentId(null);
    if (typeof window !== "undefined") {
      window.location.hash = "chess-pair";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenPlayerModal = (playerId: string) => {
    sound.playTactileClick();
    setInspectPlayerId(playerId);
  };

  // Export standings as CSV
  const handleExportStandingsCsv = () => {
    if (!activeTournament || authoritativeStandings.length === 0) return;
    const headers = [
      "Rank",
      "Title",
      "Player",
      "CCI_ID",
      "Rating",
      "Score",
      "Buchholz_Cut1",
      "Buchholz_Total",
      "Sonneborn_Berger",
      "Wins",
      "Blacks",
    ];
    const rows = authoritativeStandings.map((s) => {
      const p = publishedParticipants.find((tp) => tp.playerId === s.playerId)?.player;
      return [
        s.rank,
        s.title || "",
        `"${s.playerName.replace(/"/g, '""')}"`,
        p?.localId || "",
        s.rating,
        s.score,
        s.buchholzCut1,
        s.buchholzTotal,
        s.sonnebornBerger,
        s.wins,
        s.blacks,
      ];
    });
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTournament.slug || "tournament"}-official-standings.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full z-10 pt-28 sm:pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 font-sans text-[#1C1613]">
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION                                                         */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold text-[#8E5830] tracking-wider uppercase">
            Chess Community India &bull; Tournament Circuit
          </span>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : 'animate-pulse'}`}></span>
              <span>{isSyncing ? "Syncing..." : "Live Synced"}</span>
            </div>

            <button
              onClick={() => {
                setIsSyncing(true);
                setSyncTimestamp(Date.now());
                sound.playTactileClick();
                setTimeout(() => setIsSyncing(false), 400);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#D5C4B0] text-[#442D1C] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Force sync tournament data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#8E5830] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => {
                sound.playTactileClick();
                onNavigate("admin", "chessmanager");
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E8D1A7]" />
              <span>Arbiter Portal</span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1613] tracking-tight">
            Chess Pair
          </h1>
          <p className="text-sm text-[#594B40] leading-relaxed">
            Official pairings, confirmed board results, and authoritative standings from sanctioned tournaments.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TOURNAMENT DETAIL VIEW                                                 */}
      {/* ========================================================================= */}
      {activeTournament ? (
        <div className="space-y-6">
          {/* Navigation link back to all tournaments */}
          <div>
            <button
              onClick={handleBackToDirectory}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E5830] hover:text-[#58371C] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tournaments</span>
            </button>
          </div>

          {/* Tournament Overview Header Card */}
          <section className="rounded-2xl p-6 sm:p-7 glass-panel space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  {renderStatusBadge(activeTournament.status)}
                  <span className="text-xs text-[#594B40] font-medium">
                    Round {activeTournament.currentRound} of {activeTournament.roundsCount}
                  </span>
                  <span className="text-xs text-[#594B40]">&bull;</span>
                  <span className="text-xs text-[#594B40] font-medium">
                    {activeTournament.timeControlString || "Rapid 15m + 10s"}
                  </span>
                  {activeTournament.isFideRated && (
                    <>
                      <span className="text-xs text-[#594B40]">&bull;</span>
                      <span className="text-xs font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                        FIDE Rated
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1613]">
                  {activeTournament.name}
                </h2>

                {activeTournament.description && (
                  <p className="text-xs sm:text-sm text-[#594B40] leading-relaxed">
                    {activeTournament.description}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-start shrink-0">
                <button
                  onClick={handleExportStandingsCsv}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F4EFEA] text-[#1C1613] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D5C4B0]"
                >
                  <Download className="w-3.5 h-3.5 text-[#8E5830]" />
                  <span>Export Standings</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F4EFEA] text-[#1C1613] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D5C4B0]"
                >
                  <Printer className="w-3.5 h-3.5 text-[#8E5830]" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Structured tournament metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#EAE2D5] text-xs">
              <div>
                <span className="text-[#6B5E52] block font-medium">Dates</span>
                <p className="font-semibold text-[#1C1613] mt-0.5">
                  {activeTournament.startDate || "Active Season"}{" "}
                  {activeTournament.endDate && activeTournament.endDate !== activeTournament.startDate
                    ? `– ${activeTournament.endDate}`
                    : ""}
                </p>
              </div>

              <div>
                <span className="text-[#6B5E52] block font-medium">Venue & City</span>
                <p className="font-semibold text-[#1C1613] mt-0.5 truncate">
                  {activeTournament.venue || "Central Arena"}, {activeTournament.city || "Jabalpur"}
                </p>
              </div>

              <div>
                <span className="text-[#6B5E52] block font-medium">Participants</span>
                <p className="font-semibold text-[#1C1613] mt-0.5">
                  {publishedParticipants.length} Players Confirmed
                </p>
              </div>

              <div>
                <span className="text-[#6B5E52] block font-medium">Chief Arbiter</span>
                <p className="font-semibold text-[#1C1613] mt-0.5 truncate">
                  {activeTournament.chiefArbiter || "International Arbiter"}
                </p>
              </div>
            </div>
          </section>

          {/* Tab Navigation: Standings, Pairings, Players, Regulations */}
          <div className="flex items-center gap-1 border-b border-[#D5C4B0] pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: "standings", label: "Standings", icon: Trophy },
              { id: "pairings", label: "Pairings & Results", icon: Swords },
              { id: "players", label: `Participants (${publishedParticipants.length})`, icon: Users },
              { id: "regulations", label: "Regulations", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = detailTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playTactileClick();
                    setDetailTab(tab.id as any);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${isActive
                    ? "bg-[#442D1C] text-[#FAF7F2]"
                    : "text-[#594B40] hover:text-[#1C1613] hover:bg-[#FAF7F2]"
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#E8D1A7]" : "text-[#8E5830]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: AUTHORITATIVE STANDINGS */}
          {detailTab === "standings" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={standingsSearchQuery}
                    onChange={(e) => setStandingsSearchQuery(e.target.value)}
                    placeholder="Search player name..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                  />
                </div>
                <div className="text-xs text-[#594B40]">
                  Tiebreaks: Buchholz Cut-1 &bull; Buchholz Total &bull; Sonneborn-Berger &bull; Wins
                </div>
              </div>

              {filteredStandings.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-white border border-[#D5C4B0] text-xs text-[#6B5E52]">
                  No standings available.
                </div>
              ) : (
                <div className="rounded-xl border border-[#D5C4B0] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-xs text-left">
                      <thead className="bg-[#FAF7F2] border-b border-[#D5C4B0] text-[#442D1C] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                          <th className="py-2.5 px-3">Player</th>
                          <th className="py-2.5 px-3 text-center">Category</th>
                          <th className="py-2.5 px-3 text-right">Rating</th>
                          <th className="py-2.5 px-3 text-center font-bold text-[#1C1613]">Points</th>
                          <th className="py-2.5 px-3 text-right">BH-Cut1</th>
                          <th className="py-2.5 px-3 text-right">BH-Tot</th>
                          <th className="py-2.5 px-3 text-right">SB</th>
                          <th className="py-2.5 px-3 text-center">W-D-L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {filteredStandings.map((s) => {
                          const participant = publishedParticipants.find((tp) => tp.playerId === s.playerId);
                          return (
                            <tr
                              key={s.playerId}
                              className={`hover:bg-[#FAF7F2]/80 transition-colors ${s.rank === 1 ? "bg-amber-50/30" : ""
                                }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono font-medium text-[#594B40]">
                                {s.rank}
                              </td>

                              <td className="py-2.5 px-3">
                                <button
                                  onClick={() => handleOpenPlayerModal(s.playerId)}
                                  className="font-medium text-[#1C1613] hover:text-[#8E5830] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                                >
                                  {s.title && s.title !== "None" && (
                                    <span className="px-1 py-0.5 rounded text-[10px] font-mono font-bold bg-[#442D1C] text-[#FAF7F2]">
                                      {s.title}
                                    </span>
                                  )}
                                  <span>{s.playerName}</span>
                                </button>
                                {participant?.player?.localId && (
                                  <span className="font-mono text-[10px] text-[#9E8B7D] block">
                                    {participant.player.localId}
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {participant?.cciCategory && (
                                  <span className="text-[11px] text-[#594B40]">
                                    {participant.cciCategory.categoryName}
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-[#594B40]">
                                {s.rating}
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-[#1C1613]">
                                {s.score}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-[#594B40]">
                                {s.buchholzCut1?.toFixed(1) || "0.0"}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-[#594B40]">
                                {s.buchholzTotal?.toFixed(1) || "0.0"}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-[#594B40]">
                                {s.sonnebornBerger?.toFixed(2) || "0.00"}
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono text-[#594B40]">
                                {s.wins || 0} -{" "}
                                {s.score ? Math.round((s.score - (s.wins || 0)) * 2) : 0} -{" "}
                                {s.roundDetails
                                  ? Math.max(
                                    0,
                                    s.roundDetails.length -
                                    (s.wins || 0) -
                                    Math.round(((s.score || 0) - (s.wins || 0)) * 2)
                                  )
                                  : 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUND-WISE PAIRINGS */}
          {detailTab === "pairings" && (
            <div className="space-y-4">
              {/* Round Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {publishedRounds.length === 0 ? (
                    <span className="text-xs text-[#594B40] italic">No published rounds yet.</span>
                  ) : (
                    publishedRounds.map((r) => {
                      const isSelected = r.roundNumber === selectedRoundNumber;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            sound.playTactileClick();
                            setSelectedRoundNumber(r.roundNumber);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isSelected
                            ? "bg-[#442D1C] text-[#FAF7F2]"
                            : "bg-white text-[#594B40] hover:bg-[#FAF7F2] border border-[#D5C4B0]"
                            }`}
                        >
                          Round {r.roundNumber}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roundSearchQuery}
                    onChange={(e) => setRoundSearchQuery(e.target.value)}
                    placeholder="Search board or player..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                  />
                </div>
              </div>

              {/* Pairings Table */}
              {filteredPairings.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-white border border-[#D5C4B0] text-xs text-[#6B5E52]">
                  No pairings found for Round {selectedRoundNumber}.
                </div>
              ) : (
                <div className="rounded-xl border border-[#D5C4B0] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-xs text-left">
                      <thead className="bg-[#FAF7F2] border-b border-[#D5C4B0] text-[#442D1C] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-14 text-center">Board</th>
                          <th className="py-2.5 px-3">White</th>
                          <th className="py-2.5 px-3 text-right">Rating</th>
                          <th className="py-2.5 px-6 text-center font-bold text-[#1C1613]">Result</th>
                          <th className="py-2.5 px-3">Rating</th>
                          <th className="py-2.5 px-3">Black</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {filteredPairings.map((p) => {
                          const wName = p.whitePlayer?.name || "Player (White)";
                          const bName =
                            p.isBye || !p.blackPlayerId ? "BYE" : p.blackPlayer?.name || "Player (Black)";
                          const formattedScore = formatResultDisplay(p.result, p.isBye);

                          return (
                            <tr key={p.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                              <td className="py-3 px-3 text-center font-mono font-medium text-[#594B40]">
                                #{p.boardNumber}
                              </td>

                              <td className="py-3 px-3">
                                {p.whitePlayerId ? (
                                  <button
                                    onClick={() => handleOpenPlayerModal(p.whitePlayerId!)}
                                    className="font-medium text-[#1C1613] hover:text-[#8E5830] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shrink-0"></span>
                                    <span>{wName}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-[#594B40]">
                                {p.whitePlayer?.rating || "–"}
                              </td>

                              <td className="py-3 px-6 text-center">
                                <span className="inline-block px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#D5C4B0] font-mono font-bold text-xs text-[#1C1613]">
                                  {formattedScore}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-mono text-[#594B40]">
                                {p.blackPlayer?.rating || (p.isBye ? "–" : "–")}
                              </td>

                              <td className="py-3 px-3">
                                {p.isBye ? (
                                  <span className="text-[#8E5830] font-medium text-xs">
                                    Bye Assigned
                                  </span>
                                ) : p.blackPlayerId ? (
                                  <button
                                    onClick={() => handleOpenPlayerModal(p.blackPlayerId!)}
                                    className="font-medium text-[#1C1613] hover:text-[#8E5830] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#1C1613] shrink-0"></span>
                                    <span>{bName}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PARTICIPANTS */}
          {detailTab === "players" && (
            <div className="space-y-4">
              <div className="text-xs text-[#594B40] flex justify-between">
                <span>{publishedParticipants.length} published participants</span>
                <span>Sorted by seed number</span>
              </div>

              <div className="rounded-xl border border-[#D5C4B0] overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-xs text-left">
                    <thead className="bg-[#FAF7F2] border-b border-[#D5C4B0] text-[#442D1C] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Seed</th>
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3">Permanent ID</th>
                        <th className="py-2.5 px-3 text-right">Rating</th>
                        <th className="py-2.5 px-3 text-center">CCI Category</th>
                        <th className="py-2.5 px-3">City / Club</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D5]">
                      {publishedParticipants.map((tp) => {
                        const p = tp.player;
                        return (
                          <tr key={tp.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono font-medium text-[#594B40]">
                              {tp.seedNumber}
                            </td>

                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleOpenPlayerModal(tp.playerId)}
                                className="font-medium text-[#1C1613] hover:text-[#8E5830] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                              >
                                {p?.title && p.title !== "None" && (
                                  <span className="px-1 py-0.5 rounded text-[10px] font-mono font-bold bg-[#442D1C] text-[#FAF7F2]">
                                    {p.title}
                                  </span>
                                )}
                                <span>{p?.name || "Player " + tp.seedNumber}</span>
                              </button>
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[#594B40]">
                              {p?.localId || "–"}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-medium text-[#1C1613]">
                              {p?.rating || tp.initialRating}
                            </td>

                            <td className="py-2.5 px-3 text-center text-[#594B40]">
                              {tp.cciCategory?.categoryName || "Domestic"}
                            </td>

                            <td className="py-2.5 px-3 text-[#594B40]">
                              {p?.club || (p as any)?.city || "Chess Community India"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REGULATIONS */}
          {detailTab === "regulations" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl p-5 bg-[#FAF7F2] border border-[#D5C4B0] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1C1613] border-b border-[#D5C4B0] pb-2">
                  Official Tiebreak Criteria
                </h3>
                <ol className="space-y-2 text-xs text-[#594B40] list-decimal list-inside font-medium leading-relaxed">
                  <li>
                    <strong className="text-[#1C1613]">Direct Encounter:</strong> Results of games
                    between tied competitors.
                  </li>
                  <li>
                    <strong className="text-[#1C1613]">Buchholz Cut 1:</strong> Sum of opponent
                    scores, discarding the lowest opponent score.
                  </li>
                  <li>
                    <strong className="text-[#1C1613]">Buchholz Total:</strong> Sum of all opponent
                    scores across all rounds.
                  </li>
                  <li>
                    <strong className="text-[#1C1613]">Sonneborn-Berger:</strong> Sum of scores of
                    defeated opponents plus half of drawn opponents.
                  </li>
                  <li>
                    <strong className="text-[#1C1613]">Greater Number of Wins:</strong> Total
                    tournament victories.
                  </li>
                  <li>
                    <strong className="text-[#1C1613]">Games with Black:</strong> Color balance bonus.
                  </li>
                </ol>
              </div>

              <div className="rounded-xl p-5 bg-[#FAF7F2] border border-[#D5C4B0] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1C1613] border-b border-[#D5C4B0] pb-2">
                  Tournament Arbiter Desk
                </h3>
                <div className="space-y-2 text-xs text-[#594B40]">
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Format</span>
                    <span>Swiss System (FIDE compliant)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Time Control</span>
                    <span>{activeTournament.timeControlString || "Rapid 15m + 10s"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Chief Arbiter</span>
                    <span>{activeTournament.chiefArbiter || "International Arbiter Panel"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Sanctioning Body</span>
                    <span>Chess Community India</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-[#1C1613]">Venue</span>
                    <span>{activeTournament.venue || "Central Arena"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. TOURNAMENT DIRECTORY                                                   */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Status Tabs & Filters */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl glass-panel">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    sound.playTactileClick();
                    setStatusFilter(s);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${statusFilter === s
                    ? "bg-[#442D1C] text-[#FAF7F2]"
                    : "bg-white text-[#594B40] hover:bg-[#EAE2D5] border border-[#D5C4B0]"
                    }`}
                >
                  {s === "ALL"
                    ? "All Tournaments"
                    : s === "LIVE"
                      ? "Live"
                      : s === "UPCOMING"
                        ? "Upcoming"
                        : "Completed"}
                </button>
              ))}
            </div>

            {/* City & Search Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#594B40]">City:</span>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white rounded-lg border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c === "ALL" ? "All Cities" : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8E5830] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tournaments..."
                  className="pl-8 pr-3 py-1 rounded-lg text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830] w-48 sm:w-56"
                />
              </div>
            </div>
          </section>

          {/* Tournaments Grid */}
          {filteredTournaments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-[#D5C4B0] space-y-2">
              <h3 className="font-serif font-bold text-base text-[#1C1613]">No Tournaments Found</h3>
              <p className="text-xs text-[#6B5E52] max-w-sm mx-auto">
                No published tournaments match your selected criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTournaments.map((t) => {
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTournament(t.id)}
                    className="group rounded-2xl p-5 glass-card cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        {renderStatusBadge(t.status)}
                        <span className="text-xs text-[#594B40] font-medium">
                          {t.roundsCount} Rounds
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-base text-[#1C1613] group-hover:text-[#8E5830] transition-colors line-clamp-2 leading-snug">
                        {t.name}
                      </h3>

                      {t.description && (
                        <p className="text-xs text-[#594B40] line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-[#EAE2D5] text-xs text-[#594B40]">
                      <div className="flex items-center justify-between">
                        <span>{t.city || "Jabalpur"}</span>
                        <span>{t.startDate || "Active"}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>{t.timeControlString || "Rapid"}</span>
                        <span>{t.playersCount || 0} Registered</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 font-semibold text-[#8E5830]">
                        <span>View Pairings & Standings</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PUBLIC PLAYER PROFILE MODAL (Strict Read-Only)                          */}
      {/* ========================================================================= */}
      {inspectedPlayerProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectPlayerId(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#FAF7F2] rounded-2xl border border-[#D5C4B0] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#1C1613]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#D5C4B0] flex items-start justify-between bg-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EFE8DD] text-[#442D1C] border border-[#D5C4B0]">
                    {inspectedPlayerProfile.cciPlayerId}
                  </span>
                  {inspectedPlayerProfile.title && inspectedPlayerProfile.title !== "None" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#442D1C] text-[#FAF7F2]">
                      {inspectedPlayerProfile.title}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-[#594B40]">
                    {inspectedPlayerProfile.category.name}
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#1C1613]">
                  {inspectedPlayerProfile.name}
                </h2>
                <p className="text-xs text-[#594B40]">
                  {inspectedPlayerProfile.city || "Jabalpur"} &bull;{" "}
                  {inspectedPlayerProfile.club || "Chess Community India"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectPlayerId(null)}
                className="w-7 h-7 rounded-lg hover:bg-[#F4EFEA] text-[#594B40] hover:text-[#1C1613] flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Ratings Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
                  <span className="text-[10px] font-medium text-[#6B5E52] block">CCI Standard</span>
                  <span className="text-lg font-serif font-bold text-[#1C1613]">
                    {inspectedPlayerProfile.rating}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
                  <span className="text-[10px] font-medium text-[#6B5E52] block">CCI Rapid</span>
                  <span className="text-lg font-serif font-bold text-[#1C1613]">
                    {inspectedPlayerProfile.ratingRapid || inspectedPlayerProfile.rating}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#D5C4B0] text-center space-y-0.5">
                  <span className="text-[10px] font-medium text-[#6B5E52] block">FIDE Rating</span>
                  <span className="text-lg font-serif font-bold text-[#1C1613]">
                    {inspectedPlayerProfile.fideId
                      ? inspectedPlayerProfile.ratingClassic || inspectedPlayerProfile.rating
                      : "Unrated"}
                  </span>
                </div>
              </div>

              {/* Tournament Performance Stats */}
              <div className="p-3.5 rounded-xl bg-white border border-[#D5C4B0] space-y-2">
                <h4 className="font-semibold text-xs text-[#1C1613]">Performance</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[#6B5E52] text-[10px] block">Events</span>
                    <span className="font-bold text-sm text-[#1C1613]">
                      {inspectedPlayerProfile.stats.tournamentsPlayed}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B5E52] text-[10px] block">Games</span>
                    <span className="font-bold text-sm text-[#1C1613]">
                      {inspectedPlayerProfile.stats.gamesPlayed}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B5E52] text-[10px] block">Points</span>
                    <span className="font-bold text-sm text-[#8E5830]">
                      {inspectedPlayerProfile.stats.totalPoints}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B5E52] text-[10px] block">Win Rate</span>
                    <span className="font-bold text-sm text-emerald-800">
                      {inspectedPlayerProfile.stats.winPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Tournament History */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-[#1C1613]">Tournament History</h4>
                {inspectedPlayerTournaments.length === 0 ? (
                  <p className="text-xs text-[#6B5E52] italic p-3 rounded-lg bg-white border border-[#D5C4B0] text-center">
                    No completed tournaments recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#EAE2D5] rounded-xl border border-[#D5C4B0] bg-white overflow-hidden">
                    {inspectedPlayerTournaments.map((tHistory) => (
                      <div
                        key={tHistory.tournamentId}
                        className="p-3 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[#1C1613]">{tHistory.tournamentName}</p>
                          <p className="text-[11px] text-[#594B40]">
                            {tHistory.city || "Jabalpur"} &bull; {tHistory.date || "Active Season"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#8E5830]">
                            {tHistory.points} pts
                          </span>
                          {tHistory.rank && (
                            <span className="text-[10px] text-[#6B5E52] block">
                              Rank #{tHistory.rank} of {tHistory.totalPlayers}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-white border-t border-[#D5C4B0] flex justify-end">
              <button
                type="button"
                onClick={() => setInspectPlayerId(null)}
                className="px-4 py-1.5 rounded-lg bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessPairPublicView;
