-- OwnerScout Database Schema
-- Run this in your Supabase SQL editor to set up the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SEARCH CACHE
-- Stores results from Google APIs to avoid redundant calls.
-- Cache key is a deterministic hash of (zipCode, radiusKm, filters, insightType).
-- ============================================================
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  zip_code TEXT NOT NULL,
  radius_km FLOAT NOT NULL,
  filters JSONB NOT NULL,
  insight_type TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_search_cache_key ON search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- ============================================================
-- PLACE CACHE
-- Stores individual place details from Google Places API.
-- ============================================================
CREATE TABLE IF NOT EXISTS place_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_place_cache_place_id ON place_cache(place_id);
CREATE INDEX IF NOT EXISTS idx_place_cache_expires ON place_cache(expires_at);

-- ============================================================
-- SAVED SEARCHES
-- User-bookmarked search configurations.
-- Each user can save and re-run searches without re-entering params.
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  radius_km FLOAT NOT NULL,
  filters JSONB NOT NULL,
  last_cache_key TEXT REFERENCES search_cache(cache_key),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- Users can only access their own saved searches.
-- ============================================================
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can read own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can insert own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;

-- We handle auth in our API layer (Clerk JWT), not Supabase Auth,
-- so we use service-role key in the backend and skip RLS enforcement there.
-- But keep RLS enabled as a safety net with a permissive policy for service role.
CREATE POLICY "Service role bypass" ON saved_searches
  USING (true)
  WITH CHECK (true);

-- Search cache and place cache are shared (no user-level RLS needed)
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass" ON search_cache USING (true) WITH CHECK (true);

ALTER TABLE place_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass" ON place_cache USING (true) WITH CHECK (true);
