import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import { PawnCursor } from "./components/world/PawnCursor";
import { Continuous3DWorld } from "./components/world/Continuous3DWorld";
import { Navigation } from "./components/layout/Navigation";
import { Footer } from "./components/layout/Footer";
import { WhatsAppButton } from "./components/layout/WhatsAppButton";

// Editorial Views
import { HomeExperience } from "./components/views/HomeExperience";
import { AboutView } from "./components/views/AboutView";
import { EventsView } from "./components/views/EventsView";
import { CommunityView } from "./components/views/CommunityView";
import { CitiesView } from "./components/views/CitiesView";
import { LearnView } from "./components/views/LearnView";
import { PartnersView } from "./components/views/PartnersView";
import { MerchView } from "./components/views/MerchView";
import { JoinView } from "./components/views/JoinView";
import { HiringView } from "./components/views/HiringView";
import { WorkWithUsView } from "./components/views/WorkWithUsView";
import { TournamentDeskView } from "./components/views/TournamentDeskView";
import { AdminDeskView } from "./components/views/AdminDeskView";

// Public & Admin Ecosystem Views
import { TournamentsListView } from "./components/public/TournamentsListView";
import { TournamentPublicDetailView } from "./components/public/TournamentPublicDetailView";
import { PlayersDirectoryView } from "./components/public/PlayersDirectoryView";
import { PlayerPublicProfileView } from "./components/public/PlayerPublicProfileView";
import { RatingsLeaderboardView } from "./components/public/RatingsLeaderboardView";
import { RatingCategoriesView } from "./components/public/RatingCategoriesView";
import { ChessPairPublicView } from "./components/public/ChessPairPublicView";
import { AdminPanel } from "./components/admin/AdminPanel";
import { PlayerPortalView } from "./components/player/PlayerPortalView";
import { PlayerAccountView } from "./components/player/PlayerAccountView";
import { useAppleScrollReveal } from "./lib/useAppleScrollReveal";
import { AuthProvider } from "./lib/auth/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function AppContent() {
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes("/admin")) return "admin";
      if (pathname.includes("/chess-pair")) return "chess-pair";
      const hash = window.location.hash.replace("#", "").trim();
      const params = new URLSearchParams(window.location.search);
      const queryView = params.get("view");
      if (queryView) return queryView;
      if (hash) {
        // Handle routes with param: e.g. tournaments/tourney-national-swiss-2026 or cities/jabalpur
        const parts = hash.split("/");
        if (parts[0] === "admin" || parts[0] === "chess-manager" || parts[0] === "chessmanager") return "admin";
        if (parts[0] === "chess-pair" || parts[0] === "tournaments") return "chess-pair";
        return parts[0];
      }
    }
    return "home";
  });

  const [activeParam, setActiveParam] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "").trim();
      const parts = hash.split("/");
      if (parts[0] === "admin" && (parts[1] === "chessmanager" || parts[1] === "chess-manager")) return "chessmanager";
      if (parts[0] === "chessmanager" || parts[0] === "chess-manager") return "chessmanager";
      if (parts.length > 1) return parts[1];
      const params = new URLSearchParams(window.location.search);
      return params.get("id") || undefined;
    }
    return undefined;
  });
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Apple-inspired scroll observer for seamless reveals
  useAppleScrollReveal(activeView);

  // Initialize luxury smooth momentum scrolling (Lenis) - Untouched & Preserved
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      infinite: false,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ({ progress }: { progress: number }) => {
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Synchronize native window scroll as robust fallback
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.max(0, Math.min(1, scrollY / docHeight)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Handle smooth navigation reset
  const handleNavigate = (view: string, param?: string) => {
    setActiveView(view);
    setActiveParam(param);
    if (typeof window !== "undefined") {
      if (param) {
        window.location.hash = `${view}/${param}`;
      } else {
        window.location.hash = view;
      }
    }
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setScrollProgress(0);
  };

  // Sync hash changes with state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").trim();
      if (!hash) {
        setActiveView("home");
        setActiveParam(undefined);
        return;
      }
      const parts = hash.split("/");
      const rootPart = parts[0] || "home";
      if (rootPart === "admin" || rootPart === "chess-manager" || rootPart === "chessmanager") {
        setActiveView("admin");
        if (rootPart === "chessmanager" || rootPart === "chess-manager" || parts[1] === "chessmanager" || parts[1] === "chess-manager") {
          setActiveParam("chessmanager");
        } else {
          setActiveParam(parts.length > 1 ? parts[1] : undefined);
        }
      } else if (rootPart === "chess-pair" || rootPart === "tournaments") {
        setActiveView("chess-pair");
        setActiveParam(parts.length > 1 ? parts[1] : undefined);
      } else {
        setActiveView(rootPart);
        setActiveParam(parts.length > 1 ? parts[1] : undefined);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const isAdminView = activeView === "admin" || activeView === "chess-manager" || activeView === "chessmanager";

  if (isAdminView) {
    return (
      <div className="relative min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-x-hidden selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
        <PawnCursor />
        <ProtectedRoute
          allowedRoles={["admin", "arbiter"]}
          onNavigate={handleNavigate}
          fallbackTitle="Arbiter & Admin Desk"
          fallbackDescription="Access to the official Chess Community India tournament pairing desk, ledger, and management console requires administrative credentials."
        >
          <AdminPanel
            onNavigate={handleNavigate}
            initialModule={activeParam === "chessmanager" || activeParam === "chess-manager" ? "chessmanager" : undefined}
          />
        </ProtectedRoute>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-x-hidden selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* 1. Custom Minimal Chess Pawn Cursor (Desktop) */}
      <PawnCursor />

      {/* 2. Quiet, Minimal Floating Glass Navigation */}
      <Navigation
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      {/* 4. Main Editorial Storytelling & Tournament Ecosystem Content */}
      <main className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {/* Core Architectural Views */}
        {activeView === "home" && <HomeExperience onNavigate={handleNavigate} />}
        {activeView === "about" && <AboutView onNavigate={handleNavigate} />}
        {activeView === "community" && <CommunityView onNavigate={handleNavigate} />}
        {activeView === "cities" && (
          <CitiesView onNavigate={handleNavigate} initialCitySlug={activeParam} />
        )}
        {activeView === "hiring" && (
          <HiringView onNavigate={handleNavigate} initialJobId={activeParam} />
        )}
        {activeView === "work-with-us" && (
          <WorkWithUsView onNavigate={handleNavigate} />
        )}
        {activeView === "events" && <EventsView onNavigate={handleNavigate} />}
        {activeView === "learn" && <LearnView onNavigate={handleNavigate} />}
        {activeView === "partners" && <PartnersView onNavigate={handleNavigate} />}
        {activeView === "merch" && <MerchView onNavigate={handleNavigate} />}
        {activeView === "join" && <WorkWithUsView onNavigate={handleNavigate} />}

        {/* Authenticated Player Account System & Personal Dashboard */}
        {(activeView === "player-account" || 
          activeView === "account" || 
          activeView === "login" || 
          activeView === "player-dashboard" || 
          activeView === "player") && (
          <PlayerAccountView onNavigate={handleNavigate} />
        )}

        {/* Public ChessPair User Platform */}
        {(activeView === "chess-pair" || activeView === "tournaments" || activeView === "tournament-detail") && (
          <ChessPairPublicView
            initialTournamentId={activeParam}
            onNavigate={handleNavigate}
          />
        )}
        {activeView === "players" && (
          <PlayersDirectoryView
            initialCategory={activeParam}
            onNavigate={handleNavigate}
          />
        )}
        {activeView === "player-profile" && (
          <PlayerPublicProfileView
            playerId={activeParam || "p-01"}
            onNavigate={handleNavigate}
          />
        )}
        {activeView === "ratings" && (
          <RatingsLeaderboardView onNavigate={handleNavigate} />
        )}
        {activeView === "rating-categories" && (
          <RatingCategoriesView onNavigate={handleNavigate} />
        )}

        {/* Legacy Tournament Desk fallback */}
        {activeView === "manager" && (
          <TournamentDeskView onNavigate={handleNavigate} />
        )}
      </main>

      {/* 5. WhatsApp Official Community Floating Button */}
      <WhatsAppButton />

      {/* 6. Minimal Monolithic Platform Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
