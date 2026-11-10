# CLAUDE.md — SYNCO

You are building **SYNCO**, a multi-tenant SaaS for remote teams. The specs live in `/docs` (copied from the handoff package): `README.md`, `SPEC_DATA_MODEL.md`, `SPEC_PERMISSIONS.md`, `SPEC_WORKFLOWS.md`, `SPEC_AI.md`. The HTML prototype in `/docs/design` is the **visual source of truth**. Open the matching `.dc.html` before building any screen, and match its layout, copy, colors and states.

## Stack
Next.js 15 App Router · TypeScript (strict) · Tailwind (tokens from README → `tailwind.config.ts`) · shadcn/ui · lucide-react · Supabase (Auth, Postgres, Storage, Realtime, RLS) · Anthropic SDK (server only) · next-intl (en, ru — seed `ru` from `/docs/design/i18n.js`) · zod · Vercel.

## Rules
- Work in the phase the founder asks for. Don't build ahead.
- Database changes go only through SQL migrations in `supabase/migrations`. Every table gets RLS policies in the same migration.
- Stage changes, assignment, review and requests run through Postgres functions (RPC) that enforce SPEC_WORKFLOWS and SPEC_PERMISSIONS. The UI never writes `stage` directly.
- Never expose service-role or Anthropic keys to the client. AI calls go in route handlers / server actions.
- All user-facing strings go through next-intl. Write the EN copy exactly as in the prototype.
- Desktop first (min width 1240). Every page must have a loading state, an empty state and an error state.
- After each phase: run `npm run build`, `npm run lint` and the seed script, fix any errors, then write a short summary of what changed and how to test it.
- Keep a `docs/PROGRESS.md` checklist up to date.

## Seed data
Provide `supabase/seed.sql` with the REGAGRO demo:
- Owner Olga White; C-Level Vera Kova.
- Marketing: Jane Smith (lead), Tom Reyes, Mia Cole, Ana Silva (invited).
- Development: Alex Kim (lead), Sam Park, Lena Vu.
- Sales: Omar Diaz (lead), Ria Nair.
- Goals G1 Launch, G2 EMEA, G3 Onboarding, with the tasks shown in the prototype.
