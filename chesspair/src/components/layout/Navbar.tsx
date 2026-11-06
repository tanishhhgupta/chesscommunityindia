import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  Building2,
  ChevronDown,
  UserCheck,
  Database,
  ExternalLink,
  Users,
  Compass,
  RotateCcw,
  Sparkles,
  Share2,
} from 'lucide-react';
import { PersonaSwitcherModal } from './PersonaSwitcherModal';
import { OrgModal } from './OrgModal';
import { SupabaseSettingsModal } from './SupabaseSettingsModal';
import { PremiumModal } from './PremiumModal';
import { db } from '../../lib/storage';

interface NavbarProps {
  currentView: string;
  activeTournamentName?: string;
  onNavigate: (view: string, tournamentId?: string) => void;
  onOpenShare?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeTournamentName,
  onNavigate,
  onOpenShare,
}) => {
  const { currentUser } = useAuth();
  const { activeOrg, userRole } = useOrg();

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isTournamentContext = currentView === 'tournament-detail' && activeTournamentName;

  const handleResetData = () => {
    if (confirm('Reset tournament data to ChessManager defaults?')) {
      db.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#442D1C] text-white shadow-md select-none border-b border-[#362315]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Left: Chess:Manager brand + contextual tournament name */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <button
              onClick={() => onNavigate('tournaments')}
              className="flex items-center gap-0.5 text-white font-extrabold text-xl tracking-tight hover:opacity-95 transition-opacity cursor-pointer shrink-0"
            >
              <span>chess</span>
              <span className="text-[#E8D1A7] font-extrabold mx-0.5">:</span>
              <span>manager</span>
            </button>

            {/* Contextual Tournament Title & Share Button */}
            {isTournamentContext && (
              <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-white/20 min-w-0">
                <span className="text-[#FAF7F2] text-xs sm:text-sm font-semibold truncate max-w-[150px] sm:max-w-[280px]">
                  {activeTournamentName}
                </span>

                {onOpenShare && (
                  <button
                    onClick={onOpenShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#583a24] hover:bg-[#6c4822] text-[#E8D1A7] text-xs font-semibold transition-colors cursor-pointer shrink-0 border border-[#6c4822]"
                  >
                    <Users size={13} />
                    <span>Share</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Upgrade to Premium + User Email Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Upgrade to Premium Pill (Golden Batter + Cowhide Cocoa text) */}
            <button
              onClick={() => setIsPremiumModalOpen(true)}
              className="bg-[#E8D1A7] hover:bg-[#ddc190] active:scale-95 text-[#442D1C] font-black text-[11px] sm:text-xs uppercase px-3.5 sm:px-4 py-1.5 rounded-full shadow-sm tracking-wide transition-all cursor-pointer flex items-center gap-1"
            >
              <span>UPGRADE TO PREMIUM</span>
            </button>

            {/* User Email Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 text-xs text-white/95 hover:text-white font-medium py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {currentUser.email || 'tanay.trait@gmail.com'}
                </span>
                <ChevronDown size={13} className="text-white/70" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        {userRole}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsPersonaModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck size={14} className="text-[#84592B]" />
                        <span>Switch Persona (RBAC)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsOrgModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 size={14} className="text-[#84592B]" />
                        <span>Club: {activeOrg.name}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('public-portal');
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Compass size={14} className="text-[#84592B]" />
                        <span>Spectator View</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsDbModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Database size={14} className="text-[#84592B]" />
                        <span>Supabase & Cloud Sync</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleResetData();
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw size={14} className="text-amber-600" />
                        <span>Reset Sample Data</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          alert('Signed out.');
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <PersonaSwitcherModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />
      <OrgModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />
      <SupabaseSettingsModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </>
  );
};
