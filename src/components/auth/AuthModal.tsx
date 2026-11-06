import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Globe,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { name: string; role: "player" | "arbiter" | "admin" }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("Jabalpur");
  const [chessRole, setChessRole] = useState<"player" | "arbiter">("player");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password, {
          fullName,
          city,
        });

        if (!res.success) {
          setErrorMessage(res.error || "Signup failed. Please verify your details.");
        } else {
          if (res.requiresEmailConfirmation) {
            setInfoMessage("Verification link sent! Please check your email to activate your account.");
          } else {
            if (onSuccess) {
              onSuccess({
                name: fullName || email.split("@")[0],
                role: chessRole,
              });
            }
            onClose();
          }
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setErrorMessage(res.error || "Invalid email or password.");
        } else {
          if (onSuccess) {
            onSuccess({
              name: email.split("@")[0],
              role: "player",
            });
          }
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await signInWithOAuth(provider);
      if (!res.success) {
        setErrorMessage(res.error || "Social authentication failed.");
      } else {
        if (onSuccess) {
          onSuccess({ name: "Chess Grandmaster", role: "player" });
        }
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "OAuth login error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay animate-fade-in">
      <div className="glass-modal-dark w-full max-w-md rounded-3xl p-6 sm:p-8 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-chess-gold/15 border border-chess-gold/30 text-chess-gold mb-3 shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {isSignUp ? "Join Chess Community India" : "Sign In to CCI"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your live ratings, Swiss pairings, and tournament passports.
          </p>
          {!isConfigured && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400">
              Dev Fallback Mode
            </span>
          )}
        </div>

        {/* Error / Info Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2 mb-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("google")}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2e3748] hover:bg-[#3b475d] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[rgba(245,242,235,0.06)] transition-colors disabled:opacity-60"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Continue with Google OAuth
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("github")}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[rgba(245,242,235,0.06)] transition-colors disabled:opacity-60"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[11px] text-slate-500 uppercase tracking-wider">or with email</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tanish Gupta"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-[rgba(245,242,235,0.06)] text-white text-sm focus:outline-none focus:border-chess-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">City Chapter</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Jabalpur, Indore, Bhopal"
                  className="w-full mt-1 px-4 py-2 rounded-xl bg-slate-900 border border-[rgba(245,242,235,0.06)] text-white text-sm focus:outline-none focus:border-chess-gold transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@chesscommunity.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-[rgba(245,242,235,0.06)] text-white text-sm focus:outline-none focus:border-chess-gold transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-[rgba(245,242,235,0.06)] text-white text-sm focus:outline-none focus:border-chess-gold transition-colors"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs font-medium text-slate-300">Community Role</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setChessRole("player")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${chessRole === "player"
                    ? "bg-chess-gold/20 text-chess-gold border-chess-gold"
                    : "bg-slate-900 text-slate-400 border-[rgba(245,242,235,0.06)]"
                    }`}
                >
                  Competitor / Player
                </button>
                <button
                  type="button"
                  onClick={() => setChessRole("arbiter")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${chessRole === "arbiter"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500"
                    : "bg-slate-900 text-slate-400 border-[rgba(245,242,235,0.06)]"
                    }`}
                >
                  Arbiter / Director
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient-btn text-black font-extrabold text-sm flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isSignUp ? (
              <>
                <span>Create CCI Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Sign in / Sign up */}
        <div className="text-center mt-6 text-xs text-slate-400">
          {isSignUp ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="text-chess-gold hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to the community?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="text-chess-gold hover:underline font-semibold"
              >
                Create an Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
