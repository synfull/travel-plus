-- Supabase Schema for Travel+ App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cache table for storing API responses
CREATE TABLE cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT cache_key_unique UNIQUE (key)
);

-- Index for faster cache lookups
CREATE INDEX idx_cache_key ON cache(key);
CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- Itineraries table (for saved itineraries)
CREATE TABLE itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  people INTEGER NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  categories TEXT[] NOT NULL,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0
);

-- Index for user's itineraries
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_destination ON itineraries(destination);
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);

-- Affiliate clicks tracking
CREATE TABLE affiliate_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affiliate_type TEXT NOT NULL, -- 'booking', 'viator', 'amadeus'
  destination TEXT,
  item_id TEXT,
  item_type TEXT, -- 'flight', 'hotel', 'activity'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10, 2)
);

-- Index for affiliate performance tracking
CREATE INDEX idx_affiliate_clicks_type ON affiliate_clicks(affiliate_type);
CREATE INDEX idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX idx_affiliate_clicks_converted ON affiliate_clicks(converted);

-- Popular destinations table (for pre-caching)
CREATE TABLE popular_destinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  airport_code TEXT,
  search_count INTEGER DEFAULT 0,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cached_data JSONB,
  CONSTRAINT popular_destinations_unique UNIQUE (city, country)
);

-- User preferences table (for future personalization)
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories TEXT[],
  typical_budget_range JSONB,
  home_location TEXT,
  past_destinations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_preferences_user_unique UNIQUE (user_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Cache table policies (public read/write for now)
CREATE POLICY "Public cache read" ON cache FOR SELECT TO anon USING (true);
CREATE POLICY "Public cache write" ON cache FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public cache update" ON cache FOR UPDATE TO anon USING (true);
CREATE POLICY "Public cache delete" ON cache FOR DELETE TO anon USING (true);

-- Itineraries policies
CREATE POLICY "Users can view own itineraries" ON itineraries 
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own itineraries" ON itineraries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries" ON itineraries 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries" ON itineraries 
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics events policies (write-only for anonymous)
CREATE POLICY "Anyone can write analytics" ON analytics_events 
  FOR INSERT TO anon WITH CHECK (true);

-- Affiliate clicks policies
CREATE POLICY "Anyone can track affiliate clicks" ON affiliate_clicks 
  FOR INSERT TO anon WITH CHECK (true);

-- Popular destinations policies (public read)
CREATE POLICY "Public can read popular destinations" ON popular_destinations 
  FOR SELECT TO anon USING (true);

-- Functions

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to increment destination search count
CREATE OR REPLACE FUNCTION increment_destination_search(
  p_city TEXT,
  p_country TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO popular_destinations (city, country, search_count, last_searched)
  VALUES (p_city, p_country, 1, NOW())
  ON CONFLICT (city, country)
  DO UPDATE SET 
    search_count = popular_destinations.search_count + 1,
    last_searched = NOW();
END;
$$ LANGUAGE plpgsql;

-- Scheduled jobs (if using pg_cron extension)
-- Run cache cleanup every hour
-- SELECT cron.schedule('clean-cache', '0 * * * *', 'SELECT clean_expired_cache();');