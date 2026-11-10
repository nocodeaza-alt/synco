export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { OfficeClient } from '@/components/office/OfficeClient'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export default async function OfficePage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createServiceClient()
    const { data: ws } = await supabase.from('workspaces').select('id, name').limit(1).single()
    const wid = ws?.id ?? ''

    const since24h = new Date(Date.now() - 24 * 3600_000).toISOString()
    const [roomsRes, membersRes, sessionsRes, pastMeetingsRes] = await Promise.all([
      supabase
        .from('office_rooms')
        .select('id, name, description, type, color, meet_link, sort')
        .eq('workspace_id', wid)
        .order('sort', { ascending: true }),
      supabase
        .from('memberships')
        .select('id, user_id, role, position, department_id, profiles(full_name), departments(name, color), tasks(id, title, stage)')
        .eq('workspace_id', wid)
        .eq('status', 'active'),
      supabase
        .from('brainstorm_sessions')
        .select('id, topic, started_at, ended_at')
        .eq('workspace_id', wid)
        .is('ended_at', null)
        .not('started_at', 'is', null)
        .limit(1)
        .single(),
      supabase
        .from('kb_documents')
        .select('id, title, created_at, metadata')
        .eq('workspace_id', wid)
        .eq('source_type', 'meeting')
        .gte('created_at', since24h)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar locale="en" role="owner" userName="Olga White" />
        <OfficeClient
          workspaceId={wid}
          workspaceName={ws?.name ?? 'REGAGRO HQ'}
          rooms={roomsRes.data ?? []}
          members={membersRes.data ?? []}
          liveSession={sessionsRes.data ?? null}
          pastMeetings={pastMeetingsRes.data ?? []}
        />
        <LanguageSwitch />
      </div>
    )
  } catch (err) {
    console.error('[OfficePage]', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load Office.</p>
      </div>
    )
  }
}
