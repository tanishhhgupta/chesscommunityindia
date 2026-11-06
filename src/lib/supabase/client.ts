import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project-ref')
);

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Database Profile Types
export interface DatabaseProfile {
  id: string;
  email: string;
  full_name: string;
  age?: number;
  city: string;
  state: string;
  role: 'player' | 'arbiter' | 'admin';
  avatar_id: string;
  avatar_url?: string;
  cci_player_id: string;
  fide_id?: string;
  national_id?: string;
  chess_com_user?: string;
  lichess_user?: string;
  chess_title?: string;
  standard_rating: number;
  rapid_rating: number;
  blitz_rating: number;
  peak_rating: number;
  category_name: string;
  category_tier: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_percentage: number;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseRatingHistory {
  id: string;
  player_id: string;
  cci_player_id: string;
  event_name: string;
  date: string;
  rating_before: number;
  rating_after: number;
  rating_delta: number;
  category_name: string;
  performance_rating?: number;
  created_at: string;
}

export interface DatabasePartner {
  id: string;
  name: string;
  category: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// =============================================================================
// AUTHENTICATION OPERATIONS
// =============================================================================

export async function supabaseSignUp(params: {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  city?: string;
  chessComUser?: string;
  avatarId?: string;
}) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim().toLowerCase(),
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        age: params.age,
        city: params.city?.trim() || 'Jabalpur',
        chess_com_user: params.chessComUser?.trim() || undefined,
        avatar_id: params.avatarId || 'pawn',
      },
    },
  });

  return { data, error };
}

export async function supabaseSignIn(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  return await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function supabaseSignInWithGoogle() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
}

export async function supabaseSignOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

export async function supabaseResetPassword(email: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  return await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined,
  });
}

// =============================================================================
// PROFILE OPERATIONS
// =============================================================================

export async function fetchProfileById(userId: string): Promise<DatabaseProfile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as DatabaseProfile;
  } catch {
    return null;
  }
}

export async function fetchProfileByCciId(cciId: string): Promise<DatabaseProfile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('cci_player_id', cciId)
      .single();

    if (error || !data) return null;
    return data as DatabaseProfile;
  } catch {
    return null;
  }
}

export async function updateProfile(
  userId: string, 
  updates: Partial<Pick<DatabaseProfile, 'full_name' | 'city' | 'age' | 'avatar_id' | 'avatar_url' | 'chess_com_user' | 'lichess_user'>>
) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured.') };
  }

  return await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

// =============================================================================
// PARTNERS & MEDIA OPERATIONS
// =============================================================================

export async function fetchActivePartners(): Promise<DatabasePartner[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return data as DatabasePartner[];
  } catch {
    return [];
  }
}

export async function subscribeNewsletter(email: string) {
  if (!isSupabaseConfigured) {
    return { error: null }; // Silently acknowledge in fallback mode
  }

  return await supabase
    .from('newsletter_subscribers')
    .upsert({ email: email.trim().toLowerCase() }, { onConflict: 'email' });
}

// =============================================================================
// STORAGE OPERATIONS
// =============================================================================

export async function uploadAvatarFile(file: File, userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const ext = file.name.split('.').pop();
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Avatar upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Failed to upload avatar:', err);
    return null;
  }
}

