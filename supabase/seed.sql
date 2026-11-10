-- SYNCO Seed: Demo workspace
-- Uses fixed UUIDs for determinism

-- =========================================================
-- AUTH USERS (service role required to insert into auth.users)
-- =========================================================

-- Olga White (Owner)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'olga@synco.com',
  '$2a$10$placeholder_hash_olga_white',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Vera Kova (C-Level)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'vera@synco.com',
  '$2a$10$placeholder_hash_vera_kova',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Jane Smith (Marketing Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'jane@synco.com',
  '$2a$10$placeholder_hash_jane_smith',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Tom Reyes (Marketing Member)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'tom@synco.com',
  '$2a$10$placeholder_hash_tom_reyes',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Mia Cole (Marketing Member)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'mia@synco.com',
  '$2a$10$placeholder_hash_mia_cole',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Ana Silva (Marketing - invited)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'ana@synco.com',
  '$2a$10$placeholder_hash_ana_silva',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Alex Kim (Dev Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  'alex@synco.com',
  '$2a$10$placeholder_hash_alex_kim',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Sam Park (Dev Member)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  'sam@synco.com',
  '$2a$10$placeholder_hash_sam_park',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Lena Vu (Dev Member)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000009',
  'lena@synco.com',
  '$2a$10$placeholder_hash_lena_vu',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Omar Diaz (Sales Lead)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'omar@synco.com',
  '$2a$10$placeholder_hash_omar_diaz',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Ria Nair (Sales Member)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'ria@synco.com',
  '$2a$10$placeholder_hash_ria_nair',
  now(), now(), now()
) ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- PROFILES
-- =========================================================

INSERT INTO profiles (id, user_id, full_name, locale, time_zone) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Olga White', 'en', 'Europe/Moscow'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Vera Kova',  'en', 'Europe/Moscow'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Jane Smith', 'en', 'America/New_York'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Tom Reyes',  'en', 'America/Los_Angeles'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Mia Cole',   'en', 'Europe/London'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'Ana Silva',  'en', 'Europe/Lisbon'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'Alex Kim',   'en', 'Asia/Seoul'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 'Sam Park',   'en', 'America/Chicago'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 'Lena Vu',    'en', 'America/Denver'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'Omar Diaz',  'en', 'Europe/Madrid'),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'Ria Nair',   'en', 'Asia/Kolkata')
ON CONFLICT (user_id) DO NOTHING;


-- =========================================================
-- WORKSPACE
-- =========================================================

INSERT INTO workspaces (id, name, slug, email_domain, task_capacity, brainstorm_default_min)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'SYNCO',
  'synco-demo',
  'synco.com',
  6,
  15
) ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- DEPARTMENTS
-- =========================================================

INSERT INTO departments (id, workspace_id, name, color, sort) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Marketing',   '#5B4FE8', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Development', '#00C896', 2),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Sales',       '#F5A623', 3)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- MEMBERSHIPS
-- =========================================================

INSERT INTO memberships (id, workspace_id, user_id, role, department_id, position, status) VALUES
  -- Owner
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'owner', NULL, 'Owner', 'active'),
  -- C-Level
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002', 'c_level', NULL, 'Chief Operating Officer', 'active'),
  -- Marketing Lead
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000003', 'team_lead', '30000000-0000-0000-0000-000000000001', 'Marketing Lead', 'active'),
  -- Marketing Members
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000004', 'member', '30000000-0000-0000-0000-000000000001', 'Content Strategist', 'active'),
  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000005', 'member', '30000000-0000-0000-0000-000000000001', 'Designer', 'active'),
  ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000006', 'member', '30000000-0000-0000-0000-000000000001', 'Social Media Manager', 'invited'),
  -- Dev Lead
  ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000007', 'team_lead', '30000000-0000-0000-0000-000000000002', 'Tech Lead', 'active'),
  -- Dev Members
  ('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000008', 'member', '30000000-0000-0000-0000-000000000002', 'Backend Engineer', 'active'),
  ('40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000009', 'member', '30000000-0000-0000-0000-000000000002', 'Frontend Engineer', 'active'),
  -- Sales Lead
  ('40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000010', 'team_lead', '30000000-0000-0000-0000-000000000003', 'Sales Lead', 'active'),
  -- Sales Member
  ('40000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011', 'member', '30000000-0000-0000-0000-000000000003', 'Account Executive', 'active')
