-- PostgreSQL / Supabase Database Schema for AI Emergency Response System
-- Enable PostGIS extension for GIS spatial coordinates if available
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('USER', 'RESPONDER', 'ADMIN')),
    hospital_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HOSPITALS TABLE (Stores live Google Places metadata + internal audit)
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    phone TEXT,
    website TEXT,
    google_maps_uri TEXT,
    business_status TEXT DEFAULT 'OPERATIONAL',
    source TEXT NOT NULL CHECK (source IN ('GOOGLE_PLACES', 'VERIFIED_DATABASE', 'DEMO_DATA')),
    source_retrieved_at TIMESTAMPTZ DEFAULT NOW(),
    verification_status TEXT DEFAULT 'NOT_AVAILABLE' CHECK (verification_status IN ('VERIFIED', 'UNVERIFIED', 'NOT_AVAILABLE')),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast spatial distance search & Google Place ID lookups
CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON hospitals(google_place_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_coords ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_is_demo ON hospitals(is_demo);

-- 3. VERIFIED CLINICAL CAPABILITIES TABLE
CREATE TABLE IF NOT EXISTS verified_capabilities (
    hospital_id UUID PRIMARY KEY REFERENCES hospitals(id) ON DELETE CASCADE,
    has_emergency_department BOOLEAN DEFAULT FALSE,
    has_icu BOOLEAN DEFAULT FALSE,
    has_trauma_center BOOLEAN DEFAULT FALSE,
    has_blood_bank BOOLEAN DEFAULT FALSE,
    has_cardiology BOOLEAN DEFAULT FALSE,
    has_neurology BOOLEAN DEFAULT FALSE,
    has_orthopedics BOOLEAN DEFAULT FALSE,
    has_burn_unit BOOLEAN DEFAULT FALSE,
    has_ambulance BOOLEAN DEFAULT FALSE,
    has_operation_theatre BOOLEAN DEFAULT FALSE,
    is_emergency_available BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT UNIQUE NOT NULL,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    emergency_type TEXT NOT NULL,
    description TEXT NOT NULL,
    people_affected INT DEFAULT 1 CHECK (people_affected > 0),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    gps_accuracy DOUBLE PRECISION CHECK (gps_accuracy > 0),
    location_source TEXT NOT NULL CHECK (location_source IN ('DEVICE_GPS', 'MANUAL')),
    location_timestamp TIMESTAMPTZ NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    severity_score INT DEFAULT 0,
    ai_confidence INT DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ANALYZING', 'HOSPITAL_RECOMMENDED', 'REPORT_GENERATED', 'ALERT_SENT', 'ACKNOWLEDGED', 'IN_RESPONSE', 'RESOLVED')),
    recommended_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    search_radius_km DOUBLE PRECISION DEFAULT 5.0,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_owner ON incidents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_is_demo ON incidents(is_demo);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- 5. AI ANALYSIS SUMMARY TABLE
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    analysis_summary TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    recommended_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI MULTIMODAL OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS ai_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('VISION', 'VOICE', 'TEXT', 'LOCATION', 'INFERENCE')),
    observation_type TEXT NOT NULL,
    label TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OFFLINE SYNC QUEUE TABLE
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id TEXT NOT NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    retry_count INT DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Incidents RLS
CREATE POLICY "Users view own incidents" ON incidents
    FOR SELECT USING (auth.uid() = owner_user_id OR is_demo = TRUE);

CREATE POLICY "Responders view active incidents" ON incidents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('RESPONDER', 'ADMIN')
        )
    );

-- Hospitals RLS
CREATE POLICY "Public view hospitals" ON hospitals
    FOR SELECT USING (TRUE);
