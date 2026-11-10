-- ============================================================
-- SYNCO — полная схема БД (исправленный порядок)
-- Сначала все таблицы, потом все RLS политики
-- ============================================================

-- 1. ENUMS
CREATE TYPE access_role AS ENUM ('owner','c_level','team_lead','member');
CREATE TYPE member_status AS ENUM ('invited','active','removed');
CREATE TYPE task_stage AS ENUM ('todo','in_progress','in_review','final_review','needs_revision','done');
CREATE TYPE priority AS ENUM ('high','medium','low');
CREATE TYPE task_source AS ENUM ('owner','c_level','team_lead','request','priority_request');
CREATE TYPE request_status AS ENUM ('pending','accepted','declined');
CREATE TYPE result_kind AS ENUM ('document','link','image');
CREATE TYPE presence_status AS ENUM ('available','focus','meeting','away');
CREATE TYPE review_decision AS ENUM ('approved','changes_requested');

-- 2. ТАБЛИЦЫ

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text UNIQUE, logo_url text, email_domain text,
  auto_approve_domain bool NOT NULL DEFAULT false, task_capacity int NOT NULL DEFAULT 6,
  brainstorm_default_min int NOT NULL DEFAULT 15, drive_folder_id text,
  drive_auto_save bool NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  full_name text, avatar_url text, time_zone text NOT NULL DEFAULT 'UTC',
  working_hours jsonb, locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role access_role NOT NULL, department_id uuid,
  position text, status member_status NOT NULL DEFAULT 'invited',
  invited_by uuid REFERENCES auth.users, invite_token text, invite_expires_at timestamptz,
  last_presence presence_status, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL, color text NOT NULL, lead_membership_id uuid,
  sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memberships ADD CONSTRAINT memberships_department_id_fk
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE departments ADD CONSTRAINT departments_lead_membership_id_fk
  FOREIGN KEY (lead_membership_id) REFERENCES memberships(id) ON DELETE SET NULL;

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  role access_role NOT NULL, action text NOT NULL, allowed bool NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id, role, action)
);

CREATE TABLE join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  email text NOT NULL, full_name text, note text, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  title text NOT NULL, description text, color text NOT NULL DEFAULT '#5B4FE8',
  label text NOT NULL, target_date date, created_by uuid NOT NULL REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  goal_id uuid REFERENCES goals ON DELETE SET NULL,
  department_id uuid NOT NULL REFERENCES departments ON DELETE CASCADE,
  title text NOT NULL, description text,
  stage task_stage NOT NULL DEFAULT 'todo', priority priority NOT NULL DEFAULT 'medium',
  source task_source NOT NULL DEFAULT 'team_lead',
  assigned_to uuid REFERENCES auth.users, assigned_by uuid REFERENCES auth.users,
  deadline date, sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  kind result_kind NOT NULL, url text NOT NULL, file_name text, drive_file_id text,
  uploaded_by uuid NOT NULL REFERENCES auth.users, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users, body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users, stage int NOT NULL,
  decision review_decision, note text, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users, event_type text NOT NULL, payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  task_id uuid REFERENCES tasks ON DELETE CASCADE, type text NOT NULL,
  suggested_to uuid REFERENCES auth.users, reason text, deadline date,
  overload_warning bool DEFAULT false, accepted bool,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  from_membership_id uuid NOT NULL REFERENCES memberships ON DELETE CASCADE,
  to_department_id uuid NOT NULL REFERENCES departments ON DELETE CASCADE,
  title text NOT NULL, description text, is_priority bool NOT NULL DEFAULT false,
  status request_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES memberships ON DELETE SET NULL,
  decline_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kb_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  task_result_id uuid REFERENCES task_results ON DELETE SET NULL,
  title text NOT NULL, content text,
  department_id uuid REFERENCES departments ON DELETE SET NULL,
  goal_id uuid REFERENCES goals ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES kb_documents ON DELETE CASCADE,
  chunk_index int NOT NULL, content text NOT NULL, embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kb_compilations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  query text NOT NULL, document_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brainstorm_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  topic text NOT NULL, duration_min int NOT NULL DEFAULT 15,
  started_at timestamptz, ended_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brainstorm_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES brainstorm_sessions ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users, body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE office_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name text NOT NULL, type text NOT NULL DEFAULT 'department',
  department_id uuid REFERENCES departments ON DELETE SET NULL,
  max_capacity int, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE knocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid NOT NULL REFERENCES auth.users, to_id uuid NOT NULL REFERENCES auth.users,
  room_id uuid REFERENCES office_rooms ON DELETE CASCADE,
  message text, seen bool NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, body text, link text,
  actor_id uuid REFERENCES auth.users, read bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  event_type text NOT NULL, in_app bool NOT NULL DEFAULT true,
  email bool NOT NULL DEFAULT false, slack bool NOT NULL DEFAULT false,
  UNIQUE(user_id, workspace_id, event_type)
);

CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  provider text NOT NULL, access_token text, refresh_token text,
  expires_at timestamptz, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id, provider)
);

-- 3. ENABLE RLS

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_compilations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE knocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=workspaces.id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=workspaces.id AND m.user_id=auth.uid() AND m.role='owner'));

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid()=user_id);

CREATE POLICY "memberships_select" ON memberships FOR SELECT USING (user_id=auth.uid() OR EXISTS (SELECT 1 FROM memberships m2 WHERE m2.workspace_id=memberships.workspace_id AND m2.user_id=auth.uid() AND m2.status='active'));
CREATE POLICY "memberships_insert" ON memberships FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "memberships_update" ON memberships FOR UPDATE USING (user_id=auth.uid() OR EXISTS (SELECT 1 FROM memberships m2 WHERE m2.workspace_id=memberships.workspace_id AND m2.user_id=auth.uid() AND m2.role='owner' AND m2.status='active'));

CREATE POLICY "departments_select" ON departments FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=departments.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "departments_insert" ON departments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=departments.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "departments_update" ON departments FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=departments.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "departments_delete" ON departments FOR DELETE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=departments.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));

CREATE POLICY "permissions_select" ON permissions FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=permissions.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "permissions_insert" ON permissions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=permissions.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "permissions_update" ON permissions FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=permissions.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));

CREATE POLICY "join_requests_insert" ON join_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "join_requests_select" ON join_requests FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=join_requests.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "join_requests_update" ON join_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=join_requests.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));

CREATE POLICY "goals_select" ON goals FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=goals.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "goals_insert" ON goals FOR INSERT WITH CHECK (auth.uid()=created_by AND EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=goals.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level') AND m.status='active'));
CREATE POLICY "goals_update" ON goals FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=goals.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level') AND m.status='active'));
CREATE POLICY "goals_delete" ON goals FOR DELETE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=goals.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));

CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=tasks.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=tasks.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (assigned_to=auth.uid() OR EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=tasks.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));

CREATE POLICY "task_results_select" ON task_results FOR SELECT USING (EXISTS (SELECT 1 FROM tasks t JOIN memberships m ON m.workspace_id=t.workspace_id WHERE t.id=task_results.task_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "task_results_insert" ON task_results FOR INSERT WITH CHECK (auth.uid()=uploaded_by);

CREATE POLICY "task_comments_select" ON task_comments FOR SELECT USING (EXISTS (SELECT 1 FROM tasks t JOIN memberships m ON m.workspace_id=t.workspace_id WHERE t.id=task_comments.task_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT WITH CHECK (auth.uid()=author_id);

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (reviewer_id=auth.uid() OR EXISTS (SELECT 1 FROM tasks t JOIN memberships m ON m.workspace_id=t.workspace_id WHERE t.id=reviews.task_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (reviewer_id=auth.uid());
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (reviewer_id=auth.uid());

CREATE POLICY "task_events_select" ON task_events FOR SELECT USING (EXISTS (SELECT 1 FROM tasks t JOIN memberships m ON m.workspace_id=t.workspace_id WHERE t.id=task_events.task_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "task_events_insert" ON task_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ai_suggestions_select" ON ai_suggestions FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=ai_suggestions.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));

CREATE POLICY "requests_select" ON requests FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=requests.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "requests_insert" ON requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.id=requests.from_membership_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "requests_update" ON requests FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=requests.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));

CREATE POLICY "kb_documents_select" ON kb_documents FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=kb_documents.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "kb_documents_insert" ON kb_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=kb_documents.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));

CREATE POLICY "kb_chunks_select" ON kb_chunks FOR SELECT USING (EXISTS (SELECT 1 FROM kb_documents d JOIN memberships m ON m.workspace_id=d.workspace_id WHERE d.id=kb_chunks.document_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "kb_chunks_insert" ON kb_chunks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "kb_compilations_select" ON kb_compilations FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=kb_compilations.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "kb_compilations_insert" ON kb_compilations FOR INSERT WITH CHECK (auth.uid()=created_by);

CREATE POLICY "brainstorm_sessions_select" ON brainstorm_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=brainstorm_sessions.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "brainstorm_sessions_insert" ON brainstorm_sessions FOR INSERT WITH CHECK (auth.uid()=created_by AND EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=brainstorm_sessions.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));
CREATE POLICY "brainstorm_sessions_update" ON brainstorm_sessions FOR UPDATE USING (auth.uid()=created_by);

CREATE POLICY "brainstorm_ideas_select" ON brainstorm_ideas FOR SELECT USING (EXISTS (SELECT 1 FROM brainstorm_sessions s JOIN memberships m ON m.workspace_id=s.workspace_id WHERE s.id=brainstorm_ideas.session_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "brainstorm_ideas_insert" ON brainstorm_ideas FOR INSERT WITH CHECK (auth.uid()=author_id);

CREATE POLICY "office_rooms_select" ON office_rooms FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=office_rooms.workspace_id AND m.user_id=auth.uid() AND m.status='active'));
CREATE POLICY "office_rooms_insert" ON office_rooms FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=office_rooms.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "office_rooms_update" ON office_rooms FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=office_rooms.workspace_id AND m.user_id=auth.uid() AND m.role IN ('owner','c_level','team_lead') AND m.status='active'));

CREATE POLICY "knocks_select" ON knocks FOR SELECT USING (to_id=auth.uid() OR from_id=auth.uid());
CREATE POLICY "knocks_insert" ON knocks FOR INSERT WITH CHECK (auth.uid()=from_id);
CREATE POLICY "knocks_update" ON knocks FOR UPDATE USING (to_id=auth.uid());

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id=auth.uid());

CREATE POLICY "notification_prefs_select" ON notification_prefs FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "notification_prefs_insert" ON notification_prefs FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "notification_prefs_update" ON notification_prefs FOR UPDATE USING (auth.uid()=user_id);

CREATE POLICY "integrations_select" ON integrations FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=integrations.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "integrations_insert" ON integrations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=integrations.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "integrations_update" ON integrations FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=integrations.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));
CREATE POLICY "integrations_delete" ON integrations FOR DELETE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id=integrations.workspace_id AND m.user_id=auth.uid() AND m.role='owner' AND m.status='active'));

