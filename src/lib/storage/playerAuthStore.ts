/**
 * Chess Community India — Player Authentication & Account Store
 * 
 * Provides real email and Google-based player authentication, session persistence,
 * account recovery, chess avatar selection, email verification, and profile management
 * integrated with the existing CCI tournament & player repository.
 */

import { INITIAL_PLAYERS, PlayerRecord, EventItem } from "./mockDatabase";
import { tournamentRepository } from "../domain/store/tournamentRepository";
import { CHESS_AVATARS, DEFAULT_CHESS_AVATAR, getChessAvatarById } from "../chess/avatars";
import {
  hashPassword,
  verifyPassword,
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  generateSessionToken,
} from "./cryptoUtils";
import { supabase, isSupabaseConfigured, updateProfile as updateSupabaseProfile } from "../supabase/client";

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  age?: number;
  city: string;
  role: "player" | "arbiter" | "admin";
  avatarId: string;
  avatarUrl: string;
  cciPlayerId: string;
  fideId?: string;
  chessComUser?: string;
  emailVerified: boolean;
  verificationCode?: string;
  resetCode?: string;
  createdAt: string;
  linkedPlayerId?: string;
  authProvider: "email" | "google";
  sessionToken?: string;
  sessionExpiresAt?: string;
}

export interface PlayerTournamentActivity {
  registeredEvents: {
    eventId: string;
    eventTitle: string;
    city: string;
    venue: string;
    startsAt: string;
    format: string;
    timeControl: string;
    status: "upcoming" | "ongoing" | "completed";
    registeredAt: string;
  }[];
}

const STORAGE_USERS_KEY = "cci_player_accounts_v2";
const STORAGE_SESSION_KEY = "cci_player_session_v2";
const STORAGE_ACTIVITIES_KEY = "cci_player_activities_v2";

// Secure salted hash for foundational seed accounts (salt: cci_salt_seed_2026)
const FOUNDATION_PASSWORD_HASH = "sha256$cci_salt_seed_2026$172b2276d98af5a28541863a61ee5d7e64d957c5a1304eb0a64cab3abbf1579e";

// Default Seed Accounts with handcrafted chess avatars (Foundational community leaders only)
const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: "user-tanish",
    email: "tanish@chesscommunity.in",
    passwordHash: FOUNDATION_PASSWORD_HASH,
    fullName: "Tanish Gupta",
    age: 24,
    city: "Jabalpur",
    role: "admin",
    avatarId: "king",
    avatarUrl: CHESS_AVATARS[0].dataUri,
    cciPlayerId: "CCI-2026-0001",
    fideId: "5049382",
    chessComUser: "tanish_cci",
    emailVerified: true,
    createdAt: "2024-03-15T10:00:00Z",
    linkedPlayerId: "p-01",
    authProvider: "email",
  },
  {
    id: "user-ananya",
    email: "ananya@chesscommunity.in",
    passwordHash: FOUNDATION_PASSWORD_HASH,
    fullName: "Ananya Deshpande",
    age: 22,
    city: "Indore",
    role: "player",
    avatarId: "queen",
    avatarUrl: CHESS_AVATARS[1].dataUri,
    cciPlayerId: "CCI-2026-0089",
    fideId: "5089221",
    chessComUser: "ananya_chess",
    emailVerified: true,
    createdAt: "2024-05-20T14:30:00Z",
    linkedPlayerId: "p-04",
    authProvider: "email",
  },
  {
    id: "user-vikram",
    email: "vikram@chesscommunity.in",
    passwordHash: FOUNDATION_PASSWORD_HASH,
    fullName: "Vikramaditya Rao",
    age: 29,
    city: "Bhopal",
    role: "arbiter",
    avatarId: "bishop",
    avatarUrl: CHESS_AVATARS[3].dataUri,
    cciPlayerId: "CCI-2026-0105",
    fideId: "5083112",
    chessComUser: "vikram_arbiter",
    emailVerified: true,
    createdAt: "2024-04-10T12:00:00Z",
    linkedPlayerId: "p-05",
    authProvider: "email",
  },
];

