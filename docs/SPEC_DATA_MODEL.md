# SYNCO — Data model (Supabase / Postgres)

All tables have `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, and (except `workspaces`) `workspace_id uuid fk → workspaces` for tenancy + RLS.

## Enums
- `access_role`: `owner | c_level | team_lead | member`
- `member_status`: `invited | active | removed`
- `task_stage`: `todo | in_progress | in_review | final_review | needs_revision | done`
- `priority`: `high | medium | low`
- `task_source`: `owner | c_level | team_lead | request | priority_request`
- `request_status`: `pending | accepted | declined`
- `result_kind`: `document | link | image`
- `presence_status`: `available | focus | meeting | away`
- `review_decision`: `approved | changes_requested`

## Core
**workspaces** — name, slug (subdomain), logo_url, email_domain, auto_approve_domain bool, task_capacity int default 6, brainstorm_default_min int default 15, drive_folder_id, drive_auto_save bool

**profiles** (1:1 with `auth.users`) — user_id, full_name, avatar_url, time_zone, working_hours, locale (`en|ru`)

**memberships** — user_id, workspace_id, role access_role, department_id null, position text, status member_status, invited_by, invite_token, invite_expires_at
- C-Level and Owner have `department_id = null`.

**departments** — name, color hex, lead_membership_id null, sort int

**permissions** — workspace_id, role access_role, action text, allowed bool (seed from SPEC_PERMISSIONS.md; Owner rows immutable)

**join_requests** — workspace_id, email, full_name, note, status (`pending|approved|rejected`)

## Goals & tasks
**goals** — code (`G1`…), title, short_label, color, owner_membership_id, due_date, status (`active|completed|archived`), ai_decomposition jsonb (raw AI output for audit)

**tasks**
- title, description, goal_id null, department_id, assignee_membership_id null, assigned_by_membership_id
- holder_membership_id — the person whose "desk" it is on. While unassigned this is the Team Lead.
- stage task_stage, priority, tag text, due_date
- source task_source, request_id null
- started_at (set on first move to in_progress), completed_at, time_in_progress_sec (accumulated)
- final_reviewer_membership_id null. Required when the source is request, priority_request, c_level or owner and the assigner is not the Team Lead. See SPEC_WORKFLOWS.
- sort int

**task_results** — task_id, kind result_kind, name, url (Storage path or external link), size_bytes, mime, drive_file_id null, uploaded_by

**task_comments** — task_id, author_membership_id, body, mentions uuid[]

**reviews** — task_id, reviewer_membership_id, stage (`1|2`), decision review_decision, note

**task_events** — task_id, actor, from_stage, to_stage, at. Used for the audit trail, efficiency and the timeline.

**ai_suggestions** — task_id, suggested_membership_id, suggested_due_date, reason, overload_warning bool, status (`open|accepted|replaced`)

## Requests
**requests** — from_membership_id, from_department_id null (null = C-Level), to_department_id, title, details, goal_id, is_priority bool (only allowed for c_level/owner), status request_status, decline_reason, decided_by, created_task_id

## Knowledge base (Sync Mind)
**kb_documents** — source (`task_result|brainstorm_idea|upload|notion`), source_id, title, department_id, goal_id, tags text[], content_text, url, approved_at
**kb_chunks** — document_id, chunk_index, content, embedding vector(1024)
**kb_compilations** — query, created_by, document_ids uuid[], summary, created_at

## Brainstorm
**brainstorm_sessions** — topic, created_by, audience (`all` | department_id), duration_min, starts_at, ends_at, closed bool
**brainstorm_ideas** — session_id, author_membership_id, body. When the session closes, each idea becomes a `kb_documents` row.

## Office & notifications
**office_rooms** — name, kind (`department|meeting|focus|lounge`), department_id null, color, sort, meeting_url text null (external Meet/Zoom/Teams link)
**presence** — use Supabase Realtime Presence: `{membership_id, room_id, status, mic, cam, current_task_id}`. Persist the last status in `memberships.last_presence`.
**knocks** — from, to, room_id, delivered_at null (held while the target is in focus)
**notifications** — recipient_membership_id, type (`review|request|priority_request|mention|goal|brainstorm|decline|drive|team|returned`), actor_membership_id, entity_type, entity_id, payload jsonb, read_at
**notification_prefs** — membership_id, event, in_app bool, email bool, slack bool; digest_time text null

## Integrations
**integrations** — workspace_id, provider (`google_drive|google_calendar|slack|notion`), status, account_email, tokens (encrypted, server-only), settings jsonb

## RLS principles
- Every row is visible only to members of its `workspace_id`.
- Members see their department's tasks, tasks assigned to them, and tasks from requests that involve their department. Team Leads see their whole department. C-Level and Owner see everything.
- Writes are checked against `permissions` (via a SQL function `can(action)`) plus the stage rules in SPEC_WORKFLOWS. Prefer Postgres functions (RPC) for stage changes, so the rules live in one place.
