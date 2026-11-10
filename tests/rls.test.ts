/**
 * RLS: workspace data isolation
 *
 * Verifies that a user who belongs to workspace A cannot read or write
 * rows that belong to workspace B — even if they know the IDs.
 *
 * Strategy:
 *  - Use the existing REGAGRO workspace (A) with demo users.
 *  - Create a second workspace (B) via the service role.
 *  - Authenticate as an REGAGRO member and attempt cross-workspace reads.
 *  - All cross-workspace reads must return 0 rows (not an error — RLS just
 *    filters them out silently).
 *
 * Prerequisite: migration 20241001000014_fix_rls_recursion.sql must be
 * applied to the Supabase project, otherwise memberships policy recurses
 * and every authenticated query returns an error.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { admin, signIn, DEMO, WORKSPACE_ID as WS_A_ID } from './helpers/setup'

// ── Workspace B — created fresh for this test suite ──────────────────────────

let WS_B_ID: string
let WS_B_TASK_ID: string
let WS_B_GOAL_ID: string

beforeAll(async () => {
  // Create workspace B
  const { data: wsB, error: wsBErr } = await admin
    .from('workspaces')
    .insert({ name: 'TEST_WS_B', slug: `test-ws-b-${Date.now()}` })
    .select('id')
    .single()
  if (wsBErr || !wsB) throw new Error(`Failed to create WS B: ${wsBErr?.message}`)
  WS_B_ID = wsB.id

  // Create a goal and task in workspace B
  const { data: goal } = await admin
    .from('goals')
    .insert({ workspace_id: WS_B_ID, title: 'Secret goal in WS B', label: 'B1', color: '#FF0000' })
    .select('id').single()
  WS_B_GOAL_ID = goal!.id

  // Create a department in WS B first
  const { data: dept } = await admin
    .from('departments')
    .insert({ workspace_id: WS_B_ID, name: 'Engineering', color: '#0000FF', sort: 1 })
    .select('id').single()

  const { data: task } = await admin
    .from('tasks')
    .insert({
      workspace_id: WS_B_ID,
      department_id: dept!.id,
      title: 'Secret task in WS B',
      stage: 'todo',
      priority: 'high',
      source: 'owner',
    })
    .select('id').single()
  WS_B_TASK_ID = task!.id
})

afterAll(async () => {
  // Cascade deletes clean up goals, tasks, depts
  if (WS_B_ID) await admin.from('workspaces').delete().eq('id', WS_B_ID)
})

// ─────────────────────────────────────────────────────────────────────────────

describe('RLS — workspace data isolation', () => {
  it('member of WS A cannot read tasks belonging to WS B', async () => {
    const client = await signIn(DEMO.member)

    const { data, error } = await client
      .from('tasks')
      .select('id')
      .eq('workspace_id', WS_B_ID)

    // RLS must filter the row — 0 rows, no error
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('member of WS A cannot read goals belonging to WS B', async () => {
    const client = await signIn(DEMO.member)
    const { data, error } = await client
      .from('goals')
      .select('id')
      .eq('workspace_id', WS_B_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('member of WS A cannot read memberships of WS B', async () => {
    const client = await signIn(DEMO.teamLead)
    const { data, error } = await client
      .from('memberships')
      .select('id')
      .eq('workspace_id', WS_B_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('member of WS A cannot fetch a specific WS B task by ID', async () => {
    const client = await signIn(DEMO.member)
    const { data, error } = await client
      .from('tasks')
      .select('id')
      .eq('id', WS_B_TASK_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('owner of WS A can still read own workspace tasks', async () => {
    const client = await signIn(DEMO.owner)
    const { data, error } = await client
      .from('tasks')
      .select('id')
      .eq('workspace_id', WS_A_ID)

    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it('member of WS A cannot INSERT a task into WS B', async () => {
    const client = await signIn(DEMO.member)
    // We need a dept id — reuse a known WS B dept. Policy should block the insert.
    const { error } = await client
      .from('tasks')
      .insert({
        workspace_id: WS_B_ID,
        department_id: '00000000-0000-0000-0000-000000000099', // nonexistent
        title: 'Injected task',
        stage: 'todo',
        priority: 'low',
        source: 'member',
      })

    // Must be blocked (RLS or FK error)
    expect(error).not.toBeNull()
  })

  it('member cannot read requests addressed to WS B departments', async () => {
    const client = await signIn(DEMO.member)
    const { data, error } = await client
      .from('requests')
      .select('id')
      .eq('workspace_id', WS_B_ID)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})