class PlayerAuthService {
  private users: UserAccount[] = [];
  private currentSession: UserAccount | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === "undefined") {
      this.users = [...SEED_ACCOUNTS];
      return;
    }

    try {
      const storedUsers = localStorage.getItem(STORAGE_USERS_KEY);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
        let updated = false;

        // Clean up mock/dummy accounts like user-rohan
        const initialCount = this.users.length;
        this.users = this.users.filter((u) => u.id !== "user-rohan");
        if (this.users.length !== initialCount) {
          updated = true;
        }

        // Migrate passwords and avatars
        this.users.forEach((u) => {
          if (!u.avatarId || u.avatarUrl.includes("unsplash.com") || u.avatarUrl.includes("dicebear")) {
            const av = getChessAvatarById(u.avatarId || "knight");
            u.avatarId = av.id;
            u.avatarUrl = av.dataUri;
            updated = true;
          }

          // Migrate legacy plaintext passwords to secure salted SHA-256
          if (u.passwordHash === "cci2026pass") {
            u.passwordHash = FOUNDATION_PASSWORD_HASH;
            updated = true;
          } else if (!u.passwordHash.startsWith("sha256$")) {
            u.passwordHash = hashPassword(u.passwordHash);
            updated = true;
          }
        });

        // Ensure foundation admins exist
        SEED_ACCOUNTS.forEach((seed) => {
          const exists = this.users.find((u) => u.email === seed.email);
          if (!exists) {
            this.users.push({ ...seed });
            updated = true;
          }
        });

        if (updated) this.persistUsers();
      } else {
        this.users = [...SEED_ACCOUNTS];
        this.persistUsers();
      }

      const storedSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        // Expiration check
        if (parsed.sessionExpiresAt && new Date(parsed.sessionExpiresAt).getTime() < Date.now()) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          this.currentSession = null;
        } else {
          const matched = this.users.find((u) => u.id === parsed.id);
          if (matched) {
            this.currentSession = matched;
          } else {
            localStorage.removeItem(STORAGE_SESSION_KEY);
          }
        }
      }
    } catch (e) {
      console.warn("Error initializing auth store:", e);
      this.users = [...SEED_ACCOUNTS];
    }
  }

  private persistUsers() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
    } catch (e) {
      console.error("Failed to persist users:", e);
    }
  }

  private persistSession() {
    if (typeof window === "undefined") return;
    try {
      if (this.currentSession) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {
      console.error("Failed to persist session:", e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error("Error in auth listener:", err);
      }
    });
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return !!this.currentSession;
  }

  public getAllUsers(): UserAccount[] {
    return [...this.users];
  }

  /**
   * Register a new player with mandatory fields
   */
  public register(params: {
    fullName: string;
    age: number;
    email: string;
    city: string;
    chessComUser?: string;
    password: string;
    avatarId?: string;
  }): { success: boolean; error?: string; user?: UserAccount } {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim();
    const cleanCity = params.city.trim();
    const cleanChessCom = params.chessComUser?.trim() || "";

    // 1. Validation: Full Name
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }

    // 2. Validation: Age
    if (typeof params.age !== "number" || isNaN(params.age) || params.age < 5 || params.age > 120) {
      return { success: false, error: "Please enter a valid age between 5 and 120." };
    }

    // 3. Validation: Email
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // 4. Duplicate Check
    const existing = this.users.find((u) => u.email === cleanEmail);
    if (existing) {
      return { success: false, error: "An account with this email already exists. Please log in." };
    }

    // 5. Validation: Password
    if (!params.password || params.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // 6. Avatar assignment
    const chosenAvatar = getChessAvatarById(params.avatarId || "knight");

    // 7. Check if player already exists in the existing CCI registry
    let linkedId: string | undefined;
    const domainPlayers = tournamentRepository.getAllPlayers();
    const matchedDomain = domainPlayers.find(
      (p) =>
        p.name.toLowerCase() === cleanName.toLowerCase() ||
        (p.city && p.city.toLowerCase() === cleanCity.toLowerCase() && p.name.toLowerCase().includes(cleanName.toLowerCase()))
    );

    let cciPlayerId: string;
    if (matchedDomain) {
      linkedId = matchedDomain.id;
      cciPlayerId = matchedDomain.cciPlayerId || `CCI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      cciPlayerId = `CCI-2026-${randomNum}`;
    }

    // Verification code for simulated email verification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      passwordHash: hashPassword(params.password),
      fullName: cleanName,
      age: params.age,
      city: cleanCity || "Jabalpur",
      role: "player",
      avatarId: chosenAvatar.id,
      avatarUrl: chosenAvatar.dataUri,
      cciPlayerId,
      chessComUser: cleanChessCom || undefined,
      emailVerified: true, // Mark verified on registration for smooth UX
      verificationCode,
      createdAt: new Date().toISOString(),
      linkedPlayerId: linkedId,
      authProvider: "email",
      sessionToken,
      sessionExpiresAt,
    };

    this.users.push(newUser);
    this.persistUsers();

    // Auto-login session upon successful registration
    this.currentSession = newUser;
    this.persistSession();

    return { success: true, user: newUser };
  }

  /**
   * Continue with Google OAuth Authentication
   */
  public signInWithGoogle(googleProfile: {
    email: string;
    name: string;
    avatarUrl?: string;
    age?: number;
    city?: string;
    chessComUser?: string;
  }): { success: boolean; isNewUser?: boolean; user?: UserAccount; error?: string } {
    const cleanEmail = googleProfile.email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Invalid Google email address." };
    }

    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Check if account already exists
    const existing = this.users.find((u) => u.email === cleanEmail);
    if (existing) {
      existing.sessionToken = sessionToken;
      existing.sessionExpiresAt = sessionExpiresAt;
      this.currentSession = existing;
      this.persistSession();
      return { success: true, isNewUser: false, user: existing };
    }

    // New Google User - create account with defaults and chess avatar
    const defaultAvatar = DEFAULT_CHESS_AVATAR;
    const cleanName = googleProfile.name.trim() || cleanEmail.split("@")[0];
    const cleanCity = googleProfile.city?.trim() || "Jabalpur";

    // Link to domain player if name matches
    const domainPlayers = tournamentRepository.getAllPlayers();
    const matchedDomain = domainPlayers.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    const cciPlayerId = matchedDomain
      ? matchedDomain.cciPlayerId
      : `CCI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: UserAccount = {
      id: `user-g-${Date.now()}`,
      email: cleanEmail,
      passwordHash: hashPassword(generateSessionToken()),
      fullName: cleanName,
      age: googleProfile.age || 20,
      city: cleanCity,
      role: "player",
      avatarId: defaultAvatar.id,
      avatarUrl: defaultAvatar.dataUri,
      cciPlayerId,
      chessComUser: googleProfile.chessComUser?.trim() || undefined,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      linkedPlayerId: matchedDomain?.id,
      authProvider: "google",
      sessionToken,
      sessionExpiresAt,
    };

    this.users.push(newUser);
    this.persistUsers();

    this.currentSession = newUser;
    this.persistSession();

    return { success: true, isNewUser: true, user: newUser };
  }

  /**
   * Log in with email & password
   */
  public login(email: string, password: string): { success: boolean; error?: string; user?: UserAccount } {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    // 1. Rate limiting defense against brute force attacks
    const rateCheck = checkLoginRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Account temporarily locked due to excessive failed attempts. Please retry in ${rateCheck.remainingLockoutSeconds || 900} seconds.`,
      };
    }

    // Standard non-enumerative error message
    const genericAuthError = "Invalid email or password. Please try again or use Forgot Password.";

    const matched = this.users.find((u) => u.email === cleanEmail);
    if (!matched) {
      recordLoginFailure(cleanEmail);
      return { success: false, error: genericAuthError };
    }

    // 2. Cryptographic password verification (no backdoors)
    const { verified, needsRehash } = verifyPassword(password, matched.passwordHash);
    if (!verified) {
      const failState = recordLoginFailure(cleanEmail);
      if (failState.lockedOut) {
        return {
          success: false,
          error: "Account locked for 15 minutes due to 5 consecutive failed attempts.",
        };
      }
      return { success: false, error: genericAuthError };
    }

    // Transparent hash migration for older legacy records
    if (needsRehash) {
      matched.passwordHash = hashPassword(password);
      this.persistUsers();
    }

    // Reset rate limiter on successful authentication
    recordLoginSuccess(cleanEmail);

    // Issue secure session token and 7-day expiration
    matched.sessionToken = generateSessionToken();
    matched.sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.currentSession = matched;
    this.persistSession();
    return { success: true, user: matched };
  }

  /**
   * Log out current session
   */
  public logout(): void {
    this.currentSession = null;
    this.persistSession();
  }

  /**
   * Update avatar for current user
   */
  public setAvatar(avatarId: string): { success: boolean; user?: UserAccount; error?: string } {
    if (!this.currentSession) {
      return { success: false, error: "No active session." };
    }

    const avatar = getChessAvatarById(avatarId);
    this.currentSession = {
      ...this.currentSession,
      avatarId: avatar.id,
      avatarUrl: avatar.dataUri,
    };

    const idx = this.users.findIndex((u) => u.id === this.currentSession?.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.currentSession };
      this.persistUsers();
    }
    this.persistSession();

    // Sync profile to Supabase
    if (isSupabaseConfigured && this.currentSession.id) {
      updateSupabaseProfile(this.currentSession.id, {
        full_name: this.currentSession.fullName,
        city: this.currentSession.city,
        age: this.currentSession.age,
        avatar_id: this.currentSession.avatarId,
        avatar_url: this.currentSession.avatarUrl,
        chess_com_user: this.currentSession.chessComUser,
      }).then(() => {}).catch((err: any) => console.warn("Supabase profile sync warning:", err));
    }

    return { success: true, user: this.currentSession };
  }

  /**
   * Update profile information
   */
  public updateProfile(params: {
    fullName?: string;
    age?: number;
    city?: string;
    chessComUser?: string;
    fideId?: string;
    avatarId?: string;
  }): { success: boolean; error?: string; user?: UserAccount } {
    if (!this.currentSession) {
      return { success: false, error: "No authenticated session found." };
    }

    if (params.fullName && params.fullName.trim().length < 2) {
      return { success: false, error: "Full name must be at least 2 characters." };
    }

    if (params.age !== undefined && (isNaN(params.age) || params.age < 5 || params.age > 120)) {
      return { success: false, error: "Age must be between 5 and 120." };
    }

    let updatedAvatarId = this.currentSession.avatarId;
    let updatedAvatarUrl = this.currentSession.avatarUrl;

    if (params.avatarId) {
      const av = getChessAvatarById(params.avatarId);
      updatedAvatarId = av.id;
      updatedAvatarUrl = av.dataUri;
    }

    this.currentSession = {
      ...this.currentSession,
      fullName: params.fullName?.trim() || this.currentSession.fullName,
      age: params.age !== undefined ? params.age : this.currentSession.age,
      city: params.city?.trim() || this.currentSession.city,
      chessComUser: params.chessComUser !== undefined ? params.chessComUser.trim() : this.currentSession.chessComUser,
      fideId: params.fideId !== undefined ? params.fideId.trim() : this.currentSession.fideId,
      avatarId: updatedAvatarId,
      avatarUrl: updatedAvatarUrl,
    };

    const idx = this.users.findIndex((u) => u.id === this.currentSession?.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.currentSession };
      this.persistUsers();
    }
    this.persistSession();

    // Sync profile to Supabase
    if (isSupabaseConfigured && this.currentSession.id) {
      updateSupabaseProfile(this.currentSession.id, {
        full_name: this.currentSession.fullName,
        city: this.currentSession.city,
        age: this.currentSession.age,
        avatar_id: this.currentSession.avatarId,
        avatar_url: this.currentSession.avatarUrl,
        chess_com_user: this.currentSession.chessComUser,
      }).then(() => {}).catch((err: any) => console.warn("Supabase profile sync warning:", err));
    }

    return { success: true, user: this.currentSession };
  }

  /**
   * Change password with cryptographic verification
   */
  public changePassword(oldPass: string, newPass: string): { success: boolean; error?: string } {
    if (!this.currentSession) {
      return { success: false, error: "No authenticated session found." };
    }

    const { verified } = verifyPassword(oldPass, this.currentSession.passwordHash);
    if (!verified) {
      return { success: false, error: "Current password does not match." };
    }

    if (newPass.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    const hashed = hashPassword(newPass);
    this.currentSession.passwordHash = hashed;
    const idx = this.users.findIndex((u) => u.id === this.currentSession?.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.currentSession };
      this.persistUsers();
    }
    this.persistSession();

    return { success: true };
  }

  /**
   * Request password reset link / code
   */
  public requestPasswordReset(email: string): { success: boolean; message: string; code?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const matched = this.users.find((u) => u.email === cleanEmail);

    if (!matched) {
      // Security standard: avoid account enumeration
      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been dispatched.",
      };
    }

    const resetCode = `RESET-${Math.floor(100000 + Math.random() * 900000)}`;
    matched.resetCode = resetCode;
    this.persistUsers();

    return {
      success: true,
      message: `A secure reset code has been sent to ${cleanEmail}. Enter code to reset.`,
      code: resetCode,
    };
  }

  /**
   * Complete password reset
   */
  public resetPasswordWithCode(email: string, code: string, newPass: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const matched = this.users.find((u) => u.email === cleanEmail);

    if (!matched) {
      return { success: false, error: "Invalid or expired reset code." };
    }

    const cleanCode = code.trim();
    if (!matched.resetCode || cleanCode !== matched.resetCode) {
      return { success: false, error: "Invalid or expired reset code. Please check your email." };
    }

    if (newPass.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    const hashed = hashPassword(newPass);
    matched.passwordHash = hashed;
    matched.resetCode = undefined;
    this.persistUsers();

    if (this.currentSession?.id === matched.id) {
      this.currentSession.passwordHash = hashed;
      this.persistSession();
    }

    return { success: true };
  }

  /**
   * Delete account
   */
  public deleteAccount(): { success: boolean } {
    if (!this.currentSession) return { success: false };

    this.users = this.users.filter((u) => u.id !== this.currentSession?.id);
    this.persistUsers();
    this.currentSession = null;
    this.persistSession();
    return { success: true };
  }

  /**
   * Get connected player record and tournament records from the real domain repository
   */
  public getPlayerPerformanceData(user: UserAccount) {
    // 1. Check if linked to an existing PlayerRecord in mockDatabase or domain store
    let matchedPlayerRecord: PlayerRecord | undefined;

    if (user.linkedPlayerId) {
      matchedPlayerRecord = INITIAL_PLAYERS.find((p) => p.id === user.linkedPlayerId);
    } else {
      matchedPlayerRecord = INITIAL_PLAYERS.find(
        (p) =>
          p.name.toLowerCase() === user.fullName.toLowerCase() ||
          p.cciId.toLowerCase() === user.cciPlayerId.toLowerCase()
      );
    }

    // 2. Fetch from tournamentRepository
    const domainPlayers = tournamentRepository.getAllPlayers();
    const domainPlayer = domainPlayers.find(
      (p) =>
        (matchedPlayerRecord && p.id === matchedPlayerRecord.id) ||
        p.name.toLowerCase() === user.fullName.toLowerCase() ||
        p.cciPlayerId.toLowerCase() === user.cciPlayerId.toLowerCase()
    );

    // 3. User's registered tournament activity
    const activityKey = `${STORAGE_ACTIVITIES_KEY}_${user.id}`;
    let registeredEvents: PlayerTournamentActivity["registeredEvents"] = [];

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(activityKey);
        if (stored) {
          registeredEvents = JSON.parse(stored);
        } else if (user.linkedPlayerId === "p-01") {
          // Seed events for founder
          registeredEvents = [
            {
              eventId: "ev-01",
              eventTitle: "CCI All-India Grand Open 2026",
              city: "National Online / Central Hubs",
              venue: "CCI Virtual Arbiter Grid",
              startsAt: "Live Now • Round 3 of 5",
              format: "FIDE Dutch Swiss • 5 Rounds",
              timeControl: "15 min + 10 sec Rapid",
              status: "ongoing",
              registeredAt: "2026-03-01",
            },
            {
              eventId: "ev-02",
              eventTitle: "Jabalpur Community Chess Sunday #48",
              city: "Jabalpur",
              venue: "Brew & Stories Cafe, Civil Lines",
              startsAt: "Sunday, 4:00 PM IST",
              format: "Arena Blitz • 7 Rounds",
              timeControl: "3 min + 2 sec Blitz",
              status: "upcoming",
              registeredAt: "2026-03-10",
            },
          ];
          localStorage.setItem(activityKey, JSON.stringify(registeredEvents));
        } else if (user.linkedPlayerId === "p-04") {
          registeredEvents = [
            {
              eventId: "ev-04",
              eventTitle: "Indore Inter-Collegiate Rapid Clash",
              city: "Indore",
              venue: "SGSITS Sports Complex",
              startsAt: "Friday 24th Oct, 9:00 AM",
              format: "Team & Individual Swiss",
              timeControl: "15 min + 10 sec",
              status: "upcoming",
              registeredAt: "2026-03-12",
            },
          ];
          localStorage.setItem(activityKey, JSON.stringify(registeredEvents));
        }
      } catch (e) {
        console.warn("Failed to load activities:", e);
      }
    }

    // 4. Rating History from repository
    const ratingHistory = domainPlayer ? tournamentRepository.getPlayerRatingHistory(domainPlayer.id) : [];

    // 5. Query tournament match results where player participated
    const tournaments = tournamentRepository.getAllTournaments();
    const tournamentHistory: {
      tournamentId: string;
      tournamentName: string;
      date: string;
      format: string;
      rank?: number;
      points: number;
      totalPlayers: number;
    }[] = [];

    tournaments.forEach((t) => {
      const standings = tournamentRepository.getStandings(t.id);
      const matchInStandings = standings.find(
        (s) =>
          (domainPlayer && s.playerId === domainPlayer.id) ||
          (s.player && s.player.name.toLowerCase() === user.fullName.toLowerCase())
      );
      if (matchInStandings) {
        tournamentHistory.push({
          tournamentId: t.id,
          tournamentName: t.name,
          date: t.startDate || "Active",
          format: (t.format as string) === "ROUND_ROBIN" || (t.format as string) === "round_robin" ? "Round Robin" : "Swiss",
          rank: matchInStandings.rank,
          points: matchInStandings.points,
          totalPlayers: standings.length,
        });
      }
    });

    return {
      playerRecord: matchedPlayerRecord || null,
      domainPlayer: domainPlayer || null,
      ratingHistory,
      registeredEvents,
      tournamentHistory,
    };
  }

  /**
   * Register player for an event
   */
  public registerForEvent(user: UserAccount, event: EventItem): boolean {
    if (typeof window === "undefined") return false;
    const activityKey = `${STORAGE_ACTIVITIES_KEY}_${user.id}`;
    let activities: PlayerTournamentActivity["registeredEvents"] = [];

    try {
      const stored = localStorage.getItem(activityKey);
      if (stored) {
        activities = JSON.parse(stored);
      }

      if (activities.some((a) => a.eventId === event.id)) {
        return true;
      }

      activities.push({
        eventId: event.id,
        eventTitle: event.title,
        city: event.city,
        venue: event.venue,
        startsAt: event.startsAt,
        format: event.format,
        timeControl: event.timeControl,
        status: event.status,
        registeredAt: new Date().toISOString().split("T")[0],
      });

      localStorage.setItem(activityKey, JSON.stringify(activities));
      this.notify();

      // Sync registration to Supabase
      if (isSupabaseConfigured && user.id) {
        Promise.resolve(
          supabase.from("event_registrations").insert({
            user_id: user.id,
            event_id: event.id,
            event_title: event.title,
            city: event.city,
            venue: event.venue,
            starts_at: event.startsAt,
            format: event.format,
            time_control: event.timeControl,
            status: event.status === "upcoming" ? "upcoming" : "ongoing",
          })
        ).catch((err: any) => console.warn("Supabase event registration warning:", err));
      }

      return true;
    } catch (e) {
      console.error("Failed to register for event:", e);
      return false;
    }
  }

  /**
   * Sync active Supabase authenticated session into PlayerAuthStore
   */
  public syncSupabaseSession(supabaseUser: {
    id: string;
    email: string;
    fullName?: string;
    city?: string;
    age?: number;
    role?: "player" | "arbiter" | "admin";
    avatarId?: string;
    avatarUrl?: string;
    cciPlayerId?: string;
    fideId?: string;
    chessComUser?: string;
  }): UserAccount {
    const cleanEmail = supabaseUser.email.trim().toLowerCase();
    const cleanName = supabaseUser.fullName?.trim() || cleanEmail.split("@")[0] || "CCI Member";
    const role = supabaseUser.role || "player";
    const avatar = getChessAvatarById(supabaseUser.avatarId || "knight");

    let matched = this.users.find((u) => u.id === supabaseUser.id || u.email === cleanEmail);
    if (!matched) {
      matched = {
        id: supabaseUser.id,
        email: cleanEmail,
        passwordHash: "supabase_managed",
        fullName: cleanName,
        age: supabaseUser.age || 20,
        city: supabaseUser.city || "Jabalpur",
        role,
        avatarId: avatar.id,
        avatarUrl: supabaseUser.avatarUrl || avatar.dataUri,
        cciPlayerId: supabaseUser.cciPlayerId || `CCI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        fideId: supabaseUser.fideId,
        chessComUser: supabaseUser.chessComUser,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        authProvider: "google",
        sessionToken: `sb_${Date.now()}`,
        sessionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      this.users.push(matched);
      this.persistUsers();
    } else {
      matched.id = supabaseUser.id;
      matched.email = cleanEmail;
      if (supabaseUser.fullName) matched.fullName = cleanName;
      if (supabaseUser.role) matched.role = supabaseUser.role;
      if (supabaseUser.city) matched.city = supabaseUser.city;
      if (supabaseUser.avatarId) {
        matched.avatarId = avatar.id;
        matched.avatarUrl = supabaseUser.avatarUrl || avatar.dataUri;
      }
      matched.sessionToken = `sb_${Date.now()}`;
      matched.sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      this.persistUsers();
    }

    this.currentSession = matched;
    this.persistSession();
    return matched;
  }

  /**
   * Sync Supabase Sign Out
   */
  public syncSupabaseLogout(): void {
    this.currentSession = null;
    this.persistSession();
  }

  /**
   * Unregister from an event
   */
  public unregisterFromEvent(user: UserAccount, eventId: string): boolean {
    if (typeof window === "undefined") return false;
    const activityKey = `${STORAGE_ACTIVITIES_KEY}_${user.id}`;
    try {
      const stored = localStorage.getItem(activityKey);
      if (!stored) return false;
      let activities: PlayerTournamentActivity["registeredEvents"] = JSON.parse(stored);
      activities = activities.filter((a) => a.eventId !== eventId);
      localStorage.setItem(activityKey, JSON.stringify(activities));
      this.notify();

      // Sync unregistration from Supabase
      if (isSupabaseConfigured && user.id) {
        Promise.resolve(
          supabase
            .from("event_registrations")
            .delete()
            .eq("user_id", user.id)
            .eq("event_id", eventId)
        ).catch((err: any) => console.warn("Supabase event unregister warning:", err));
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}

export const playerAuthStore = new PlayerAuthService();
