-- SYNCO Phase 1: Goals and Tasks
-- Migration: 20241001000003_goals_tasks.sql

-- goals
CREATE TABLE goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  color         text NOT NULL DEFAULT '#5B4FE8',
  label         text NOT NULL, -- e.g. 'G1', 'G2'
  target_date   date,
  created_by    uuid NOT NULL REFERENCES auth.users,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = goals.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "goals_insert" ON goals
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = goals.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "goals_update" ON goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = goals.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level')
        AND m.status = 'active'
    )
  );

CREATE POLICY "goals_delete" ON goals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = goals.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );


-- tasks
CREATE TABLE tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  goal_id       uuid REFERENCES goals ON DELETE SET NULL,
  department_id uuid NOT NULL REFERENCES departments ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  stage         task_stage NOT NULL DEFAULT 'todo',
  priority      priority NOT NULL DEFAULT 'medium',
  source        task_source NOT NULL DEFAULT 'team_lead',
  assigned_to   uuid REFERENCES auth.users,
  assigned_by   uuid REFERENCES auth.users,
  deadline      date,
  sort          int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = tasks.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = tasks.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = tasks.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- task_results
CREATE TABLE task_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  kind          result_kind NOT NULL,
  url           text NOT NULL,
  file_name     text,
  drive_file_id text,
  uploaded_by   uuid NOT NULL REFERENCES auth.users,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_results_select" ON task_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN memberships m ON m.workspace_id = t.workspace_id
      WHERE t.id = task_results.task_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "task_results_insert" ON task_results
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN memberships m ON m.workspace_id = t.workspace_id
      WHERE t.id = task_results.task_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );


-- task_comments
CREATE TABLE task_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN memberships m ON m.workspace_id = t.workspace_id
      WHERE t.id = task_comments.task_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "task_comments_insert" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN memberships m ON m.workspace_id = t.workspace_id
      WHERE t.id = task_comments.task_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );


-- reviews
CREATE TABLE reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES auth.users,
  stage         int NOT NULL, -- 1 = team lead, 2 = final reviewer
  decision      review_decision,
  note          text,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tasks t
      JOIN memberships m ON m.workspace_id = t.workspace_id
      WHERE t.id = reviews.task_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
  );

CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE USING (
    reviewer_id = auth.uid()
  );


-- task_events (audit trail)
CREATE TABLE task_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  actor_id    uuid REFERENCES auth.users,
  event_type  text NOT NULL, -- 'stage_change', 'assignment', 'comment', 'review'
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_events_select" ON task_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN memberships m ON m.workspace_id = t.workspace_id
      WHERE t.id = task_events.task_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );


-- ai_suggestions
CREATE TABLE ai_suggestions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  task_id         uuid REFERENCES tasks ON DELETE CASCADE,
  type            text NOT NULL, -- 'assignment', 'decomposition'
  suggested_to    uuid REFERENCES auth.users,
  reason          text,
  deadline        date,
  overload_warning bool DEFAULT false,
  accepted        bool,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_suggestions_select" ON ai_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = ai_suggestions.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );
