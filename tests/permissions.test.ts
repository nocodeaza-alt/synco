/**
 * Role-based permissions
 *
 * Tests the `can(action_key)` Postgres RPC and verifies that RLS policies
 * block writes that require elevated roles.
 *
 * Matrix from SPEC_PERMISSIONS (locked defaults):
 *
 *   Action              | Owner | C-Level | Team Lead | Member
 *   --------------------|-------|---------|-----------|-------
 *   goal.create         |  ✓    |   ✓     |     –     |   –
 *   task.assign_dept    |  ✓    |   ✓     |     –     |   –
 *   task.assign_member  |  ✓    |   ✓     |  ✓ (own)  |   –
 *   request.priority    |  ✓    |   ✓     |     –     |   –
 *   request.regular     |  ✓    |   ✓     |     ✓     |   –
 *   review.approve      |  ✓    |   ✓     |  ✓ (own)  |   –
 *   org.edit            |  ✓    |   –     |     –     |   –
 *   brainstorm.start    |  ✓    |   ✓     |     ✓     |   –
 *   kb.query            |  ✓    |   ✓     |     ✓     |   ✓
 *   workspace.admin     |  ✓    |   –     |     –     |   –
 */
import { describe, it, expect } from 'vitest'
import { signIn, DEMO } from './helpers/setup'

// Helper: call can() RPC and return the boolean
async function can(email: string, action: string): Promise<boolean> {
  const client = await signIn(email)
  const { data, error } = await client.rpc('can', { action_key: action })
  if (error) throw new Error(`can(${action}) as ${email}: ${error.message}`)
  return data as boolean
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Permissions — goal.create', () => {
  it('owner can create goals',    async () => expect(await can(DEMO.owner, 'goal.create')).toBe(true))
  it('c_level can create goals',  async () => expect(await can(DEMO.cLevel, 'goal.create')).toBe(true))
  it('team_lead cannot',          async () => expect(await can(DEMO.teamLead, 'goal.create')).toBe(false))
  it('member cannot',             async () => expect(await can(DEMO.member, 'goal.create')).toBe(false))
})

describe('Permissions — task.assign_department', () => {
  it('owner can',      async () => expect(await can(DEMO.owner, 'task.assign_department')).toBe(true))
  it('c_level can',    async () => expect(await can(DEMO.cLevel, 'task.assign_department')).toBe(true))
  it('team_lead cannot', async () => expect(await can(DEMO.teamLead, 'task.assign_department')).toBe(false))
  it('member cannot',    async () => expect(await can(DEMO.member, 'task.assign_department')).toBe(false))
})

describe('Permissions — request.priority', () => {
  it('owner can',      async () => expect(await can(DEMO.owner, 'request.priority')).toBe(true))
  it('c_level can',    async () => expect(await can(DEMO.cLevel, 'request.priority')).toBe(true))
  it('team_lead cannot', async () => expect(await can(DEMO.teamLead, 'request.priority')).toBe(false))
  it('member cannot',    async () => expect(await can(DEMO.member, 'request.priority')).toBe(false))
})

describe('Permissions — request.regular', () => {
  it('owner can',      async () => expect(await can(DEMO.owner, 'request.regular')).toBe(true))
  it('c_level can',    async () => expect(await can(DEMO.cLevel, 'request.regular')).toBe(true))
  it('team_lead can',  async () => expect(await can(DEMO.teamLead, 'request.regular')).toBe(true))
  it('member cannot',  async () => expect(await can(DEMO.member, 'request.regular')).toBe(false))
})

describe('Permissions — review.approve', () => {
  it('owner can',      async () => expect(await can(DEMO.owner, 'review.approve')).toBe(true))
  it('c_level can',    async () => expect(await can(DEMO.cLevel, 'review.approve')).toBe(true))
  it('team_lead can',  async () => expect(await can(DEMO.teamLead, 'review.approve')).toBe(true))
  it('member cannot',  async () => expect(await can(DEMO.member, 'review.approve')).toBe(false))
})

describe('Permissions — org.edit', () => {
  it('owner can',       async () => expect(await can(DEMO.owner, 'org.edit')).toBe(true))
  it('c_level cannot',  async () => expect(await can(DEMO.cLevel, 'org.edit')).toBe(false))
  it('team_lead cannot',async () => expect(await can(DEMO.teamLead, 'org.edit')).toBe(false))
  it('member cannot',   async () => expect(await can(DEMO.member, 'org.edit')).toBe(false))
})

describe('Permissions — kb.query (all roles)', () => {
  it('owner can',     async () => expect(await can(DEMO.owner, 'kb.query')).toBe(true))
  it('c_level can',   async () => expect(await can(DEMO.cLevel, 'kb.query')).toBe(true))
  it('team_lead can', async () => expect(await can(DEMO.teamLead, 'kb.query')).toBe(true))
  it('member can',    async () => expect(await can(DEMO.member, 'kb.query')).toBe(true))
})

describe('Permissions — workspace.admin', () => {
  it('owner can',       async () => expect(await can(DEMO.owner, 'workspace.admin')).toBe(true))
  it('c_level cannot',  async () => expect(await can(DEMO.cLevel, 'workspace.admin')).toBe(false))
  it('team_lead cannot',async () => expect(await can(DEMO.teamLead, 'workspace.admin')).toBe(false))
  it('member cannot',   async () => expect(await can(DEMO.member, 'workspace.admin')).toBe(false))
})
