export const dynamic = 'force-dynamic'

import { createServiceClient, getCurrentUserInfo } from '@/lib/supabase/server'
import { NotificationsClient } from '@/components/notifications/NotificationsClient'
import type { NotifItem } from '@/components/notifications/NotificationsClient'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

// Demo notifications shown when the table is empty
const DEMO: NotifItem[] = [
  {
    id: 'd1', type: 'review_approved', title: 'Jane Smith approved your task',
    body: '"Design product launch landing page" moved to Final review — Vera needs to sign off.',
    link: '/en/flow?open=task&id=60000000-0000-0000-0000-000000000001',
    actor_name: 'Jane Smith', read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), group: 'Today',
  },
  {
    id: 'd2', type: 'priority_request', title: 'Vera Kova sent a priority request',
    body: 'Need competitive analysis for EMEA by Friday. Mark as urgent.',
    link: '/en/flow?open=request',
    actor_name: 'Vera Kova', read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(), group: 'Today',
  },
  {
    id: 'd3', type: 'goal_progress', title: 'G2 EMEA reached 50% completion',
    body: '7 of 14 puzzle pieces are done across all departments.',
    link: '/en/goals',
    actor_name: 'Synco', read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), group: 'Today',
  },
  {
    id: 'd4', type: 'review_request', title: 'Alex Kim submitted work for review',
    body: '"Build product API" is waiting in your review queue.',
    link: '/en/flow?open=task&id=60000000-0000-0000-0000-000000000005',
    actor_name: 'Alex Kim', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), group: 'Today',
  },
  {
    id: 'd5', type: 'request_accepted', title: 'Omar Diaz accepted your request',
    body: '"Sales deck update for EMEA pitch" has been accepted by Sales team.',
    link: '/en/flow?open=request',
    actor_name: 'Omar Diaz', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), group: 'Earlier',
  },
  {
    id: 'd6', type: 'goal_created', title: 'New goal created: G3 Onboarding',
    body: 'Olga White decomposed the goal into 6 puzzle pieces across 3 departments.',
    link: '/en/goals',
    actor_name: 'Olga White', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), group: 'Earlier',
  },
  {
    id: 'd7', type: 'review_returned', title: 'Vera Kova returned a task',
    body: '"Social media launch calendar" needs revision: add competitor benchmarks.',
    link: '/en/flow?open=task&id=60000000-0000-0000-0000-000000000002',
    actor_name: 'Vera Kova', read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), group: 'Earlier',
  },
]

function groupFor(dateStr: string): 'Today' | 'Earlier' {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  return 'Earlier'
}

export default async function NotificationsPage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [supabase, currentUser] = await Promise.all([createServiceClient(), getCurrentUserInfo()]) as [any, Awaited<ReturnType<typeof getCurrentUserInfo>>]
    const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single()
    const wid = ws?.id

    let notifs: NotifItem[] = []
    let unread = 0

    if (wid) {
      const { data: raw } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, actor_id, read, created_at')
        .eq('workspace_id', wid)
        .order('created_at', { ascending: false })
        .limit(50)

      if (raw && raw.length > 0) {
        // fetch actor names
        const actorIds = [...new Set(raw.filter((n: { actor_id: string | null }) => n.actor_id).map((n: { actor_id: string }) => n.actor_id))]
        const { data: profiles } = actorIds.length
          ? await supabase.from('profiles').select('user_id, full_name').in('user_id', actorIds)
          : { data: [] }
        const pmap = new Map((profiles ?? []).filter((p: { user_id: string | null }) => p.user_id).map((p: { user_id: string; full_name: string | null }) => [p.user_id, p.full_name]))

        notifs = raw.map((n: { id: string; type: string; title: string; body: string | null; link: string | null; actor_id: string | null; read: boolean; created_at: string }) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          actor_name: n.actor_id ? (pmap.get(n.actor_id) ?? null) : null,
          read: n.read,
          created_at: n.created_at,
          group: groupFor(n.created_at),
        }))
        unread = notifs.filter(n => !n.read).length
      } else {
        notifs = DEMO
        unread = DEMO.filter(n => !n.read).length
      }
    } else {
      notifs = DEMO
      unread = DEMO.filter(n => !n.read).length
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar role={currentUser.role} userName={currentUser.name} unreadCount={unread} />
        <NotificationsClient notifications={notifs} unreadCount={unread} />
        <LanguageSwitch />
      </div>
    )
  } catch (err) {
    console.error('[NotificationsPage]', err)
    const unread = DEMO.filter(n => !n.read).length
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar unreadCount={unread} />
        <NotificationsClient notifications={DEMO} unreadCount={unread} />
        <LanguageSwitch />
      </div>
    )
  }
}
