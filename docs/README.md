# Handoff: SYNCO — AI operating system for remote teams

## Overview
SYNCO lets a company owner set a goal, have AI split it into tasks per department, and watch teams carry it out visually. Each department works in a vertical **thread** (no kanban). Every finished task needs an attached **result** (document, link or image). Results go through review: a Team Lead first, then a final reviewer when the task came from someone else. Approved results are stored in **Sync Mind** (RU: «Синк»), a knowledge-base agent that can gather documents by topic. Other modules: inter-department **requests**, a **goal puzzle** (each task is one piece), timed **async brainstorms**, a **Virtual Office**, role dashboards, org tree editor, settings and notifications.

## About the design files
Everything in `design/` is an **HTML design reference**: a clickable prototype showing intended look and behaviour. It is **not production code**. Each `.dc.html` file is self-contained (inline styles, a small logic class, demo data in memory). Do not ship or port these files directly. Rebuild the screens in the stack below, using its own patterns. Open `design/index.html` in a browser to click through everything.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, copy and interactions are final. Match the visuals closely, then wire them to real data.

## Target stack (no existing codebase — chosen for this project)
- **Next.js 15 (App Router) + TypeScript + Tailwind CSS**, components with shadcn/ui primitives restyled to the tokens below
- **Supabase**: Postgres, Auth (Google + email/password), Storage (result files), Realtime (threads, brainstorm, office presence), Row Level Security for permissions
- **Anthropic Claude API** (server-side only): goal decomposition, assignee suggestion, Sync Mind retrieval/compilation. Use `pgvector` in Supabase for document embeddings.
- **Google Drive API**: copy every approved result into `SYNCO / {Department} / {Task}`
- **Vercel** hosting; **next-intl** for EN/RU
- Later: LiveKit or Daily for Virtual Office audio/video, Stripe for billing, Resend for email

## Files in this package
| File | What it is |
|---|---|
| `README.md` | This file: overview, tokens, screens, interactions |
| `SPEC_DATA_MODEL.md` | Tables, columns, enums, relations, RLS notes |
| `SPEC_PERMISSIONS.md` | Role × action matrix |
| `SPEC_WORKFLOWS.md` | Task / request / review state machines, battery & efficiency formulas |
| `SPEC_AI.md` | Prompts and JSON schemas for decomposition, assignee suggestion, Sync Mind |
| `BACKLOG.md` | Agreed but unscheduled: built-in calls, meeting transcription agent |
| `CLAUDE.md` | Drop into the repo root — standing instructions for Claude Code |
| `START_HERE_RU.md` | Step-by-step guide for the founder (Russian) with phase prompts |
| `design/` | The HTML prototype (open `index.html`) |
| `design/i18n.js` | Complete EN→RU dictionary used by the prototype — reuse as the RU message catalog |

## Design tokens
**Colors**
| Token | Hex | Use |
|---|---|---|
| primary | `#5B4FE8` | Primary buttons, active states, links, Marketing dept color |
| primary-dark | `#3B33B0` | Gradient end, hover |
| primary-soft | `#EEEDFB` | Chips, soft fills |
| navy | `#0F1B2D` | Headings, dark surfaces, Owner |
| mint | `#00C896` | Success, done, Development dept color, "available" |
| mint-dark | `#00936E` | Success text |
| amber | `#F5A623` | In progress, warnings, Sales dept color, "in a meeting" |
| amber-text | `#C77E0A` | Amber text on light |
| danger | `#E5484D` | High priority, overload, needs revision, decline |
| violet | `#8B5CF6` / `#6D3FE0` | C-Level, priority requests, "in focus" |
| bg | `#F7F8FC` | App background |
| surface | `#FFFFFF` | Cards |
| border | `#ECEEF5` | Card borders; inputs `#E5E7F0` |
| text-2 | `#6B7385` | Secondary text; muted `#9CA3B5`, faint `#B7BCCB` |
| goal colors | `#E5487F` (G1), `#2E9BE6` (G2), `#8B5CF6` (G3) | Goal chips / puzzle |

Soft badge pattern: text = token color, background = same color at 12–16% alpha (e.g. `rgba(229,72,77,.12)`).

**Typography**: Inter (400/500/600/700/800). Page title 26–28/800, letter-spacing −0.8px. Section title 15–16/800. Body 13–15/400–500. Labels 11–13/600. Overline 10–11/700, letter-spacing .4–.5px, uppercase. Auth headline 44/800, −1.6px.

