CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lokals (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tracking_events (
  id BIGSERIAL PRIMARY KEY,
  lokal_id TEXT NOT NULL REFERENCES lokals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_visit','video_play','progress_25','progress_50','progress_75','video_complete')),
  visitor_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lokals_admin_id_idx ON lokals(admin_id);
CREATE INDEX IF NOT EXISTS tracking_lokal_id_idx ON tracking_events(lokal_id);
CREATE INDEX IF NOT EXISTS tracking_created_at_idx ON tracking_events(created_at);
