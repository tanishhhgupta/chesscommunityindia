import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured, getSupabaseConfig } from "../supabase";
import { playerAuthStore, UserAccount } from "../storage/playerAuthStore";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  city?: string;
  age?: number;
  role: "player" | "arbiter" | "admin";
  avatar_id?: string;
  avatar_url?: string;
  cci_player_id?: string;
  fide_id?: string;
  chess_com_username?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: "player" | "arbiter" | "admin";
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  configSource: "environment" | "localStorage" | "unconfigured";
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { fullName?: string; city?: string; age?: number; avatarId?: string }
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  signInWithOAuth: (provider: "google" | "github") => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const config = getSupabaseConfig();
  const configured = config.isConfigured;

  // Derive role safely: Prefer profile.role or raw_app_meta_data.role
  // NEVER use user_metadata for authorization decisions
  const role: "player" | "arbiter" | "admin" = useMemo(() => {
    if (profile?.role) return profile.role;
    if (user?.app_metadata?.role) {
      const appRole = user.app_metadata.role;
      if (appRole === "admin" || appRole === "arbiter") return appRole;
    }
    // Fallback to active local store user role if Supabase is unconfigured
    const localUser = playerAuthStore.getCurrentUser();
    if (localUser?.role) return localUser.role;
    return "player";
  }, [profile, user]);

  /**
   * Fetch profile from public.profiles table
   */
  const fetchProfile = useCallback(async (userId: string, userEmail: string): Promise<UserProfile | null> => {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch user profile from Supabase:", error.message);
        return null;
      }

      if (data) {
        return data as UserProfile;
      }

      // If profile record does not exist yet (e.g. before trigger finished), construct safe baseline
      return {
        id: userId,
        email: userEmail,
        full_name: splitEmailName(userEmail),
        role: "player",
      };
    } catch (err) {
      console.warn("Error fetching profile:", err);
      return null;
    }
  }, []);

  /**
   * Sync active session with playerAuthStore so all domain logic,
   * rankings, and avatar widgets stay in sync seamlessly.
   */
  const syncWithLocalStore = useCallback((activeUser: User | null, activeProfile: UserProfile | null) => {
    if (activeUser && activeUser.email) {
      playerAuthStore.syncSupabaseSession({
        id: activeUser.id,
        email: activeUser.email,
        fullName: activeProfile?.full_name || (activeUser.user_metadata?.full_name as string) || (activeUser.user_metadata?.name as string) || splitEmailName(activeUser.email),
        city: activeProfile?.city || (activeUser.user_metadata?.city as string),
        age: activeProfile?.age,
        role: activeProfile?.role || (activeUser.app_metadata?.role as any) || "player",
        avatarId: activeProfile?.avatar_id || (activeUser.user_metadata?.avatar_id as string),
        avatarUrl: activeProfile?.avatar_url,
        cciPlayerId: activeProfile?.cci_player_id,
        fideId: activeProfile?.fide_id,
        chessComUser: activeProfile?.chess_com_username,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id, user.email || "");
    if (p) {
      setProfile(p);
      syncWithLocalStore(user, p);
    }
  }, [user, fetchProfile, syncWithLocalStore]);

  // Initialize Supabase auth listener
  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();

    if (!client || !configured) {
      // Supabase is not configured; fallback cleanly to playerAuthStore
      const local = playerAuthStore.getCurrentUser();
      if (local && mounted) {
        setProfile({
          id: local.id,
          email: local.email,
          full_name: local.fullName,
          city: local.city,
          age: local.age,
          role: local.role,
          avatar_id: local.avatarId,
          avatar_url: local.avatarUrl,
          cci_player_id: local.cciPlayerId,
          fide_id: local.fideId,
          chess_com_username: local.chessComUser,
        });
      }
      setIsLoading(false);
      return;
    }

    // 1. Initial Session Check
    client.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn("Supabase initial getSession error:", error.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        const p = await fetchProfile(initialSession.user.id, initialSession.user.email || "");
        if (mounted) {
          setProfile(p);
          syncWithLocalStore(initialSession.user, p);
        }
      }
      if (mounted) setIsLoading(false);
    });

    // 2. Realtime Auth State Changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event: AuthChangeEvent, newSession: Session | null) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        const p = await fetchProfile(newSession.user.id, newSession.user.email || "");
        if (mounted) {
          setProfile(p);
          syncWithLocalStore(newSession.user, p);
        }
      } else {
        setProfile(null);
        playerAuthStore.syncSupabaseLogout();
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfile, syncWithLocalStore]);

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client || !configured) {
      // Local development fallback
      const res = playerAuthStore.login(email, password);
      if (res.success && res.user) {
        setProfile({
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.fullName,
          city: res.user.city,
          age: res.user.age,
          role: res.user.role,
          avatar_id: res.user.avatarId,
          avatar_url: res.user.avatarUrl,
          cci_player_id: res.user.cciPlayerId,
          fide_id: res.user.fideId,
          chess_com_username: res.user.chessComUser,
        });
        return { success: true };
      }
      return { success: false, error: res.error || "Login failed." };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        const p = await fetchProfile(data.user.id, data.user.email || email);
        setProfile(p);
        syncWithLocalStore(data.user, p);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Unexpected authentication error." };
    }
  };

  // Sign Up with Email & Password
  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: { fullName?: string; city?: string; age?: number; avatarId?: string }
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    const client = getSupabaseClient();
    if (!client || !configured) {
      // Local development fallback
      const res = playerAuthStore.register({
        fullName: metadata?.fullName || splitEmailName(email),
        age: metadata?.age || 20,
        email,
        city: metadata?.city || "Jabalpur",
        password,
        avatarId: metadata?.avatarId || "knight",
      });
      if (res.success && res.user) {
        setProfile({
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.fullName,
          city: res.user.city,
          age: res.user.age,
          role: res.user.role,
          avatar_id: res.user.avatarId,
          avatar_url: res.user.avatarUrl,
          cci_player_id: res.user.cciPlayerId,
          fide_id: res.user.fideId,
        });
        return { success: true, requiresEmailConfirmation: false };
      }
      return { success: false, error: res.error || "Registration failed." };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: metadata?.fullName?.trim() || splitEmailName(email),
            city: metadata?.city?.trim() || "Jabalpur",
            age: metadata?.age || 20,
            avatar_id: metadata?.avatarId || "knight",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const requiresConfirmation = !data.session;
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        const p = await fetchProfile(data.user.id, data.user.email || email);
        setProfile(p);
        syncWithLocalStore(data.user, p);
      }

      return { success: true, requiresEmailConfirmation: requiresConfirmation };
    } catch (err: any) {
      return { success: false, error: err?.message || "Registration failed." };
    }
  };

  // Sign In with OAuth (Google / GitHub)
  const signInWithOAuth = async (provider: "google" | "github"): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client || !configured) {
      // Fallback to local Google simulation
      const res = playerAuthStore.signInWithGoogle({
        email: `player_${Math.floor(100 + Math.random() * 900)}@gmail.com`,
        name: "Community Grandmaster",
      });
      if (res.success && res.user) {
        setProfile({
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.fullName,
          city: res.user.city,
          age: res.user.age,
          role: res.user.role,
          avatar_id: res.user.avatarId,
          avatar_url: res.user.avatarUrl,
          cci_player_id: res.user.cciPlayerId,
        });
        return { success: true };
      }
      return { success: false, error: "OAuth simulation failed." };
    }

    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/#account` : undefined;
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "OAuth sign-in failed." };
    }
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    const client = getSupabaseClient();
    if (client && configured) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error:", err);
      }
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    playerAuthStore.syncSupabaseLogout();
  };

  // Password Reset Request
  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client || !configured) {
      const res = playerAuthStore.requestPasswordReset(email);
      return { success: res.success, error: res.success ? undefined : res.message };
    }

    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/#reset-password` : undefined;
      const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Password reset request failed." };
    }
  };

  // Update Password
  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client || !configured) {
      return { success: true };
    }

    try {
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Password update failed." };
    }
  };

  const isAuthenticated = Boolean(user || profile || playerAuthStore.getCurrentUser());

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isAuthenticated,
    isLoading,
    isConfigured: configured,
    configSource: config.source,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function splitEmailName(email: string): string {
  const namePart = email.split("@")[0] || "CCI Member";
  return namePart
    .split(/[._-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

