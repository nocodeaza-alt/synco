-- SYNCO Phase 1: Virtual Office
-- Migration: 20241001000007_office.sql

CREATE TABLE office_rooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  name          text NOT NULL,
  type          text NOT NULL DEFAULT 'department', -- department | war_room | focus | lounge
  department_id uuid REFERENCES departments ON DELETE SET NULL,
  max_capacity  int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE office_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office_rooms_select" ON office_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = office_rooms.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "office_rooms_insert" ON office_rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = office_rooms.workspace_id
        AND m.user_id = auth.uid()
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  );


-- knocks: quiet notifications when someone in focus mode is knocked
CREATE TABLE knocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id     uuid NOT NULL REFERENCES auth.users,
  to_id       uuid NOT NULL REFERENCES auth.users,
  room_id     uuid REFERENCES office_rooms ON DELETE CASCADE,
  message     text,
  seen        bool NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE knocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knocks_select" ON knocks
  FOR SELECT USING (
    to_id = auth.uid() OR from_id = auth.uid()
  );

CREATE POLICY "knocks_insert" ON knocks
  FOR INSERT WITH CHECK (auth.uid() = from_id);

CREATE POLICY "knocks_update" ON knocks
  FOR UPDATE USING (to_id = auth.uid());


-- notifications
CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type          text NOT NULL,
  title         text NOT NULL,
  body          text,
  link          text,
  actor_id      uuid REFERENCES auth.users,
  read          bool NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = notifications.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());


-- notification_prefs: per-user notification preferences
CREATE TABLE notification_prefs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  event_type    text NOT NULL,
  in_app        bool NOT NULL DEFAULT true,
  email         bool NOT NULL DEFAULT false,
  slack         bool NOT NULL DEFAULT false,
  UNIQUE(user_id, workspace_id, event_type)
);

ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_prefs_select" ON notification_prefs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_prefs_insert" ON notification_prefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_prefs_update" ON notification_prefs
  FOR UPDATE USING (auth.uid() = user_id);
