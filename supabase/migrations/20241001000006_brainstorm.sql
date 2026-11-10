-- SYNCO Phase 1: Brainstorm
-- Migration: 20241001000006_brainstorm.sql

CREATE TABLE brainstorm_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  topic         text NOT NULL,
  duration_min  int NOT NULL DEFAULT 15,
  started_at    timestamptz,
  ended_at      timestamptz,
  created_by    uuid NOT NULL REFERENCES auth.users,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brainstorm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brainstorm_sessions_select" ON brainstorm_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = brainstorm_sessions.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "brainstorm_sessions_insert" ON brainstorm_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = brainstorm_sessions.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );

CREATE POLICY "brainstorm_sessions_update" ON brainstorm_sessions
  FOR UPDATE USING (
    auth.uid() = created_by
  );


CREATE TABLE brainstorm_ideas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES brainstorm_sessions ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brainstorm_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brainstorm_ideas_select" ON brainstorm_ideas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brainstorm_sessions s
      JOIN memberships m ON m.workspace_id = s.workspace_id
      WHERE s.id = brainstorm_ideas.session_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "brainstorm_ideas_insert" ON brainstorm_ideas
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM brainstorm_sessions s
      JOIN memberships m ON m.workspace_id = s.workspace_id
      WHERE s.id = brainstorm_ideas.session_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND s.started_at IS NOT NULL
        AND s.ended_at IS NULL
    )
  );
