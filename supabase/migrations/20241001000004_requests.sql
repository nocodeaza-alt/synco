-- SYNCO Phase 1: Requests
-- Migration: 20241001000004_requests.sql

CREATE TABLE requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  from_membership_id  uuid NOT NULL REFERENCES memberships ON DELETE CASCADE,
  to_department_id    uuid NOT NULL REFERENCES departments ON DELETE CASCADE,
  title               text NOT NULL,
  description         text,
  is_priority         bool NOT NULL DEFAULT false,
  status              request_status NOT NULL DEFAULT 'pending',
  assigned_to         uuid REFERENCES memberships ON DELETE SET NULL,
  decline_reason      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Members of the workspace can see requests
CREATE POLICY "requests_select" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = requests.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- C-Level can send priority requests, Team Leads can send regular requests
CREATE POLICY "requests_insert" ON requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.id = requests.from_membership_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND (
          m.role IN ('owner', 'c_level')
          OR (m.role = 'team_lead' AND NOT requests.is_priority)
        )
    )
  );

-- Team leads of the receiving dept can accept/decline
CREATE POLICY "requests_update" ON requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      JOIN departments d ON d.id = requests.to_department_id
      WHERE m.workspace_id = requests.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
