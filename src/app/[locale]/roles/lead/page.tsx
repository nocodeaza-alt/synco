export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { TeamLeadClient } from '@/components/roles/TeamLeadClient'
import type { TLTask, TLMember, TLRequest, TLGoalPiece } from '@/components/roles/TeamLeadClient'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export default async function TeamLeadPage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createServiceClient()

    const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single()
    if (!ws) throw new Error('No workspace')
    const wid = ws.id

    const [goalsR, tasksR, deptsR, membersR, requestsR] = await Promise.all([
      supabase.from('goals').select('id, label, title, color').eq('workspace_id', wid),
      supabase.from('tasks').select('id, title, stage, priority, source, deadline, goal_id, department_id, assigned_to, assigned_by, task_results(id, kind, url, file_name)').eq('workspace_id', wid),
      supabase.from('departments').select('id, name, color, lead_membership_id').eq('workspace_id', wid),
      supabase.from('memberships').select('id, user_id, role, department_id, open_load, capacity, battery_pct, efficiency_pct').eq('workspace_id', wid).eq('status', 'active'),
      supabase.from('requests').select('id, from_membership_id, to_department_id, title, is_priority, status, created_at, sender:memberships!from_membership_id(user_id, profiles(full_name))').eq('workspace_id', wid).order('created_at', { ascending: false }),
    ])

    const goals = goalsR.data ?? []
    const tasks = tasksR.data ?? []
    const depts = deptsR.data ?? []
    const members = membersR.data ?? []
    const requests = requestsR.data ?? []

    // profiles
    const uids = [...new Set([...members.map((m: { user_id: string }) => m.user_id), ...tasks.flatMap((t: { assigned_to: string | null; assigned_by: string | null }) => [t.assigned_to, t.assigned_by]).filter(Boolean) as string[]])]
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', uids.length ? uids : ['00000000-0000-0000-0000-000000000000'])
    const pmap = new Map<string, string>((profiles ?? []).filter((p: { user_id: string | null }) => p.user_id).map((p: { user_id: string; full_name: string | null }) => [p.user_id, p.full_name ?? 'Unknown']))

    // find Jane Smith (first team_lead)
    const janeMember = members.find((m: { role: string }) => m.role === 'team_lead')
    const janeDeptId = janeMember?.department_id
    const janeDept = (depts.find((d: { id: string }) => d.id === janeDeptId) ?? depts[0]) as { id: string; name: string; color: string; lead_membership_id: string | null } | undefined
    const janeUserId = janeMember?.user_id as string | undefined
    const janeName: string = janeUserId ? (pmap.get(janeUserId) ?? 'Team Lead') : 'Team Lead'

    // dept members
    const deptMembers = members.filter((m: { department_id: string | null }) => m.department_id === janeDept?.id)

    // tasks in this dept
    const deptTasks = tasks.filter((t: { department_id: string }) => t.department_id === janeDept?.id)

    // review queue: in_review tasks in this dept
    const reviewQueue: TLTask[] = deptTasks
      .filter((t: { stage: string }) => t.stage === 'in_review')
      .map((t: { id: string; title: string; stage: string; priority: string; goal_id: string | null; deadline: string | null; assigned_to: string | null; task_results?: { id: string; kind: string; url: string; file_name: string | null }[] }) => {
        const goal = goals.find((g: { id: string }) => g.id === t.goal_id)
        const assigneeName = t.assigned_to ? (pmap.get(t.assigned_to) ?? 'Unknown') : 'Unknown'
        return {
          id: t.id, title: t.title, stage: t.stage, priority: t.priority,
          goal_label: goal?.label ?? '', goal_color: goal?.color ?? '#5B4FE8',
          assignee_name: assigneeName, deadline: t.deadline,
          results: (t.task_results ?? []).map(r => ({ id: r.id, kind: r.kind, url: r.url, file_name: r.file_name })),
        }
      })

    // incoming requests to Jane's dept
    const incomingReqs: TLRequest[] = requests
      .filter((r: { to_department_id: string }) => r.to_department_id === janeDept?.id)
      .slice(0, 6)
      .map((r: { id: string; title: string; from_membership_id: string; is_priority: boolean; status: string; created_at: string; sender?: { user_id: string; profiles?: { full_name: string | null } | null } | null }) => {
        const fromName = r.sender?.profiles?.full_name
          ?? (r.sender?.user_id ? (pmap.get(r.sender.user_id) ?? '') : '')
          ?? ''
        return { id: r.id, title: r.title, from_name: fromName, is_priority: r.is_priority, status: r.status, when: r.created_at.slice(0, 10) }
      })

    // team members with stats
    const teamRows: TLMember[] = deptMembers.map((m: { id: string; user_id: string; role: string; open_load: number; capacity: number; battery_pct: number; efficiency_pct: number }) => {
      const name = pmap.get(m.user_id) ?? 'Unknown'
      const myTasks = deptTasks.filter((t: { assigned_to: string | null }) => t.assigned_to === m.user_id)
      const activeTasks = myTasks.filter((t: { stage: string }) => t.stage !== 'done')
      const latestStage = activeTasks[0]?.stage ?? 'assigned'
      return {
        id: m.id, user_id: m.user_id, name, role: m.role,
        battery_pct: m.battery_pct ?? 70, efficiency_pct: m.efficiency_pct ?? 85,
        open_load: m.open_load ?? 0, capacity: m.capacity ?? 5,
        task_count: activeTasks.length, stage: latestStage,
      }
    })

    // Jane's own tasks
    const myTasks: TLTask[] = tasks
      .filter((t: { assigned_to: string | null }) => t.assigned_to === janeUserId)
      .slice(0, 5)
      .map((t: { id: string; title: string; stage: string; priority: string; goal_id: string | null; deadline: string | null }) => {
        const goal = goals.find((g: { id: string }) => g.id === t.goal_id)
        return { id: t.id, title: t.title, stage: t.stage, priority: t.priority, goal_label: goal?.label ?? '', goal_color: goal?.color ?? '#5B4FE8', assignee_name: janeName, deadline: t.deadline, results: [] }
      })

    // goal pieces for Jane's dept
    const goalPieces: TLGoalPiece[] = goals.map((g: { id: string; label: string; color: string }) => {
      const gTasks = deptTasks.filter((t: { goal_id: string | null }) => t.goal_id === g.id)
      const done = gTasks.filter((t: { stage: string }) => t.stage === 'done').length
      return { goal_label: g.label, goal_color: g.color, done, total: gTasks.length, pct: gTasks.length ? Math.round((done / gTasks.length) * 100) : 0 }
    }).filter((g: TLGoalPiece) => g.total > 0)

    // unread count
    const { count: unread } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', wid)
      .eq('user_id', janeUserId ?? '00000000-0000-0000-0000-000000000003')
      .eq('read', false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar locale="en" role="team_lead" userName={janeName} unreadCount={unread ?? 0} />
        <TeamLeadClient
          reviewQueue={reviewQueue}
          requests={incomingReqs}
          team={teamRows}
          myTasks={myTasks}
          goalPieces={goalPieces}
          deptName={janeDept?.name ?? 'Marketing'}
          leadName={janeName}
          workspaceId={wid}
        />
        <LanguageSwitch />
      </div>
    )
  } catch (err) {
    console.error('[TeamLeadPage]', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load Team Lead dashboard.</p>
      </div>
    )
  }
}
