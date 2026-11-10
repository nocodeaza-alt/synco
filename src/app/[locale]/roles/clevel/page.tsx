export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { CLevelClient } from '@/components/roles/CLevelClient'
import type { GoalStat, DeptStat, ReviewItem, PriorityReq } from '@/components/roles/CLevelClient'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'


export default async function CLevelPage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createServiceClient()

    const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single()
    if (!ws) throw new Error('No workspace')
    const wid = ws.id

    const [goalsR, tasksR, deptsR, membersR, requestsR] = await Promise.all([
      supabase.from('goals').select('id, label, title, color, deadline, status').eq('workspace_id', wid),
      supabase.from('tasks').select('id, title, stage, source, deadline, goal_id, department_id, assigned_to, assigned_by').eq('workspace_id', wid),
      supabase.from('departments').select('id, name, color, lead_membership_id').eq('workspace_id', wid),
      supabase.from('memberships').select('id, user_id, role, department_id, open_load, capacity, battery_pct, efficiency_pct').eq('workspace_id', wid).eq('status', 'active'),
      supabase.from('requests').select('id, from_membership_id, to_department_id, title, is_priority, status, created_at').eq('workspace_id', wid).order('created_at', { ascending: false }),
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

    // find Vera Kova membership
    const veraMember = members.find((m: { role: string }) => m.role === 'c_level')

    // --- GoalStat ---
    const deptIds = depts.map((d: { id: string }) => d.id)
    // determine dept indexes for coloring (mkt=0,dev=1,sales=2 by sort order)
    const deptColorMap: Record<string, 'marketing' | 'dev' | 'sales'> = {}
    depts.forEach((d: { id: string }, i: number) => {
      if (i === 0) deptColorMap[d.id] = 'marketing'
      else if (i === 1) deptColorMap[d.id] = 'dev'
      else deptColorMap[d.id] = 'sales'
    })

    const goalStats: GoalStat[] = goals.map((g: { id: string; label: string; title: string; color: string; deadline: string | null; status: string | null }) => {
      const gTasks = tasks.filter((t: { goal_id: string | null }) => t.goal_id === g.id)
      const total = gTasks.length || 1
      const done = gTasks.filter((t: { stage: string }) => t.stage === 'done').length
      const pct = Math.round((done / total) * 100)

      const byDept = (key: 'marketing' | 'dev' | 'sales') => {
        const deptId = deptIds[key === 'marketing' ? 0 : key === 'dev' ? 1 : 2]
        if (!deptId) return 0
        const dTasks = gTasks.filter((t: { department_id: string }) => t.department_id === deptId)
        if (!dTasks.length) return 0
        return Math.round((dTasks.filter((t: { stage: string }) => t.stage === 'done').length / total) * 100)
      }

      const doneCount = gTasks.filter((t: { stage: string }) => t.stage === 'done').length
      const totalForMeta = gTasks.length
      const remaining = totalForMeta - doneCount
      const status: 'On track' | 'At risk' = (pct >= 50 || totalForMeta === 0) ? 'On track' : 'At risk'

      return {
        id: g.id,
        label: g.label,
        title: g.title,
        color: g.color,
        pct,
        marketing_pct: byDept('marketing'),
        dev_pct: byDept('dev'),
        sales_pct: byDept('sales'),
        status,
        meta: `${doneCount} pieces done · ${remaining} remaining${g.deadline ? ' · Due ' + g.deadline.slice(0, 10) : ''}`,
      }
    })

    // --- DeptStat ---
    const memberMap = new Map(members.map((m: { id: string }) => [m.id, m]))
    const deptStats: DeptStat[] = depts.map((d: { id: string; name: string; color: string; lead_membership_id: string | null }) => {
      const dMembers = members.filter((m: { department_id: string | null }) => m.department_id === d.id)
      const lead = d.lead_membership_id ? (memberMap.get(d.lead_membership_id) as { user_id: string } | undefined) : null
      const leadName = lead ? (pmap.get(lead.user_id) ?? 'Team Lead') : 'Team Lead'
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
      const eff = avg(dMembers.map((m: { efficiency_pct: number }) => m.efficiency_pct ?? 85))
      const bat = avg(dMembers.map((m: { battery_pct: number }) => m.battery_pct ?? 70))
      const openLoad = dMembers.reduce((s: number, m: { open_load: number }) => s + (m.open_load ?? 0), 0)
      const capacity = dMembers.reduce((s: number, m: { capacity: number }) => s + (m.capacity ?? 5), 0)
      const inReview = tasks.filter((t: { department_id: string; stage: string }) => t.department_id === d.id && (t.stage === 'in_review' || t.stage === 'final_review')).length

      return {
        id: d.id,
        name: d.name,
        color: d.color,
        lead_name: leadName,
        efficiency_pct: eff || 85,
        battery_pct: bat || 70,
        open_load: openLoad,
        capacity: capacity || dMembers.length * 5,
        in_review: inReview,
        status: openLoad >= capacity ? 'OVERLOAD' : 'ON TRACK',
      }
    })

    // --- ReviewItem (tasks in final_review) ---
    const reviewTasks = tasks.filter((t: { stage: string }) => t.stage === 'final_review')
    const reviewItems: ReviewItem[] = reviewTasks.slice(0, 5).map((t: { id: string; title: string; department_id: string; goal_id: string | null; deadline: string | null; assigned_to: string | null; assigned_by: string | null }) => {
      const dept = depts.find((d: { id: string }) => d.id === t.department_id)
      const goal = goals.find((g: { id: string }) => g.id === t.goal_id)
      const lead = dept?.lead_membership_id ? (memberMap.get(dept.lead_membership_id) as { user_id: string } | undefined) : null
      const leadName = lead ? (pmap.get(lead.user_id) ?? 'Team Lead') : 'Team Lead'
      const assigneeName = t.assigned_to ? (pmap.get(t.assigned_to) ?? 'Unknown') : 'Unknown'
      return {
        id: t.id,
        title: t.title,
        dept: dept?.name ?? '',
        goal_label: goal?.label ?? '',
        goal_color: goal?.color ?? '#5B4FE8',
        assignee_name: assigneeName,
        when: t.deadline ? t.deadline.slice(0, 10) : 'No deadline',
        file: 'strategy.pdf',
        lead_name: leadName,
      }
    })

    // --- PriorityReq (is_priority = true from Vera) ---
    const veraId = veraMember?.id
    const priorityReqs: PriorityReq[] = requests
      .filter((r: { is_priority: boolean }) => r.is_priority)
      .slice(0, 5)
      .map((r: { id: string; title: string; to_department_id: string; status: string; created_at: string }) => {
        const dept = depts.find((d: { id: string }) => d.id === r.to_department_id)
        return {
          id: r.id,
          title: r.title,
          to_dept: dept?.name ?? 'Team',
          dept_color: dept?.color ?? '#5B4FE8',
          status: r.status,
          when: r.created_at.slice(0, 10),
        }
      })

    // unread count for bell
    const { count: unread } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', wid)
      .eq('user_id', veraMember?.user_id ?? '00000000-0000-0000-0000-000000000002')
      .eq('read', false)

    void veraId

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar locale="en" role="c_level" userName="Vera Kova" unreadCount={unread ?? 0} />
        <CLevelClient
          goals={goalStats}
          departments={deptStats}
          reviewQueue={reviewItems}
          priorityRequests={priorityReqs}
          workspaceId={wid}
        />
        <LanguageSwitch />
      </div>
    )
  } catch (err) {
    console.error('[CLevelPage]', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load C-Level dashboard.</p>
      </div>
    )
  }
}
