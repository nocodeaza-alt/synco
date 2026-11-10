-- SYNCO Phase 1: Integrations
-- Migration: 20241001000008_integrations.sql

CREATE TABLE integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  provider        text NOT NULL, -- 'google_drive' | 'google_calendar' | 'slack' | 'notion'
  access_token    text,
  refresh_token   text,
  expires_at      timestamptz,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_select" ON integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = integrations.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "integrations_insert" ON integrations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = integrations.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "integrations_update" ON integrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = integrations.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "integrations_delete" ON integrations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = integrations.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );
