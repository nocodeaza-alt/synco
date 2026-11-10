# SYNCO — Progress Tracker

## Phase 1: Scaffold & Auth ✅

### Configuration
- [x] `package.json` — all dependencies declared
- [x] `next.config.ts` — Next.js 15 + next-intl plugin
- [x] `tsconfig.json` — strict mode, `@/*` path alias
- [x] `tailwind.config.ts` — all design tokens, shadows, radii
- [x] `postcss.config.mjs`
- [x] `.env.local` + `.env.example` — placeholder values
- [x] `components.json` — shadcn/ui config
- [x] `middleware.ts` — next-intl routing + Supabase session refresh

### Internationalization
- [x] `src/i18n/routing.ts` — locales: en, ru
- [x] `src/i18n/navigation.ts` — typed Link, redirect, router
- [x] `messages/en.json` — complete EN strings
- [x] `messages/ru.json` — complete RU translations

### Library
- [x] `src/lib/utils.ts` — cn(), getInitials(), getAvatarColor(), formatDate()
- [x] `src/lib/supabase/client.ts` — browser client
- [x] `src/lib/supabase/server.ts` — server client + service client
- [x] `src/lib/supabase/types.ts` — full Database TypeScript types

### App Shell
- [x] `src/app/globals.css` — Inter font, base styles, Tailwind layers
- [x] `src/app/layout.tsx` — root HTML layout
- [x] `src/app/page.tsx` — redirects to /en/auth/login
- [x] `src/app/[locale]/layout.tsx` — NextIntlClientProvider
- [x] `src/app/auth/callback/route.ts` — Supabase auth code exchange

### Auth Screens
- [x] `src/components/auth/AuthLayout.tsx` — split-screen wrapper (46/54)
- [x] `src/app/[locale]/auth/login/page.tsx` — login + demo panel
- [x] `src/app/[locale]/auth/signup/page.tsx` — create workspace / join team tabs
- [x] `src/app/[locale]/auth/sent/page.tsx` — access request sent
- [x] `src/app/[locale]/auth/forgot/page.tsx` — forgot password
- [x] `src/app/[locale]/auth/forgot-sent/page.tsx` — check inbox + 30s resend
- [x] `src/app/[locale]/auth/reset/page.tsx` — new password + rule checklist
- [x] `src/app/[locale]/auth/invite/page.tsx` — accept invite card

### Onboarding
- [x] `src/app/[locale]/onboarding/owner/page.tsx` — 3-step wizard
- [x] `src/app/[locale]/onboarding/member/page.tsx` — 3-step welcome flow

### Global Layout Components
- [x] `src/components/layout/TopBar.tsx` — 60px bar, tabs, bell, avatar
- [x] `src/components/layout/LanguageSwitch.tsx` — floating EN/RU pill
- [x] `src/components/layout/SyncoLogo.tsx` — logo + wordmark component

### Settings
- [x] `src/app/[locale]/settings/layout.tsx` — sidebar layout
- [x] `src/app/[locale]/settings/profile/page.tsx`
- [x] `src/app/[locale]/settings/workspace/page.tsx`
- [x] `src/app/[locale]/settings/members/page.tsx`
- [x] `src/app/[locale]/settings/permissions/page.tsx`
- [x] `src/app/[locale]/settings/integrations/page.tsx`
- [x] `src/app/[locale]/settings/notifications/page.tsx`

### Org Tree
- [x] `src/app/[locale]/settings/org/page.tsx`
- [x] `src/components/org/OrgTree.tsx` — dotted canvas, drag & drop
- [x] `src/components/org/PersonPanel.tsx` — person edit panel
- [x] `src/components/org/DeptPanel.tsx` — dept edit panel

### Stub Pages (Phase 2)
- [x] `src/app/[locale]/flow/page.tsx`
- [x] `src/app/[locale]/workspace/page.tsx`
- [x] `src/app/[locale]/roles/clevel/page.tsx`
- [x] `src/app/[locale]/roles/lead/page.tsx`
- [x] `src/app/[locale]/notifications/page.tsx`

### Database Migrations
- [x] `20241001000001_enums.sql` — all 9 enum types
- [x] `20241001000002_core.sql` — workspaces, profiles, memberships, departments, permissions, join_requests + RLS
- [x] `20241001000003_goals_tasks.sql` — goals, tasks, task_results, task_comments, reviews, task_events, ai_suggestions + RLS
- [x] `20241001000004_requests.sql` — requests + RLS
- [x] `20241001000005_knowledge.sql` — pgvector, kb_documents, kb_chunks, kb_compilations + RLS
- [x] `20241001000006_brainstorm.sql` — brainstorm_sessions, brainstorm_ideas + RLS
- [x] `20241001000007_office.sql` — office_rooms, knocks, notifications, notification_prefs + RLS
- [x] `20241001000008_integrations.sql` — integrations + RLS
- [x] `20241001000009_functions.sql` — can(), get_user_workspace_role(), advance_task_stage(), return_task()

### Seed Data
- [x] `supabase/seed.sql` — REGAGRO demo (Olga, Vera, Jane, Tom, Mia, Ana, Alex, Sam, Lena, Omar, Ria + goals + tasks)

---

## How to Test Phase 1

### Prerequisites
1. Copy `.env.example` to `.env.local` and fill in your Supabase and Anthropic credentials
2. Run `npm install`
3. Run `npm run dev`

### Auth Flow
1. Visit http://localhost:3000 → redirects to `/en/auth/login`
2. Click a demo role card → fills in credentials → sign in
3. Test "Forgot password?" flow → check email link
4. Test "Request access" → `/auth/signup` → join tab → `/auth/sent`
5. Test "Accept invite" → `/auth/invite`

### Onboarding
1. Sign up with Create Workspace → `/onboarding/owner` (3 steps + done)
2. Accept invite → `/onboarding/member` (3 steps)

### Settings
1. Navigate to `/settings/profile` — update name, timezone, language
2. `/settings/workspace` — task capacity slider, brainstorm duration
3. `/settings/members` — member table with role badges
4. `/settings/permissions` — checkbox matrix
5. `/settings/integrations` — connect/disconnect mock
6. `/settings/notifications` — toggle matrix
7. `/settings/org` — org tree canvas, drag people, edit panels

### Language Switch
- Click EN/RU pill (bottom-right) on any page — UI language switches

### Database
```bash
# Push migrations to Supabase
supabase db push

# Run seed (requires service role)
supabase db reset --db-url <your-db-url>
```

---

## Phase 2 — Core App Screens ✅

### Database
- [x] `20241001000010_phase2.sql` — adds `ready` stage, `tag`, `holder_membership_id`, `started_at`, `ready_at` to tasks; updated `advance_task_stage` (6-stage workflow with result enforcement)

### Utilities
- [x] `src/lib/utils/avatar.ts` — `gradFor()`, `initialsFor()`
- [x] `src/lib/utils/stages.ts` — `STAGE_COLORS`, `PRIORITY_COLORS`, `STAGE_NODE_COLOR`
- [x] `src/types/app.ts` — `TaskRow`, `DeptColumn`, `MemberRow`, `RequestRow`

### Server Actions
- [x] `src/app/actions/tasks.ts` — `advanceTaskStage`, `returnTask`, `assignTask`, `addComment`, `uploadTaskResult`, `createRequest`, `respondToRequest`

### Work Flow (`/en/flow`)
- [x] `src/app/[locale]/flow/page.tsx` — server component, fetches dept columns + requests
- [x] `src/components/flow/FlowClient.tsx` — 3 dept columns, timeline nodes, reviewer cards, convergence SVG, Sync Mind card, right panel (4 modes: task detail / reviewer queue / requests / Sync Mind)
- [x] Realtime subscription on `tasks` table

