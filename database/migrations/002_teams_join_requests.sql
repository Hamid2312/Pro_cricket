-- ============================================================
-- Migration 002: Teams + Join Requests + Captain flag
-- Run in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ---------------------------------------------------------------------------
-- TEAMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO teams (id, name, slug)
VALUES (1, 'Hafiz Stars Eleven', 'hafiz-stars-eleven')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- PLAYERS: add captain flag (is_admin = treasurer/admin, is_captain = squad captain)
-- ---------------------------------------------------------------------------
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- JOIN REQUESTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS join_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         INT NOT NULL DEFAULT 1 REFERENCES teams(id),
  user_id         UUID NOT NULL,
  full_name       TEXT NOT NULL,
  jersey_number   INT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-Rounder', 'WK')),
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at     TIMESTAMPTZ,
  reviewer_note   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent multiple pending requests per user per team
CREATE UNIQUE INDEX IF NOT EXISTS idx_join_requests_one_pending_per_user_team
  ON join_requests (team_id, user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests (status, team_id);

-- ---------------------------------------------------------------------------
-- REALTIME: add join_requests + rsvps + stats to publication
-- ---------------------------------------------------------------------------
-- Add tables that weren't in the original publication
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE stats;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_read_all" ON teams FOR SELECT USING (true);

-- Users can read their own requests
CREATE POLICY "join_read_own" ON join_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Captains/admins can read all pending for their team
CREATE POLICY "join_read_captain" ON join_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.auth_id = auth.uid()
        AND p.status = 'Active'
        AND (p.is_captain = true OR p.is_admin = true)
    )
  );

-- Users can insert their own request
CREATE POLICY "join_insert_self" ON join_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Approve/reject is performed via backend service role (bypasses RLS)
-- No UPDATE policy needed for client side

-- ============================================================
-- CAPTAIN BOOTSTRAP INSTRUCTIONS (run once per deployment)
-- ============================================================
-- After a user signs up, find their auth.users.id in Supabase Dashboard
-- → Authentication → Users → copy their UUID
-- Then run:
--
-- UPDATE players
--   SET is_captain = true, auth_id = '<auth-uuid-here>'
-- WHERE jersey_number = <captain_jersey>;
--
-- Example:
-- UPDATE players SET is_captain = true, auth_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- WHERE jersey_number = 11;
--
-- If no players row exists yet, insert one:
-- INSERT INTO players (auth_id, name, jersey_number, role, status, is_captain)
-- VALUES ('xxxxxxxx-...', 'Hafiz Usman', 11, 'Batsman', 'Active', true);
-- ============================================================
