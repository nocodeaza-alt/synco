-- SYNCO Phase 1: Core tables
-- Migration: 20241001000002_core.sql

-- workspaces
CREATE TABLE workspaces (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text UNIQUE,
  logo_url              text,
  email_domain          text,
  auto_approve_domain   bool NOT NULL DEFAULT false,
  task_capacity         int  NOT NULL DEFAULT 6,
  brainstorm_default_min int  NOT NULL DEFAULT 15,
  drive_folder_id       text,
  drive_auto_save       bool NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- workspaces: SELECT for authenticated members
CREATE POLICY "workspace_select" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = workspaces.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- workspaces: INSERT by authenticated users (creating their own workspace)
CREATE POLICY "workspace_insert" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- workspaces: UPDATE by workspace owner
CREATE POLICY "workspace_update" ON workspaces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = workspaces.id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
    )
  );


-- profiles
CREATE TABLE profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  full_name     text,
  avatar_url    text,
  time_zone     text NOT NULL DEFAULT 'UTC',
  working_hours jsonb,
  locale        text NOT NULL DEFAULT 'en',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);


-- memberships
CREATE TABLE memberships (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role              access_role NOT NULL,
  department_id     uuid,
  position          text,
  status            member_status NOT NULL DEFAULT 'invited',
  invited_by        uuid REFERENCES auth.users,
  invite_token      text,
  invite_expires_at timestamptz,
  last_presence     presence_status,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_select" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.workspace_id = memberships.workspace_id
        AND m2.user_id = auth.uid()
        AND m2.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "memberships_insert" ON memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.workspace_id = memberships.workspace_id
        AND m2.user_id = auth.uid()
        AND m2.role IN ('owner', 'c_level')
        AND m2.status = 'active'
    )
    OR auth.uid() IS NOT NULL -- allow self-join for invite acceptance
  );

CREATE POLICY "memberships_update" ON memberships
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.workspace_id = memberships.workspace_id
        AND m2.user_id = auth.uid()
        AND m2.role = 'owner'
        AND m2.status = 'active'
    )
  );


-- departments
CREATE TABLE departments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name                text NOT NULL,
  color               text NOT NULL,
  lead_membership_id  uuid REFERENCES memberships,
  sort                int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select" ON departments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = departments.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "departments_insert" ON departments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = departments.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "departments_update" ON departments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = departments.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "departments_delete" ON departments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = departments.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

-- Add FK from memberships.department_id to departments
ALTER TABLE memberships
  ADD CONSTRAINT memberships_department_id_fk
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;


-- permissions
CREATE TABLE permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  role          access_role NOT NULL,
  action        text NOT NULL,
  allowed       bool NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, role, action)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select" ON permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = permissions.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "permissions_update" ON permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = permissions.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "permissions_insert" ON permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = permissions.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );


-- join_requests
CREATE TABLE join_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  note          text,
  status        text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can insert a join request
CREATE POLICY "join_requests_insert" ON join_requests
  FOR INSERT WITH CHECK (true);

-- Only workspace owners can view and update requests
CREATE POLICY "join_requests_select" ON join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = join_requests.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );

CREATE POLICY "join_requests_update" ON join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = join_requests.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );
