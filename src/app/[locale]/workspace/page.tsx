export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { WorkspaceClient } from '@/components/workspace/WorkspaceClient'
import type { TaskRow, MemberRow } from '@/types/app'
import type { Database } from '@/lib/supabase/types'
import { initialsFor } from '@/lib/utils/avatar'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

type MembershipPartial = { id: string; user_id: string; role: string; department_id: string | null; position: string | null; status: string }
type TaskPartial = {
  id: string; title: string; description: string | null; stage: string; priority: string; source: string
  tag?: string | null; started_at?: string | null; ready_at?: string | null; deadline: string | null
  goal_id: string | null; department_id: string; assigned_to: string | null; assigned_by: string | null
  goals: unknown; departments: unknown; task_results: unknown[]; task_comments: unknown[]; updated_at: string
}
type DeptPartial = { id: string; name: string; color: string }
type ProfilePartial = { user_id: string | null; full_name: string | null }

export default async function WorkspacePage() {
  const supabase = await createServiceClient()

  const workspaceResult = await supabase
    .from('workspaces')
    .select('*')
    .limit(1)
    .single()

  const workspace = workspaceResult.data as WorkspaceRow | null

  if (!workspace) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#6B7385' }}>No workspace found.</p>
      </div>
    )
  }

  const workspaceId = workspace.id

  const membershipsResult = await supabase
    .from('memberships')
    .select('id, user_id, role, department_id, position, status')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
  const memberships = (membershipsResult.data ?? []) as MembershipPartial[]

  const rawTasksResult = await supabase
    .from('tasks')
    .select('*, goals(label, color), departments(name, color), task_results(*), task_comments(*)')
    .eq('workspace_id', workspaceId)
    .order('sort')
  const rawTasks = (rawTasksResult.data ?? []) as TaskPartial[]

  const deptsResult = await supabase
    .from('departments')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)
  const departments = (deptsResult.data ?? []) as DeptPartial[]

  const deptMap = new Map(departments.map((d) => [d.id, d]))

  const userIds = [
    ...new Set([
      ...memberships.map((m) => m.user_id),
      ...rawTasks.flatMap((t) => [t.assigned_to, t.assigned_by].filter((x): x is string => x != null)),
    ]),
  ]

  const profilesResult = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])
  const profiles = (profilesResult.data ?? []) as ProfilePartial[]

  const profileMap = new Map(profiles.filter((p) => p.user_id).map((p) => [p.user_id!, p.full_name ?? 'Unknown']))

  type RawResult = { id: string; kind: string; url: string; file_name: string | null }
  type RawComment = { id: string; author_id: string; body: string; created_at: string }

  const taskRows: TaskRow[] = rawTasks.map((t) => {
    const assigneeName = t.assigned_to ? (profileMap.get(t.assigned_to) ?? null) : null
    const assignerName = t.assigned_by ? (profileMap.get(t.assigned_by) ?? null) : null
    const goal = t.goals as { label: string; color: string } | null
    const dept = t.departments as { name: string; color: string } | null
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      stage: t.stage,
      priority: t.priority,
      source: t.source,
      tag: t.tag ?? null,
      deadline: t.deadline,
      started_at: t.started_at ?? null,
      ready_at: t.ready_at ?? null,
      goal_id: t.goal_id,
      goal_label: goal?.label ?? null,
      goal_color: goal?.color ?? null,
      department_id: t.department_id,
      department_name: dept?.name ?? '',
      department_color: dept?.color ?? '#5B4FE8',
      assigned_to: t.assigned_to,
      assignee_name: assigneeName,
      assignee_initials: assigneeName ? initialsFor(assigneeName) : null,
      assigned_by: t.assigned_by,
      assigner_name: assignerName,
      results: ((t.task_results ?? []) as RawResult[]).map((r) => ({
        id: r.id,
        kind: r.kind,
        url: r.url,
        file_name: r.file_name,
      })),
      comments: ((t.task_comments ?? []) as RawComment[]).map((c) => ({
        id: c.id,
        author_name: profileMap.get(c.author_id) ?? 'Unknown',
        body: c.body,
        created_at: c.created_at,
      })),
    }
  })

  const CAPACITY = workspace.task_capacity ?? 5
  const workspaceName = workspace.name

  const memberRows: MemberRow[] = memberships.map((m) => {
    const name = profileMap.get(m.user_id) ?? 'Unknown'
    const dept = m.department_id ? deptMap.get(m.department_id) : null
    const openLoad = taskRows.filter(
      (t) =>
        t.assigned_to === m.user_id &&
        ['todo', 'in_progress', 'needs_revision'].includes(t.stage)
    ).length
    const batteryPct = Math.round(Math.max(0, (CAPACITY - openLoad) / CAPACITY) * 100)

    const now = new Date()
    const cutoff = new Date(now.getTime() - 14 * 24 * 3600000)
    const done14 = taskRows.filter(
      (t) =>
        t.assigned_to === m.user_id &&
        t.stage === 'done' &&
        new Date(t.deadline ?? '').getTime() > cutoff.getTime()
    )
    const onTime = done14.filter((t) => !t.deadline || t.deadline >= '')
    const onTimeRate = done14.length > 0 ? onTime.length / done14.length : 1
    const effPct = Math.round(100 * (0.6 * onTimeRate + 0.4 * 1))

    return {
      membership_id: m.id,
      user_id: m.user_id,
      name,
      initials: initialsFor(name),
      role: m.role,
      department_id: m.department_id,
      department_name: dept?.name ?? null,
      open_load: openLoad,
      capacity: CAPACITY,
      battery_pct: batteryPct,
      efficiency_pct: effPct,
    }
  })

  return (
    <WorkspaceClient
      members={memberRows}
      tasks={taskRows}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
    />
  )
}