ON CONFLICT (id) DO NOTHING;

-- Update department leads
UPDATE departments SET lead_membership_id = '40000000-0000-0000-0000-000000000003'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE departments SET lead_membership_id = '40000000-0000-0000-0000-000000000007'
WHERE id = '30000000-0000-0000-0000-000000000002';

UPDATE departments SET lead_membership_id = '40000000-0000-0000-0000-000000000010'
WHERE id = '30000000-0000-0000-0000-000000000003';


-- =========================================================
-- REQUESTS (demo)
-- =========================================================

INSERT INTO requests (id, workspace_id, from_membership_id, to_department_id, title, description, is_priority, status) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000004', -- Tom Reyes (Marketing member)
    '30000000-0000-0000-0000-000000000002', -- → Development dept
    'Need API endpoint for campaign analytics',
    'We need a /analytics/campaigns endpoint to pull CTR and impressions for the EMEA campaign dashboard.',
    true,
    'pending'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000011', -- Ria Nair (Sales member)
    '30000000-0000-0000-0000-000000000001', -- → Marketing dept
    'Request updated product one-pager for Q4 sales deck',
    'Sales needs the latest product positioning materials before the Oct 20 pitch.',
    false,
    'pending'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000007', -- Alex Kim (Dev lead)
    '30000000-0000-0000-0000-000000000001', -- → Marketing dept
    'Design assets for onboarding email sequence',
    null,
    false,
    'accepted'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- GOALS
-- =========================================================

INSERT INTO goals (id, workspace_id, title, description, color, label, target_date, created_by) VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Launch new product by September 1',
    'Full product launch including landing page, API, pricing and marketing campaign.',
    '#E5487F',
    'G1',
    '2025-09-01',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Enter the EMEA market in Q4',
    'Expand into Europe, Middle East and Africa with localized content and partner network.',
    '#2E9BE6',
    'G2',
    '2025-12-31',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Cut onboarding time by 30%',
    'Redesign the onboarding experience to reduce time-to-value for new customers.',
    '#8B5CF6',
    'G3',
    '2025-10-31',
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- TASKS (G1 - Launch)
-- =========================================================

INSERT INTO tasks (id, workspace_id, goal_id, department_id, title, description, stage, priority, source, assigned_to, assigned_by, deadline, sort) VALUES
  -- Marketing G1 tasks
  (
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Design product launch landing page',
    'Build the responsive landing page for the September launch — hero, feature highlights, pricing, and the request-access CTA.',
    'in_review',
    'high',
    'owner',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '2025-08-15',
    1
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Social media launch calendar',
    'Six-week posting plan across LinkedIn, X and Instagram tied to the launch milestones.',
    'in_progress',
    'medium',
    'owner',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '2025-08-20',
    2
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Write blog announcement',
    'Long-form launch announcement for the company blog with product framing and customer quotes.',
    'todo',
    'medium',
    'team_lead',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    '2025-08-25',
    3
  ),
  (
    '60000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Welcome email series',
    'Three-email welcome sequence for new workspaces.',
    'needs_revision',
    'low',
    'team_lead',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    '2025-08-28',
    4
  ),
  -- Dev G1 tasks
  (
    '60000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    'Build product API',
    'Core REST + webhook API powering the new product surface, with auth and rate limiting.',
    'in_review',
    'high',
    'owner',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    '2025-08-10',
    1
  ),
  (
    '60000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    'Empty-state redesign',
    'Replace the blank dashboard with a guided 3-step start.',
    'in_progress',
    'medium',
    'owner',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    '2025-08-18',
    2
  ),
  (
    '60000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'EU region deployment',
    'Move workspace data for EU customers to the Frankfurt region.',
    'todo',
    'high',
    'owner',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    '2025-10-15',
    3
  ),
  -- Sales G1 tasks
  (
    '60000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    'Prepare pricing tiers',
    'Three-tier pricing with feature gating and an enterprise contact path.',
    'done',
    'high',
    'owner',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    '2025-08-05',
    1
  ),
  (
    '60000000-0000-0000-0000-000000000009',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    'Draft outreach list',
    'Marketing asked for a segmented prospect list to target with the EMEA campaign.',
    'in_progress',
    'medium',
    'request',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000010',
    '2025-09-10',
    2
  )
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- DEFAULT PERMISSIONS
-- =========================================================

