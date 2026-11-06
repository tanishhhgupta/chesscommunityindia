import React, { useState, useEffect, useMemo, useRef } from "react";
import { sound } from "../../lib/audio";
import { playerAuthStore, UserAccount } from "../../lib/storage/playerAuthStore";
import { 
  contentStore, 
  LandingPageContent, 
  EditableCityChapter, 
  EditableEventItem, 
  EditableJobPost, 
  AboutPageContent, 
  WorkWithUsContent, 
  MediaAsset, 
  FormSubmission, 
  WebsiteSettings, 
  ContentAuditEntry 
} from "../../lib/storage/contentStore";
import { tournamentRepository } from "../../lib/domain/store/tournamentRepository";
import { 
  Tournament, 
  Player, 
  Round, 
  Pairing, 
  MatchResult, 
  StandingsRow 
} from "../../lib/domain/types";
import { ExportService } from "../../lib/domain/services/ExportService";
import { db as chesspairDb } from "../../chesspair/lib/storage";
import { getCCICategory, CCI_CATEGORIES } from "../../chesspair/lib/cciAdapter";
import confetti from "canvas-confetti";
import { MediaGalleryManager } from "./media/MediaGalleryManager";
import { MediaUploadModal } from "./media/MediaUploadModal";
import { PartnerManager } from "./partners/PartnerManager";
import { 
  LayoutDashboard, 
  Globe, 
  MapPin, 
  Calendar, 
  Trophy, 
  Swords, 
  Users, 
  Briefcase, 
  Handshake, 
  Info, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  ShieldCheck, 
  History, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ExternalLink, 
  Download, 
  Upload, 
  Save, 
  RefreshCw, 
  LogOut, 
  Lock, 
  AlertTriangle, 
  Menu, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  Copy, 
  UserCheck, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Layers
} from "lucide-react";

