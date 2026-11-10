# SYNCO — Workflows & formulas

## Task lifecycle
```
todo ──take today──▶ in_progress ──mark done (needs ≥1 result)──▶ (done-local) ──send for review──▶ in_review
in_review ──stage-1 approve──▶ final_review   (if final reviewer exists)
in_review ──stage-1 approve──▶ done           (single-stage)
final_review ──stage-2 approve──▶ done
in_review | final_review ──request changes + note──▶ needs_revision
needs_revision ──resubmit (≥1 result)──▶ in_review
```
- In the Member UI, "Done — ready to send" is a local band. Store it as `in_progress` + `ready_at`, or add a `ready` stage. The prototype shows it as a separate band.
- Every transition writes a `task_events` row. `started_at` is set on the first `in_progress`, and time in progress accumulates while the stage is `in_progress | needs_revision`.
- **Request changes** requires a note. The note becomes a comment from the reviewer, and the card animates back into the thread with a red border.
- **Approve to done**:
  1. Create `kb_documents` from the task results and embed them.
  2. If Drive auto-save is on, copy the results to Drive at `SYNCO/{Department}/{Task}`.
  3. Notify the executor and the assigner.
  4. Recompute goal progress.

## Assignment cascade
1. A goal is created → AI decomposition → tasks with `department_id`, `holder = Team Lead`, `assignee = null`, `stage = todo`.
2. Owner or C-Level can (a) delegate to the Team Lead — the task stays on the lead's desk — or (b) assign a member directly.
3. The Team Lead delegates from their desk to a member: `assignee` is set and the task appears in that member's Assigned band.
4. **AI suggest** (per unassigned task): pick the department member with the lowest open load, ties broken by efficiency, and propose a due date. Set `overload_warning` if `load + 1 ≥ capacity`. "Approve all" accepts every open suggestion.
5. Manual assignment works through the picker dropdown or by dragging a card onto a person or Team Lead.

## Requests
- Created by a TL (regular) or by C-Level/Owner (regular or priority), addressed to another department.
- The receiving TL either **accepts** — this creates a task with `source = request|priority_request`, `final_reviewer = requester`, `holder = TL` — or **declines** with a required reason. Either way the requester is notified.
- Priority requests sort above TL-sourced tasks in the department's queue.

## Battery (capacity left)
```
open_load(person) = count(tasks where assignee = person and stage in (todo,in_progress,needs_revision))
                  + count(tasks where holder = person and assignee is null)
battery = max(0, capacity - open_load) / capacity
color = load >= capacity ? red : battery >= .5 ? green : battery >= .25 ? amber : red
dept battery = mean over dept members incl. lead
```

## Efficiency (daily, per person; dept = mean)
Suggested v1 formula — confirm with the founder before shipping:
```
on_time_rate   = done_on_or_before_due / done_in_last_14d
first_pass     = approved_without_revision / reviewed_in_last_14d
efficiency %   = round(100 * (0.6 * on_time_rate + 0.4 * first_pass))
color: ≥85 green, ≥70 amber, else red
```
Department status: OVERLOAD if anyone is at capacity; otherwise ON TRACK if efficiency ≥85, else WATCH.

## Goal puzzle
One piece per task linked to the goal. Piece state = task stage. Goal % = done / total. The goal completes when all pieces are done, which triggers the completion banner and a `goal` notification to everyone involved.

## Brainstorm
A session has a fixed `ends_at`, and the countdown is computed on the client from server time. While the session is open, ideas stream in through Realtime. On close, set `closed = true` and index every idea into Sync Mind with the session topic as a tag. There is no voting or editing of others' ideas.

## Virtual Office
Presence lives in Supabase Realtime. Setting Focus moves the person to the focus room. A room shows "On a call" when 2 or more people are there and at least one is in a meeting or has joined media. Knocks to someone in focus are held, then delivered once their status changes. **Phase 1 (now): meetings run via external links.** Each room has an optional `meeting_url` (Google Meet / Zoom / Teams). It is editable by Team Leads for their room and by Owner/C-Level for all rooms. "Join call ↗" moves the person into the room, sets their presence to `meeting` and opens the link in a new tab. The call bar shows "Open in Google Meet ↗" and Leave. Built-in calls and meeting transcription are **not** in scope yet — see BACKLOG.md.

## Notifications (events)
- review needed (stage 1 or 2)
- task returned
- request received / accepted / declined
- priority request received
- mention in a comment (`@Name`)
- goal reached 50% / 100%
- brainstorm started in your audience
- result saved to Drive
- an invited person joined

Each event respects `notification_prefs`. An optional daily email digest goes out at the chosen time.

## Time zone
- Store the IANA zone name (e.g. `Europe/Moscow`) in `profiles.time_zone` — never a fixed offset string.
- On first login / onboarding, prefill from the browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and show "Detected automatically".
- "Change" opens a searchable list of all IANA zones (`Intl.supportedValuesOf('timeZone')`), searchable by city, country and Russian city names.
- Offsets and local times are always computed for the current date (DST-aware), never hardcoded.
- Deadlines are stored in UTC and shown in the viewer's zone; Virtual Office shows each person's local time.