INSERT INTO permissions (workspace_id, role, action, allowed) VALUES
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'create_goal',            false),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'edit_goal',              true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'create_task',            true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'assign_task',            true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'send_priority_request',  true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'send_request',           true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'review_task',            true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'final_review',           true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'invite_member',          true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'query_sync_mind',        true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'start_brainstorm',       true),
  ('20000000-0000-0000-0000-000000000001', 'c_level',   'view_all_tasks',         true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'create_task',            true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'assign_task',            true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'send_request',           true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'accept_request',         true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'review_task',            true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'query_sync_mind',        true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'start_brainstorm',       true),
  ('20000000-0000-0000-0000-000000000001', 'team_lead', 'view_all_tasks',         true),
  ('20000000-0000-0000-0000-000000000001', 'member',    'query_sync_mind',        true),
  ('20000000-0000-0000-0000-000000000001', 'member',    'start_brainstorm',       false),
  ('20000000-0000-0000-0000-000000000001', 'member',    'view_all_tasks',         false)
ON CONFLICT (workspace_id, role, action) DO NOTHING;


-- =========================================================
-- KNOWLEDGE BASE (Sync Mind demo documents)
-- =========================================================

INSERT INTO kb_documents (id, workspace_id, department_id, goal_id, title, content, source_type, file_url, file_name, created_at) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'Product Launch Campaign Brief',
    'Full marketing campaign brief for the September product launch. Covers brand positioning, target audience (SMB SaaS), key messages, channel strategy (LinkedIn, Product Hunt, email), budget allocation and KPI targets. Launch date September 1. Expected reach: 50k impressions, 500 signups.',
    'task_result', NULL, 'launch_campaign_brief.pdf',
    now() - interval '5 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    'API Technical Specification v2',
    'REST API spec for the REGAGRO platform v2. Authentication via JWT, rate limits 1000 req/min per workspace. Key endpoints: /tasks, /goals, /members, /requests, /kb. WebSocket support for real-time updates. SLA: 99.9% uptime, p95 latency < 200ms.',
    'task_result', NULL, 'api_spec_v2.docx',
    now() - interval '8 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000002',
    'EMEA Expansion — Market Analysis',
    'Market analysis for EMEA expansion covering Germany, France, Netherlands and Poland. TAM: €4.2B. Key competitors: Monday.com, Asana, Notion. Recommended entry: Germany first (highest SaaS adoption, GDPR-ready infrastructure). Timeline: Q1 pilot, Q2 full rollout.',
    'task_result', NULL, 'emea_market_analysis.pdf',
    now() - interval '12 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000002',
    'EMEA Pricing Strategy',
    'Pricing recommendations for European markets. Base: €12/seat/mo (Starter), €28/seat/mo (Growth), €60/seat/mo (Enterprise). Annual discount 20%. Localized billing in EUR, GBP, PLN. VAT handling via Stripe Tax. Competitive positioning against Monday.com (€9–€19) and Asana (€11–€25).',
    'task_result', NULL, 'emea_pricing_strategy.xlsx',
    now() - interval '3 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'Onboarding Flow — UX Research Report',
    'User research findings from 24 onboarding interviews. Key friction points: invite flow (38% drop-off), first task creation (22% abandon), role setup confusion (45% need support). Recommendations: guided wizard, role templates, 3-step quick-start. Expected improvement: 60% completion rate (from 41%).',
    'task_result', NULL, 'onboarding_ux_research.pdf',
    now() - interval '6 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000003',
    'Onboarding Technical Architecture',
    'Technical design for the onboarding wizard. Steps: workspace setup → invite team → assign roles → create first goal → decompose with AI. State machine in Postgres, progress tracked per membership. AI decompose called once per goal on first creation. Estimated dev time: 3 sprints.',
    'task_result', NULL, 'onboarding_tech_arch.docx',
    now() - interval '2 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'Go-to-Market Playbook Q3',
    'GTM playbook for Q3 launch. Channels: content (SEO blog, 3 posts/week), paid (Google + LinkedIn, €5k/mo), partnerships (3 integration partners), community (Slack groups, Product Hunt launch week). Success metrics: 1000 MQL, 100 SQL, 20 closed deals in first 90 days.',
    'task_result', NULL, 'gtm_playbook_q3.pdf',
    now() - interval '14 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    'Landing Page Copy & Design Specs',
    'Final approved copy and design specs for the product landing page. Hero: "Your team, in sync". Value props: AI goal decomposition, role-based workflows, real-time knowledge base. Social proof: 3 customer quotes (REGAGRO, TechNova, Meridian). CTA: "Start free trial" → signup flow. Figma link included.',
    'task_result', NULL, 'landing_page_specs.pdf',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- OFFICE ROOMS
