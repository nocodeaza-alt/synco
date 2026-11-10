# SYNCO — Backlog (not scheduled)

Items agreed with the founder but intentionally out of the current build. Do not implement unless the founder asks.

## B1. Built-in calls in Virtual Office
- Replace the external links with in-app audio/video (LiveKit or Daily), so a call opens inside the room without a link.
- Call bar: mute, camera, screen share, leave. Presence updates automatically.
- Keep `meeting_url` as a fallback for teams that prefer Meet or Zoom.
- Cost reference: about $0.004 per participant-minute.

## B2. Meeting transcription agent — «Протоколист» (Minutes agent)
Depends on B1, or on the Google Meet / Zoom transcript APIs if external links stay.
1. A **"Take minutes"** button in the call bar. Every participant sees a "Recording" badge, and consent is required.
2. After the call, the agent produces a **transcript**, a **summary**, **decisions**, and **action items** (who · what · due date).
3. The action items arrive to the organizer as **draft tasks**: confirm, edit or change the assignee. Confirmed tasks land in the backlog — the assignee's "Assigned" band, or the Team Lead's desk if no one is assigned. They link back to the meeting and, if one is mentioned, to the goal.
4. The minutes are filed to **Sync Mind** with tags (room, participants, goal), so people can ask "what did we decide about the launch last week?".
- Data: `meetings` (room_id, started_at, ended_at, participants, source: livekit|meet|zoom), `meeting_minutes` (meeting_id, transcript, summary, decisions jsonb, action_items jsonb, status).
- Prompt sketch: "From this transcript, extract decisions and action items. Each action item: owner (must match a participant), task title ≤70 chars, due date if stated. JSON only. Never invent owners."
- Screens to design later: a "Meeting minutes" page (summary, decisions, draft tasks with Confirm / Change assignee) and a "Minutes ready" notification.
