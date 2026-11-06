import React, { useState, useEffect, useRef } from "react";
import { sound } from "../../lib/audio";
import { playerAuthStore, UserAccount } from "../../lib/storage/playerAuthStore";
import { contentStore, resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  Menu, 
  X, 
  User, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  LayoutDashboard,
  ExternalLink 
} from "lucide-react";

interface NavigationProps {
  activeView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => playerAuthStore.getCurrentUser());
  const [siteSettings, setSiteSettings] = useState(() => contentStore.getSettings());

  const profileRef = useRef<HTMLDivElement | null>(null);

  // Synchronize dynamic website settings (including logo) from ContentStore
  useEffect(() => {
    const sync = () => setSiteSettings(contentStore.getSettings());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  // Scroll detection for enhanced glass depth
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for user account & authentication changes
  useEffect(() => {
    const unsub = playerAuthStore.subscribe(() => {
      setCurrentUser(playerAuthStore.getCurrentUser());
    });
    return unsub;
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // The 6 Primary Architectural Sections with consistent routing
  const links = [
    { id: "cities", label: "Cities" },
    { id: "hiring", label: "Hiring" },
    { id: "work-with-us", label: "Work With Us" },
    { id: "about", label: "About Us" },
    { id: "events", label: "Events" },
    { id: "chess-pair", label: "Chess Pair" },
  ];

  const handleLinkClick = (id: string, param?: string) => {
    sound.playTactileClick();
    onNavigate(id, param);
    setMobileOpen(false);
    setProfileDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    sound.playTactileClick();
    playerAuthStore.logout();
    setProfileDropdownOpen(false);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 cci-premium-header ${
        scrolled ? "is-scrolled py-3 sm:py-3.5" : "py-3.5 sm:py-4"
      }`}
    >
      {/* Subtle chess-inspired texture and warm ambient highlight overlay */}
      <div 
        className="pointer-events-none absolute inset-0 cci-header-chess-texture opacity-70"
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between relative z-10">
        
        {/* =================================================================== */}
        {/* LEFT – BRAND IDENTITY (Prominent Logo, Title & Grassroots Tagline)   */}
        {/* =================================================================== */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => handleLinkClick("home")}
            className="flex items-center gap-3 sm:gap-3.5 group text-left focus:outline-hidden cursor-pointer"
            title="Chess Community India Homepage"
          >
            {/* Enlarged Prominent CCI Emblem */}
            <div className="w-9 h-9 min-[360px]:w-10 min-[360px]:h-10 sm:w-[50px] sm:h-[50px] rounded-xl sm:rounded-2xl bg-[#1E130D]/95 border border-[#C5A059]/45 p-1 sm:p-1.5 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img
                src={resolveMediaUrl(siteSettings.logoUrl, 'brand_logo')}
                alt="Chess Community India"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>

            {/* Brand Title & Secondary Tagline Column */}
            <div className="flex flex-col justify-center select-none">
              <span className="font-serif text-[11px] min-[360px]:text-[12.5px] sm:text-[15px] font-bold tracking-[0.06em] min-[360px]:tracking-[0.10em] sm:tracking-[0.14em] uppercase leading-tight text-[#FAF7F2] group-hover:text-[#FFF] transition-colors whitespace-nowrap">
                CHESS COMMUNITY INDIA
              </span>
              <span className="font-serif italic text-[9.5px] min-[360px]:text-[10px] sm:text-[11.5px] font-normal tracking-[0.02em] sm:tracking-[0.03em] text-[#D8B26E] mt-0.5 leading-none">
                India's Grassroots Chess Network
              </span>
            </div>
          </button>

          {/* Subtle Vertical Divider between Brand Identity and Navigation */}
          <div 
            className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-[#C5A059]/35 to-transparent mx-4 xl:mx-6 shrink-0" 
            aria-hidden="true" 
          />
        </div>

        {/* =================================================================== */}
        {/* CENTRE – SECTION NAVIGATION (Consistent Spacing & Understated Gold)  */}
        {/* =================================================================== */}
        <nav
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-sans tracking-[0.07em] font-medium text-[#DCD1C2]"
          aria-label="Main Navigation"
        >
          {links.map((link) => {
            const isActive = activeView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`relative py-1.5 px-1 transition-colors cursor-pointer focus:outline-hidden ${
                  isActive
                    ? "text-[#FAF7F2] font-semibold"
                    : "hover:text-[#FAF7F2]"
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span
                    className="absolute -bottom-1 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent rounded-full shadow-[0_0_8px_rgba(197,160,89,0.7)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* =================================================================== */}
        {/* RIGHT – ACCOUNT & ACTIONS (Admin Desk, User Profile, Join Button)    */}
        {/* =================================================================== */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          
          {/* Admin Desk Shortcut (Accessible to Admins & Arbiters) */}
          {currentUser && (currentUser.role === "admin" || currentUser.role === "arbiter") && (
            <button
              onClick={() => handleLinkClick("admin")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C5A059]/50 hover:border-[#E6C587] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#E6C587] hover:text-[#FAF7F2] text-[11px] font-sans font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
              title="Admin Tournament Desk & Chess Manager"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Admin Desk</span>
            </button>
          )}

          {/* User Profile Pill with Interactive Dropdown */}
          <div className="relative" ref={profileRef}>
            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    sound.playTactileClick();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#241710]/85 hover:bg-[#2F1E16]/95 border border-[#C5A059]/35 hover:border-[#C5A059]/60 text-[#FAF7F2] text-[11px] font-sans font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
                  title="Player Account Options"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-[#C5A059]/60 bg-[#140E0A] flex items-center justify-center shrink-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-[#E6C587]">
                        {currentUser.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="max-w-[100px] truncate">
                    {currentUser.fullName.split(" ")[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-[#C5A059] transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#1A120D]/95 backdrop-blur-xl border border-[#C5A059]/35 p-2 shadow-2xl space-y-1 z-50 animate-fade-in text-left">
                    <div className="p-2.5 border-b border-[#C5A059]/20">
                      <div className="text-xs font-bold text-[#FAF7F2] truncate">
                        {currentUser.fullName}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className="text-[#C5A059] font-mono uppercase">{currentUser.role}</span>
                        {currentUser.city && (
                          <span className="text-[#A39688] font-mono">{currentUser.city}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLinkClick("player-account")}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#DCD1C2] hover:text-[#FAF7F2] hover:bg-[#2C1D14] transition-colors cursor-pointer text-left"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Player Dashboard</span>
                    </button>

                    {(currentUser.role === "admin" || currentUser.role === "arbiter") && (
                      <button
                        onClick={() => handleLinkClick("admin")}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#DCD1C2] hover:text-[#FAF7F2] hover:bg-[#2C1D14] transition-colors cursor-pointer text-left"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E6C587]" />
                        <span>Admin Desk</span>
                      </button>
                    )}

                    <div className="pt-1 border-t border-[#C5A059]/15">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => handleLinkClick("player-account")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C5A059]/35 hover:border-[#C5A059]/60 bg-[#241710]/85 hover:bg-[#2F1E16]/95 text-[#FAF7F2] text-[11px] font-sans font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
                title="Player Sign In or Registration"
              >
                <User className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Refined JOIN Button (Champagne-gold with dark text) */}
          <button
            onClick={() => handleLinkClick("work-with-us")}
            className="px-5 sm:px-6 py-2 rounded-full text-[11px] font-sans tracking-[0.14em] uppercase font-bold bg-gradient-to-r from-[#C5A059] to-[#D8B26E] hover:from-[#D4AF37] hover:to-[#E6C587] text-[#140E0A] shadow-[0_2px_12px_rgba(197,160,89,0.3)] hover:shadow-[0_4px_18px_rgba(197,160,89,0.45)] transition-all active:scale-95 cursor-pointer shrink-0"
          >
            JOIN
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => {
            sound.playTactileClick();
            setMobileOpen(!mobileOpen);
          }}
          className="lg:hidden p-2 text-[#FAF7F2] hover:text-[#C5A059] transition-colors focus:outline-hidden cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* ===================================================================== */}
      {/* MOBILE MENU DRAWER (Premium Dark Glass with Golden Highlights)       */}
      {/* ===================================================================== */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#160F0B]/98 backdrop-blur-2xl border-b border-[#C5A059]/30 p-5 sm:p-6 space-y-4 shadow-2xl animate-fade-in max-h-[calc(100vh-70px)] overflow-y-auto">
          <div className="flex flex-col gap-1.5 text-sm">
            {links.map((link) => {
              const isActive = activeView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`text-left py-2.5 px-3.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "text-[#FAF7F2] bg-[#2C1D14] border border-[#C5A059]/40 font-semibold"
                      : "text-[#DCD1C2] hover:text-[#FAF7F2] hover:bg-[#22160F]"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Mobile Actions Drawer */}
            <div className="pt-3 border-t border-[#C5A059]/20 space-y-2.5">
              {currentUser && (currentUser.role === "admin" || currentUser.role === "arbiter") && (
                <button
                  onClick={() => handleLinkClick("admin")}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[#C5A059]/50 bg-[#C5A059]/10 text-[#E6C587] font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                >
                  <span>Admin Tournament Desk</span>
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                </button>
              )}

              <button
                onClick={() => handleLinkClick("player-account")}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#241710] border border-[#C5A059]/30 text-[#FAF7F2] font-medium text-xs flex items-center justify-between cursor-pointer"
              >
                <span>{currentUser ? `Dashboard (${currentUser.fullName})` : "Player Sign In / Register"}</span>
                <User className="w-4 h-4 text-[#C5A059]" />
              </button>

              <button
                onClick={() => handleLinkClick("work-with-us")}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#C5A059] to-[#D8B26E] text-[#140E0A] font-bold text-center text-xs tracking-[0.14em] uppercase shadow-md active:scale-98 transition-all cursor-pointer"
              >
                JOIN THE MOVEMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