### My Workspace (`/en/workspace`)
- [x] `src/app/[locale]/workspace/page.tsx` — server component, fetches members + tasks
- [x] `src/components/workspace/WorkspaceClient.tsx` — profile select → workspace view
- [x] Thread rail, 4 task bands, task panel with Result field (Document/Link/Image) + comments
- [x] Realtime subscription on `tasks` table

### Assign Work (`/en/assign`)
- [x] `src/app/[locale]/assign/page.tsx` — server component
- [x] `src/components/assign/AssignClient.tsx` — unassigned lane + teams cascade, AI suggestions, drag-and-drop, battery/efficiency per SPEC_WORKFLOWS

### How to Test Phase 2
1. Run `supabase/migrations/20241001000010_phase2.sql` in Supabase SQL Editor
2. `/en/flow` — dept columns, task click → panel, reviewer card → queue, Requests button, Sync Mind card
3. `/en/workspace` — pick member → task bands, task click → result upload + comments
4. `/en/assign` — unassigned lane, Suggest assignments, drag to member drop zone

---

## Phase 3 — AI + Goals ✅

### AI Backend
- [x] `@anthropic-ai/sdk` v1.6.0 installed
- [x] `src/app/api/decompose/route.ts` — POST /api/decompose: tool-use structured output via Claude Sonnet 4.6, no raw JSON parsing. `ANTHROPIC_API_KEY` server-only. `maxDuration = 60`.

### Goals Screen (`/en/goals`)
- [x] `src/app/[locale]/goals/page.tsx` — server component (`force-dynamic`), fetches goals/tasks/departments/members
- [x] `src/components/goals/GoalsClient.tsx` — full client component:
  - Left rail: goal list with progress bars, % complete, due dates, delete button (×)
  - View mode: hex puzzle board (edge-to-edge tessellation, stage-colored fills, dashed empty pieces)
  - Simulate step / Auto-play / Reset controls
  - Right panel: piece detail with assignee, deadline, advance button
  - New goal mode: text input → POST /api/decompose → SVG thread animation → editable task cards (title, priority, delete) → "Create goal & puzzle"
  - Completion banner when all pieces are done
  - `router.refresh()` after create/delete syncs server data
- [x] `src/app/actions/tasks.ts` — `createGoalWithTasks` (service-role, bypasses RLS) + `deleteGoal` (cascade)
- [x] `messages/en.json` + `messages/ru.json` — `goals` namespace (24 strings)

### Flow screen updates
- [x] Goals sorted G1→G2→G3 (numeric) in header pills
- [x] "← Goals" link added to flow header
- [x] `export const dynamic = 'force-dynamic'` on flow + workspace pages

### How to Test Phase 3
1. `/en/goals` — see G1/G2/G3 goals in left rail with puzzle boards
2. Click a goal → hex board (edge-to-edge tessellation), pieces colored by department
3. Click a piece → right panel shows task detail, Advance button
4. "Simulate one step" → random piece advances; "Auto-play" → animates; "Reset" → restores
5. "+ New goal" → type goal → "Decompose with AI ✦" → thread animation → edit task cards → "Create goal & puzzle" → new goal appears with puzzle
6. `×` on a goal card → confirms → deletes goal + all tasks
7. `/en/flow` → "← Goals" link in header; goal pills sorted G1…Gn

---

## Phase 4 — Dashboards & Notifications ✅

### Role Dashboards
- [x] `src/app/[locale]/roles/clevel/page.tsx` — server component, fetches goals/tasks/depts/members/requests for C-Level
- [x] `src/components/roles/CLevelClient.tsx` — 4 stat cards, company goals (dept-coloured bars), departments table (efficiency/battery/in-review), review queue (approve → Sync Mind / return with note), priority requests list
- [x] `src/app/[locale]/roles/lead/page.tsx` — server component for Team Lead (Jane Smith / Marketing)
- [x] `src/components/roles/TeamLeadClient.tsx` — review queue, incoming requests (accept/decline), team today (battery + efficiency per member), on-your-desk tasks, team goal pieces progress