-- 5. ФУНКЦИИ И ТРИГГЕРЫ

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx ON kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);

CREATE OR REPLACE FUNCTION get_user_workspace_role() RETURNS access_role LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role access_role;
BEGIN
  SELECT m.role INTO v_role FROM memberships m WHERE m.user_id=auth.uid() AND m.status='active'
  ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'c_level' THEN 2 WHEN 'team_lead' THEN 3 ELSE 4 END LIMIT 1;
  RETURN v_role;
END; $$;

CREATE OR REPLACE FUNCTION can(action_key text) RETURNS bool LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_workspace_id uuid; v_role access_role; v_allowed bool;
BEGIN
  SELECT m.workspace_id, m.role INTO v_workspace_id, v_role FROM memberships m
  WHERE m.user_id=auth.uid() AND m.status='active'
  ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'c_level' THEN 2 WHEN 'team_lead' THEN 3 ELSE 4 END LIMIT 1;
  IF v_role='owner' THEN RETURN true; END IF;
  SELECT p.allowed INTO v_allowed FROM permissions p WHERE p.workspace_id=v_workspace_id AND p.role=v_role AND p.action=action_key;
  RETURN COALESCE(v_allowed, false);
END; $$;

CREATE OR REPLACE FUNCTION advance_task_stage(p_task_id uuid) RETURNS tasks LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_task tasks; v_role access_role; v_next task_stage;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id=p_task_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  v_role := get_user_workspace_role();
  CASE v_task.stage
    WHEN 'todo' THEN
      IF v_task.assigned_to=auth.uid() OR v_role IN ('owner','c_level','team_lead') THEN v_next:='in_progress';
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;
    WHEN 'in_progress' THEN
      IF v_task.assigned_to=auth.uid() THEN
        IF NOT EXISTS (SELECT 1 FROM task_results WHERE task_id=p_task_id) THEN RAISE EXCEPTION 'Need a result first'; END IF;
        v_next:='in_review';
      ELSE RAISE EXCEPTION 'Only assignee can submit'; END IF;
    WHEN 'in_review' THEN
      IF v_role IN ('owner','c_level','team_lead') THEN
        IF v_task.source IN ('owner','c_level','priority_request') THEN v_next:='final_review'; ELSE v_next:='done'; END IF;
      ELSE RAISE EXCEPTION 'Only leads can approve'; END IF;
    WHEN 'final_review' THEN
      IF v_role IN ('owner','c_level') THEN v_next:='done'; ELSE RAISE EXCEPTION 'Only owner/c_level'; END IF;
    WHEN 'needs_revision' THEN
      IF v_task.assigned_to=auth.uid() THEN v_next:='in_progress'; ELSE RAISE EXCEPTION 'Only assignee'; END IF;
    ELSE RAISE EXCEPTION 'Cannot advance from %', v_task.stage;
  END CASE;
  UPDATE tasks SET stage=v_next, updated_at=now() WHERE id=p_task_id RETURNING * INTO v_task;
  INSERT INTO task_events(task_id,actor_id,event_type,payload) VALUES(p_task_id,auth.uid(),'stage_change',jsonb_build_object('from',v_task.stage,'to',v_next));
  RETURN v_task;