-- =========================================================

INSERT INTO office_rooms (id, workspace_id, name, description, type, department_id, color, meet_link, sort) VALUES
  ('c0000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Marketing',  'Team room · Jane''s team',   'department','30000000-0000-0000-0000-000000000001','#5B4FE8','meet.google.com/mkt-regagro-day',1),
  ('c0000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Development','Team room · Alex''s team',   'department','30000000-0000-0000-0000-000000000002','#00C896','meet.google.com/dev-sprint-room',2),
  ('c0000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Sales',      'Team room · Omar''s team',   'department','30000000-0000-0000-0000-000000000003','#F5A623','zoom.us/j/84120399',3),
  ('c0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','Launch war room','Meeting room · G1 · Launch','war_room',NULL,'#E5487F','meet.google.com/launch-war-room',4),
  ('c0000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','Focus zone', 'Quiet · knocks held until later','focus',  NULL,'#8B5CF6',NULL,5),
  ('c0000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','Lounge',     'Coffee, small talk, hellos',  'lounge',  NULL,'#9CA3B5','meet.google.com/regagro-lounge',6)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- BRAINSTORM SESSIONS
-- =========================================================

INSERT INTO brainstorm_sessions (id, workspace_id, topic, audience, duration_min, started_at, ended_at, created_by) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'How might we make a new customer''s first week feel effortless?',
    'All company', 15,
    now() - interval '8 minutes',
    NULL,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Names for the September launch campaign',
    'Marketing', 10,
    now() - interval '2 days',
    now() - interval '2 days' + interval '10 minutes',
    '00000000-0000-0000-0000-000000000003'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'What slows down our release process?',
    'Development', 30,
    now() - interval '3 days',
    now() - interval '3 days' + interval '30 minutes',
    '00000000-0000-0000-0000-000000000007'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO brainstorm_ideas (id, session_id, author_id, body, created_at) VALUES
  -- Session 1 (live)
  ('e0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','Assign every new customer a named contact for week one.',now()-interval '7 minutes'),
  ('e0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','Send a 60-second video recap after their first goal is decomposed.',now()-interval '6 minutes'),
  ('e0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','A welcome email that links straight to building the org tree.',now()-interval '5 minutes'),
  ('e0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000007','Pre-fill departments from the company size they chose at signup.',now()-interval '3 minutes'),
  -- Session 2 (closed)
  ('e0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','"In Sync" — short and on-brand.',now()-interval '2 days'),
  ('e0000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005','"One Tree, Every Team".',now()-interval '2 days'),
  ('e0000000-0000-0000-0000-000000000007','d0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','"Goals, Untangled".',now()-interval '2 days'),
  -- Session 3 (closed)
  ('e0000000-0000-0000-0000-000000000008','d0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000008','Manual QA sign-off waits on one person.',now()-interval '3 days'),
  ('e0000000-0000-0000-0000-000000000009','d0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000009','Preview environments take 20 minutes to spin up.',now()-interval '3 days'),
  ('e0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000007','Release notes are written at the last minute.',now()-interval '3 days')
