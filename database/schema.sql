-- ============================================================
-- Hafiz Stars Eleven - Real-Time Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PLAYERS
-- ============================================================
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id         UUID, -- Link to Supabase Auth if needed
  name            TEXT NOT NULL,
  jersey_number   INT UNIQUE NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-Rounder', 'WK')),
  status          TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Inactive')),
  balance         INT DEFAULT 0, -- Overall personal balance (owed vs paid)
  is_admin        BOOLEAN DEFAULT FALSE,
  impact_rating   DECIMAL(5,2) DEFAULT 0.00,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEAM TREASURY (Singleton)
-- ============================================================
CREATE TABLE team_treasury (
  id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_balance   INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO team_treasury (id, total_balance) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- ============================================================
-- INVENTORY (Singleton)
-- ============================================================
CREATE TABLE inventory (
  id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  fresh_balls     INT DEFAULT 0,
  tape_rolls      INT DEFAULT 0,
  kit_holder_id   UUID REFERENCES players(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO inventory (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================================
-- LEDGER (Finance)
-- ============================================================
CREATE TABLE ledger (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID REFERENCES players(id) ON DELETE SET NULL, -- Can be null for general team expenses
  amount          INT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Monthly', 'Fine', 'Tape', 'Balls', 'Snacks', 'Ground', 'Other')),
  status          TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Review', 'Rejected')),
  type            TEXT NOT NULL CHECK (type IN ('Income', 'Expense')), -- Income (dues/fines), Expense (tape/balls/etc)
  proof_image_url TEXT,
  month_ref       TEXT, -- e.g., '2025-05' for monthly dues tracking
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opponent        TEXT NOT NULL,
  venue           TEXT NOT NULL,
  match_date      TIMESTAMPTZ NOT NULL,
  match_time      TEXT NOT NULL,
  squad_list      JSONB DEFAULT '[]'::jsonb, -- Store the XI builder data here
  is_live         BOOLEAN DEFAULT FALSE,
  result          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RSVPS
-- ============================================================
CREATE TABLE rsvps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK (status IN ('in', 'out', 'maybe')) DEFAULT 'maybe',
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- ============================================================
-- STATS
-- ============================================================
CREATE TABLE stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  runs            INT DEFAULT 0,
  balls_faced     INT DEFAULT 0,
  wickets         INT DEFAULT 0,
  overs_bowled    DECIMAL(4,1) DEFAULT 0.0,
  impact_score    DECIMAL(5,2) DEFAULT 0.00,
  confirmed       BOOLEAN DEFAULT FALSE,
  UNIQUE(match_id, player_id)
);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- 1. Trigger: Update Treasury when Ledger entry becomes 'Paid'
CREATE OR REPLACE FUNCTION fn_update_treasury()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act if the status changes to Paid (or is inserted as Paid)
  IF NEW.status = 'Paid' AND (TG_OP = 'INSERT' OR OLD.status != 'Paid') THEN
    IF NEW.type = 'Income' THEN
      UPDATE team_treasury SET total_balance = total_balance + NEW.amount, updated_at = NOW() WHERE id = 1;
      
      -- If it's a player paying, update their personal balance
      IF NEW.player_id IS NOT NULL THEN
         UPDATE players SET balance = balance + NEW.amount WHERE id = NEW.player_id;
      END IF;

    ELSIF NEW.type = 'Expense' THEN
      UPDATE team_treasury SET total_balance = total_balance - NEW.amount, updated_at = NOW() WHERE id = 1;
    END IF;
  END IF;

  -- Handle reverting if status changes FROM Paid to something else
  IF TG_OP = 'UPDATE' AND OLD.status = 'Paid' AND NEW.status != 'Paid' THEN
    IF OLD.type = 'Income' THEN
      UPDATE team_treasury SET total_balance = total_balance - OLD.amount, updated_at = NOW() WHERE id = 1;
      IF OLD.player_id IS NOT NULL THEN
         UPDATE players SET balance = balance - OLD.amount WHERE id = OLD.player_id;
      END IF;
    ELSIF OLD.type = 'Expense' THEN
      UPDATE team_treasury SET total_balance = total_balance + OLD.amount, updated_at = NOW() WHERE id = 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_treasury
AFTER INSERT OR UPDATE ON ledger
FOR EACH ROW EXECUTE FUNCTION fn_update_treasury();

-- 2. Trigger: Auto-update Inventory on Expense
CREATE OR REPLACE FUNCTION fn_auto_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- We assume buying 'Tape' or 'Balls' adds to inventory.
  -- This is a simple heuristic based on the amount/category. 
  -- In a more complex system, you might specify quantity in the ledger.
  -- For now, if category is Tape/Balls and it's Paid, we increment.
  IF NEW.status = 'Paid' AND NEW.type = 'Expense' AND (TG_OP = 'INSERT' OR OLD.status != 'Paid') THEN
    IF NEW.category = 'Tape' THEN
       -- Let's say 1 tape roll per 150 PKR approx for demo purposes, or just +1 per entry
       UPDATE inventory SET tape_rolls = tape_rolls + 1, updated_at = NOW() WHERE id = 1;
    ELSIF NEW.category = 'Balls' THEN
       UPDATE inventory SET fresh_balls = fresh_balls + 2, updated_at = NOW() WHERE id = 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_inventory
AFTER INSERT OR UPDATE ON ledger
FOR EACH ROW EXECUTE FUNCTION fn_auto_inventory();


-- 3. Function: Generate Monthly Dues for Active Players
CREATE OR REPLACE FUNCTION fn_monthly_dues()
RETURNS void AS $$
DECLARE
  p RECORD;
  current_month TEXT;
BEGIN
  current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  FOR p IN SELECT id FROM players WHERE status = 'Active' LOOP
    -- Insert a Pending ledger entry for 250 PKR Monthly fee
    -- Use ON CONFLICT if we had a unique constraint on (player_id, month_ref, category)
    -- But since we don't, we check if it exists first to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM ledger WHERE player_id = p.id AND category = 'Monthly' AND month_ref = current_month) THEN
      INSERT INTO ledger (player_id, amount, category, status, type, month_ref, description)
      VALUES (p.id, 250, 'Monthly', 'Pending', 'Income', current_month, 'Monthly Dues - ' || current_month);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- (Optional pg_cron setup to call fn_monthly_dues on the 1st of every month at midnight)
-- SELECT cron.schedule('0 0 1 * *', $$SELECT fn_monthly_dues();$$);

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================
-- Drop existing publications if any, then recreate
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE players, ledger, matches, stats, team_treasury, inventory, rsvps;
COMMIT;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_all" ON players FOR SELECT USING (true);
CREATE POLICY "public_read_all" ON ledger FOR SELECT USING (true);
CREATE POLICY "public_read_all" ON matches FOR SELECT USING (true);
CREATE POLICY "public_read_all" ON stats FOR SELECT USING (true);
CREATE POLICY "public_read_all" ON team_treasury FOR SELECT USING (true);
CREATE POLICY "public_read_all" ON inventory FOR SELECT USING (true);
CREATE POLICY "public_read_all" ON rsvps FOR SELECT USING (true);

-- Allow authenticated users to insert/update ledger (for uploading proofs, admins for approval)
-- In a real app, restrict updates to own records or admins. For this PWA demo, allow all authenticated.
CREATE POLICY "auth_all_ledger" ON ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_rsvps" ON rsvps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_matches" ON matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_inventory" ON inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
