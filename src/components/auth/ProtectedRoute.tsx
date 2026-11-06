import React from "react";
import { useAuth } from "../../lib/auth/AuthContext";
import { ShieldAlert, ShieldCheck, Lock, ArrowRight, Home, Sparkles, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "arbiter" | "player")[];
  redirectTo?: string;
  onNavigate?: (view: string, param?: string) => void;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onNavigate,
  fallbackTitle,
  fallbackDescription,
}) => {
  const { isAuthenticated, isLoading, role, user, profile, isConfigured } = useAuth();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl bg-[#1C1613] border border-[#C5A059]/30 flex items-center justify-center shadow-xl">
            <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
          </div>
          <div className="absolute -inset-1 rounded-3xl bg-[#C5A059]/10 blur-md -z-10 animate-pulse" />
        </div>
        <h4 className="text-sm font-sans font-bold tracking-[0.2em] uppercase text-[#1C1613]/70">
          Verifying Passport Credentials
        </h4>
        <p className="text-xs text-[#8E5830] font-serif italic mt-1">
          Synchronizing with Chess Community India secure gateway...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="w-full max-w-lg bg-[#FAF7F2] border border-[#E8DFD5] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center">
          {/* Subtle architectural gold accent background */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#1C1613] border border-[#C5A059]/40 text-[#C5A059] mb-6 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-[#C5A059]/15 text-[#8E5830] border border-[#C5A059]/30 text-[10px] font-sans font-bold tracking-[0.2em] uppercase mb-3">
            Protected Area
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1613] mb-3">
            {fallbackTitle || "Authentication Required"}
          </h2>

          <p className="text-sm text-[#735D4C] font-sans leading-relaxed max-w-md mx-auto mb-8">
            {fallbackDescription ||
              "This portal requires an active Chess Community India player passport or arbiter credentials. Please sign in to verify your identity."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("player-account");
                } else if (typeof window !== "undefined") {
                  window.location.hash = "player-account";
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-sans font-bold uppercase tracking-wider bg-gradient-to-r from-[#C5A059] to-[#D8B26E] text-[#140E0A] hover:shadow-[0_4px_18px_rgba(197,160,89,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In with Supabase</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("home");
                } else if (typeof window !== "undefined") {
                  window.location.hash = "home";
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-full text-xs font-sans font-semibold text-[#735D4C] hover:text-[#1C1613] hover:bg-[#F2ECE4] border border-[#E8DFD5] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>

          {!isConfigured && (
            <div className="mt-8 pt-6 border-t border-[#E8DFD5]/80 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Supabase Local Mode Active</span>
              </div>
              <p className="text-[11px] text-[#735D4C] mt-1">
                You can sign in using local foundation accounts (e.g. <code className="bg-[#E8DFD5] px-1 py-0.5 rounded text-[10px]">tanish@chesscommunity.in</code>) or connect Supabase keys in <code className="bg-[#E8DFD5] px-1 py-0.5 rounded text-[10px]">.env</code> for cloud auth.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Role Authorization Check (BOLA / IDOR Defense)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="w-full max-w-lg bg-[#FAF7F2] border border-rose-200 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-950/10 border border-rose-300 text-rose-700 mb-6 shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-sans font-bold tracking-[0.2em] uppercase mb-3">
            Insufficient Permissions
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1613] mb-3">
            Access Restricted
          </h2>

          <p className="text-sm text-[#735D4C] font-sans leading-relaxed max-w-md mx-auto mb-4">
            This module requires <strong>{allowedRoles.join(" or ")}</strong> privileges. Your active passport is signed in as:
          </p>

          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#EFE9DF] border border-[#DDD4C7] mb-8 text-left">
            <div className="w-8 h-8 rounded-full bg-[#1C1613] text-[#C5A059] flex items-center justify-center text-xs font-bold">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div>
              <div className="text-xs font-bold text-[#1C1613]">
                {profile?.full_name || user?.email}
              </div>
              <div className="text-[10px] text-[#8E5830] font-mono uppercase tracking-wider">
                Current Role: {role}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("player-account");
                } else if (typeof window !== "undefined") {
                  window.location.hash = "player-account";
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-sans font-bold uppercase tracking-wider bg-[#1C1613] hover:bg-[#2C1D14] text-[#FAF7F2] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Switch Account</span>
            </button>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("home");
                } else if (typeof window !== "undefined") {
                  window.location.hash = "home";
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-full text-xs font-sans font-semibold text-[#735D4C] hover:text-[#1C1613] hover:bg-[#F2ECE4] border border-[#E8DFD5] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized: Render content
  return <>{children}</>;
};

