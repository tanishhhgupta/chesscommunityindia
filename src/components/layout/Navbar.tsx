import React, { useState } from "react";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  Swords, 
  Trophy, 
  Users, 
  Calculator, 
  MapPin, 
  Calendar, 
  Camera, 
  Briefcase, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Volume2, 
  VolumeX, 
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { sound } from "../../lib/audio";

interface NavbarProps {
  onOpenAuth: () => void;
  currentUser: { name: string; role: "player" | "arbiter" | "admin" } | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(sound.enabled);

  const toggleSound = () => {
    const s = sound.toggle();
    setSoundActive(s);
  };

  const navLinks = [
    { label: "HOME", href: "#", icon: Sparkles },
    { label: "ABOUT", href: "#about", icon: Briefcase },
    { label: "EVENTS", href: "#events", icon: Calendar },
    { label: "COMMUNITY", href: "#chapters", icon: MapPin },
    { label: "LEARN", href: "#learn", icon: Trophy },
    { label: "PARTNERS", href: "#partners", icon: Swords },
    { label: "MERCH", href: "#merch", icon: Users },
    { label: "JOIN US", href: "#join-portal", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav-dark transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Title */}
          <a 
            href="#" 
            onClick={() => sound.playTactileClick()}
            className="flex items-center gap-3.5 group shrink-0"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-[#121212] border border-[#C9A45C]/40 flex items-center justify-center p-1 shadow-lg shadow-[#C9A45C]/10 group-hover:scale-105 transition-transform overflow-hidden">
              <img 
                src={resolveMediaUrl("/logos/cci-logo.png", "brand_logo")} 
                alt="CCI Brand Emblem" 
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(201,164,92,0.4)]" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-lg sm:text-xl tracking-tight text-white font-serif-editorial">
                CHESS COMMUNITY <span className="gold-gradient-text">INDIA</span>
              </div>
              <div className="text-[10px] text-[#8D8D8D] font-semibold tracking-widest uppercase flex items-center gap-1.5">
                <span>More Than A Game</span>
                <span className="w-1 h-1 rounded-full bg-[#C9A45C]" />
                <span className="text-[#C9A45C]">FIDE Swiss</span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-bold text-slate-300">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => sound.playTactileClick()}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-xl hover:text-chess-gold hover:bg-white/5 transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-chess-gold/70" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all ${
                soundActive 
                  ? "bg-chess-gold/15 border-chess-gold/40 text-chess-gold" 
                  : "bg-white/5 border-[rgba(245, 242, 235,0.06)] text-slate-400 hover:text-white"
              }`}
              title={soundActive ? "Mute Tactile Audio" : "Unmute Audio"}
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* User Auth or Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-[rgba(245, 242, 235,0.06)]">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5 text-chess-gold" />
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-chess-gold font-mono font-semibold uppercase">
                    Role: {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.playTactileClick();
                    onLogout();
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-300 border border-[rgba(245, 242, 235,0.06)] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="#join-portal"
                onClick={() => sound.playTactileClick()}
                className="gold-gradient-btn px-4 py-2.5 rounded-xl text-[#080808] font-black text-xs flex items-center gap-2 shadow-lg hover:scale-102 transition-transform"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>JOIN COMMUNITY</span>
              </a>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#070c12] border-b border-[rgba(245, 242, 235,0.06)] p-5 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    sound.playTactileClick();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 text-slate-200 hover:text-chess-gold hover:bg-white/10"
                >
                  <Icon className="w-4 h-4 text-chess-gold" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
