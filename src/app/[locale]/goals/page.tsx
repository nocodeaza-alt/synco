export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { GoalsClient } from '@/components/goals/GoalsClient'
import type { TaskRow, MemberRow } from '@/types/app'
import { initialsFor } from '@/lib/utils/avatar'

type GoalRow = {
  id: string
  label: string
  color: string
  title: string
  target_date: string | null
  tasks: TaskRow[]
}

type DeptInfo = { id: string; name: string; color: string }

export default async function GoalsPage() {
  try {
    const supabase = await createServiceClient()

    const { data: workspaceData } = await supabase
      .from('workspaces')
      .select('*')
      .limit(1)
      .single()

    const workspace = workspaceData as { id: string; name: string; task_capacity: number } | null

    if (!workspace) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p style={{ color: '#6B7385' }}>No workspace found.</p>
        </div>
      )
    }

    const workspaceId = workspace.id

    const [goalsResult, tasksResult, deptsResult, membershipsResult] = await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at'),
      supabase
        .from('tasks')
        .select('*, goals(label, color), departments(name, color), task_results(*), task_comments(*)')
        .eq('workspace_id', workspaceId)
        .order('sort'),
      supabase
        .from('departments')
        .select('id, name, color')
        .eq('workspace_id', workspaceId)
        .order('sort'),
      supabase
        .from('memberships')
        .select('id, user_id, role, department_id, position, status')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active'),
    ])

    const goals = (goalsResult.data ?? []) as Array<{
      id: string; label: string; color: string; title: string; target_date: string | null; created_at: string
    }>
    const rawTasks = (tasksResult.data ?? []) as Array<{
      id: string; title: string; description: string | null; stage: string; priority: string; source: string
      tag?: string | null; started_at?: string | null; ready_at?: string | null; deadline: string | null
      goal_id: string | null; department_id: string; assigned_to: string | null; assigned_by: string | null
      goals: unknown; departments: unknown; task_results: unknown[]; task_comments: unknown[]; updated_at: string
    }>
    const departments = (deptsResult.data ?? []) as DeptInfo[]
    const memberships = (membershipsResult.data ?? []) as Array<{
      id: string; user_id: string; role: string; department_id: string | null; position: string | null; status: string
    }>

    // Profiles
    const userIds = [...new Set([
      ...memberships.map(m => m.user_id),
      ...rawTasks.flatMap(t => [t.assigned_to, t.assigned_by].filter((x): x is string => x != null)),
    ])]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])
    const profiles = (profilesData ?? []) as Array<{ user_id: string | null; full_name: string | null }>
    const profileMap = new Map(profiles.filter(p => p.user_id).map(p => [p.user_id!, p.full_name ?? 'Unknown']))
    const deptMap = new Map(departments.map(d => [d.id, d]))

    // Build task rows
    type RawResult = { id: string; kind: string; url: string; file_name: string | null }
    type RawComment = { id: string; author_id: string; body: string; created_at: string }

    const taskRows: TaskRow[] = rawTasks.map(t => {
      const assigneeName = t.assigned_to ? (profileMap.get(t.assigned_to) ?? null) : null
      const assignerName = t.assigned_by ? (profileMap.get(t.assigned_by) ?? null) : null
      const goal = t.goals as { label: string; color: string } | null
      const dept = t.departments as { name: string; color: string } | null
      return {
        id: t.id, title: t.title, description: t.description,
        stage: t.stage, priority: t.priority, source: t.source,
        tag: t.tag ?? null, deadline: t.deadline,
        started_at: t.started_at ?? null, ready_at: t.ready_at ?? null,
        goal_id: t.goal_id,
        goal_label: goal?.label ?? null, goal_color: goal?.color ?? null,
        department_id: t.department_id,
        department_name: dept?.name ?? '',
        department_color: dept?.color ?? '#5B4FE8',
        assigned_to: t.assigned_to,
        assignee_name: assigneeName,
        assignee_initials: assigneeName ? initialsFor(assigneeName) : null,
        assigned_by: t.assigned_by,
        assigner_name: assignerName,
        results: ((t.task_results ?? []) as RawResult[]).map(r => ({ id: r.id, kind: r.kind, url: r.url, file_name: r.file_name })),
        comments: ((t.task_comments ?? []) as RawComment[]).map(c => ({
          id: c.id, author_name: profileMap.get(c.author_id) ?? 'Unknown', body: c.body, created_at: c.created_at,
        })),
      }
    })

    // Build goal rows
    const goalRows: GoalRow[] = goals.map(g => ({
      id: g.id,
      label: g.label,
      color: g.color,
      title: g.title,
      target_date: g.target_date,
      tasks: taskRows.filter(t => t.goal_id === g.id),
    }))

    const CAPACITY = workspace.task_capacity ?? 5
    const memberRows: MemberRow[] = memberships.map(m => {
      const name = profileMap.get(m.user_id) ?? 'Unknown'
      const dept = m.department_id ? deptMap.get(m.department_id) : null
      const openLoad = taskRows.filter(t => t.assigned_to === m.user_id && ['todo', 'in_progress', 'needs_revision'].includes(t.stage)).length
      const batteryPct = Math.round(Math.max(0, (CAPACITY - openLoad) / CAPACITY) * 100)
      return {
        membership_id: m.id, user_id: m.user_id, name,
        initials: initialsFor(name), role: m.role,
        department_id: m.department_id, department_name: dept?.name ?? null,
        open_load: openLoad, capacity: CAPACITY,
        battery_pct: batteryPct, efficiency_pct: 85,
      }
    })

    return (
      <GoalsClient
        goals={goalRows}
        departments={departments}
        members={memberRows}
        workspaceId={workspaceId}
      />
    )
  } catch (err) {
    console.error('[GoalsPage] error:', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load Goals. Check server logs.</p>
      </div>
    )
  }
}
