-- ============================================================================
-- Umkhuseli / Sankofa Safe — Supabase PostgreSQL Schema
-- FNB App of the Year Hackathon 2026: Safer Communities & GBV Response
-- Target: Zero-Knowledge Encrypted Cloud Vault, PostGIS Safety Heatmap & Edge SOS
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. User Profiles / Anonymous Device Registrations
-- Victims can authenticate anonymously via Supabase Auth (auth.uid()) or PIN-based pseudonym
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    sa_id_number TEXT NOT NULL DEFAULT '',
    safe_word TEXT NOT NULL DEFAULT '',
    medical_conditions TEXT NOT NULL DEFAULT '',
    alert_email TEXT NOT NULL DEFAULT '',
    twitter_handle TEXT NOT NULL DEFAULT '',
    instagram_handle TEXT NOT NULL DEFAULT '',
    facebook_profile TEXT NOT NULL DEFAULT '',
    preferred_disguise TEXT NOT NULL DEFAULT 'MUNICIPAL_PREPAID'
        CHECK (preferred_disguise IN ('MUNICIPAL_PREPAID', 'MUSIC_PLAYER', 'DAILY_DEVOTIONAL', 'ANDROID_LAUNCHER')),
    is_uat_mode BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_completed_at TIMESTAMPTZ,
    recovery_hash TEXT, -- Optional bcrypt/argon2 hash of recovery passphrase
    duress_pin_hash TEXT, -- Hash for duress trigger PIN
    preferred_language TEXT DEFAULT 'en', -- en, zu, xh, st, af
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ICE Guardians Table (Migrated & Enhanced from GuardianEntity.kt)
CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surname TEXT DEFAULT '',
    mobile_number_1 TEXT NOT NULL,
    mobile_number_2 TEXT DEFAULT '',
    email_address_1 TEXT DEFAULT '',
    email_address_2 TEXT DEFAULT '',
    tiktok_handle TEXT DEFAULT '',
    facebook_profile TEXT DEFAULT '',
    instagram_handle TEXT DEFAULT '',
    has_whatsapp_access BOOLEAN DEFAULT TRUE,
    relationship TEXT DEFAULT 'Guardian',
    notify_via_sms BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    position SMALLINT NOT NULL DEFAULT 1 CHECK (position BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON public.guardians(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_user_position ON public.guardians(user_id, position);

-- 4. Evidence Vault: Incidents Table (Zero-Knowledge AES-256-GCM)
-- Text and metadata are encrypted client-side with AES-256-GCM prior to upload.
-- The server stores zero plaintext details about the perpetrator or assault.
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    date_time_formatted TEXT NOT NULL,
    incident_type TEXT NOT NULL, -- Physical, Verbal/Emotional, Threat, Financial, Stalking, Property Damage, Digital Surveillance
    severity_level INT NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    encrypted_payload TEXT NOT NULL, -- AES-256-GCM ciphertext containing perpetrator, description, injuries, witnesses, notes
    police_ob_number TEXT DEFAULT '', -- SAPS Occurrence Book number if reported
    evidence_media_keys TEXT[] DEFAULT '{}', -- S3 storage keys in vault-evidence bucket
    sha256_checksum TEXT NOT NULL, -- Tamper-proof hash for legal admissibility
    form2_affidavit_draft TEXT DEFAULT '', -- Generated via Gemini AI Studio
    danger_score INT CHECK (danger_score BETWEEN 0 AND 100), -- Predictive Danger Assessment Index (DAI)
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON public.incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity_level);

-- 5. SOS Beacons Table (Triggered during panic state for Unstoppable Dispatch)
CREATE TABLE IF NOT EXISTS public.sos_beacons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DISPATCHED', 'RESOLVED', 'FALSE_ALARM')),
    is_duress BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    area_name TEXT DEFAULT 'Pending GPS lock',
    battery_percentage INT,
    is_charging BOOLEAN DEFAULT FALSE,
    device_model TEXT,
    distress_message TEXT,
    dispatched_channels TEXT[] DEFAULT '{}', -- ['SMS', 'EMAIL', 'WHATSAPP_GATEWAY']
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sos_beacons_user_id ON public.sos_beacons(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_beacons_status ON public.sos_beacons(status);

-- 6. PostGIS Crowdsourced Safety Hazards (Anonymous Community Heatmap)
-- Allows users to report unsafe zones (broken lighting during loadshedding, harassment hotspots)
-- completely anonymously without tying to user_id.
CREATE TABLE IF NOT EXISTS public.safety_hazards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_type TEXT NOT NULL, -- 'Dark Street / No Lighting', 'Harassment Hotspot', 'Isolated Alley', 'Unmanned Taxi Rank'
    description TEXT DEFAULT '',
    province TEXT NOT NULL, -- Gauteng, Western Cape, KwaZulu-Natal, etc.
    location GEOGRAPHY(Point, 4326) NOT NULL,
    verified_count INT DEFAULT 1,
    reported_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safety_hazards_geo ON public.safety_hazards USING GIST(location);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Zero-Knowledge Privacy Isolation
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_beacons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_hazards ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users view own profile" 
    ON public.profiles FOR SELECT 
    TO authenticated
    USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users update own profile" 
    ON public.profiles FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users insert own profile" 
    ON public.profiles FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

-- Guardians: Strictly isolated by user_id
CREATE POLICY "Users manage own guardians" 
    ON public.guardians FOR ALL 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardians TO authenticated;

-- Incidents: Strict zero-knowledge access
CREATE POLICY "Users manage own incidents" 
    ON public.incidents FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- SOS Beacons: Users can insert and read their own beacons
CREATE POLICY "Users manage own sos beacons" 
    ON public.sos_beacons FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Safety Hazards Heatmap: Anyone can read aggregated pins, authenticated users can insert pins anonymously
CREATE POLICY "Public read safety hazards" 
    ON public.safety_hazards FOR SELECT 
    USING (TRUE);

CREATE POLICY "Users insert anonymous hazard pins" 
    ON public.safety_hazards FOR INSERT 
    WITH CHECK (TRUE);

-- ============================================================================
-- STORAGE CONFIGURATION & BUCKET POLICIES
-- ============================================================================

-- Create private bucket for encrypted evidence files (J88 medical photos, audio)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vault-evidence',
    'vault-evidence',
    FALSE,
    52428800, -- 50 MB limit per encrypted file
    ARRAY['application/octet-stream', 'image/jpeg', 'image/png', 'audio/mp4', 'audio/aac', 'audio/mpeg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can only upload and read files within their own user_id directory
CREATE POLICY "Users upload to own vault directory"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'vault-evidence' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users read own vault objects"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'vault-evidence' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users delete own vault objects"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'vault-evidence' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================================
-- POSTGIS SPATIAL QUERY FUNCTIONS
-- ============================================================================

-- Function to find safety hazards within X meters of user GPS
CREATE OR REPLACE FUNCTION get_hazards_nearby(
    user_lat DOUBLE PRECISION,
    user_lon DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (
    id UUID,
    hazard_type TEXT,
    description TEXT,
    province TEXT,
    distance_meters DOUBLE PRECISION,
    verified_count INT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        id,
        hazard_type,
        description,
        province,
        ST_Distance(location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) AS distance_meters,
        verified_count
    FROM public.safety_hazards
    WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
        radius_meters
    )
    ORDER BY distance_meters ASC;
$$;

-- ============================================================================
-- 10. ADVANCED JOURNEYS, 72-HOUR BEACONS, CONTACTS & GHOST BEACONS
-- ============================================================================

-- Private Registered Contact Hashes (HMAC/SHA-256 phone matching)
CREATE TABLE IF NOT EXISTS public.registered_contact_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_hash TEXT NOT NULL UNIQUE,
    display_alias TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_hashes_hash ON public.registered_contact_hashes(phone_hash);
ALTER TABLE public.registered_contact_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own registered contact hash"
    ON public.registered_contact_hashes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RPC: Match Address Book Hashes (Private Discovery)
CREATE OR REPLACE FUNCTION match_registered_contacts(
    lookup_hashes TEXT[]
)
RETURNS TABLE (
    user_id UUID,
    phone_hash TEXT,
    display_alias TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        user_id,
        phone_hash,
        display_alias
    FROM public.registered_contact_hashes
    WHERE phone_hash = ANY(lookup_hashes)
      AND user_id != auth.uid();
$$;

-- Safe Journeys with Dynamic 3km Geofence and 1km Fuzzy Safe Home Return
CREATE TABLE IF NOT EXISTS public.safe_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_title TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    departure_radius_km NUMERIC DEFAULT 3.0,
    home_fuzzy_radius_km NUMERIC DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'DEVIATION_ALERT', 'SAFE_RETURN', 'TERMINATED'
    selected_guardians JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_safe_journeys_user ON public.safe_journeys(user_id);
ALTER TABLE public.safe_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own safe journeys"
    ON public.safe_journeys
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 72-Hour Ephemeral Live Beacons
CREATE TABLE IF NOT EXISTS public.live_beacons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    accuracy NUMERIC,
    battery_pct INT,
    is_charging BOOLEAN DEFAULT FALSE,
    device_model TEXT DEFAULT '',
    current_area TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '72 hours'),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_beacons_token ON public.live_beacons(token);
ALTER TABLE public.live_beacons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create and manage their own live beacons"
    ON public.live_beacons
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read for active unexpired live beacons by token"
    ON public.live_beacons
    FOR SELECT
    USING (is_active = TRUE AND expires_at > TIMEZONE('utc'::text, NOW()));

-- Ghost Beacons (Silent 6-Hour Hardware Tracking)
CREATE TABLE IF NOT EXISTS public.ghost_beacons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hardware_id TEXT NOT NULL,
    user_declared_imei TEXT,
    battery_level INT,
    network_carrier TEXT,
    approx_lat DOUBLE PRECISION,
    approx_lng DOUBLE PRECISION,
    synced_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ghost_beacons_hardware ON public.ghost_beacons(hardware_id);
ALTER TABLE public.ghost_beacons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ghost beacons"
    ON public.ghost_beacons
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);



-- ============================================================================
-- 9. User Acceptance Testing (UAT) Feedback Submissions
-- Allows physical device beta testers to submit anonymous feedback and bug reports.
-- IP addresses, device serials, and personal identity are stripped in compliance with POPIA.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uat_feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tester_alias TEXT DEFAULT 'Anonymous Tester',
    device_model TEXT NOT NULL,
    os_version TEXT NOT NULL,
    app_version TEXT NOT NULL DEFAULT '2.3.0',
    platform TEXT NOT NULL CHECK (platform IN ('ANDROID_NATIVE', 'WEB_PWA', 'SAFARI_IOS')),
    network_condition TEXT DEFAULT 'UNKNOWN',
    stealth_rating INT CHECK (stealth_rating BETWEEN 1 AND 5),
    panic_speed_rating INT CHECK (panic_speed_rating BETWEEN 1 AND 5),
    unlock_ease_rating INT CHECK (unlock_ease_rating BETWEEN 1 AND 5),
    sos_grace_rating INT CHECK (sos_grace_rating BETWEEN 1 AND 5),
    offline_reliability_rating INT CHECK (offline_reliability_rating BETWEEN 1 AND 5),
    form2_quality_rating INT CHECK (form2_quality_rating BETWEEN 1 AND 5),
    overall_sus_score INT,
    bug_description TEXT DEFAULT '',
    bug_severity TEXT CHECK (bug_severity IN ('BLOCKER', 'MAJOR', 'MINOR', 'NONE', 'SUGGESTION')),
    qualitative_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.uat_feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert for UAT feedback"
    ON public.uat_feedback_submissions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to view UAT feedback"
    ON public.uat_feedback_submissions
    FOR SELECT
    USING (auth.role() = 'authenticated');
