export const dynamic = 'force-dynamic'

import { createServiceClient, getCurrentUserInfo } from '@/lib/supabase/server'
import { BrainstormClient } from '@/components/brainstorm/BrainstormClient'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export default async function BrainstormPage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [supabase, currentUser] = await Promise.all([createServiceClient(), getCurrentUserInfo()]) as [any, Awaited<ReturnType<typeof getCurrentUserInfo>>]
    const { data: ws } = await supabase.from('workspaces').select('id, name').limit(1).single()
    const wid = ws?.id ?? ''

    const { data: sessions } = await supabase
      .from('brainstorm_sessions')
      .select('id, topic, audience, duration_min, started_at, ended_at, created_by')
      .eq('workspace_id', wid)
      .order('started_at', { ascending: false })
      .limit(20)

    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id)
    let ideas: { id: string; session_id: string; author_id: string; body: string; created_at: string }[] = []
    if (sessionIds.length > 0) {
      const { data } = await supabase
        .from('brainstorm_ideas')
        .select('id, session_id, author_id, body, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })
      ideas = data ?? []
    }

    const { data: members } = await supabase
      .from('memberships')
      .select('id, user_id, role, position, profiles(full_name)')
      .eq('workspace_id', wid)
      .eq('status', 'active')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar role={currentUser.role} userName={currentUser.name} unreadCount={currentUser.unreadCount} />
        <BrainstormClient
          workspaceId={wid}
          sessions={sessions ?? []}
          ideas={ideas}
          members={members ?? []}
        />
        <LanguageSwitch />
      </div>
    )
  } catch (err) {
    console.error('[BrainstormPage]', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load Brainstorm.</p>
      </div>
    )
  }
}
