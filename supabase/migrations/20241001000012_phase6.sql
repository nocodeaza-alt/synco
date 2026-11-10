-- SYNCO Phase 6: Brainstorm + Virtual Office additions
-- Migration: 20241001000012_phase6.sql

-- Add audience and workspace_id to brainstorm_sessions
ALTER TABLE brainstorm_sessions
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'All company',
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces ON DELETE CASCADE;

-- Add meet_link, color, description to office_rooms
ALTER TABLE office_rooms
  ADD COLUMN IF NOT EXISTS meet_link text,
  ADD COLUMN IF NOT EXISTS color    text NOT NULL DEFAULT '#5B4FE8',
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sort     int NOT NULL DEFAULT 0;

-- Service role can insert/update brainstorm_sessions (for demo seeding + end-session)
DROP POLICY IF EXISTS "brainstorm_sessions_service_insert" ON brainstorm_sessions;
CREATE POLICY "brainstorm_sessions_service_insert" ON brainstorm_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "brainstorm_sessions_service_update" ON brainstorm_sessions;
CREATE POLICY "brainstorm_sessions_service_update" ON brainstorm_sessions
  FOR UPDATE USING (true);

-- Service role can insert brainstorm_ideas (for demo seeding)
DROP POLICY IF EXISTS "brainstorm_ideas_service_insert" ON brainstorm_ideas;
CREATE POLICY "brainstorm_ideas_service_insert" ON brainstorm_ideas
  FOR INSERT WITH CHECK (true);

-- Service role can insert/update office_rooms (for demo seeding + meet link save)
DROP POLICY IF EXISTS "office_rooms_service_update" ON office_rooms;
CREATE POLICY "office_rooms_service_update" ON office_rooms
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "office_rooms_service_insert" ON office_rooms;
CREATE POLICY "office_rooms_service_insert" ON office_rooms
  FOR INSERT WITH CHECK (true);

-- Service role can insert knocks
DROP POLICY IF EXISTS "knocks_service_insert" ON knocks;
CREATE POLICY "knocks_service_insert" ON knocks
  FOR INSERT WITH CHECK (true);

-- Add structured metadata to kb_documents (executor, reviewer, comments, dates)
ALTER TABLE kb_documents
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
