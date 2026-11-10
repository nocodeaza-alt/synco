-- Fix: infinite recursion in memberships RLS policies
-- The original policies queried `memberships` from within a memberships policy,
-- causing PostgreSQL to recurse infinitely. Fix with a SECURITY DEFINER helper.

-- Helper function that bypasses RLS to check workspace membership.
-- SECURITY DEFINER means it runs as the function owner (postgres), not the caller.
CREATE OR REPLACE FUNCTION public.user_workspace_ids(uid uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT workspace_id FROM memberships WHERE user_id = uid AND status = 'active';
$$;

-- Drop and recreate memberships policies without self-reference.
DROP POLICY IF EXISTS "memberships_select" ON memberships;
DROP POLICY IF EXISTS "memberships_insert" ON memberships;
DROP POLICY IF EXISTS "memberships_update" ON memberships;

CREATE POLICY "memberships_select" ON memberships
  FOR SELECT USING (
    workspace_id = ANY(SELECT user_workspace_ids(auth.uid()))
    OR user_id = auth.uid()
  );

CREATE POLICY "memberships_insert" ON memberships
  FOR INSERT WITH CHECK (
    workspace_id = ANY(SELECT user_workspace_ids(auth.uid()))
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "memberships_update" ON memberships
  FOR UPDATE USING (
    user_id = auth.uid()
    OR workspace_id = ANY(
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
    )
  );
