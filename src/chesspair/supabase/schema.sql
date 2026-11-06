-- ==============================================================================
-- ChessPair Database Schema (PostgreSQL with Supabase RLS)
-- Multi-tenant Chess Tournament Management System with Role-Based Access Control
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    fide_id TEXT,
    national_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. ORGANIZATIONS (Clubs, Federations, Tournament Organizers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    country TEXT DEFAULT 'US',
    website TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATION MEMBERS (Role-Based Access Control)
-- Roles: 'owner', 'admin', 'organizer', 'arbiter', 'viewer'
-- ------------------------------------------------------------------------------
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'organizer', 'arbiter', 'viewer');

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'arbiter',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 4. PLAYERS (Organization Roster)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    fide_id TEXT,
    national_id TEXT,
    rating INTEGER NOT NULL DEFAULT 1200,
    title TEXT DEFAULT 'None', -- 'GM', 'IM', 'WGM', 'FM', 'WIM', 'CM', 'WCM', 'None'
    federation TEXT DEFAULT 'FID',
    club TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. TOURNAMENTS
-- Supported formats: 'basic_swiss', 'round_robin', 'knockout', 'team', 'fide_swiss'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    format TEXT NOT NULL DEFAULT 'basic_swiss', -- Note: 'basic_swiss' is labeled non-FIDE certified
    engine_version TEXT NOT NULL DEFAULT 'basic-swiss-v1',
    time_control_category TEXT NOT NULL DEFAULT 'rapid', -- 'blitz', 'rapid', 'classical', 'bullet', 'custom'
    time_control_string TEXT NOT NULL DEFAULT '15m + 10s',
    rounds_count INTEGER NOT NULL DEFAULT 5,
    current_round INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'registration', 'in_progress', 'completed', 'archived'
    points_win NUMERIC(3,1) NOT NULL DEFAULT 1.0,
    points_draw NUMERIC(3,1) NOT NULL DEFAULT 0.5,
    points_loss NUMERIC(3,1) NOT NULL DEFAULT 0.0,
    tiebreak_rules JSONB NOT NULL DEFAULT '["buchholz_cut1", "buchholz_median", "sonneborn_berger", "direct_encounter", "most_blacks", "wins"]'::jsonb,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    venue TEXT,
    chief_arbiter TEXT,
    deputy_arbiter TEXT,
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, slug)
);

-- ------------------------------------------------------------------------------
-- 6. TOURNAMENT PARTICIPANTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    seed_number INTEGER,
    initial_rating INTEGER NOT NULL,
    is_withdrawn BOOLEAN NOT NULL DEFAULT FALSE,
    withdrawn_at_round INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tournament_id, player_id)
);

-- ------------------------------------------------------------------------------
-- 7. ROUNDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'in_progress', 'completed'
    pairings_locked BOOLEAN NOT NULL DEFAULT FALSE,
    paired_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tournament_id, round_number)
);

-- ------------------------------------------------------------------------------
-- 8. PAIRINGS & RESULTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pairings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    board_number INTEGER NOT NULL,
    white_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    result TEXT NOT NULL DEFAULT 'UNPLAYED', -- '1-0', '0.5-0.5', '0-1', '1F-0', '0-1F', '0F-0F', '1-0_BYE', '0.5-BYE', '0-BYE', 'UNPLAYED'
    is_bye BOOLEAN NOT NULL DEFAULT FALSE,
    bye_type TEXT, -- 'full_point', 'half_point', 'zero_point'
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    manual_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(round_id, board_number)
);

-- ------------------------------------------------------------------------------
-- 9. AUDIT LOGS (Traceability for Arbiter overrides, pairings, score adjustments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'GENERATE_PAIRINGS', 'PUBLISH_ROUND', 'ENTER_RESULT', 'MANUAL_SWAP', 'UPDATE_SETTINGS'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is member of organization with minimum role
CREATE OR REPLACE FUNCTION public.check_user_org_permission(
    org_id UUID,
    required_roles org_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND role = ANY(required_roles)
    );
$$;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ORGANIZATIONS POLICIES
CREATE POLICY "Members can view their organizations"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
              AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and Admins can update organization"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (public.check_user_org_permission(id, ARRAY['owner'::org_role, 'admin'::org_role]));

-- PLAYERS POLICIES (Scoped to Organization)
CREATE POLICY "Organization members can view players"
    ON public.players FOR SELECT
    TO authenticated
    USING (public.check_user_org_permission(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role, 'viewer'::org_role]));

CREATE POLICY "Organizers, Arbiters and Admins can manage players"
    ON public.players FOR ALL
    TO authenticated
    USING (public.check_user_org_permission(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role]));

-- TOURNAMENTS POLICIES
CREATE POLICY "Public tournaments viewable by everyone"
    ON public.tournaments FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Organization members can view any org tournament"
    ON public.tournaments FOR SELECT
    TO authenticated
    USING (public.check_user_org_permission(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role, 'viewer'::org_role]));

CREATE POLICY "Organizers and Admins can create and edit tournaments"
    ON public.tournaments FOR ALL
    TO authenticated
    USING (public.check_user_org_permission(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role]));

-- ROUNDS & PAIRINGS POLICIES
CREATE POLICY "Published rounds viewable if tournament is public"
    ON public.rounds FOR SELECT
    USING (
        status IN ('published', 'in_progress', 'completed')
        AND EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE tournaments.id = rounds.tournament_id AND tournaments.is_public = TRUE
        )
    );

CREATE POLICY "Org members can view rounds"
    ON public.rounds FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE tournaments.id = rounds.tournament_id
              AND public.check_user_org_permission(tournaments.organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role, 'viewer'::org_role])
        )
    );

CREATE POLICY "Arbiters, Organizers, and Admins can manage rounds"
    ON public.rounds FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE tournaments.id = rounds.tournament_id
              AND public.check_user_org_permission(tournaments.organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role])
        )
    );

CREATE POLICY "Published pairings viewable if tournament is public"
    ON public.pairings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds
            JOIN public.tournaments ON tournaments.id = rounds.tournament_id
            WHERE rounds.id = pairings.round_id
              AND rounds.status IN ('published', 'in_progress', 'completed')
              AND tournaments.is_public = TRUE
        )
    );

CREATE POLICY "Arbiters, Organizers, and Admins can manage pairings"
    ON public.pairings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE tournaments.id = pairings.tournament_id
              AND public.check_user_org_permission(tournaments.organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role])
        )
    );

-- AUDIT LOGS POLICIES
CREATE POLICY "Org members can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.check_user_org_permission(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role]));

CREATE POLICY "Arbiters and Organizers can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.check_user_org_permission(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'organizer'::org_role, 'arbiter'::org_role]));