**Radius**: inputs & buttons 12px (small buttons 9–10px), cards 16px, chips 99px, avatars 50%.
**Shadows**: card `0 2px 10px rgba(15,27,45,.04)`; raised `0 12px 30px rgba(15,27,45,.12)`; primary button `0 8px 20px rgba(91,79,232,.30)`; modal `0 30px 80px rgba(0,0,0,.45)`.
**Spacing**: 4-pt grid; common gaps 6/8/10/12/14/18/22; page padding 26–30px.
**Sizes**: top bar 60px; buttons 36/42/48/52px tall; inputs 42–50px; avatars 22/28/36/52px. Desktop minimum width 1240px (target 1440×900).

## Global UI
- **Top bar** (60px, white, bottom border): logo · segmented tabs (Home*, Work Flow, Assign Work, Goals, Brainstorm, Office) · context text · bell → Notifications (amber count badge) · avatar → Settings. *Home appears for C-Level/Team Lead.
- **Language switch** EN/RU: floating pill bottom-right (and in Settings → Profile). Saved per user.
- **Battery** (workload): shows *capacity left*, iPhone-style. Full green ≥50%, amber 25–50%, red <25% or overloaded. Capacity per person is a workspace setting (default 6 open tasks).
- **Toasts**: dark navy pill, bottom-centre, ~2.4s.

## Screens (see `design/` for exact layout)
1. **Auth** (`SYNCO Auth.dc.html`, hash: `#login #signup #sent #forgot #forgotSent #reset #invite`). Split screen: a 46% left panel with a gradient `155deg #5B4FE8→#3B33B0→#0F1B2D`, and a form on the right (max-width 440).
   - Login: Google button, email and password fields, "Forgot password?", Sign in. Each role lands on its own start screen: Owner → Work Flow, C-Level → C-Level dashboard, Team Lead → Team Lead dashboard, Member → My Workspace.
   - Sign up has two modes. *Create a workspace* sends the user to owner onboarding. *Join my team* sends a request to admins.
   - Forgot password: email sent, resend unlocks after 30s, then a new-password screen. Rules: 8+ characters, a number, upper and lower case. The confirmation field must match.
   - Accept invite: the card shows workspace, department, Team Lead, position and access level. The user sets a password or uses Google.
2. **Onboarding** (`SYNCO Onboarding.dc.html`). Owner: `#1` workspace name, role, company size → `#2` org map (departments + lead email, AI-suggested set, CSV import, live tree preview) → `#3` invites (email + department + access level, shareable link) → `#done` (summary, then "Set first goal" → Goals new-goal mode). Member: `#m1` welcome + team → `#m2` profile (photo, name, position, time zone, hours) → `#m3` how it works → My Workspace.
3. **My Workspace** — Member (`SYNCO Workspace.dc.html`).
   - Left rail, "The Thread": Assigned → In Focus (pulsing bulb) → Done → For Review (flag), with counts.
   - Middle bands: *Assigned to you* (sorted by priority, "Take today ↓"), *In focus today* ("Mark done"), *Done* ("Send for review"), *With your manager*.
   - Task card panel on the right: badges, description, assignee / assigned by / deadline / time in progress, the **required Result** box (tabs Document | Link | Image, drag-drop or browse, attached list, "Saved to Google Drive" row), comments, and a contextual primary button.
   - **A task cannot be marked done without at least one result.**
4. **Work Flow** — Owner (`SYNCO Flow.dc.html`).
   - One column per department. Each column is a vertical thread of task cards; the dot color shows stage. Each card has a goal chip and a source badge.
   - Each thread ends in a **Reviewer card**. Under the columns, dashed animated curves from all reviewers converge into the **Sync Mind** card.
   - Goal filter pills dim tasks from other goals to 22% opacity. A Requests button opens the requests panel.
   - The right panel (opens on click, **fully removed when closed**) has four modes: task detail (with the review chain timeline), reviewer queue (Approve → Sync Mind, or Request changes with a note → task returns as **Needs Revision**), requests (new request form plus pending and history), and Sync Mind (query, suggestion chips, compiled set, export).
5. **Assign Work** (`SYNCO Assign.dc.html`).
   - Goal bar with "✦ Suggest assignments" and "Approve all suggested".
   - Unassigned lane: each card shows the AI suggestion (person, reason, deadline, overload warning) with Approve / Change ▾. The "Assign ▾" picker lists team leads and members with batteries; it has a × button and closes on outside click. Cards can also be dragged.
   - Team cards: a lead header (efficiency bar and battery), "On the lead's desk · Delegate ↓", and members as drop targets.
   - Daily Status rail: efficiency and battery by department and by person.
