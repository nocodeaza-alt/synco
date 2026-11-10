-- SYNCO Phase 1: Postgres Functions
-- Migration: 20241001000009_functions.sql

-- get_user_workspace_role(): returns the current user's role in their active workspace
CREATE OR REPLACE FUNCTION get_user_workspace_role()
RETURNS access_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role access_role;
BEGIN
  SELECT m.role INTO v_role
  FROM memberships m
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
  ORDER BY
    CASE m.role
      WHEN 'owner' THEN 1
      WHEN 'c_level' THEN 2
      WHEN 'team_lead' THEN 3
      WHEN 'member' THEN 4
    END
  LIMIT 1;

  RETURN v_role;
END;
$$;


-- can(action_key): checks if current user has permission for the action in their workspace
CREATE OR REPLACE FUNCTION can(action_key text)
RETURNS bool
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id uuid;
  v_role         access_role;
  v_allowed      bool;
BEGIN
  -- Get the user's active workspace and role
  SELECT m.workspace_id, m.role INTO v_workspace_id, v_role
  FROM memberships m
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
  ORDER BY
    CASE m.role
      WHEN 'owner' THEN 1
      WHEN 'c_level' THEN 2
      WHEN 'team_lead' THEN 3
      WHEN 'member' THEN 4
    END
  LIMIT 1;

  -- Owner always has all permissions
  IF v_role = 'owner' THEN
    RETURN true;
  END IF;

  -- Check the permissions table
  SELECT p.allowed INTO v_allowed
  FROM permissions p
  WHERE p.workspace_id = v_workspace_id
    AND p.role = v_role
    AND p.action = action_key;

  -- Default to false if not found
  RETURN COALESCE(v_allowed, false);
END;
$$;


-- advance_task_stage(task_id): enforces workflow rules when advancing a task
-- The UI calls this instead of writing stage directly
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  v_role := get_user_workspace_role();

  -- Determine next stage
  CASE v_task.stage
    WHEN 'todo' THEN
      -- Only assignee or team lead can start
      IF v_task.assigned_to = auth.uid() OR v_role IN ('owner', 'c_level', 'team_lead') THEN
        v_next_stage := 'in_progress';
      ELSE
        RAISE EXCEPTION 'Not authorized to start this task';
      END IF;

    WHEN 'in_progress' THEN
      -- Assignee marks done (sends to review)
      IF v_task.assigned_to = auth.uid() THEN
        -- Check if task has at least one result
        IF NOT EXISTS (SELECT 1 FROM task_results WHERE task_id = p_task_id) THEN
          RAISE EXCEPTION 'Task must have at least one result before marking done';
        END IF;
        v_next_stage := 'in_review';
      ELSE
        RAISE EXCEPTION 'Only the assignee can submit for review';
      END IF;

    WHEN 'in_review' THEN
      -- Team lead can advance to final_review or done
      IF v_role IN ('owner', 'c_level', 'team_lead') THEN
        -- If task came from owner/c_level, needs final review
        IF v_task.source IN ('owner', 'c_level', 'priority_request') THEN
          v_next_stage := 'final_review';
        ELSE
          v_next_stage := 'done';
        END IF;
      ELSE
        RAISE EXCEPTION 'Only team leads can advance from review';
      END IF;

    WHEN 'final_review' THEN
      IF v_role IN ('owner', 'c_level') THEN
        v_next_stage := 'done';
      ELSE
        RAISE EXCEPTION 'Only owner or C-Level can approve final review';
      END IF;

    WHEN 'needs_revision' THEN
      IF v_task.assigned_to = auth.uid() THEN
        v_next_stage := 'in_progress';
      ELSE
        RAISE EXCEPTION 'Only the assignee can restart a revision';
      END IF;

    ELSE
      RAISE EXCEPTION 'Cannot advance task from stage %', v_task.stage;
  END CASE;

  -- Update the stage
  UPDATE tasks SET stage = v_next_stage, updated_at = now()
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  -- Log the event
  INSERT INTO task_events (task_id, actor_id, event_type, payload)
  VALUES (
    p_task_id,
    auth.uid(),
    'stage_change',
    jsonb_build_object(
      'from', v_task.stage::text,
      'to', v_next_stage::text
    )
  );

  RETURN v_task;
END;
$$;


-- return_task(task_id, note): reviewer sends task back with notes
CREATE OR REPLACE FUNCTION return_task(p_task_id uuid, p_note text)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task tasks;
  v_role access_role;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;
  v_role := get_user_workspace_role();

  IF NOT (v_role IN ('owner', 'c_level', 'team_lead')) THEN
    RAISE EXCEPTION 'Not authorized to return tasks';
  END IF;

  IF v_task.stage NOT IN ('in_review', 'final_review') THEN
    RAISE EXCEPTION 'Task is not in a reviewable stage';
  END IF;

  UPDATE tasks
  SET stage = 'needs_revision', updated_at = now()
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  -- Insert review record
  INSERT INTO reviews (task_id, reviewer_id, stage, decision, note, reviewed_at)
  VALUES (
    p_task_id,
    auth.uid(),
    CASE WHEN v_task.stage = 'in_review' THEN 1 ELSE 2 END,
    'changes_requested',
    p_note,
    now()
  );

  -- Log event
  INSERT INTO task_events (task_id, actor_id, event_type, payload)
  VALUES (
    p_task_id,
    auth.uid(),
    'stage_change',
    jsonb_build_object('from', v_task.stage::text, 'to', 'needs_revision', 'note', p_note)
  );

  RETURN v_task;
END;
$$;