### Notifications Center
- [x] `src/app/[locale]/notifications/page.tsx` — server component; falls back to demo data if table empty
- [x] `src/components/notifications/NotificationsClient.tsx` — filter tabs (All/Unread/Reviews/Requests/Goals), grouped Today/Earlier, unread dot + bg, action buttons, mark all read
- [x] `src/app/actions/tasks.ts` — `markNotificationRead`, `markAllNotificationsRead` server actions

### How to Test Phase 4
1. `/en/roles/clevel` — C-Level dashboard: stat cards, company goals bars, departments table, review queue, priority requests
2. `/en/roles/lead` — Team Lead dashboard: review queue, requests panel, team today, on-your-desk, goal pieces
3. `/en/notifications` — notification center with 7 demo items; switch filter tabs; mark read; mark all read
4. Build passes: `npm run build` ✓, `npx tsc --noEmit` ✓

---

---

## Phase 5 — Sync Mind + Google Drive ✅

### Database
- [x] `20241001000011_phase5.sql` — adds `source_type`, `file_url`, `file_name`, `fts tsvector` (GIN-indexed) to `kb_documents`; adds `summary`, `grouping` to `kb_compilations`; adds `drive_file_id`, `drive_file_url` to `task_results`; RLS service-role insert policies

### AI Backend
- [x] `src/app/api/syncmind/route.ts` — POST /api/syncmind: full-text search via tsvector/GIN, Claude Haiku 5.5 (512 tokens), rate limit 20/workspace/hour, saves compilation to `kb_compilations`
- [x] `src/app/api/decompose/route.ts` — optimized: switched to `claude-haiku-5-5`, 1024 max_tokens, trimmed context (dept IDs+names only), rate limit 10/workspace/10 min (12× cost reduction)

### Sync Mind Screen (`/en/syncmind`)
- [x] `src/app/[locale]/syncmind/page.tsx` — server component, fetches docCount + 8 recent docs
- [x] `src/components/syncmind/SyncMindClient.tsx` — search bar, 5 quick-chips, loading animation, summary card with Export button, grouped doc cards with icons, empty state

### Google Drive Integration
- [x] `src/app/api/auth/google/route.ts` — OAuth2 initiation (drive.file scope, offline access)
- [x] `src/app/api/auth/google/callback/route.ts` — exchanges code for tokens, upserts into `integrations` table
- [x] `src/app/[locale]/settings/integrations/page.tsx` — real OAuth redirect for Google Drive, success/error toast, auto-save info box
- [x] `src/app/actions/tasks.ts` — `saveResultToDrive`: finds/creates `SYNCO/Dept/Task` folder hierarchy, uploads shortcut, updates `task_results.drive_file_url`

### Auto-Indexing + Rich Metadata
- [x] `advanceTaskStage` auto-indexes task results into `kb_documents` when stage reaches `done`
- [x] `indexTaskResult` — fetches assignee, assigner names (via memberships→profiles), task comments, reviews; builds rich `content` for search + structured `metadata` JSON (`executed_by`, `executed_by_role`, `assigned_by`, `completed_at`, `department`, `reviews[]`, `comments[]`)
- [x] `20241001000012_phase6.sql` — `ALTER TABLE kb_documents ADD COLUMN metadata jsonb`
- [x] `SyncMindClient.tsx` — right panel shows People (Executed by, Assigned by, Department, Completed), Reviews (approve/return with color), Comments; fallback to raw content for older docs

### Seed Data
- [x] `supabase/seed.sql` — 8 demo `kb_documents` (launch brief, API spec, EMEA analysis, pricing, UX research, tech arch, GTM playbook, landing page specs)

### Navigation
- [x] `src/components/layout/TopBar.tsx` — Sync Mind tab added to both owner and member tab sets
- [x] `messages/en.json` + `messages/ru.json` — `nav.syncMind` key added

