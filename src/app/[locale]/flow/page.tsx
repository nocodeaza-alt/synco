export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { FlowClient } from '@/components/flow/FlowClient'
import type { DeptColumn, TaskRow, RequestRow } from '@/types/app'
import { initialsFor } from '@/lib/utils/avatar'

type TaskPartial = {
  id: string; title: string; description: string | null; stage: string; priority: string; source: string
  tag?: string | null; started_at?: string | null; ready_at?: string | null; deadline: string | null
  goal_id: string | null; department_id: string; assigned_to: string | null; assigned_by: string | null
  goals: unknown; departments: unknown; task_results: unknown[]; task_comments: unknown[]; updated_at: string
}
type DeptPartial = { id: string; name: string; color: string; lead_membership_id: string | null }
type MemberPartial = { id: string; user_id: string; role: string; department_id: string | null }
type ProfilePartial = { user_id: string | null; full_name: string | null }
type RequestPartial = {
  id: string; workspace_id: string; from_membership_id: string; to_department_id: string
  title: string; description: string | null; is_priority: boolean; status: string; decline_reason: string | null; created_at: string
}

export default async function FlowPage() {
  try {
    const supabase = await createServiceClient()

    const workspaceResult = await supabase
      .from('workspaces')
      .select('*')
      .limit(1)
      .single()

    const workspace = workspaceResult.data as { id: string; name: string } | null

    if (!workspace) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p style={{ color: '#6B7385' }}>No workspace found.</p>
        </div>
      )
    }

    const workspaceId = workspace.id

    const [deptsResult, tasksResult, membersResult, requestsResult] = await Promise.all([
      supabase
        .from('departments')
        .select('id, name, color, lead_membership_id')
        .eq('workspace_id', workspaceId)
        .order('sort'),
      supabase
        .from('tasks')
        .select('*, goals(label, color), departments(name, color), task_results(*), task_comments(*)')
        .eq('workspace_id', workspaceId)
        .order('sort'),
      supabase
        .from('memberships')
        .select('id, user_id, role, department_id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active'),
      supabase
        .from('requests')
        .select('id, workspace_id, from_membership_id, to_department_id, title, description, is_priority, status, decline_reason, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
    ])

    const departments = (deptsResult.data ?? []) as DeptPartial[]
    const rawTasks = (tasksResult.data ?? []) as TaskPartial[]
    const members = (membersResult.data ?? []) as MemberPartial[]
    const rawRequests = (requestsResult.data ?? []) as RequestPartial[]

    // Build profile map
    const userIds = [
      ...new Set([
        ...members.map((m) => m.user_id),
        ...rawTasks.flatMap((t) => [t.assigned_to, t.assigned_by].filter((x): x is string => x != null)),
      ]),
    ]
    const profilesResult = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])
    const profiles = (profilesResult.data ?? []) as ProfilePartial[]
    const profileMap = new Map(profiles.filter((p) => p.user_id).map((p) => [p.user_id!, p.full_name ?? 'Unknown']))

    // Build task rows
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
          id: r.id, kind: r.kind, url: r.url, file_name: r.file_name,
        })),
        comments: ((t.task_comments ?? []) as RawComment[]).map((c) => ({
          id: c.id,
          author_name: profileMap.get(c.author_id) ?? 'Unknown',
          body: c.body,
          created_at: c.created_at,
        })),
      }
    })

    // Build dept columns with reviewer
    const membershipMap = new Map(members.map((m) => [m.id, m]))
    const deptColumns: DeptColumn[] = departments.map((dept) => {
      const deptTasks = taskRows.filter((t) => t.department_id === dept.id)
      const lead = dept.lead_membership_id ? membershipMap.get(dept.lead_membership_id) : null
      const leadName = lead ? (profileMap.get(lead.user_id) ?? 'Team Lead') : null
      const reviewer = leadName
        ? {
            name: leadName,
            initials: initialsFor(leadName),
            role: lead?.role ?? 'team_lead',
            doc_count: deptTasks.filter((t) => t.stage === 'in_review' || t.stage === 'final_review').length,
          }
        : null
      return { id: dept.id, name: dept.name, color: dept.color, tasks: deptTasks, reviewer }
    })

    // Build dept map for request source resolution
    const deptMap = new Map(departments.map((d) => [d.id, d.name]))
    // membershipMap already built above
    const requests: RequestRow[] = rawRequests.map((r) => {
      const fromMember = membershipMap.get(r.from_membership_id)
      const fromName = fromMember ? (profileMap.get(fromMember.user_id) ?? null) : null
      const fromDeptId = fromMember?.department_id ?? null
      const fromDeptName = fromDeptId ? (deptMap.get(fromDeptId) ?? null) : null
      const toDeptName = deptMap.get(r.to_department_id) ?? null
      return {
        id: r.id,
        workspace_id: r.workspace_id,
        from_membership_id: r.from_membership_id,
        to_department_id: r.to_department_id,
        title: r.title,
        description: r.description,
        is_priority: r.is_priority,
        status: r.status,
        decline_reason: r.decline_reason,
        created_at: r.created_at,
        from_name: fromName,
        from_dept_name: fromDeptName,
        to_dept_name: toDeptName,
      }
    })

    return (
      <FlowClient
        deptColumns={deptColumns}
        requests={requests}
        workspaceId={workspaceId}
      />
    )
  } catch (err) {
    console.error('[FlowPage] error:', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load Work Flow. Check server logs.</p>
      </div>
    )
  }
}