ON CONFLICT (id) DO NOTHING;


-- Add demo file URLs so "Open →" buttons appear on cards
UPDATE kb_documents SET file_url = 'https://www.figma.com/file/demo-launch-brief'       WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE kb_documents SET file_url = 'https://www.notion.so/demo-api-spec'                WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE kb_documents SET file_url = 'https://docs.google.com/presentation/d/demo-emea'   WHERE id = 'b0000000-0000-0000-0000-000000000003';
UPDATE kb_documents SET file_url = 'https://docs.google.com/spreadsheets/d/demo-pricing' WHERE id = 'b0000000-0000-0000-0000-000000000004';
UPDATE kb_documents SET file_url = 'https://www.notion.so/demo-ux-research'             WHERE id = 'b0000000-0000-0000-0000-000000000005';
UPDATE kb_documents SET file_url = 'https://www.notion.so/demo-tech-arch'               WHERE id = 'b0000000-0000-0000-0000-000000000006';
UPDATE kb_documents SET file_url = 'https://docs.google.com/document/d/demo-gtm'        WHERE id = 'b0000000-0000-0000-0000-000000000007';
UPDATE kb_documents SET file_url = 'https://www.figma.com/file/demo-landing-page'       WHERE id = 'b0000000-0000-0000-0000-000000000008';