### How to Test Phase 5
1. Run `20241001000011_phase5.sql` migration in Supabase SQL editor
2. Run seed to populate 8 demo documents
3. `/en/syncmind` — search bar, type a query or click a chip → AI summary + doc cards appear
4. Click "↓ Export" → downloads `.txt` compilation file
5. `/en/settings/integrations` — click "Connect" on Google Drive → OAuth redirect (needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in `.env.local`)
6. After OAuth, `?connected=google_drive` → green toast, button shows "Connected"
7. Advance a task to `done` in Flow → results auto-indexed into `kb_documents` (visible in Sync Mind)
8. Build passes: `npm run build` ✓, `npx tsc --noEmit` ✓

---

---

## Phase 6 — Brainstorm + Virtual Office ✅

### Database
- [x] `20241001000012_phase6.sql` — adds `audience`, `workspace_id` to `brainstorm_sessions`; adds `meet_link`, `color`, `description`, `sort` to `office_rooms`; service-role RLS policies for seeding

### Brainstorm (`/en/brainstorm`)
- [x] `src/app/[locale]/brainstorm/page.tsx` — server component, fetches sessions + ideas + members
- [x] `src/components/brainstorm/BrainstormClient.tsx` — left rail (sessions list + new session form), main board (timer countdown + progress bar, participant avatars, idea composer, idea wall), Realtime subscribe to ideas, auto-close on timer, closed banner with "Open Sync Mind →"
- [x] `src/app/actions/brainstorm.ts` — `createBrainstormSession`, `postBrainstormIdea`, `endBrainstormSession` (indexes ideas to kb_documents), `saveMeetLink`, `sendKnock`

### Virtual Office (`/en/office`)
- [x] `src/app/[locale]/office/page.tsx` — server component, fetches rooms + members + live session
- [x] `src/components/office/OfficeClient.tsx` — 3-column rooms grid, Supabase Realtime Presence, status switcher (Available/Focus/Meeting/Away), "Move here" + "Join ↗" (opens meeting link in new tab), Knock button, right panel (person detail + status + room + working on + actions), "Who's around" with status counts + roster, live brainstorm banner, toast notifications, **"+ New Room" button** with modal (name, description, color picker, optional meet link; creates room instantly without page reload)
- [x] `src/app/actions/brainstorm.ts` — `createOfficeRoom` server action

### Seed Data
- [x] `supabase/seed.sql` — 6 office rooms (Marketing/Dev/Sales/War room/Focus/Lounge) with colors and meet links; 3 brainstorm sessions (1 live, 2 closed) with 10 ideas

### How to Test Phase 6
1. Run `20241001000012_phase6.sql` in Supabase SQL Editor
2. Run `seed.sql` again (new sections ON CONFLICT DO NOTHING)
3. `/en/brainstorm` — see sessions list; live session with countdown timer and idea wall; click "Post idea" or press Enter; timer counts down; "End now" closes session + banner appears
4. `/en/office` — 6 rooms with people; click a person → right panel; "Move here" moves you; "Join ↗" opens meet link in new tab; "Knock" sends notification; status switcher changes your dot
5. Build passes: `npm run build` ✓, `npx tsc --noEmit` ✓

---

## Phase 7 — Email Digest + Requests + Semantic Search ✅

- [x] Email digest via Resend (`/api/digest`, Vercel cron, Settings → Notifications "Send test" button)
- [x] Requests panel in Flow — priority badge, source badges (dept → dept), sender name + avatar
- [x] Priority badges on task cards in Flow columns (HIGH/MEDIUM/CRITICAL)
- [x] Vector embeddings for Sync Mind — Voyage AI `voyage-3` (1024 dims), pgvector cosine similarity, fallback to ILIKE
- [x] `src/lib/embeddings.ts` — `embed()` / `embedBatch()` via Voyage AI
- [x] `/api/embed-docs` — backfill endpoint for existing documents
- [x] `indexTaskResult` updated — generates embedding on task completion
- [x] `supabase/migrations/20241001000014_voyage_embeddings.sql` — vector(1024), ivfflat index, `search_kb_semantic` RPC
