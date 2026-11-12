export const dynamic = 'force-dynamic'

import { createServiceClient, getCurrentUserInfo } from '@/lib/supabase/server'
import { SyncMindClient } from '@/components/syncmind/SyncMindClient'
import { TopBar } from '@/components/layout/TopBar'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export default async function SyncMindPage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [supabase, currentUser] = await Promise.all([createServiceClient(), getCurrentUserInfo()]) as [any, Awaited<ReturnType<typeof getCurrentUserInfo>>]
    const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single()
    const wid = ws?.id ?? ''

    const [countRes, docsRes] = await Promise.all([
      supabase.from('kb_documents').select('id', { count: 'exact', head: true }).eq('workspace_id', wid),
      supabase.from('kb_documents')
        .select('id, title, content, source_type, file_url, file_name, created_at, metadata')
        .eq('workspace_id', wid)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F7F8FC' }}>
        <TopBar role={currentUser.role} userName={currentUser.name} unreadCount={currentUser.unreadCount} />
        <SyncMindClient
          workspaceId={wid}
          docCount={countRes.count ?? 0}
          recentDocs={docsRes.data ?? []}
        />
        <LanguageSwitch />
      </div>
    )
  } catch (err) {
    console.error('[SyncMindPage]', err)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#E5484D' }}>Failed to load Sync Mind.</p>
      </div>
    )
  }
}