interface AdminPanelProps {
  onNavigate: (view: string, param?: string) => void;
  initialModule?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate, initialModule }) => {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => playerAuthStore.getCurrentUser());
  useEffect(() => {
    return playerAuthStore.subscribe(() => {
      setCurrentUser(playerAuthStore.getCurrentUser());
    });
  }, []);

  const isAuthorized = currentUser && (currentUser.role === "admin" || currentUser.role === "arbiter");

  // Navigation Module Selection
  const [activeModule, setActiveModule] = useState<string>(() => {
    if (initialModule) {
      return initialModule === "chess-manager" ? "chessmanager" : initialModule;
    }
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes("/admin/chessmanager") || pathname.includes("/admin/chess-manager")) {
        return "chessmanager";
      }
      const hash = window.location.hash.replace("#", "").trim();
      const parts = hash.split("/");
      if (parts[0] === "admin" && (parts[1] === "chessmanager" || parts[1] === "chess-manager")) {
        return "chessmanager";
      }
      if (parts[0] === "chessmanager" || parts[0] === "chess-manager") {
        return "chessmanager";
      }
      if (parts[0] === "admin" && parts[1]) {
        return parts[1];
      }
    }
    return "dashboard";
  });

  // UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [cmFullscreen, setCmFullscreen] = useState(false);
  const [cmIframeKey, setCmIframeKey] = useState(0);

  // Sync hash changes with activeModule
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      const parts = hash.split("/");
      if (parts[0] === "admin" && parts[1]) {
        setActiveModule(parts[1] === "chess-manager" ? "chessmanager" : parts[1]);
      } else if (parts[0] === "chessmanager" || parts[0] === "chess-manager") {
        setActiveModule("chessmanager");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (initialModule) {
      setActiveModule(initialModule === "chess-manager" ? "chessmanager" : initialModule);
    }
  }, [initialModule]);

  // Sync timestamps
  const [contentTimestamp, setContentTimestamp] = useState(Date.now());
  const [domainTimestamp, setDomainTimestamp] = useState(Date.now());

  useEffect(() => {
    const handleContentSync = () => setContentTimestamp(Date.now());
    const handleDomainSync = () => setDomainTimestamp(Date.now());
    window.addEventListener("cci-content-synced", handleContentSync);
    window.addEventListener("cci-domain-db-synced", handleDomainSync);
    return () => {
      window.removeEventListener("cci-content-synced", handleContentSync);
      window.removeEventListener("cci-domain-db-synced", handleDomainSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // LOGIN FORM STATE (For unauthenticated /admin visitors)
  // ---------------------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    const res = playerAuthStore.login(loginEmail.trim(), loginPassword);
    if (!res.success || !res.user) {
      setLoginError(res.error || "Invalid email or password.");
      return;
    }

    if (res.user.role !== "admin" && res.user.role !== "arbiter") {
      setLoginError("Access denied: This account lacks administrative permissions.");
      playerAuthStore.logout();
      return;
    }

    sound.playGoldenChord();
    showToast(`Welcome back, ${res.user.fullName}!`);
  };

  const handleLogout = () => {
    sound.playTactileClick();
    playerAuthStore.logout();
    showToast("Signed out from administrative console.");
  };

  // ---------------------------------------------------------------------------
  // DATA SUBSCRIPTIONS (ContentStore, DomainStore, ChesspairDB)
  // ---------------------------------------------------------------------------
  const landingContent = useMemo(() => contentStore.getLandingContent(), [contentTimestamp]);
  const allCities = useMemo(() => contentStore.getCities(true), [contentTimestamp]);
  const allEvents = useMemo(() => contentStore.getEvents(true), [contentTimestamp]);
  const allJobs = useMemo(() => contentStore.getJobs(true), [contentTimestamp]);
  const aboutContent = useMemo(() => contentStore.getAboutContent(), [contentTimestamp]);
  const workContent = useMemo(() => contentStore.getWorkWithUsContent(), [contentTimestamp]);
  const mediaAssets = useMemo(() => contentStore.getMediaAssets(), [contentTimestamp]);
  const formSubmissions = useMemo(() => contentStore.getFormSubmissions(), [contentTimestamp]);
  const settings = useMemo(() => contentStore.getSettings(), [contentTimestamp]);
  const auditLogs = useMemo(() => contentStore.getAuditLogs(), [contentTimestamp]);

  // Tournament Domain Data
  const allTournaments = useMemo(() => tournamentRepository.getAllTournaments(), [domainTimestamp]);
  const allPlayers = useMemo(() => tournamentRepository.getAllPlayers(), [domainTimestamp]);
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(() => {
    const active = tournamentRepository.getActiveTournament();
    return active ? active.id : (allTournaments[0]?.id || "");
  });

  const activeTourney = useMemo(() => {
    return tournamentRepository.getTournamentById(selectedTourneyId) || allTournaments[0] || tournamentRepository.getActiveTournament();
  }, [selectedTourneyId, allTournaments, domainTimestamp]);

  const activeRounds = useMemo(() => {
    if (!activeTourney) return [];
    return tournamentRepository.getTournamentRounds(activeTourney.id);
  }, [activeTourney, domainTimestamp]);

  const [selectedRoundNum, setSelectedRoundNum] = useState<number>(activeTourney?.currentRoundNumber || 1);
  const activeRound = useMemo(() => {
    return activeRounds.find(r => r.number === selectedRoundNum) || activeRounds[0];
  }, [activeRounds, selectedRoundNum]);

  const activePairings = useMemo(() => {
    if (!activeRound) return [];
    return tournamentRepository.getActivePairingsForRound(activeRound.id);
  }, [activeRound, domainTimestamp]);

  const activeStandings = useMemo(() => {
    if (!activeTourney) return [];
    return tournamentRepository.getStandings(activeTourney.id);
  }, [activeTourney, domainTimestamp]);

  const activeTourneyPlayers = useMemo(() => {
    if (!activeTourney) return [];
    return tournamentRepository.getTournamentPlayers(activeTourney.id);
  }, [activeTourney, domainTimestamp]);

  // Player Map
  const playerMap = useMemo(() => {
    return new Map<string, Player>(allPlayers.map(p => [p.id, p]));
  }, [allPlayers]);

  // Sub-tab states for editors
  const [landingSubTab, setLandingSubTab] = useState<"hero" | "cities" | "events" | "why" | "chesspair" | "involved" | "newsletter">("hero");
  const [chessManagerSubTab, setChessManagerSubTab] = useState<"tournaments" | "rounds" | "results" | "standings" | "players" | "ratings" | "settings">("tournaments");
  const [settingsSubTab, setSettingsSubTab] = useState<"general" | "navigation" | "seo" | "footer" | "social">("general");
  const [formsSubTab, setFormsSubTab] = useState<"all" | "registrations" | "newsletter" | "work">("all");

  // Modals
  const [editingCity, setEditingCity] = useState<EditableCityChapter | null>(null);
  const [isNewCity, setIsNewCity] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEventItem | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [editingJob, setEditingJob] = useState<EditableJobPost | null>(null);
  const [isNewJob, setIsNewJob] = useState(false);
  const [showNewTourneyModal, setShowNewTourneyModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showMediaPickerModal, setShowMediaPickerModal] = useState<{ onSelect: (url: string) => void } | null>(null);
  const [showPickerUploadModal, setShowPickerUploadModal] = useState(false);

  // New Tournament Form
  const [newTourneyName, setNewTourneyName] = useState("");
  const [newTourneyCity, setNewTourneyCity] = useState("Jabalpur");
  const [newTourneyVenue, setNewTourneyVenue] = useState("South Avenue Arena");
  const [newTourneyFormat, setNewTourneyFormat] = useState<"SWISS" | "ROUND_ROBIN">("SWISS");
  const [newTourneyRounds, setNewTourneyRounds] = useState(5);
  const [newTourneyTime, setNewTourneyTime] = useState(15);
  const [newTourneyIncrement, setNewTourneyIncrement] = useState(10);

  // New Player Form
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerRating, setNewPlayerRating] = useState(1000);
  const [newPlayerCity, setNewPlayerCity] = useState("Jabalpur");
  const [newPlayerFideId, setNewPlayerFideId] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");

  // ---------------------------------------------------------------------------
  // AUTHENTICATION CHECK GATE
  // If user is not authenticated or not an admin, render the login screen
  // ---------------------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F4EFEA] text-[#1C1613] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#8E5830]/20 selection:text-[#1C1613] font-sans">
        
        {/* Subtle decorative curved chess ribbon line */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none">
            <path d="M-100,200 C300,50 600,400 1100,100 C1300,-20 1500,250 1600,300" stroke="#C5A059" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Main Card */}
          <div className="glass-modal rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
            
            {/* Logo & Emblem Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#261811] text-[#C5A059] flex items-center justify-center text-xl shadow-md border border-[#3E291D]">
                ♟
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] tracking-tight">
                Chess Community India
              </h1>
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#EAE2D5] border border-[#D5C4B0] text-[11px] font-sans font-bold tracking-[0.16em] uppercase text-[#8E5830]">
                Admin Panel
              </div>
              <p className="text-xs text-[#7A6E63] font-sans pt-1">
                Manage your website, tournaments and community.
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] placeholder-[#8C7E72] focus:outline-none focus:border-[#8E5830] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] placeholder-[#8C7E72] focus:outline-none focus:border-[#8E5830] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6E63] hover:text-[#1C1613] p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#594B40]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#D5C4B0] text-[#8E5830] focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-[#8E5830] hover:underline cursor-pointer text-[11px]">
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-sans text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                Log In
              </button>
            </form>

            {/* Return to website */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="text-xs text-[#7A6E63] hover:text-[#1C1613] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>&larr; Return to Public Website</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED ADMIN PANEL LAYOUT
  // ---------------------------------------------------------------------------
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "landing", label: "Landing Page", icon: Globe },
    { id: "cities", label: "Cities", icon: MapPin },
    { id: "events", label: "Events", icon: Calendar },
    { id: "chessmanager", label: "ChessManager", icon: Swords },
    { id: "players", label: "Players & Profiles", icon: Users },
    { id: "hiring", label: "Hiring", icon: Briefcase },
    { id: "work", label: "Work With Us", icon: Layers },
    { id: "partners", label: "Partners & Marquee", icon: Handshake },
    { id: "about", label: "About Us", icon: Info },
    { id: "media", label: "Media Library", icon: ImageIcon },
    { id: "forms", label: "Forms & Submissions", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "users", label: "Users & Access", icon: ShieldCheck },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFEA] text-[#1C1613] flex font-sans selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#261811] border border-[#C5A059] text-[#FAF7F2] shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#E6B86A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 1. LEFT SIDEBAR (Dark Brown Aesthetic with Muted Gold Highlights)       */}
      {/* ======================================================================= */}
      <aside
        className={`bg-[#261811] text-[#DCD1C2] border-r border-[#3E291D] shrink-0 transition-all duration-300 flex flex-col justify-between z-30 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-4 border-b border-[#3E291D] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3E291D] text-[#C5A059] flex items-center justify-center text-lg font-bold shrink-0 border border-[#C5A059]/40 shadow-xs">
              ♟
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-serif font-bold text-sm text-[#FAF7F2] tracking-wide leading-tight truncate">
                  Chess Community India
                </span>
                <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#C5A059] font-medium">
                  Admin Panel
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="p-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playTactileClick();
                    setActiveModule(item.id);
                    if (typeof window !== "undefined") {
                      window.location.hash = `admin/${item.id}`;
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-[#3D281D] text-[#FAF7F2] font-semibold shadow-xs border border-[#C5A059]/30"
                      : "text-[#DCD1C2] hover:bg-[#322017] hover:text-[#FAF7F2]"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#E6B86A]" : "text-[#9E8B7D]"}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Session & Public Site Link */}
        <div className="p-3 border-t border-[#3E291D] space-y-2">
          <button
            onClick={() => onNavigate("home")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#C5A059] hover:bg-[#322017] transition-colors cursor-pointer"
            title="Open Public Website"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>View Public Site</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-[#322017] hover:text-rose-200 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ======================================================================= */}
      {/* 2. MAIN ADMIN CONTENT CONTAINER                                         */}
      {/* ======================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#D5C4B0] px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-[#EAE2D5] text-[#594B40] transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="relative hidden sm:block w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7E72]" />
              <input
                type="text"
                placeholder="Search anything in admin..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613] placeholder-[#8C7E72] focus:outline-none focus:border-[#8E5830]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Links */}
            <button
              onClick={() => setActiveModule("chess-manager")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-xs font-semibold text-[#2E221B] transition-colors cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5 text-[#8E5830]" />
              <span>Chess Manager</span>
            </button>

            {/* Current User Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#D5C4B0]">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C5B49E] bg-[#261811] text-[#E6B86A] flex items-center justify-center font-bold text-xs">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.fullName?.charAt(0) || "A"
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#1C1613] leading-tight">
                  {currentUser?.fullName || "Administrator"}
                </span>
                <span className="text-[10px] text-[#8E5830] font-semibold uppercase">
                  {currentUser?.role || "ADMIN"}
                </span>
              </div>
            </div>
          </div>

        </header>

        {/* ===================================================================== */}
        {/* 3. DYNAMIC MODULE RENDERING                                           */}
        {/* ===================================================================== */}
        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* MODULE: DASHBOARD OVERVIEW */}
          {activeModule === "dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Dashboard</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Welcome back to the Chess Community India administrative control desk.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModule("chess-manager")}
                    className="px-4 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tournament Desk</span>
                  </button>
                  <button
                    onClick={() => setActiveModule("landing")}
                    className="px-4 py-2 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span>Edit Website</span>
                  </button>
                </div>
              </div>

              {/* 4 Stat Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveModule("chess-manager")}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] shadow-xs hover:border-[#8E5830] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8E5830] mb-2">
                    <Trophy className="w-5 h-5" />
                    <span className="text-[11px] font-semibold group-hover:translate-x-0.5 transition-transform">View all &rarr;</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C1613]">{allTournaments.length}</div>
                  <div className="text-xs font-medium text-[#6B5E52] mt-1">Total Tournaments</div>
                </div>

                <div 
                  onClick={() => setActiveModule("players")}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] shadow-xs hover:border-[#8E5830] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8E5830] mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-[11px] font-semibold group-hover:translate-x-0.5 transition-transform">View all &rarr;</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C1613]">{allPlayers.length}</div>
                  <div className="text-xs font-medium text-[#6B5E52] mt-1">Total Players in Registry</div>
                </div>

                <div 
                  onClick={() => setActiveModule("events")}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] shadow-xs hover:border-[#8E5830] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8E5830] mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-[11px] font-semibold group-hover:translate-x-0.5 transition-transform">View all &rarr;</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C1613]">
                    {allEvents.filter(e => e.publishedStatus === 'published').length}
                  </div>
                  <div className="text-xs font-medium text-[#6B5E52] mt-1">Active Events</div>
                </div>

                <div 
                  onClick={() => setActiveModule("cities")}
                  className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] shadow-xs hover:border-[#8E5830] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8E5830] mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-[11px] font-semibold group-hover:translate-x-0.5 transition-transform">Manage &rarr;</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#1C1613]">
                    {allCities.filter(c => c.status === 'published').length}
                  </div>
                  <div className="text-xs font-medium text-[#6B5E52] mt-1">Published City Chapters</div>
                </div>
              </div>

              {/* 2 Main Dashboard Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tournaments */}
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-[#1C1613]">Recent Tournaments</h3>
                    <button
                      onClick={() => setActiveModule("chess-manager")}
                      className="text-xs font-semibold text-[#8E5830] hover:underline"
                    >
                      View all tournaments &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#EAE2D5] text-[#8C7E72] font-semibold uppercase tracking-wider">
                          <th className="pb-2.5">#</th>
                          <th className="pb-2.5">Tournament Name</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5">Start Date</th>
                          <th className="pb-2.5 text-right">Players</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {allTournaments.slice(0, 5).map((t, idx) => (
                          <tr key={t.id} className="hover:bg-[#F4EFEA] transition-colors">
                            <td className="py-2.5 font-mono text-[#8C7E72]">{idx + 1}</td>
                            <td className="py-2.5 font-medium text-[#1C1613]">{t.name}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                t.status === "LIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "COMPLETED"
                                  ? "bg-stone-200 text-stone-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-[#6B5E52]">{t.startDate || "2026-10-01"}</td>
                            <td className="py-2.5 text-right font-semibold">{tournamentRepository.getTournamentPlayers(t.id).length || 16}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Updates / Audit Logs */}
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-[#1C1613]">Recent Website Updates</h3>
                    <button
                      onClick={() => setActiveModule("audit")}
                      className="text-xs font-semibold text-[#8E5830] hover:underline"
                    >
                      View all updates &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#EAE2D5] text-[#8C7E72] font-semibold uppercase tracking-wider">
                          <th className="pb-2.5">Section</th>
                          <th className="pb-2.5">Action</th>
                          <th className="pb-2.5">Updated By</th>
                          <th className="pb-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {auditLogs.slice(0, 5).map((log) => (
                          <tr key={log.id} className="hover:bg-[#F4EFEA] transition-colors">
                            <td className="py-2.5 font-medium text-[#1C1613]">{log.section}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-[#EAE2D5] text-[10px] font-bold text-[#594B40]">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 text-[#6B5E52]">{log.actor}</td>
                            <td className="py-2.5 text-right text-[#8C7E72]">
                              {new Date(log.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: LANDING PAGE MANAGER                                        */}
          {/* =================================================================== */}
          {activeModule === "landing" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Landing Page Manager</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Edit content for your website landing page sections while preserving existing animations.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      onNavigate("home");
                    }}
                    className="px-4 py-2 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span>Preview Live</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playGoldenChord();
                      showToast("All Landing Page changes saved & published!");
                    }}
                    className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

              {/* Section Subtabs */}
              <div className="flex items-center gap-2 border-b border-[#D5C4B0] pb-2 overflow-x-auto text-xs font-semibold">
                {[
                  { id: "hero", label: "Hero Section" },
                  { id: "why", label: "Why CCI" },
                  { id: "chesspair", label: "ChessPair Promo" },
                  { id: "involved", label: "Get Involved / Hiring" },
                  { id: "newsletter", label: "Stay Updated (Newsletter)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLandingSubTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      landingSubTab === tab.id
                        ? "bg-[#261811] text-[#FAF7F2] shadow-xs"
                        : "text-[#594B40] hover:bg-[#EAE2D5]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subtab 1: Hero Section */}
              {landingSubTab === "hero" && (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C1613]">Hero Section Content</h3>
                      <p className="text-xs text-[#6B5E52]">Controls the first scroll experience, announcement badge, headline, and calls to action.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#594B40]">
                      <input
                        type="checkbox"
                        checked={landingContent.hero.showSection}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, showSection: e.target.checked }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="rounded border-[#D5C4B0] text-[#8E5830]"
                      />
                      <span>Show Section</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Announcement Pill Text
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.announcementText}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, announcementText: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Announcement Link Destination
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.announcementLink}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, announcementLink: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Main Headline Line 1
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.headlineLine1}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, headlineLine1: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Headline Italic Highlight Word
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.headlineHighlight}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, headlineHighlight: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Headline Line 2
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.headlineLine2}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, headlineLine2: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Sub-headline Paragraph
                      </label>
                      <textarea
                        rows={3}
                        value={landingContent.hero.subheadline}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, subheadline: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Primary Button Text
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.primaryCtaText}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, primaryCtaText: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Primary Button Destination
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.primaryCtaLink}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, primaryCtaLink: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Secondary Button Text
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.secondaryCtaText}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, secondaryCtaText: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">
                        Secondary Button Destination
                      </label>
                      <input
                        type="text"
                        value={landingContent.hero.secondaryCtaLink}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            hero: { ...landingContent.hero, secondaryCtaLink: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Why CCI */}
              {landingSubTab === "why" && (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C1613]">Why CCI (More than tournaments)</h3>
                      <p className="text-xs text-[#6B5E52]">Edit titles, 3 pillars, and accompanying media.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#594B40]">
                      <input
                        type="checkbox"
                        checked={landingContent.whyCci.showSection}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            whyCci: { ...landingContent.whyCci, showSection: e.target.checked }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="rounded border-[#D5C4B0] text-[#8E5830]"
                      />
                      <span>Show Section</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Headline</label>
                      <input
                        type="text"
                        value={landingContent.whyCci.titleLine1 + " " + landingContent.whyCci.titleLine2}
                        onChange={(e) => {
                          const parts = e.target.value.split(" ");
                          contentStore.updateLandingContent({
                            whyCci: {
                              ...landingContent.whyCci,
                              titleLine1: parts.slice(0, 2).join(" "),
                              titleLine2: parts.slice(2).join(" ") || "tournaments."
                            }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={landingContent.whyCci.imageUrl}
                          onChange={(e) => {
                            contentStore.updateLandingContent({
                              whyCci: { ...landingContent.whyCci, imageUrl: e.target.value }
                            }, currentUser?.fullName || "Admin");
                          }}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowMediaPickerModal({
                              onSelect: (url) => {
                                contentStore.updateLandingContent({
                                  whyCci: { ...landingContent.whyCci, imageUrl: url }
                                }, currentUser?.fullName || "Admin");
                                setShowMediaPickerModal(null);
                              }
                            });
                          }}
                          className="px-3 py-2 rounded-xl bg-[#EAE2D5] border border-[#D5C4B0] text-xs font-semibold cursor-pointer"
                        >
                          Pick Media
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={landingContent.whyCci.description}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            whyCci: { ...landingContent.whyCci, description: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 3: ChessPair Promo */}
              {landingSubTab === "chesspair" && (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C1613]">ChessPair Promotional Section</h3>
                      <p className="text-xs text-[#6B5E52]">Controls the promotional banner for the ChessPair platform on the landing page.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#594B40]">
                      <input
                        type="checkbox"
                        checked={landingContent.chessPairPromo.showSection}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            chessPairPromo: { ...landingContent.chessPairPromo, showSection: e.target.checked }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="rounded border-[#D5C4B0] text-[#8E5830]"
                      />
                      <span>Show Section</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Headline</label>
                      <input
                        type="text"
                        value={`${landingContent.chessPairPromo.titleLine1} ${landingContent.chessPairPromo.titleLine2}`}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            chessPairPromo: {
                              ...landingContent.chessPairPromo,
                              titleLine1: e.target.value,
                              titleLine2: ""
                            }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Button Destination</label>
                      <input
                        type="text"
                        value={landingContent.chessPairPromo.ctaLink}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            chessPairPromo: { ...landingContent.chessPairPromo, ctaLink: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={landingContent.chessPairPromo.description}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            chessPairPromo: { ...landingContent.chessPairPromo, description: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 4: Get Involved */}
              {landingSubTab === "involved" && (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C1613]">Get Involved / Hiring Banner</h3>
                      <p className="text-xs text-[#6B5E52]">Manage the call to action for volunteers, arbiters, and partners.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#594B40]">
                      <input
                        type="checkbox"
                        checked={landingContent.getInvolved.showSection}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            getInvolved: { ...landingContent.getInvolved, showSection: e.target.checked }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="rounded border-[#D5C4B0] text-[#8E5830]"
                      />
                      <span>Show Section</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Headline</label>
                      <input
                        type="text"
                        value={landingContent.getInvolved.title}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            getInvolved: { ...landingContent.getInvolved, title: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Button Destination</label>
                      <input
                        type="text"
                        value={landingContent.getInvolved.ctaLink}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            getInvolved: { ...landingContent.getInvolved, ctaLink: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={landingContent.getInvolved.description}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            getInvolved: { ...landingContent.getInvolved, description: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 5: Stay Updated */}
              {landingSubTab === "newsletter" && (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C1613]">Stay Updated / Newsletter Section</h3>
                      <p className="text-xs text-[#6B5E52]">Configure newsletter callout copy and form status.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#594B40]">
                      <input
                        type="checkbox"
                        checked={landingContent.newsletter.showSection}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            newsletter: { ...landingContent.newsletter, showSection: e.target.checked }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="rounded border-[#D5C4B0] text-[#8E5830]"
                      />
                      <span>Show Section</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Headline</label>
                      <input
                        type="text"
                        value={landingContent.newsletter.title}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            newsletter: { ...landingContent.newsletter, title: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Button Text</label>
                      <input
                        type="text"
                        value={landingContent.newsletter.buttonText}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            newsletter: { ...landingContent.newsletter, buttonText: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={landingContent.newsletter.description}
                        onChange={(e) => {
                          contentStore.updateLandingContent({
                            newsletter: { ...landingContent.newsletter, description: e.target.value }
                          }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: CITIES MANAGER                                              */}
          {/* =================================================================== */}
          {activeModule === "cities" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Cities Manager</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Manage all city chapters, meetup venues, chapter leads, and coordinates.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCity({
                      id: `city-${Date.now()}`,
                      slug: "",
                      name: "",
                      tagline: "",
                      description: "",
                      memberCount: 0,
                      weeklyVenues: ["Heritage Café Hub"],
                      leadName: "",
                      leadRole: "Chapter Lead",
                      whatsappUrl: "#",
                      instagramUrl: "#",
                      imageUrl: "/images/redesign/city-jabalpur.jpg",
                      status: "published",
                      order: allCities.length + 1,
                      region: "Central",
                    });
                    setIsNewCity(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add City</span>
                </button>
              </div>

              {/* Cities Table */}
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#EAE2D5] text-[#594B40] font-bold uppercase tracking-wider border-b border-[#D5C4B0]">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">City Name</th>
                        <th className="py-3 px-4">Chapter Title</th>
                        <th className="py-3 px-4">Region</th>
                        <th className="py-3 px-4">Members</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D5]">
                      {allCities.map((city, idx) => (
                        <tr key={city.id} className="hover:bg-[#F4EFEA] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#8C7E72]">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#1C1613]">
                            <div className="flex items-center gap-2.5">
                              <img src={city.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#D5C4B0]" />
                              <div>
                                <div>{city.name}</div>
                                <div className="text-[10px] text-[#8C7E72] font-mono">/{city.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#594B40]">{city.tagline || `${city.name} Chapter`}</td>
                          <td className="py-3 px-4 text-[#6B5E52]">{city.region || "Central"}</td>
                          <td className="py-3 px-4 font-semibold">{city.memberCount || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              city.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-800"
                            }`}>
                              {city.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingCity({ ...city });
                                setIsNewCity(false);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#EAE2D5] text-[#594B40] hover:text-[#1C1613] transition-colors cursor-pointer"
                              title="Edit City"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${city.name} chapter?`)) {
                                  contentStore.deleteCity(city.id, currentUser?.fullName || "Admin");
                                  showToast(`Deleted ${city.name} chapter.`);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="Delete City"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: EVENTS MANAGER                                              */}
          {/* =================================================================== */}
          {activeModule === "events" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Events Manager</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Manage community events, meets, and championship announcements.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      ExportService.downloadCSV(ExportService.exportEventsToCSV(allEvents), "cci-events.csv");
                      showToast("Exported events to CSV");
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingEvent({
                        id: `event-${Date.now()}`,
                        title: "",
                        category: "National Swiss",
                        city: "Jabalpur",
                        venue: "South Avenue Arena",
                        startsAt: "2026-11-20",
                        format: "Swiss 9 Rounds",
                        timeControl: "90 min + 30 sec",
                        entryFee: "₹1,000",
                        prizePool: "₹5,00,000",
                        registeredCount: 0,
                        capacity: 250,
                        status: "upcoming",
                        publishedStatus: "published",
                        order: allEvents.length + 1,
                        description: "",
                        imageUrl: "/images/redesign/event-swiss.jpg",
                      });
                      setIsNewEvent(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* Events Table */}
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#EAE2D5] text-[#594B40] font-bold uppercase tracking-wider border-b border-[#D5C4B0]">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Event Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">City / Venue</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Publication</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D5]">
                      {allEvents.map((evt, idx) => (
                        <tr key={evt.id} className="hover:bg-[#F4EFEA] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#8C7E72]">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#1C1613]">
                            <div>{evt.title}</div>
                            <div className="text-[10px] text-[#8E5830] font-semibold">{evt.category}</div>
                          </td>
                          <td className="py-3 px-4 text-[#594B40]">{evt.startsAt}</td>
                          <td className="py-3 px-4 text-[#6B5E52]">{evt.city} &bull; {evt.venue}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EAE2D5] text-[#594B40]">
                              {evt.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              evt.publishedStatus === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {evt.publishedStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingEvent({ ...evt });
                                setIsNewEvent(false);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#EAE2D5] text-[#594B40] hover:text-[#1C1613] transition-colors cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete event "${evt.title}"?`)) {
                                  contentStore.deleteEvent(evt.id, currentUser?.fullName || "Admin");
                                  showToast(`Deleted event ${evt.title}`);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: CHESSMANAGER (Authentic Standalone Software Integration)    */}
          {/* =================================================================== */}
          {(activeModule === "chessmanager" || activeModule === "chess-manager") && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Outer Control & Status Header (strictly kept outside the software interface) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D5C4B0]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613]">ChessManager</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8D1A7] text-[#442D1C] border border-[#D5C4B0]">
                      Official Standalone Software
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5E52] mt-0.5">
                    Tournament administration &bull; Swiss pairing engine &bull; Arbiter desk &bull; Rating &amp; tiebreaks &bull; Isolated runtime
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCmIframeKey((k) => k + 1);
                      showToast("Reloaded ChessManager instance");
                    }}
                    className="px-3 py-1.5 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Reload application instance"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span className="hidden sm:inline">Reload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCmFullscreen(!cmFullscreen)}
                    className="px-3 py-1.5 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={cmFullscreen ? "Exit full view" : "Expand to full viewport"}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span>{cmFullscreen ? "Standard View" : "Full View"}</span>
                  </button>

                  <a
                    href="/chessmanager/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    title="Open standalone ChessManager in dedicated full window / monitor"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#E8D1A7]" />
                    <span>Open in New Window</span>
                  </a>
                </div>
              </div>

              {/* Secure Sandboxed Viewport: 100% Preservation of Original Software UI & Logic */}
              <div
                className={
                  cmFullscreen
                    ? "fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col w-screen h-screen"
                    : "w-full flex-1 min-h-[calc(100vh-14rem)] rounded-2xl border border-[#D5C4B0] overflow-hidden shadow-xs bg-[#FAF7F2] flex flex-col"
                }
              >
                {cmFullscreen && (
                  <div className="bg-[#442D1C] text-white px-5 py-2.5 flex items-center justify-between text-xs border-b border-[#362315] select-none shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#FAF7F2] tracking-tight">chess:manager</span>
                      <span className="text-[#E8D1A7] text-[11px]">&bull; Dedicated Tournament Desk View</span>
                      <span className="hidden md:inline text-white/50 text-[10px] ml-2">
                        Session: {currentUser?.fullName} ({currentUser?.role?.toUpperCase()})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCmFullscreen(false)}
                      className="px-3 py-1 rounded-md bg-[#E8D1A7] text-[#442D1C] font-bold text-xs cursor-pointer hover:bg-[#ddc190] transition-colors"
                    >
                      Exit Full View
                    </button>
                  </div>
                )}
                <iframe
                  key={cmIframeKey}
                  src="/chessmanager/index.html"
                  title="ChessManager Software"
                  className="w-full flex-1 border-0 m-0 p-0 block bg-[#FAF7F2]"
                  style={{
                    height: cmFullscreen ? "calc(100vh - 42px)" : "calc(100vh - 14rem)",
                    minHeight: "680px",
                  }}
                  allow="clipboard-read; clipboard-write; fullscreen"
                />
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: PLAYERS & PROFILES                                          */}
          {/* =================================================================== */}
          {activeModule === "players" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Players &amp; Profiles</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Master registry of authenticated Indian chess players, ratings, and FIDE identifiers.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      ExportService.downloadCSV(ExportService.exportPlayersToCSV(allPlayers), "cci-master-players.csv");
                      showToast("Exported players to CSV");
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8E5830]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Player</span>
                  </button>
                </div>
              </div>

              {/* Master Players Table */}
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#EAE2D5] text-[#594B40] font-bold uppercase tracking-wider border-b border-[#D5C4B0]">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-4">CCI ID</th>
                        <th className="py-3 px-4">FIDE ID</th>
                        <th className="py-3 px-4">Standard</th>
                        <th className="py-3 px-4">Rapid</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">City</th>
                        <th className="py-3 px-4 text-right">Win %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D5]">
                      {allPlayers.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-[#F4EFEA] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#8C7E72]">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#1C1613]">{p.name}</td>
                          <td className="py-3 px-4 font-mono text-[#6B5E52]">{p.cciPlayerId}</td>
                          <td className="py-3 px-4 font-mono text-[#8C7E72]">{p.fideId || "—"}</td>
                          <td className="py-3 px-4 font-mono font-bold">{p.cciStandardRating}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#8E5830]">{p.cciRapidRating}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAE2D5] text-[#594B40]">
                              {p.currentCategory?.name || "Category 2"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#6B5E52]">{p.city}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">{p.stats?.winPercentage || 50}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: PARTNERS & COLLABORATORS MARQUEE                            */}
          {/* =================================================================== */}
          {activeModule === "partners" && (
            <PartnerManager
              currentUser={currentUser}
              onToast={showToast}
            />
          )}

          {/* =================================================================== */}
          {/* MODULE: MEDIA LIBRARY & ASSET MANAGER                               */}
          {/* =================================================================== */}
          {activeModule === "media" && (
            <MediaGalleryManager
              currentUser={currentUser}
              onToast={showToast}
            />
          )}

          {/* =================================================================== */}
          {/* MODULE: ABOUT US MANAGER                                            */}
          {/* =================================================================== */}
          {activeModule === "about" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">About Us Manager</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Manage origin story, history, mission statement, and core values.</p>
                </div>
                <button
                  onClick={() => {
                    sound.playGoldenChord();
                    showToast("About Us content updated successfully!");
                  }}
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Headline</label>
                    <input
                      type="text"
                      value={aboutContent.headlineLine1 + " " + aboutContent.headlineLine2}
                      onChange={(e) => {
                        const parts = e.target.value.split(" ");
                        contentStore.updateAboutContent({
                          headlineLine1: parts.slice(0, 2).join(" "),
                          headlineLine2: parts.slice(2).join(" ") || "a Game."
                        }, currentUser?.fullName || "Admin");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Story Heading</label>
                    <input
                      type="text"
                      value={aboutContent.storyHeading}
                      onChange={(e) => {
                        contentStore.updateAboutContent({ storyHeading: e.target.value }, currentUser?.fullName || "Admin");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Subheadline</label>
                    <textarea
                      rows={2}
                      value={aboutContent.subheadline}
                      onChange={(e) => {
                        contentStore.updateAboutContent({ subheadline: e.target.value }, currentUser?.fullName || "Admin");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Story Paragraph 1</label>
                    <textarea
                      rows={3}
                      value={aboutContent.storyParagraph1}
                      onChange={(e) => {
                        contentStore.updateAboutContent({ storyParagraph1: e.target.value }, currentUser?.fullName || "Admin");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Story Paragraph 2</label>
                    <textarea
                      rows={3}
                      value={aboutContent.storyParagraph2}
                      onChange={(e) => {
                        contentStore.updateAboutContent({ storyParagraph2: e.target.value }, currentUser?.fullName || "Admin");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: HIRING & WORK WITH US                                       */}
          {/* =================================================================== */}
          {(activeModule === "hiring" || activeModule === "work") && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">
                    {activeModule === "hiring" ? "Hiring Manager" : "Work With Us Manager"}
                  </h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Manage open roles, fellowships, arbiters, and collaboration tracks.</p>
                </div>
                {activeModule === "hiring" && (
                  <button
                    onClick={() => {
                      setEditingJob({
                        id: `job-${Date.now()}`,
                        title: "",
                        department: "Tournament Operations",
                        type: "Full-time",
                        location: "Jabalpur / Delhi / Remote",
                        compensation: "Competitive",
                        description: "",
                        requirements: ["Passion for Indian grassroots chess"],
                        publishedStatus: "published",
                      });
                      setIsNewJob(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                )}
              </div>

              {activeModule === "hiring" ? (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#EAE2D5] text-[#594B40] font-bold uppercase tracking-wider border-b border-[#D5C4B0]">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Role Title</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {allJobs.map((job, idx) => (
                          <tr key={job.id} className="hover:bg-[#F4EFEA] transition-colors">
                            <td className="py-3 px-4 font-mono text-[#8C7E72]">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-[#1C1613]">{job.title}</td>
                            <td className="py-3 px-4 text-[#594B40]">{job.department}</td>
                            <td className="py-3 px-4 text-[#6B5E52]">{job.type}</td>
                            <td className="py-3 px-4 text-[#6B5E52]">{job.location}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                job.publishedStatus === "published" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-800"
                              }`}>
                                {job.publishedStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingJob({ ...job });
                                  setIsNewJob(false);
                                }}
                                className="p-1.5 rounded-lg hover:bg-[#EAE2D5] text-[#594B40] hover:text-[#1C1613] transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete job "${job.title}"?`)) {
                                    contentStore.deleteJob(job.id, currentUser?.fullName || "Admin");
                                    showToast(`Deleted ${job.title}`);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Headline</label>
                      <input
                        type="text"
                        value={workContent.headline}
                        onChange={(e) => {
                          contentStore.updateWorkWithUsContent({ headline: e.target.value }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Kicker</label>
                      <input
                        type="text"
                        value={workContent.kicker}
                        onChange={(e) => {
                          contentStore.updateWorkWithUsContent({ kicker: e.target.value }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Subheadline</label>
                      <textarea
                        rows={3}
                        value={workContent.subheadline}
                        onChange={(e) => {
                          contentStore.updateWorkWithUsContent({ subheadline: e.target.value }, currentUser?.fullName || "Admin");
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: FORMS & SUBMISSIONS                                         */}
          {/* =================================================================== */}
          {activeModule === "forms" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Forms &amp; Submissions</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">View and export incoming registrations, volunteer inquiries, and newsletter signups.</p>
                </div>
                <button
                  onClick={() => {
                    ExportService.downloadCSV(ExportService.exportSubmissionsToCSV(formSubmissions), "cci-submissions.csv");
                    showToast("Exported submissions to CSV");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#8E5830]" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] overflow-hidden shadow-xs">
                {formSubmissions.length === 0 ? (
                  <div className="p-12 text-center text-[#8C7E72] text-xs">
                    No submissions recorded yet. Inquiries and registrations submitted on the website will be securely logged here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#EAE2D5] text-[#594B40] font-bold uppercase tracking-wider border-b border-[#D5C4B0]">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Phone / City</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {formSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-[#F4EFEA] transition-colors">
                            <td className="py-3 px-4 text-[#8C7E72]">{new Date(sub.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 font-bold text-[#8E5830] uppercase text-[10px]">{sub.type}</td>
                            <td className="py-3 px-4 font-bold text-[#1C1613]">{sub.name || "—"}</td>
                            <td className="py-3 px-4 text-[#594B40]">{sub.email}</td>
                            <td className="py-3 px-4 text-[#6B5E52]">{sub.city || sub.phone || "—"}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  contentStore.deleteFormSubmission(sub.id, currentUser?.fullName || "Admin");
                                  showToast("Removed submission.");
                                }}
                                className="p-1 rounded text-rose-700 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: SETTINGS                                                    */}
          {/* =================================================================== */}
          {activeModule === "settings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Website Settings</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Manage global metadata, branding, contact details, and SEO configuration.</p>
                </div>
                <button
                  onClick={() => {
                    sound.playGoldenChord();
                    showToast("Website settings saved!");
                  }}
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Site Title</label>
                    <input
                      type="text"
                      value={settings.siteTitle}
                      onChange={(e) => contentStore.updateSettings({ siteTitle: e.target.value }, currentUser?.fullName || "Admin")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => contentStore.updateSettings({ contactEmail: e.target.value }, currentUser?.fullName || "Admin")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Logo URL</label>
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) => contentStore.updateSettings({ logoUrl: e.target.value }, currentUser?.fullName || "Admin")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => contentStore.updateSettings({ contactPhone: e.target.value }, currentUser?.fullName || "Admin")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Site Description</label>
                    <textarea
                      rows={2}
                      value={settings.siteDescription}
                      onChange={(e) => contentStore.updateSettings({ siteDescription: e.target.value }, currentUser?.fullName || "Admin")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-[#594B40] uppercase tracking-wider mb-1.5">Footer Copyright Line</label>
                    <input
                      type="text"
                      value={settings.footerCopyright}
                      onChange={(e) => contentStore.updateSettings({ footerCopyright: e.target.value }, currentUser?.fullName || "Admin")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-xs text-[#1C1613]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* MODULE: AUDIT LOGS                                                  */}
          {/* =================================================================== */}
          {activeModule === "audit" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-[#1C1613]">Audit Logs</h1>
                  <p className="text-xs text-[#6B5E52] mt-0.5">Chronological record of all content, pairing, and user operations.</p>
                </div>
                <button
                  onClick={() => {
                    const headers = ["ID", "Timestamp", "Actor", "Action", "Section", "Details"];
                    const rows = auditLogs.map(l => [l.id, l.timestamp, l.actor, l.action, l.section, l.details]);
                    ExportService.downloadCSV([headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n'), 'cci-audit-log.csv');
                    showToast("Exported audit log to CSV");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#D5C4B0] bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#1C1613] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#8E5830]" />
                  <span>Export Log</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#FAF7F2] border border-[#D5C4B0] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#EAE2D5] text-[#594B40] font-bold uppercase tracking-wider border-b border-[#D5C4B0]">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Section</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D5]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F4EFEA] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#8C7E72] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1C1613]">{log.actor}</td>
                          <td className="py-3 px-4 font-semibold text-[#8E5830]">{log.section}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-[#EAE2D5] text-[10px] font-bold text-[#594B40]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#594B40]">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================================= */}
      {/* MODALS: ADD / EDIT CITY                                                 */}
      {/* ======================================================================= */}
      {editingCity && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#1C1613]">
                {isNewCity ? "Add New City Chapter" : `Edit City: ${editingCity.name}`}
              </h3>
              <button onClick={() => setEditingCity(null)} className="p-1 rounded-lg hover:bg-[#EAE2D5] cursor-pointer">
                <X className="w-4 h-4 text-[#7A6E63]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingCity.name.trim()) return;
                const finalSlug = editingCity.slug.trim() || editingCity.name.toLowerCase().replace(/\s+/g, '-');
                contentStore.saveCity({ ...editingCity, slug: finalSlug }, currentUser?.fullName || "Admin");
                setEditingCity(null);
                showToast(`Saved city: ${editingCity.name}`);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">City Name</label>
                <input
                  type="text"
                  required
                  value={editingCity.name}
                  onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Slug (URL)</label>
                <input
                  type="text"
                  placeholder="e.g. jabalpur"
                  value={editingCity.slug}
                  onChange={(e) => setEditingCity({ ...editingCity, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Chapter Tagline</label>
                <input
                  type="text"
                  value={editingCity.tagline}
                  onChange={(e) => setEditingCity({ ...editingCity, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingCity.imageUrl}
                  onChange={(e) => setEditingCity({ ...editingCity, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editingCity.status}
                    onChange={(e) => setEditingCity({ ...editingCity, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Region</label>
                  <select
                    value={editingCity.region || "Central"}
                    onChange={(e) => setEditingCity({ ...editingCity, region: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  >
                    <option value="Central">Central</option>
                    <option value="North">North</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setEditingCity(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODALS: ADD / EDIT EVENT                                                */}
      {/* ======================================================================= */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#1C1613]">
                {isNewEvent ? "Add New Event" : `Edit Event: ${editingEvent.title}`}
              </h3>
              <button onClick={() => setEditingEvent(null)} className="p-1 rounded-lg hover:bg-[#EAE2D5] cursor-pointer">
                <X className="w-4 h-4 text-[#7A6E63]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingEvent.title.trim()) return;
                contentStore.saveEvent(editingEvent, currentUser?.fullName || "Admin");
                setEditingEvent(null);
                showToast(`Saved event: ${editingEvent.title}`);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  >
                    <option value="National Swiss">National Swiss</option>
                    <option value="City Rapid">City Rapid</option>
                    <option value="Cafe Blitz">Cafe Blitz</option>
                    <option value="College Championship">College Championship</option>
                    <option value="Youth Workshop">Youth Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.city}
                    onChange={(e) => setEditingEvent({ ...editingEvent, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Venue</label>
                <input
                  type="text"
                  required
                  value={editingEvent.venue}
                  onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Starts At / Date</label>
                  <input
                    type="text"
                    required
                    value={editingEvent.startsAt}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startsAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Publication Status</label>
                  <select
                    value={editingEvent.publishedStatus}
                    onChange={(e) => setEditingEvent({ ...editingEvent, publishedStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODALS: CREATE TOURNAMENT                                               */}
      {/* ======================================================================= */}
      {showNewTourneyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#1C1613]">Create New Tournament</h3>
              <button onClick={() => setShowNewTourneyModal(false)} className="p-1 rounded-lg hover:bg-[#EAE2D5] cursor-pointer">
                <X className="w-4 h-4 text-[#7A6E63]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTourneyName.trim()) return;
                const created = tournamentRepository.createTournament({
                  name: newTourneyName.trim(),
                  format: newTourneyFormat,
                  rounds: Number(newTourneyRounds) || 5,
                  baseTime: Number(newTourneyTime) || 15,
                  increment: Number(newTourneyIncrement) || 10,
                  city: newTourneyCity,
                  venue: newTourneyVenue,
                  ratingType: "RAPID",
                });
                setSelectedTourneyId(created.id);
                setShowNewTourneyModal(false);
                setNewTourneyName("");
                sound.playGoldenChord();
                showToast(`Created tournament: ${created.name}`);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Tournament Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jabalpur Grand Prix 2026"
                  value={newTourneyName}
                  onChange={(e) => setNewTourneyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newTourneyCity}
                    onChange={(e) => setNewTourneyCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Rounds</label>
                  <input
                    type="number"
                    min={3}
                    max={11}
                    value={newTourneyRounds}
                    onChange={(e) => setNewTourneyRounds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Venue</label>
                <input
                  type="text"
                  required
                  value={newTourneyVenue}
                  onChange={(e) => setNewTourneyVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setShowNewTourneyModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODALS: ADD PLAYER                                                      */}
      {/* ======================================================================= */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#1C1613]">Register New Player</h3>
              <button onClick={() => setShowAddPlayerModal(false)} className="p-1 rounded-lg hover:bg-[#EAE2D5] cursor-pointer">
                <X className="w-4 h-4 text-[#7A6E63]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlayerName.trim()) return;
                const created = tournamentRepository.createPlayer({
                  name: newPlayerName.trim(),
                  cciStandardRating: Number(newPlayerRating) || 1000,
                  cciRapidRating: Number(newPlayerRating) || 1000,
                  city: newPlayerCity,
                  fideId: newPlayerFideId.trim() || undefined,
                  email: newPlayerEmail.trim() || undefined,
                });
                if (activeTourney) {
                  tournamentRepository.registerPlayerForTournament(activeTourney.id, created.id);
                }
                setShowAddPlayerModal(false);
                setNewPlayerName("");
                sound.playGoldenChord();
                showToast(`Registered ${created.name} (${created.cciPlayerId}) with 1000 initial Elo.`);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">Initial Rating</label>
                  <input
                    type="number"
                    value={newPlayerRating}
                    onChange={(e) => setNewPlayerRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={newPlayerCity}
                    onChange={(e) => setNewPlayerCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#594B40] uppercase tracking-wider mb-1">FIDE ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 5049382"
                  value={newPlayerFideId}
                  onChange={(e) => setNewPlayerFideId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4EFEA] border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B0] hover:bg-[#EAE2D5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Register Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODALS: MEDIA PICKER WITH DIRECT PC UPLOAD                              */}
      {/* ======================================================================= */}
      {showMediaPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#FAF7F2] rounded-3xl border border-[#D5C4B0] p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1C1613]">Select Image</h3>
                <p className="text-xs text-[#7A6E63]">Pick an existing asset or directly upload a new image from your PC.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPickerUploadModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6B3D22] hover:bg-[#542F19] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from PC</span>
                </button>
                <button onClick={() => setShowMediaPickerModal(null)} className="p-1 rounded-lg hover:bg-[#EAE2D5] cursor-pointer">
                  <X className="w-4 h-4 text-[#7A6E63]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    showMediaPickerModal.onSelect(asset.url);
                    setShowMediaPickerModal(null);
                  }}
                  className="rounded-xl overflow-hidden border border-[#D5C4B0] hover:border-[#8E5830] transition-colors cursor-pointer group"
                >
                  <div className="aspect-[4/3] bg-[#EAE2D5] overflow-hidden">
                    <img src={asset.url} alt={asset.altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-1.5 text-[10px] font-bold text-[#1C1613] truncate bg-white">
                    {asset.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Direct PC Upload for Media Picker */}
      <MediaUploadModal
        isOpen={showPickerUploadModal}
        onClose={() => setShowPickerUploadModal(false)}
        actor={currentUser?.fullName || "Admin"}
        onUploadSuccess={(newAssets) => {
          if (newAssets && newAssets.length > 0 && showMediaPickerModal) {
            showMediaPickerModal.onSelect(newAssets[0].url);
            setShowMediaPickerModal(null);
            setShowPickerUploadModal(false);
            showToast(`Uploaded and selected "${newAssets[0].name}"!`);
          }
        }}
      />

    </div>
  );
};
