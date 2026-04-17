-- Bensly Labs Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  rating NUMERIC(3,1) DEFAULT 4.5,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'beta', 'live')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  platform VARCHAR(20) CHECK (platform IN ('android', 'ios', 'web')),
  version VARCHAR(50),
  apk_path TEXT,
  play_store_url TEXT,
  app_store_url TEXT,
  pwa_url TEXT,
  is_latest BOOLEAN DEFAULT FALSE,
  release_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS install_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id),
  device_type VARCHAR(20),
  country VARCHAR(10),
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_install_events_app_id ON install_events(app_id);
CREATE INDEX IF NOT EXISTS idx_install_events_created_at ON install_events(created_at);
CREATE INDEX IF NOT EXISTS idx_app_versions_app_id ON app_versions(app_id);

-- Seed data
INSERT INTO apps (slug, name, description, status, rating) VALUES
  ('julinemart', 'JulineMart', 'Kenya''s premier e-commerce marketplace. Shop thousands of products with fast delivery across East Africa.', 'live', 4.8),
  ('skola', 'Skola', 'Smart school management system. Attendance, grades, fees, and communication for modern schools.', 'live', 4.9),
  ('rotapay', 'RotaPay', 'Fast and secure mobile payments. Send, receive, and manage money across Africa.', 'beta', 4.7)
ON CONFLICT (slug) DO NOTHING;
