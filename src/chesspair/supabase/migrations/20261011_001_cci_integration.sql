-- ==============================================================================
-- Chess Community India × ChessPair Migration
-- Version: 20261011_001_cci_integration
-- Description: Adds CCI Player Identifiers, 1,000 baseline rating, 6-category logic,
--              multi-city affiliations (Jabalpur, Bhopal, Indore, Delhi),
--              and an auditable rating history ledger with RLS security.
-- ==============================================================================

-- 1. Extend Players table with CCI fields
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS cci_player_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cci_rating INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS rating_category TEXT NOT NULL DEFAULT 'Category 2';

-- Add check constraint for non-negative rating
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS chk_cci_rating_non_negative;

ALTER TABLE public.players
  ADD CONSTRAINT chk_cci_rating_non_negative CHECK (cci_rating >= 0);

-- 2. Multi-City Affiliation Table (Normalized Many-to-Many)
CREATE TABLE IF NOT EXISTS public.player_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    city_name TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(player_id, city_name)
);

CREATE INDEX IF NOT EXISTS idx_player_cities_city ON public.player_cities(city_name);
CREATE INDEX IF NOT EXISTS idx_player_cities_player ON public.player_cities(player_id);

-- 3. Auditable Rating History Ledger
CREATE TABLE IF NOT EXISTS public.rating_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    round_number INTEGER,
    board_number INTEGER,
    opponent_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    previous_rating INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    new_rating INTEGER NOT NULL,
    category_before TEXT NOT NULL,
    category_after TEXT NOT NULL,
    result TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rating_history_player ON public.rating_history(player_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_tournament ON public.rating_history(tournament_id);

-- 4. Function & Trigger: Automatic Category Computation
-- Categories:
-- Category 1: 0 - 800
-- Category 2: 801 - 1200
-- Category 3: 1201 - 1600
-- Category 4: 1601 - 2000
-- Category 5: 2001 - 2400
-- Category 6: 2401 - 3000
CREATE OR REPLACE FUNCTION public.compute_cci_category(rating INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF rating <= 800 THEN
        RETURN 'Category 1';
    ELSIF rating <= 1200 THEN
        RETURN 'Category 2';
    ELSIF rating <= 1600 THEN
        RETURN 'Category 3';
    ELSIF rating <= 2000 THEN
        RETURN 'Category 4';
    ELSIF rating <= 2400 THEN
        RETURN 'Category 5';
    ELSE
        RETURN 'Category 6';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_update_player_category()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.rating_category := public.compute_cci_category(NEW.cci_rating);
    -- Sync default rating column if needed
    NEW.rating := NEW.cci_rating;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_players_category_update ON public.players;
CREATE TRIGGER trg_players_category_update
    BEFORE INSERT OR UPDATE OF cci_rating ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_update_player_category();

-- 5. Row Level Security Policies
ALTER TABLE public.player_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;

-- Reading policies
CREATE POLICY "Public read player cities" ON public.player_cities
    FOR SELECT USING (true);

CREATE POLICY "Public read rating history" ON public.rating_history
    FOR SELECT USING (true);

-- Modification policies: Only organization staff (owner, admin, organizer, arbiter) can modify
CREATE POLICY "Staff manage player cities" ON public.player_cities
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.players p
            JOIN public.organization_members om ON om.organization_id = p.organization_id
            WHERE p.id = player_cities.player_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'organizer', 'arbiter')
        )
    );

CREATE POLICY "Staff insert rating history" ON public.rating_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.players p
            JOIN public.organization_members om ON om.organization_id = p.organization_id
            WHERE p.id = rating_history.player_id
              AND om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin', 'organizer', 'arbiter')
        )
    );
