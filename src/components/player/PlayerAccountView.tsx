import React, { useState, useEffect, useMemo } from "react";
import { playerAuthStore, UserAccount } from "../../lib/storage/playerAuthStore";
import { useAuth } from "../../lib/auth/AuthContext";
import { INITIAL_CITIES } from "../../lib/storage/mockDatabase";
import { CHESS_AVATARS, getChessAvatarById } from "../../lib/chess/avatars";
import { ChessAvatarSelector } from "./ChessAvatarSelector";
import { sound } from "../../lib/audio";
import {
  User,
  Mail,
  Lock,
  MapPin,
  Trophy,
  Calendar,
  Swords,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit3,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  X,
  RefreshCw,
  Hash,
  Award,
} from "lucide-react";

interface PlayerAccountViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const PlayerAccountView: React.FC<PlayerAccountViewProps> = ({ onNavigate }) => {
  const {
    isConfigured: isSupabaseAuthLive,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPasswordForEmail,
  } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(playerAuthStore.getCurrentUser());
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [activeTab, setActiveTab] = useState<"overview" | "tournaments" | "performance" | "settings">("overview");

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration Form States (Mandatory Fields)
  const [regFullName, setRegFullName] = useState("");
  const [regAge, setRegAge] = useState<string>("20");
  const [regEmail, setRegEmail] = useState("");
  const [regCity, setRegCity] = useState("Jabalpur");
  const [regChessCom, setRegChessCom] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regAvatarId, setRegAvatarId] = useState<string>("knight");
  const [regTermsAccepted, setRegTermsAccepted] = useState(true);
  const [regLoading, setRegLoading] = useState(false);

  // Forgot Password / Reset States
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Google Sign-In Profile Completion Modal
  const [showGoogleCompleteModal, setShowGoogleCompleteModal] = useState(false);
  const [googleTempProfile, setGoogleTempProfile] = useState<{ email: string; name: string } | null>(null);
  const [googleAge, setGoogleAge] = useState("20");
  const [googleCity, setGoogleCity] = useState("Jabalpur");
  const [googleChessCom, setGoogleChessCom] = useState("");

  // Edit Profile Modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editChessCom, setEditChessCom] = useState("");
  const [editFideId, setEditFideId] = useState("");
  const [editAvatarId, setEditAvatarId] = useState("knight");

  // Avatar Modal
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);

  // Change Password Modal / State
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  // Alerts
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = playerAuthStore.subscribe(() => {
      const user = playerAuthStore.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setEditName(user.fullName);
        setEditAge(String(user.age || 20));
        setEditCity(user.city);
        setEditChessCom(user.chessComUser || "");
        setEditFideId(user.fideId || "");
        setEditAvatarId(user.avatarId || "knight");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.fullName);
      setEditAge(String(currentUser.age || 20));
      setEditCity(currentUser.city);
      setEditChessCom(currentUser.chessComUser || "");
      setEditFideId(currentUser.fideId || "");
      setEditAvatarId(currentUser.avatarId || "knight");
    }
  }, [currentUser]);

  // Performance data connected to domain models
  const performanceData = useMemo(() => {
    if (!currentUser) return null;
    return playerAuthStore.getPlayerPerformanceData(currentUser);
  }, [currentUser]);

  // City options
  const cityOptions = useMemo(() => {
    const list = INITIAL_CITIES.map((c) => c.name);
    return Array.from(new Set([...list, "Jabalpur", "Bhopal", "Indore", "Delhi", "Mumbai", "Bengaluru", "Pune", "Hyderabad"])).sort();
  }, []);

  // Current Avatar Object
  const userAvatar = useMemo(() => {
    return getChessAvatarById(currentUser?.avatarId);
  }, [currentUser?.avatarId]);

  // =========================================================================
  // AUTHENTICATION HANDLERS
  // =========================================================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setLoginLoading(true);
    sound.playTactileClick();

    if (isSupabaseAuthLive) {
      const res = await signInWithEmail(loginEmail, loginPassword);
      setLoginLoading(false);
      if (!res.success) {
        setAuthError(res.error || "Login failed. Please check your credentials.");
      } else {
        sound.playPieceMove();
        setAuthError(null);
      }
    } else {
      setTimeout(() => {
        const res = playerAuthStore.login(loginEmail, loginPassword);
        setLoginLoading(false);
        if (!res.success) {
          setAuthError(res.error || "Login failed. Please check your credentials.");
        } else {
          sound.playPieceMove();
          setAuthError(null);
        }
      }, 300);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    sound.playTactileClick();

    const parsedAge = parseInt(regAge, 10);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 120) {
      setAuthError("Please enter a valid age between 5 and 120.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!regTermsAccepted) {
      setAuthError("Please review and agree to the Terms of Service & Privacy Policy.");
      return;
    }

    setRegLoading(true);

    if (isSupabaseAuthLive) {
      const res = await signUpWithEmail(regEmail, regPassword, {
        fullName: regFullName,
        city: regCity,
        age: parsedAge,
        avatarId: regAvatarId,
      });
      setRegLoading(false);
      if (!res.success) {
        setAuthError(res.error || "Registration failed.");
      } else {
        sound.playPieceMove();
        setAuthError(null);
        if (res.requiresEmailConfirmation) {
          setAuthSuccess("Verification link sent! Please check your email to activate your account.");
        } else {
          setAuthSuccess("Account successfully created! Welcome to Chess Community India.");
        }
      }
    } else {
      setTimeout(() => {
        const res = playerAuthStore.register({
          fullName: regFullName,
          age: parsedAge,
          email: regEmail,
          city: regCity,
          chessComUser: regChessCom,
          password: regPassword,
          avatarId: regAvatarId,
        });

        setRegLoading(false);

        if (!res.success) {
          setAuthError(res.error || "Registration failed.");
        } else {
          sound.playPieceMove();
          setAuthError(null);
          setAuthSuccess("Account successfully created! Welcome to Chess Community India.");
        }
      }, 400);
    }
  };

  // Google OAuth Flow
  const handleGoogleSignIn = async () => {
    sound.playTactileClick();
    setAuthError(null);

    if (isSupabaseAuthLive) {
      const res = await signInWithOAuth("google");
      if (!res.success) {
        setAuthError(res.error || "Google sign-in failed.");
      }
      return;
    }

    // Prompt for Google account or use authenticated mock
    const googleEmail = prompt("Enter your Google Account email (e.g. yourname@gmail.com):", "alex.gm@gmail.com");
    if (!googleEmail || !googleEmail.trim()) return;

    const cleanEmail = googleEmail.trim().toLowerCase();
    const existing = playerAuthStore.getAllUsers().find((u) => u.email === cleanEmail);

    if (existing) {
      // Existing user: direct sign in
      const res = playerAuthStore.signInWithGoogle({ email: cleanEmail, name: existing.fullName });
      if (res.success) {
        sound.playPieceMove();
      }
    } else {
      // New user: ask to complete required profile details
      setGoogleTempProfile({
        email: cleanEmail,
        name: cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      });
      setShowGoogleCompleteModal(true);
    }
  };

  const handleFinishGoogleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleTempProfile) return;

    const parsedAge = parseInt(googleAge, 10);
    const res = playerAuthStore.signInWithGoogle({
      email: googleTempProfile.email,
      name: googleTempProfile.name,
      age: isNaN(parsedAge) ? 20 : parsedAge,
      city: googleCity,
      chessComUser: googleChessCom,
    });

    if (res.success) {
      sound.playPieceMove();
      setShowGoogleCompleteModal(false);
      setGoogleTempProfile(null);
    }
  };

  // Forgot Password Handlers
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    sound.playTactileClick();

    if (!forgotEmail || !forgotEmail.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (isSupabaseAuthLive) {
      const res = await resetPasswordForEmail(forgotEmail);
      if (res.success) {
        setForgotMessage("Password recovery instructions have been sent to your email.");
        setForgotStep(2);
      } else {
        setAuthError(res.error || "Failed to initiate password reset.");
      }
      return;
    }

    const res = playerAuthStore.requestPasswordReset(forgotEmail);
    setForgotMessage(res.message);
    if (res.code) {
      setResetCode(res.code);
    }
    setForgotStep(2);
  };

  const handleCompletePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    sound.playTactileClick();

    if (newPassword !== confirmNewPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    const res = playerAuthStore.resetPasswordWithCode(forgotEmail, resetCode, newPassword);
    if (!res.success) {
      setAuthError(res.error || "Password reset failed.");
    } else {
      sound.playPieceMove();
      setAuthSuccess("Password successfully updated. You may now log in.");
      setAuthMode("login");
      setForgotStep(1);
    }
  };

  // Edit Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    sound.playTactileClick();

    const parsedAge = parseInt(editAge, 10);

    const res = playerAuthStore.updateProfile({
      fullName: editName,
      age: isNaN(parsedAge) ? undefined : parsedAge,
      city: editCity,
      chessComUser: editChessCom,
      fideId: editFideId,
      avatarId: editAvatarId,
    });

    if (!res.success) {
      setAuthError(res.error || "Failed to update profile.");
    } else {
      setIsEditingProfile(false);
      sound.playPieceMove();
    }
  };

  // Change Password Handler in Settings
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeSuccess(null);
    setAuthError(null);
    sound.playTactileClick();

    const res = playerAuthStore.changePassword(oldPasswordInput, newPasswordInput);
    if (!res.success) {
      setAuthError(res.error || "Failed to change password.");
    } else {
      sound.playPieceMove();
      setPasswordChangeSuccess("Password updated successfully.");
      setOldPasswordInput("");
      setNewPasswordInput("");
    }
  };

  const handleLogout = async () => {
    sound.playTactileClick();
    if (isSupabaseAuthLive) {
      await signOut();
    }
    playerAuthStore.logout();
    setAuthMode("login");
  };

  return (
    <div className="relative w-full z-10 pt-28 sm:pt-32 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 font-sans text-[#1C1613]">
      {/* ========================================================================= */}
      {/* 1. AUTHENTICATED PLAYER DASHBOARD                                         */}
      {/* ========================================================================= */}
      {currentUser ? (
        <div className="space-y-6">
          {/* Dashboard Header Panel */}
          <section className="rounded-2xl p-6 sm:p-8 glass-panel space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Avatar & Player Identity */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Chess Avatar with Edit Overlay */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#D5C4B0] bg-white p-1.5 shadow-sm">
                    <img
                      src={userAvatar.dataUri}
                      alt={currentUser.fullName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      setIsChangingAvatar(true);
                    }}
                    className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Choose a new chess avatar"
                  >
                    <Edit3 className="w-2.5 h-2.5 text-[#E8D1A7]" />
                    <span>Avatar</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EFE8DD] text-[#442D1C] border border-[#D5C4B0]">
                      {currentUser.cciPlayerId}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Player
                    </span>
                    {currentUser.role === "admin" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#442D1C] text-[#FAF7F2]">
                        Arbiter
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1613]">
                    {currentUser.fullName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#594B40]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8E5830]" />
                      {currentUser.city} Chapter
                    </span>
                    {currentUser.age && (
                      <>
                        <span>&bull;</span>
                        <span>Age {currentUser.age}</span>
                      </>
                    )}
                    {currentUser.chessComUser && (
                      <>
                        <span>&bull;</span>
                        <a
                          href={`https://www.chess.com/member/${encodeURIComponent(currentUser.chessComUser)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8E5830] hover:text-[#58371C] font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>chess.com/{currentUser.chessComUser}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                <button
                  onClick={() => {
                    sound.playTactileClick();
                    setIsEditingProfile(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#D5C4B0] text-[#1C1613] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#8E5830]" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-200/70 hover:bg-red-50 hover:text-red-700 text-[#594B40] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sign out of your account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </section>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-[#D5C4B0] pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: "overview", label: "Overview", icon: User },
              { id: "tournaments", label: "Tournament History", icon: Calendar },
              { id: "performance", label: "Chess Performance", icon: TrendingUp },
              { id: "settings", label: "Account Settings", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playTactileClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
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

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-[#6B5E52] text-xs font-medium block">Standard Rating</span>
                  <span className="text-xl font-serif font-bold text-[#1C1613] block">
                    {performanceData?.domainPlayer?.cciStandardRating || performanceData?.playerRecord?.rating || 1200}
                  </span>
                  <span className="text-[11px] text-[#8E5830]">
                    {performanceData?.domainPlayer?.currentCategory?.name || "Positional Strategist"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-[#6B5E52] text-xs font-medium block">Rapid Rating</span>
                  <span className="text-xl font-serif font-bold text-[#1C1613] block">
                    {performanceData?.domainPlayer?.cciRapidRating || performanceData?.playerRecord?.rating || 1200}
                  </span>
                  <span className="text-[11px] text-[#594B40]">CCI Circuit</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-[#6B5E52] text-xs font-medium block">Tournaments</span>
                  <span className="text-xl font-serif font-bold text-[#1C1613] block">
                    {performanceData?.tournamentHistory?.length || performanceData?.registeredEvents?.length || 0}
                  </span>
                  <span className="text-[11px] text-[#594B40]">Events recorded</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-[#6B5E52] text-xs font-medium block">Win Rate</span>
                  <span className="text-xl font-serif font-bold text-emerald-800 block">
                    {performanceData?.domainPlayer?.stats?.winPercentage !== undefined
                      ? `${performanceData.domainPlayer.stats.winPercentage}%`
                      : performanceData?.playerRecord?.matchesPlayed
                      ? `${Math.round((performanceData.playerRecord.wins / performanceData.playerRecord.matchesPlayed) * 100)}%`
                      : "–"}
                  </span>
                  <span className="text-[11px] text-[#594B40]">Sanctioned matches</span>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="rounded-xl p-5 bg-[#FAF7F2] border border-[#D5C4B0] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1C1613] border-b border-[#D5C4B0] pb-2">
                  Player Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#594B40]">
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Full Name</span>
                    <span>{currentUser.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Registered Age</span>
                    <span>{currentUser.age || "–"} years</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Email (Private)</span>
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">City Chapter</span>
                    <span>{currentUser.city}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Chess.com Account</span>
                    <span>{currentUser.chessComUser ? `@${currentUser.chessComUser}` : "Not linked"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE2D5]">
                    <span className="font-medium text-[#1C1613]">Selected Avatar</span>
                    <span className="font-semibold text-[#8E5830]">{userAvatar.name}</span>
                  </div>
                </div>
              </div>

              {/* Registered Events / Fixtures */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#1C1613]">
                    Upcoming Registered Fixtures
                  </h3>
                  <button
                    onClick={() => onNavigate("chess-pair")}
                    className="text-xs font-semibold text-[#8E5830] hover:text-[#58371C] transition-colors"
                  >
                    Browse Circuit &rarr;
                  </button>
                </div>

                {performanceData?.registeredEvents?.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-white border border-[#D5C4B0] text-xs text-[#6B5E52]">
                    You are not currently registered for upcoming events.
                  </div>
                ) : (
                  <div className="divide-y divide-[#EAE2D5] rounded-xl border border-[#D5C4B0] bg-white overflow-hidden">
                    {performanceData?.registeredEvents.map((evt) => (
                      <div key={evt.eventId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-[#1C1613] text-sm">{evt.eventTitle}</p>
                          <p className="text-[#594B40]">
                            {evt.venue}, {evt.city} &bull; {evt.timeControl} &bull; {evt.format}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EFE8DD] text-[#594B40] border border-[#D5C4B0]">
                            {evt.startsAt}
                          </span>
                          <button
                            onClick={() => onNavigate("chess-pair")}
                            className="px-3 py-1 rounded-lg bg-white border border-[#D5C4B0] text-xs font-medium text-[#1C1613] hover:bg-[#FAF7F2]"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TOURNAMENT HISTORY */}
          {activeTab === "tournaments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-[#594B40]">
                <span>Authoritative records from Chess Community India events</span>
                <button
                  onClick={() => onNavigate("chess-pair")}
                  className="font-semibold text-[#8E5830] hover:text-[#58371C]"
                >
                  View Chess Pair &rarr;
                </button>
              </div>

              {!performanceData?.tournamentHistory || performanceData.tournamentHistory.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-white border border-[#D5C4B0] space-y-2">
                  <Trophy className="w-8 h-8 text-[#D5C4B0] mx-auto" />
                  <h4 className="font-serif font-bold text-sm text-[#1C1613]">No Tournament Records Yet</h4>
                  <p className="text-xs text-[#594B40] max-w-sm mx-auto">
                    When you participate in sanctioned tournaments managed through Chess Manager, your results, points, and standings will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#D5C4B0] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF7F2] border-b border-[#D5C4B0] text-[#442D1C] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Tournament Name</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Format</th>
                          <th className="py-2.5 px-3 text-center">Final Rank</th>
                          <th className="py-2.5 px-3 text-right">Points</th>
                          <th className="py-2.5 px-3 text-right">Public Standings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE2D5]">
                        {performanceData.tournamentHistory.map((t) => (
                          <tr key={t.tournamentId} className="hover:bg-[#FAF7F2]/80 transition-colors">
                            <td className="py-3 px-3 font-semibold text-[#1C1613]">
                              {t.tournamentName}
                            </td>
                            <td className="py-3 px-3 text-[#594B40]">{t.date}</td>
                            <td className="py-3 px-3 text-[#594B40]">{t.format}</td>
                            <td className="py-3 px-3 text-center font-mono font-medium text-[#1C1613]">
                              {t.rank ? `#${t.rank} of ${t.totalPlayers}` : "–"}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#8E5830]">
                              {t.points} pts
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => onNavigate("chess-pair", t.tournamentId)}
                                className="inline-flex items-center gap-1 font-semibold text-[#8E5830] hover:text-[#58371C] transition-colors"
                              >
                                <span>View Standings</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHESS PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              {/* Canonical Rating Category Banner */}
              <div className="rounded-xl p-5 bg-[#FAF7F2] border border-[#D5C4B0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#8E5830] uppercase tracking-wider block">
                    Verified Rating Category
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#1C1613]">
                    {performanceData?.domainPlayer?.currentCategory?.name || "Category 3 (Positional Strategist)"}
                  </h3>
                  <p className="text-xs text-[#594B40]">
                    Established via official 6-tier Chess Community India classification rules.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#594B40] block">Standard Elo</span>
                  <span className="text-2xl font-serif font-bold text-[#442D1C]">
                    {performanceData?.domainPlayer?.cciStandardRating || 1200}
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-xs text-[#6B5E52] block">Matches Played</span>
                  <span className="text-xl font-serif font-bold text-[#1C1613]">
                    {performanceData?.domainPlayer?.stats?.matchesPlayed ?? performanceData?.playerRecord?.matchesPlayed ?? 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-xs text-[#6B5E52] block">Victories</span>
                  <span className="text-xl font-serif font-bold text-emerald-800">
                    {performanceData?.domainPlayer?.stats?.wins ?? performanceData?.playerRecord?.wins ?? 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-xs text-[#6B5E52] block">Draws</span>
                  <span className="text-xl font-serif font-bold text-[#8E5830]">
                    {performanceData?.domainPlayer?.stats?.draws ?? performanceData?.playerRecord?.draws ?? 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#D5C4B0] space-y-1">
                  <span className="text-xs text-[#6B5E52] block">Losses</span>
                  <span className="text-xl font-serif font-bold text-[#594B40]">
                    {performanceData?.domainPlayer?.stats?.losses ?? performanceData?.playerRecord?.losses ?? 0}
                  </span>
                </div>
              </div>

              {/* Rating History */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-sm text-[#1C1613]">Rating Trajectory</h4>
                {!performanceData?.ratingHistory || performanceData.ratingHistory.length === 0 ? (
                  <p className="text-xs text-[#594B40] italic p-4 rounded-xl bg-white border border-[#D5C4B0] text-center">
                    No rating adjustments logged yet. Ratings recalculate after confirmed tournament finishes.
                  </p>
                ) : (
                  <div className="divide-y divide-[#EAE2D5] rounded-xl border border-[#D5C4B0] bg-white overflow-hidden text-xs">
                    {performanceData.ratingHistory.map((h, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#1C1613]">{h.tournamentName}</p>
                          <p className="text-[#594B40]">{h.date} &bull; {h.ratingType}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#1C1613]">{h.ratingAfter}</span>
                          <span className={`text-[11px] block font-semibold ${h.ratingChange >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            {h.ratingChange >= 0 ? `+${h.ratingChange}` : h.ratingChange}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              {/* Avatar Switcher Section */}
              <div className="rounded-xl p-5 bg-white border border-[#D5C4B0] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#1C1613]">
                      Custom Chess Avatar
                    </h3>
                    <p className="text-xs text-[#594B40]">
                      Choose your illustrated chess piece identity for tournaments and profile display.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-[#D5C4B0] p-0.5 shrink-0">
                    <img src={userAvatar.dataUri} alt="Current Avatar" className="w-full h-full object-contain" />
                  </div>
                </div>

                <ChessAvatarSelector
                  selectedAvatarId={currentUser.avatarId || "knight"}
                  onSelectAvatar={(avId) => {
                    playerAuthStore.setAvatar(avId);
                  }}
                  compact={true}
                />
              </div>

              {/* Change Password Section */}
              <div className="rounded-xl p-5 bg-white border border-[#D5C4B0] space-y-4">
                <h3 className="font-serif font-bold text-sm text-[#1C1613]">
                  Security & Password
                </h3>

                {passwordChangeSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordChangeSuccess}</span>
                  </div>
                )}

                {authError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="text-xs text-[#594B40] block mb-1">Current Password</label>
                    <input
                      type="password"
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#FAF7F2] border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#594B40] block mb-1">New Password (min 6 characters)</label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new secure password"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#FAF7F2] border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. PLAYER LOGIN & REGISTRATION INTERFACE                                   */
        /* ========================================================================= */
        <div className="max-w-md mx-auto space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <span className="text-xs font-semibold text-[#8E5830] tracking-wider uppercase">
              Chess Community India
            </span>
            <h1 className="text-3xl font-serif font-bold text-[#1C1613]">
              {authMode === "login"
                ? "Player Sign In"
                : authMode === "register"
                ? "Register Player Account"
                : "Reset Your Password"}
            </h1>
            <p className="text-xs text-[#594B40]">
              {authMode === "login"
                ? "Access your tournament rankings, official ratings, and match history."
                : authMode === "register"
                ? "Create your permanent competitor profile for sanctioned tournaments."
                : "Enter your registered email to receive a password reset link."}
            </p>
          </div>

          {/* Alerts */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Card Container */}
          <div className="rounded-2xl p-6 sm:p-7 glass-panel shadow-lg space-y-5">
            {/* GOOGLE AUTHENTICATION BUTTON */}
            {authMode !== "forgot" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-[#D5C4B0] text-[#1C1613] text-xs font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#D5C4B0]"></div>
                  <span className="text-[11px] text-[#7A6E63] font-medium">or continue with email</span>
                  <div className="flex-1 h-px bg-[#D5C4B0]"></div>
                </div>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-[#594B40] block mb-1 font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. player@chesscommunity.in"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-[#594B40] font-medium">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot");
                        setForgotEmail(loginEmail);
                      }}
                      className="text-[11px] text-[#8E5830] hover:text-[#58371C] font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-xl bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {loginLoading ? "Signing In..." : "Sign In to Account"}
                </button>
              </form>
            )}

            {/* FORM 2: REGISTRATION (Mandatory Fields) */}
            {authMode === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* 1. Full Name */}
                <div>
                  <label className="text-xs text-[#594B40] block mb-1 font-medium">
                    1. Full Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Enter real or preferred competitor name"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 2. Age */}
                  <div>
                    <label className="text-xs text-[#594B40] block mb-1 font-medium">
                      2. Age <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={120}
                      value={regAge}
                      onChange={(e) => setRegAge(e.target.value)}
                      placeholder="Age"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>

                  {/* 4. City (Dropdown from existing website chapters) */}
                  <div>
                    <label className="text-xs text-[#594B40] block mb-1 font-medium">
                      4. City <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                    >
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Email Address (Mentioned single time) */}
                <div>
                  <label className="text-xs text-[#594B40] block mb-1 font-medium">
                    3. Email Address <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. player@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                </div>

                {/* 5. Chess.com Username */}
                <div>
                  <label className="text-xs text-[#594B40] block mb-1 font-medium">
                    5. Chess.com Username
                  </label>
                  <div className="relative">
                    <span className="text-xs font-mono text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2 font-bold">@</span>
                    <input
                      type="text"
                      value={regChessCom}
                      onChange={(e) => setRegChessCom(e.target.value)}
                      placeholder="Chess.com handle (optional)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                </div>

                {/* 6. Password & Confirmation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#594B40] block mb-1 font-medium">
                      6. Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#594B40] block mb-1 font-medium">
                      Confirm <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                    />
                  </div>
                </div>

                {/* Chess Avatar Selection */}
                <div className="pt-2 border-t border-[#EAE2D5] space-y-2">
                  <label className="text-xs text-[#594B40] block font-medium">
                    Select Your Chess Avatar
                  </label>
                  <ChessAvatarSelector
                    selectedAvatarId={regAvatarId}
                    onSelectAvatar={(avId) => setRegAvatarId(avId)}
                    compact={true}
                  />
                </div>

                {/* Terms of Service & Privacy Agreement */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={regTermsAccepted}
                    onChange={(e) => setRegTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-[#D5C4B0] text-[#8E5830] focus:ring-[#8E5830]"
                  />
                  <label htmlFor="terms" className="text-[11px] text-[#594B40] leading-tight">
                    I agree to the{" "}
                    <span className="text-[#8E5830] underline cursor-pointer">Terms of Service</span> and{" "}
                    <span className="text-[#8E5830] underline cursor-pointer">Privacy Policy</span>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 rounded-xl bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {regLoading ? "Registering..." : "Create Competitor Profile"}
                </button>
              </form>
            )}

            {/* FORM 3: FORGOT PASSWORD */}
            {authMode === "forgot" && (
              <div className="space-y-4">
                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                    <div>
                      <label className="text-xs text-[#594B40] block mb-1 font-medium">Your Email Address</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-[#8E5830] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] placeholder-[#9E8B7D] focus:outline-none focus:border-[#8E5830]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      Send Password Reset Link
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                    {forgotMessage && (
                      <p className="text-xs text-[#594B40] p-3 rounded-xl bg-white border border-[#D5C4B0]">
                        {forgotMessage}
                      </p>
                    )}

                    <div>
                      <label className="text-xs text-[#594B40] block mb-1 font-medium">Reset Code</label>
                      <input
                        type="text"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter code from email"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[#594B40] block mb-1 font-medium">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[#594B40] block mb-1 font-medium">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613] focus:outline-none focus:border-[#8E5830]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      Update Password & Sign In
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Toggle Modes Footer */}
            <div className="pt-4 border-t border-[#EAE2D5] text-center text-xs text-[#594B40]">
              {authMode === "login" ? (
                <p>
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode("register");
                    }}
                    className="font-bold text-[#8E5830] hover:text-[#58371C] underline"
                  >
                    Register here
                  </button>
                </p>
              ) : authMode === "register" ? (
                <p>
                  Already have a registered account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode("login");
                    }}
                    className="font-bold text-[#8E5830] hover:text-[#58371C] underline"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthMode("login");
                  }}
                  className="font-bold text-[#8E5830] hover:text-[#58371C] underline"
                >
                  &larr; Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT PROFILE MODAL                                                     */}
      {/* ========================================================================= */}
      {isEditingProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditingProfile(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#FAF7F2] rounded-2xl border border-[#D5C4B0] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#1C1613]">
            <div className="p-5 border-b border-[#D5C4B0] flex items-center justify-between bg-white">
              <h3 className="font-serif font-bold text-base text-[#1C1613]">Edit Competitor Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#F4EFEA] text-[#594B40] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs text-[#594B40] block mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#594B40] block mb-1 font-medium">Age</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#594B40] block mb-1 font-medium">City Chapter</label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                  >
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#594B40] block mb-1 font-medium">Chess.com Username</label>
                <input
                  type="text"
                  value={editChessCom}
                  onChange={(e) => setEditChessCom(e.target.value)}
                  placeholder="Username without @"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div>
                <label className="text-xs text-[#594B40] block mb-1 font-medium">FIDE ID (if rated)</label>
                <input
                  type="text"
                  value={editFideId}
                  onChange={(e) => setEditFideId(e.target.value)}
                  placeholder="e.g. 5049382"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              {/* Avatar Selector in Edit Modal */}
              <div className="pt-2 border-t border-[#EAE2D5] space-y-2">
                <label className="text-xs text-[#594B40] block font-medium">Chess Avatar</label>
                <ChessAvatarSelector
                  selectedAvatarId={editAvatarId}
                  onSelectAvatar={(avId) => setEditAvatarId(avId)}
                  compact={true}
                />
              </div>

              <div className="pt-3 border-t border-[#EAE2D5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-lg bg-stone-200/70 text-xs font-semibold text-[#594B40]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CHESS AVATAR SELECTOR MODAL                                            */}
      {/* ========================================================================= */}
      {isChangingAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChangingAvatar(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-[#FAF7F2] rounded-2xl border border-[#D5C4B0] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#1C1613]">
            <div className="p-5 border-b border-[#D5C4B0] flex items-center justify-between bg-white">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1C1613]">Choose Chess Avatar</h3>
                <p className="text-xs text-[#594B40]">Select an illustrated piece representing your chess style.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingAvatar(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#F4EFEA] text-[#594B40] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <ChessAvatarSelector
                selectedAvatarId={currentUser?.avatarId || "knight"}
                onSelectAvatar={(avId) => {
                  playerAuthStore.setAvatar(avId);
                  setIsChangingAvatar(false);
                }}
                compact={false}
              />
            </div>

            <div className="p-4 bg-white border-t border-[#D5C4B0] flex justify-end">
              <button
                type="button"
                onClick={() => setIsChangingAvatar(false)}
                className="px-4 py-1.5 rounded-lg bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GOOGLE COMPLETE PROFILE MODAL                                          */}
      {/* ========================================================================= */}
      {showGoogleCompleteModal && googleTempProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FAF7F2] rounded-2xl border border-[#D5C4B0] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 text-[#1C1613]">
            <div className="p-5 border-b border-[#D5C4B0] bg-white">
              <h3 className="font-serif font-bold text-base text-[#1C1613]">Complete Your Profile</h3>
              <p className="text-xs text-[#594B40]">
                Signed in as <strong className="text-[#1C1613]">{googleTempProfile.email}</strong>. Please provide your city and age.
              </p>
            </div>

            <form onSubmit={handleFinishGoogleSignUp} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[#594B40] block mb-1 font-medium">Age</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={120}
                  value={googleAge}
                  onChange={(e) => setGoogleAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div>
                <label className="text-xs text-[#594B40] block mb-1 font-medium">City</label>
                <select
                  value={googleCity}
                  onChange={(e) => setGoogleCity(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                >
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#594B40] block mb-1 font-medium">Chess.com Username (optional)</label>
                <input
                  type="text"
                  value={googleChessCom}
                  onChange={(e) => setGoogleChessCom(e.target.value)}
                  placeholder="e.g. blitzmaster"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#D5C4B0] text-[#1C1613]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleCompleteModal(false)}
                  className="px-4 py-2 rounded-lg bg-stone-200/70 text-xs font-semibold text-[#594B40]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#442D1C] hover:bg-[#362315] text-[#FAF7F2] text-xs font-semibold"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerAccountView;