-- Rich metadata for demo documents
UPDATE kb_documents SET metadata = '{
  "executed_by": "Jane Smith",
  "executed_by_role": "Marketing Lead",
  "assigned_by": "Olga White",
  "completed_at": "2024-08-26T14:30:00Z",
  "department": "Marketing",
  "task_description": "Create full campaign brief for the September product launch covering positioning, channels, budget and KPIs.",
  "reviews": [{"reviewer":"Vera Kova","action":"approve","note":"Solid brief, go ahead","at":"2024-08-27T10:00:00Z"}],
  "comments": [{"author":"Tom Reyes","body":"Added LinkedIn budget breakdown on page 4","at":"2024-08-25T16:20:00Z"},{"author":"Jane Smith","body":"Updated KPI targets after Olga review","at":"2024-08-26T09:10:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Alex Kim",
  "executed_by_role": "Dev Lead",
  "assigned_by": "Vera Kova",
  "completed_at": "2024-08-23T18:00:00Z",
  "department": "Development",
  "task_description": "Write REST API spec v2 with authentication, rate limits, all endpoints and WebSocket support.",
  "reviews": [{"reviewer":"Vera Kova","action":"return","note":"Need SLA numbers and p95 latency target","at":"2024-08-22T11:00:00Z"},{"reviewer":"Vera Kova","action":"approve","note":"Looks complete now","at":"2024-08-23T17:45:00Z"}],
  "comments": [{"author":"Sam Park","body":"Added WebSocket section, reviewed all endpoints","at":"2024-08-21T14:00:00Z"},{"author":"Alex Kim","body":"Added SLA and latency targets as requested","at":"2024-08-23T12:30:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000002';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Omar Diaz",
  "executed_by_role": "Sales Lead",
  "assigned_by": "Vera Kova",
  "completed_at": "2024-08-19T16:00:00Z",
  "department": "Sales",
  "task_description": "Conduct market analysis for EMEA expansion: Germany, France, Netherlands, Poland. TAM, competitors, recommended entry strategy.",
  "reviews": [{"reviewer":"Olga White","action":"approve","note":"Great depth on Germany entry. Proceed with Q1 pilot plan.","at":"2024-08-20T09:00:00Z"}],
  "comments": [{"author":"Ria Nair","body":"Added competitor pricing table for Monday.com and Asana","at":"2024-08-18T11:00:00Z"},{"author":"Omar Diaz","body":"Revised Germany entry rationale based on GDPR readiness data","at":"2024-08-19T10:00:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000003';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Ria Nair",
  "executed_by_role": "Sales",
  "assigned_by": "Omar Diaz",
  "completed_at": "2024-09-05T15:00:00Z",
  "department": "Sales",
  "task_description": "Build EMEA pricing strategy with per-country recommendations, VAT handling and competitive positioning.",
  "reviews": [{"reviewer":"Vera Kova","action":"approve","note":"Annual discount approved. Ship it.","at":"2024-09-05T17:00:00Z"}],
  "comments": [{"author":"Ria Nair","body":"Stripe Tax handles PLN and GBP automatically — confirmed with Finance","at":"2024-09-04T14:30:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000004';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Mia Cole",
  "executed_by_role": "Marketing",
  "assigned_by": "Jane Smith",
  "completed_at": "2024-08-25T12:00:00Z",
  "department": "Marketing",
  "task_description": "Conduct user research interviews on the onboarding flow. Identify friction points and produce recommendations.",
  "reviews": [{"reviewer":"Jane Smith","action":"approve","note":"Excellent findings. Share with Dev team immediately.","at":"2024-08-25T16:00:00Z"}],
  "comments": [{"author":"Mia Cole","body":"Conducted 24 interviews across 3 cohorts — attached raw notes","at":"2024-08-24T18:00:00Z"},{"author":"Tom Reyes","body":"Can we turn this into a slide deck for the all-hands?","at":"2024-08-25T13:00:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000005';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Lena Vu",
  "executed_by_role": "Development",
  "assigned_by": "Alex Kim",
  "completed_at": "2024-09-07T11:00:00Z",
  "department": "Development",
  "task_description": "Design technical architecture for the onboarding wizard: state machine, AI integration, progress tracking per membership.",
  "reviews": [{"reviewer":"Alex Kim","action":"approve","note":"Clean design. 3 sprints is realistic.","at":"2024-09-07T14:00:00Z"}],
  "comments": [{"author":"Sam Park","body":"Reviewed state machine diagram — edge cases look handled","at":"2024-09-06T16:00:00Z"},{"author":"Lena Vu","body":"Added fallback if AI decompose fails","at":"2024-09-07T09:30:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000006';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Tom Reyes",
  "executed_by_role": "Marketing",
  "assigned_by": "Jane Smith",
  "completed_at": "2024-08-17T17:00:00Z",
  "department": "Marketing",
  "task_description": "Build the Q3 GTM playbook: content, paid, partnerships and community channels with 90-day success metrics.",
  "reviews": [{"reviewer":"Jane Smith","action":"return","note":"Need to add partnership names, not just 3 integration partners generically","at":"2024-08-16T10:00:00Z"},{"reviewer":"Jane Smith","action":"approve","note":"Perfect, ship it","at":"2024-08-17T16:30:00Z"}],
  "comments": [{"author":"Tom Reyes","body":"Named partners: Zapier, Slack, Notion. Added co-marketing budget line.","at":"2024-08-17T12:00:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000007';

UPDATE kb_documents SET metadata = '{
  "executed_by": "Ana Silva",
  "executed_by_role": "Marketing",
  "assigned_by": "Jane Smith",
  "completed_at": "2024-09-08T16:00:00Z",
  "department": "Marketing",
  "task_description": "Write final approved copy and design specs for the product landing page. Coordinate with Design on Figma handoff.",
  "reviews": [{"reviewer":"Olga White","action":"approve","note":"Love the hero copy. Green light.","at":"2024-09-08T18:00:00Z"}],
  "comments": [{"author":"Mia Cole","body":"3 customer quotes approved by REGAGRO, TechNova and Meridian","at":"2024-09-07T15:00:00Z"},{"author":"Ana Silva","body":"Figma file shared with Dev team for implementation","at":"2024-09-08T14:00:00Z"}]
}' WHERE id = 'b0000000-0000-0000-0000-000000000008';
