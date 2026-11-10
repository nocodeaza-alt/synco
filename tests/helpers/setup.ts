/**
 * Shared test helpers.
 * All helpers read env from .env.local via process.env (loaded by vitest.config.ts).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Service-role client — bypasses ALL RLS. Use for test fixture setup only. */
export const admin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Sign in as a demo user and return an authenticated client. */
export async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON)
  const { error } = await client.auth.signInWithPassword({ email, password: 'demo1234' })
  if (error) throw new Error(`signIn(${email}) failed: ${error.message}`)
  return client
}

/** Known demo emails mapped to roles. */
export const DEMO = {
  owner:    'olga@synco.com',
  cLevel:   'vera@synco.com',
  teamLead: 'jane@synco.com',
  member:   'tom@synco.com',
} as const

/** REGAGRO workspace ID (from seed). */
export const WORKSPACE_ID = '20000000-0000-0000-0000-000000000001'

/** Create a minimal task owned by the REGAGRO workspace (using service role).
 *  Returns the task id. The caller is responsible for cleanup. */
export async function createTestTask(opts: {
  departmentId: string
  assignedTo?: string | null
  stage?: string
  source?: string
}): Promise<string> {
  const { data, error } = await admin.from('tasks').insert({
    workspace_id: WORKSPACE_ID,
    department_id: opts.departmentId,
    title: `TEST_TASK_${Date.now()}`,
    stage: opts.stage ?? 'todo',
    priority: 'medium',
    source: opts.source ?? 'owner',
    assigned_to: opts.assignedTo ?? null,
  }).select('id').single()
  if (error || !data) throw new Error(`createTestTask: ${error?.message}`)
  return data.id
}

/** Add a result to a task (needed before submitting for review). */
export async function addTestResult(taskId: string): Promise<void> {
  const { error } = await admin.from('task_results').insert({
    task_id: taskId,
    kind: 'link',
    url: 'https://example.com/result',
    file_name: 'test-result',
  })
  if (error) throw new Error(`addTestResult: ${error.message}`)
}

/** Delete test tasks whose title starts with TEST_TASK_. */
export async function cleanTestTasks(): Promise<void> {
  await admin.from('tasks').delete().like('title', 'TEST_TASK_%')
}

/** Fetch a task row (service role). */
export async function getTask(id: string) {
  const { data } = await admin.from('tasks').select('*').eq('id', id).single()
  return data
}

/** Marketing dept id from seed. */
export const MARKETING_DEPT_ID  = '30000000-0000-0000-0000-000000000001'
/** Development dept id from seed. */
export const DEVELOPMENT_DEPT_ID = '30000000-0000-0000-0000-000000000002'

/** Tom Reyes user_id (member, Marketing). */
export const TOM_USER_ID = 'b371900a-2a8e-4cf3-ba4d-85f425f4c495'
/** Jane Smith user_id (team_lead, Marketing). */
export const JANE_USER_ID = '5218e949-2fa9-445e-a72d-61f3c345e616'
/** Olga White user_id (owner). */
export const OLGA_USER_ID = '93d289b6-113a-4992-905e-c380ebc947fd'
/** Vera Kova user_id (c_level). */
export const VERA_USER_ID = '595bb22e-5341-40b6-9cb8-0b0584b7a626'
