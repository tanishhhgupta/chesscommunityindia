import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage keys for runtime configuration overrides
 */
const STORAGE_KEYS = {
  url: "cci_supabase_url",
  anonKey: "cci_supabase_anon_key",
  legacyUrl: "chesspair_supabase_url",
  legacyAnonKey: "chesspair_supabase_anon_key",
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: "environment" | "localStorage" | "unconfigured";
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL?.trim() || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY?.trim() || "";

  let storedUrl = "";
  let storedKey = "";

  if (typeof window !== "undefined") {
    storedUrl =
      localStorage.getItem(STORAGE_KEYS.url)?.trim() ||
      localStorage.getItem(STORAGE_KEYS.legacyUrl)?.trim() ||
      "";
    storedKey =
      localStorage.getItem(STORAGE_KEYS.anonKey)?.trim() ||
      localStorage.getItem(STORAGE_KEYS.legacyAnonKey)?.trim() ||
      "";
  }

  const activeUrl = envUrl || storedUrl;
  const activeKey = envKey || storedKey;

  const isConfigured = Boolean(
    activeUrl &&
    activeKey &&
    activeUrl.startsWith("https://") &&
    !activeUrl.includes("your-project") &&
    !activeUrl.includes("placeholder")
  );

  return {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured,
    source: envUrl ? "environment" : storedUrl ? "localStorage" : "unconfigured",
  };
}

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = "";
let lastUsedKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (
    !supabaseInstance ||
    lastUsedUrl !== config.url ||
    lastUsedKey !== config.anonKey
  ) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
        },
      });
      lastUsedUrl = config.url;
      lastUsedKey = config.anonKey;
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function saveSupabaseRuntimeConfig(url: string, anonKey: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.url, url.trim());
    localStorage.setItem(STORAGE_KEYS.anonKey, anonKey.trim());
    // Invalidate cached client to recreate with new credentials
    supabaseInstance = null;
  }
}

