import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { buildDigestHtml, DigestTask, DigestRequest } from '@/lib/email/digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AC = any

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  const secret = process.env.DIGEST_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  // Test mode: ?to=email sends a sample digest to that address
  const testTo = new URL(req.url).searchParams.get('to')
  if (testTo) {
    const html = buildDigestHtml({
      userName: 'Azalia (test)',
      userEmail: testTo,
      workspaceName: 'REGAGRO',
      tasksInProgress: [
        { title: 'Build EMEA sales deck', stage: 'in_progress', priority: 'high', goal: 'G2 EMEA Expansion' },
        { title: 'API integration spec', stage: 'in_progress', priority: 'medium', goal: 'G1 Launch' },
      ],
      tasksAwaitingReview: [
        { title: 'Onboarding flow redesign', stage: 'review', priority: 'critical', goal: 'G3 Onboarding' },
      ],
      newRequests: [
        { title: 'Need design assets for campaign', from: 'Tom Reyes', type: 'resource' },
        { title: 'Approve Q4 budget allocation', from: 'Jane Smith', type: 'approval' },
      ],
      teamDigest: { totalDone: 7, totalInProgress: 12, pendingReviews: 3 },
    })
    const { error } = await resend.emails.send({
      from: 'SYNCO <onboarding@resend.dev>',
      to: testTo,
      subject: `[Test] Your daily digest — SYNCO`,
      html,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sent: 1, to: testTo })
  }
  // Use plain supabase-js client with service role for admin API access
  const svc: AC = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Load workspaces
  const { data: workspaces } = await svc.from('workspaces').select('id, name')
  if (!workspaces?.length) return NextResponse.json({ sent: 0 })

  let totalSent = 0
  const errors: string[] = []

  for (const ws of workspaces as { id: string; name: string }[]) {
    // Load all active members (no joins — schema cache issue with direct client)
    const { data: members, error: membErr } = await svc
      .from('memberships')
      .select('id, user_id, role, position, department_id')
      .eq('workspace_id', ws.id)
      .eq('status', 'active')
    if (membErr) console.log('[digest] memberships error:', membErr.message)

    if (!members?.length) continue

    // emails stored in profiles.email (synced from auth.users via trigger)
    const emailMap: Record<string, string> = {}
    const profileMap: Record<string, string> = {}

    // Fetch profiles (with email)
    const userIds = (members ?? []).map((m: AC) => m.user_id)
    const { data: profiles, error: profErr } = await svc
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
    if (profErr) console.log('[digest] profiles error:', profErr.message)
    if (profiles) {
      for (const p of profiles as { user_id: string; full_name: string; email?: string | null }[]) {
        profileMap[p.user_id] = p.full_name
        if (p.email) emailMap[p.user_id] = p.email
      }
    }

    // Load all tasks for this workspace (no goal join — schema cache)
    const { data: tasks } = await svc
      .from('tasks')
      .select('id, title, stage, priority, assigned_to, holder_membership_id, goal_id')
      .eq('workspace_id', ws.id)
      .neq('stage', 'done')

    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    // Load all pending requests
    const { data: requests } = await svc
      .from('requests')
      .select('id, title, type, created_by')
      .eq('workspace_id', ws.id)
      .eq('status', 'pending')
      .limit(10)

    // Team stats
    const { data: doneTasks } = await svc
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('workspace_id', ws.id)
      .eq('stage', 'done')
      .gte('updated_at', since)

    const doneCount = (doneTasks as unknown as { count?: number } | null)?.count ?? 0
    const inProgressCount = (tasks ?? []).filter((t: AC) => t.stage === 'in_progress').length
    const reviewCount = (tasks ?? []).filter((t: AC) => ['ready', 'review'].includes(t.stage)).length

    for (const member of members as AC[]) {
      const email = emailMap[member.user_id as string] ?? null
      const name = profileMap[member.user_id as string] ?? 'Team member'
      if (!email) continue

      const userId = member.user_id as string

      // Tasks in progress assigned to this user
      const myInProgress: DigestTask[] = (tasks ?? [])
        .filter((t: AC) => t.assigned_to === userId && t.stage === 'in_progress')
        .map((t: AC) => ({
          title: t.title,
          stage: t.stage,
          priority: t.priority ?? null,
          goal: null,
        }))

      // Tasks awaiting this user's review (holder)
      const myReviews: DigestTask[] = (tasks ?? [])
        .filter((t: AC) => t.holder_membership_id === member.id && ['ready', 'review'].includes(t.stage))
        .map((t: AC) => ({
          title: t.title,
          stage: t.stage,
          priority: t.priority ?? null,
          goal: null,
        }))

      // Requests (shown to leads + owners + clevel)
      const myRequests: DigestRequest[] =
        ['owner', 'clevel', 'lead'].includes(member.role)
          ? (requests ?? []).map((r: AC) => ({
              title: r.title,
              from: profileMap[r.created_by] ?? 'Team member',
              type: r.type ?? 'request',
            }))
          : []

      const isLead = ['owner', 'clevel', 'lead'].includes(member.role)
      // Skip members with no tasks AND no requests (unless they're a lead/owner)
      const hasContent = myInProgress.length > 0 || myReviews.length > 0 || myRequests.length > 0
      if (!hasContent && !isLead) continue

      const html = buildDigestHtml({
        userName: name,
        userEmail: email,
        workspaceName: ws.name,
        tasksInProgress: myInProgress,
        tasksAwaitingReview: myReviews,
        newRequests: myRequests,
        teamDigest: isLead
          ? { totalDone: doneCount, totalInProgress: inProgressCount, pendingReviews: reviewCount }
          : undefined,
      })

      const { error } = await resend.emails.send({
        from: 'SYNCO <onboarding@resend.dev>',
        to: email,
        subject: `Your daily digest — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}`,
        html,
      })

      if (error) {
        errors.push(`${email}: ${error.message}`)
      } else {
        totalSent++
      }
    }
  }

  return NextResponse.json({ sent: totalSent, errors })
}

// Allow GET for manual test trigger (dev only)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST' }, { status: 405 })
  }
  return POST(req)
}
