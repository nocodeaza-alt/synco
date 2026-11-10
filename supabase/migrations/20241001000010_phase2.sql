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