6. **Goals** (`SYNCO Goals.dc.html`, `#new`). The goal list shows % and pieces placed. The main area is a **hex puzzle**: 87×100 hexes in an offset grid, one hex per task, filled with the department color by stage:
   - not started: dashed outline;
   - in progress: 13% fill, pulsing;
   - in review: 45% fill;
   - done: full fill with ✓, plus a snap-in animation.

   Clicking a piece shows its task. In new-goal mode, the decomposition animation draws three curves to the department nodes, then the task cards fade in, then "Create goal & puzzle".
7. **Brainstorm** (`SYNCO Brainstorm.dc.html`). Sessions list (LIVE + countdown / CLOSED). New session: topic, duration 10/15/30 min, audience. Board: countdown (red under 2 min), contributors avatars, a composer (text only, no voting) and a wall of idea cards whose top stripe is the department color. When the timer ends, every idea is sent to Sync Mind.
8. **Role dashboards** (`SYNCO Roles.dc.html`, `#clevel` / `#lead`).
   - C-Level: 4 stat cards; company goals with a stacked per-department progress bar; a departments table (lead, efficiency, battery, in review, status); "Needs your sign-off" (final review: approve, or return with a note); your priority requests.
   - Team Lead: team efficiency and battery; review queue; incoming requests (accept, or decline with a reason); team today (status, in-focus task, battery, efficiency); "On your desk" delegation chips; the team's puzzle pieces per goal.
9. **Org Tree editor** (`SYNCO Org Editor.dc.html`). Dotted canvas: Owner root → C-Level row → department columns.
   - Drag people between departments.
   - Edit panel for a person: name, position, department, Team Lead toggle, access level, resend invite, remove (two-step).
   - Edit panel for a department: name, color, lead, delete (only when empty). Changes autosave.
10. **Settings** (`SYNCO Settings.dc.html`, `#profile #workspace #members #permissions #integrations #notifications`):
    - Workspace: auto-approve by email domain; task capacity per person (2–15); default brainstorm length.
    - Members: role pill cycles C-Level → Team Lead → Member (Owner fixed).
    - Permissions: matrix (Owner column locked).
    - Integrations: Drive / Calendar / Slack / Notion.
    - Notifications: event × channel matrix (Slack disabled until connected), plus daily digest.
11. **Notifications** (`SYNCO Notifications.dc.html`). Filters: All, Unread, Reviews, Requests, Mentions, Goals. Grouped Today / Earlier. Each item has an actor avatar with a type badge, a quote, a goal chip and inline actions (Approve, Accept/Decline, Open, Join). Clicking marks the item read.
12. **Virtual Office** (`SYNCO Office.dc.html`).
    - Rooms grid: 3 department rooms, a war room, a focus zone and a lounge. Avatars have status rings: available `#00C896`, focus `#8B5CF6`, meeting `#F5A623`, away `#C3C9D6`.
    - Your status selector; choosing Focus moves you to the focus zone. Move or join rooms.
    - Call bar: mute, camera, leave. Person panel: Knock (held quietly if the person is in focus) and Go to room.
    - A live brainstorm banner sits at the top.
13. **Prototype canvas** (`SYNCO Prototype.dc.html`). Overview of every screen; not a product screen.

## Interactions & animation
- Thread drop: `translateY(-38px) scale(.96) → 6px overshoot → 0`, 600ms `cubic-bezier(.34,1.4,.5,1)`.
- Returned card: `returnIn` (translateY −16px → 0) with a red border for 1.2s.
- Puzzle snap: scale .55 → 1.1 → 1, 600ms. In-progress pulse: opacity 1 ↔ .55, 1.6s.
- Panels slide in: translateX 14px → 0, 220ms. Toast fade-up 250ms.
- Sync Mind card: soft violet glow pulse, 3s.
- Convergence curves: dashed stroke with an animated `stroke-dashoffset`.

## Assets
No raster assets. The logo is a 26–40px rounded square in `#5B4FE8` with a white rotated rounded square. Icons in the prototype are CSS shapes or glyphs; replace them with **lucide-react** equivalents. Avatars are initials on gradients. Use real profile photos when uploaded.