END; $$;

CREATE OR REPLACE FUNCTION return_task(p_task_id uuid, p_note text) RETURNS tasks LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_task tasks; v_role access_role; v_stage int;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id=p_task_id;
  v_role:=get_user_workspace_role();
  IF NOT (v_role IN ('owner','c_level','team_lead')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_task.stage NOT IN ('in_review','final_review') THEN RAISE EXCEPTION 'Not reviewable'; END IF;
  v_stage:=CASE WHEN v_task.stage='in_review' THEN 1 ELSE 2 END;
  UPDATE tasks SET stage='needs_revision', updated_at=now() WHERE id=p_task_id RETURNING * INTO v_task;
  INSERT INTO reviews(task_id,reviewer_id,stage,decision,note,reviewed_at) VALUES(p_task_id,auth.uid(),v_stage,'changes_requested',p_note,now());
  INSERT INTO task_events(task_id,actor_id,event_type,payload) VALUES(p_task_id,auth.uid(),'stage_change',jsonb_build_object('from',v_task.stage,'to','needs_revision','note',p_note));
  RETURN v_task;
END; $$;
-- SYNCO Phase 2 Migration

-- 1. Add 'ready' stage (between in_progress and in_review)
ALTER TYPE task_stage ADD VALUE IF NOT EXISTS 'ready' AFTER 'in_progress';

-- 2. Add tag column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tag text;

-- 3. Add holder_membership_id (whose desk the task is on before member assignment)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS holder_membership_id uuid REFERENCES memberships(id);

-- 4. Add started_at and ready_at to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ready_at timestamptz;

-- 5. Update advance_task_stage: in_progress → ready → in_review
CREATE OR REPLACE FUNCTION advance_task_stage(p_task_id uuid)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task        tasks;
  v_role        access_role;
  v_next_stage  task_stage;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  v_role := get_user_workspace_role();

  CASE v_task.stage
    WHEN 'todo' THEN
      IF v_task.assigned_to = auth.uid() OR v_role IN ('owner','c_level','team_lead') THEN
        v_next_stage := 'in_progress';
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;

    WHEN 'in_progress' THEN
      IF v_task.assigned_to = auth.uid() OR v_role IN ('owner','c_level','team_lead') THEN
        IF NOT EXISTS (SELECT 1 FROM task_results WHERE task_id = p_task_id) THEN
          RAISE EXCEPTION 'Attach a result before marking done';
        END IF;
        v_next_stage := 'ready';
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;

    WHEN 'ready' THEN
      IF v_task.assigned_to = auth.uid() OR v_role IN ('owner','c_level','team_lead') THEN
        v_next_stage := 'in_review';
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;

    WHEN 'in_review' THEN
      IF v_role IN ('owner','c_level','team_lead') THEN
        IF v_task.source IN ('owner','c_level','priority_request') THEN
          v_next_stage := 'final_review';
        ELSE v_next_stage := 'done'; END IF;
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;

    WHEN 'final_review' THEN
      IF v_role IN ('owner','c_level') THEN v_next_stage := 'done';
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;

    WHEN 'needs_revision' THEN
      IF v_task.assigned_to = auth.uid() OR v_role IN ('owner','c_level','team_lead') THEN
        IF NOT EXISTS (SELECT 1 FROM task_results WHERE task_id = p_task_id) THEN
          RAISE EXCEPTION 'Attach a result before resubmitting';
        END IF;
        v_next_stage := 'in_review';
      ELSE RAISE EXCEPTION 'Not authorized'; END IF;

    ELSE RAISE EXCEPTION 'Cannot advance from %', v_task.stage;
  END CASE;

  UPDATE tasks SET
    stage = v_next_stage,
    updated_at = now(),
    started_at = CASE WHEN v_next_stage = 'in_progress' AND v_task.started_at IS NULL THEN now() ELSE v_task.started_at END,
    ready_at = CASE WHEN v_next_stage = 'ready' THEN now() ELSE v_task.ready_at END
  WHERE id = p_task_id RETURNING * INTO v_task;

  INSERT INTO task_events (task_id, actor_id, event_type, payload)
  VALUES (p_task_id, auth.uid(), 'stage_change',
    jsonb_build_object('from', v_task.stage::text, 'to', v_next_stage::text));

  RETURN v_task;
END;
$$;
