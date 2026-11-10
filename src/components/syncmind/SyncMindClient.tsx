'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface KbDocMeta {
  // task_result fields
  executed_by?: string | null
  executed_by_role?: string | null
  assigned_by?: string | null
  completed_at?: string | null
  department?: string | null
  task_description?: string | null
  reviews?: { reviewer: string; action: string; note: string | null; at: string }[]
  comments?: { author: string; body: string; at: string }[]
  // brainstorm fields
  topic?: string | null
  session_id?: string | null
  session_started_at?: string | null
  duration_min?: number | null
  idea_count?: number | null
  ideas?: { body: string; author: string }[]
  // meeting fields
  room_name?: string | null
  room_id?: string | null
  meeting_date?: string | null
  author?: string | null
  participants?: string[]
  notes?: string | null
  messages?: { author: string; body: string; at: string }[]
}

interface KbDoc {
  id: string; title: string; content: string | null
  source_type: string; file_url: string | null; file_name: string | null
  created_at: string
  metadata?: KbDocMeta | null
}

interface Compilation {
  summary: string
  document_ids: string[]
  grouping: { label: string; document_ids: string[] }[]
  documents: KbDoc[]
}

interface Props {
  workspaceId: string
  docCount: number
  recentDocs: KbDoc[]
}

const CHIPS = [
  'Everything launch-related',
  'Pricing + go-to-market docs',
  'All approved technical specs',
  'EMEA expansion materials',
  'Onboarding documentation',
]

function sourceIcon(type: string, file_name: string | null) {
  if (type === 'task_result') {
    const ext = file_name?.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['jpg','jpeg','png','gif','webp'].includes(ext ?? '')) return '🖼️'
    if (['xlsx','csv'].includes(ext ?? '')) return '📊'
    if (['docx','doc'].includes(ext ?? '')) return '📝'
    return '📄'
  }
  if (type === 'brainstorm') return '💡'
  if (type === 'meeting') return '📋'
  return '🔗'
}

function timeAgo(dateStr: string, t: (key: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return t('today')
  if (days === 1) return t('yesterday')
  return `${days}${t('daysAgo')}`
}

export function SyncMindClient({ workspaceId, docCount, recentDocs }: Props) {
  const sm = useTranslations('syncMind')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Compilation | null>(null)
  const [error, setError] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<KbDoc | null>(null)
  const [filter, setFilter] = useState<'all' | 'task_result' | 'brainstorm' | 'meeting'>('all')

  async function handleSearch(q?: string) {
    const text = (q ?? query).trim()
    if (!text) return
    setQuery(text)
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/syncmind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, workspaceId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Search failed'); return }
      setResult(data)
    } catch {
      setError(sm('networkError'))
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    if (!result) return
    const lines = [
      `Sync Mind compilation`,
      `Query: "${query}"`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      result.summary,
      '',
      ...result.documents.map((d, i) => `${i + 1}. ${d.title}${d.file_url ? '\n   ' + d.file_url : ''}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sync-mind-${Date.now()}.txt`
    a.click()
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Doc detail panel */}
      {selectedDoc && (
        <div style={{
          position: 'fixed', top: 60, right: 0, bottom: 0, width: 380,
          background: '#fff', borderLeft: '1px solid #ECEEF5',
          boxShadow: '-8px 0 32px rgba(15,27,45,.08)',
          display: 'flex', flexDirection: 'column', zIndex: 50, overflowY: 'auto',
        }}>
          {/* Panel header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #ECEEF5', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{sourceIcon(selectedDoc.source_type, selectedDoc.file_name)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1B2D', lineHeight: 1.35 }}>{selectedDoc.title}</div>
              <div style={{ fontSize: 12, color: '#B7BCCB', marginTop: 4 }}>{timeAgo(selectedDoc.created_at, sm)}</div>
            </div>
            <button onClick={() => setSelectedDoc(null)} style={{ flexShrink: 0, background: 'none', border: 'none', fontSize: 18, color: '#B7BCCB', cursor: 'pointer', padding: 4 }}>×</button>
          </div>

          {/* Panel body */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* BRAINSTORM PANEL */}
            {selectedDoc.source_type === 'brainstorm' && (() => {
              const m = selectedDoc.metadata
              return (
                <>
                  {/* Session info */}
                  <div style={{ padding: '14px 16px', background: 'rgba(91,79,232,.04)', borderRadius: 11, border: '1px solid rgba(91,79,232,.12)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 10 }}>SESSION</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {m?.session_started_at && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9CA3B5' }}>Date</span>
                          <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{new Date(m.session_started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                      {m?.duration_min && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9CA3B5' }}>Duration</span>
                          <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{m.duration_min} min</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#9CA3B5' }}>Ideas</span>
                        <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{m?.idea_count ?? (m?.ideas?.length ?? 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ideas list */}
                  {(m?.ideas?.length ?? 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>IDEAS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {m!.ideas!.map((idea, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: '#F7F8FC', borderRadius: 9, border: '1px solid #ECEEF5' }}>
                            <div style={{ fontSize: 13, color: '#0F1B2D', lineHeight: 1.5 }}>{idea.body}</div>
                            <div style={{ marginTop: 4, fontSize: 11, color: '#B7BCCB' }}>{idea.author}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback: raw content if no ideas in metadata */}
                  {(m?.ideas?.length ?? 0) === 0 && selectedDoc.content && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>IDEAS</div>
                      <div style={{ fontSize: 13, color: '#3A4253', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{selectedDoc.content}</div>
                    </div>
                  )}
                </>
              )
            })()}

            {/* MEETING PANEL */}
            {selectedDoc.source_type === 'meeting' && (() => {
              const m = selectedDoc.metadata
              return (
                <>
                  <div style={{ padding: '14px 16px', background: 'rgba(15,27,45,.03)', borderRadius: 11, border: '1px solid #ECEEF5' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 10 }}>MEETING</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {m?.room_name && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9CA3B5' }}>Room</span>
                          <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{m.room_name}</span>
                        </div>
                      )}
                      {m?.meeting_date && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9CA3B5' }}>Date</span>
                          <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{new Date(m.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                      {m?.author && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9CA3B5' }}>Notes by</span>
                          <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{m.author}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(m?.participants?.length ?? 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>PARTICIPANTS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {m!.participants!.map((p, i) => (
                          <span key={i} style={{ padding: '4px 10px', borderRadius: 99, background: '#F7F8FC', border: '1px solid #ECEEF5', fontSize: 12, fontWeight: 600, color: '#3A4253' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structured messages (new format) */}
                  {(m?.messages?.length ?? 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>NOTES · {m!.messages!.length}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {m!.messages!.map((msg, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: '#F7F8FC', borderRadius: 9, border: '1px solid #ECEEF5' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#5B4FE8' }}>{msg.author}</span>
                              <span style={{ fontSize: 11, color: '#B7BCCB' }}>{new Date(msg.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#0F1B2D', lineHeight: 1.5 }}>{msg.body}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback: plain notes (old format) */}
                  {(m?.messages?.length ?? 0) === 0 && m?.notes && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>NOTES</div>
                      <div style={{ fontSize: 13, color: '#3A4253', lineHeight: 1.7, whiteSpace: 'pre-line', padding: '12px 14px', background: '#F7F8FC', borderRadius: 11, border: '1px solid #ECEEF5' }}>{m.notes}</div>
                    </div>
                  )}
                </>
              )
            })()}

            {/* TASK RESULT PANEL */}
            {selectedDoc.source_type !== 'brainstorm' && selectedDoc.source_type !== 'meeting' && <>

            {/* Task description */}
            {selectedDoc.metadata?.task_description && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>DESCRIPTION</div>
                <div style={{ fontSize: 13, color: '#3A4253', lineHeight: 1.65 }}>{selectedDoc.metadata.task_description}</div>
              </div>
            )}

            {/* Executed by */}
            {selectedDoc.metadata?.executed_by && (
              <div style={{ padding: '14px 16px', background: '#F7F8FC', borderRadius: 11, border: '1px solid #ECEEF5' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 10 }}>PEOPLE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9CA3B5' }}>Executed by</span>
                    <span style={{ color: '#0F1B2D', fontWeight: 600 }}>
                      {selectedDoc.metadata.executed_by}
                      {selectedDoc.metadata.executed_by_role && (
                        <span style={{ color: '#B7BCCB', fontWeight: 400 }}> · {selectedDoc.metadata.executed_by_role}</span>
                      )}
                    </span>
                  </div>
                  {selectedDoc.metadata.assigned_by && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9CA3B5' }}>Assigned by</span>
                      <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{selectedDoc.metadata.assigned_by}</span>
                    </div>
                  )}
                  {selectedDoc.metadata.department && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9CA3B5' }}>Department</span>
                      <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{selectedDoc.metadata.department}</span>
                    </div>
                  )}
                  {selectedDoc.metadata.completed_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9CA3B5' }}>Completed</span>
                      <span style={{ color: '#0F1B2D', fontWeight: 600 }}>{new Date(selectedDoc.metadata.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews */}
            {(selectedDoc.metadata?.reviews?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>REVIEWS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedDoc.metadata!.reviews ?? []).map((r, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: r.action === 'approve' ? 'rgba(0,200,150,.06)' : 'rgba(245,166,35,.06)', border: `1px solid ${r.action === 'approve' ? 'rgba(0,200,150,.2)' : 'rgba(245,166,35,.2)'}`, borderRadius: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#0F1B2D' }}>{r.reviewer}</span>
                        <span style={{ color: r.action === 'approve' ? '#00C896' : '#F5A623', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{r.action}</span>
                      </div>
                      {r.note && <div style={{ marginTop: 4, fontSize: 12, color: '#6B7385', lineHeight: 1.5 }}>{r.note}</div>}
                      <div style={{ marginTop: 4, fontSize: 11, color: '#B7BCCB' }}>{new Date(r.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {(selectedDoc.metadata?.comments?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>COMMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedDoc.metadata!.comments ?? []).map((c, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#F7F8FC', borderRadius: 9, border: '1px solid #ECEEF5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#0F1B2D' }}>{c.author}</span>
                        <span style={{ color: '#B7BCCB' }}>{new Date(c.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#6B7385', lineHeight: 1.5 }}>{c.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: raw content if no metadata */}
            {!selectedDoc.metadata?.executed_by && selectedDoc.content && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>DESCRIPTION</div>
                <div style={{ fontSize: 13, color: '#3A4253', lineHeight: 1.65 }}>{selectedDoc.content}</div>
              </div>
            )}

            {/* File name */}
            {selectedDoc.file_name && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>FILE</div>
                <div style={{ fontSize: 13, color: '#6B7385', fontFamily: 'monospace' }}>{selectedDoc.file_name}</div>
              </div>
            )}

            {/* Link */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>LINK</div>
              {selectedDoc.file_url ? (
                <a
                  href={selectedDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: '#5B4FE8', wordBreak: 'break-all', lineHeight: 1.5 }}
                >
                  {selectedDoc.file_url}
                </a>
              ) : (
                <div style={{ fontSize: 13, color: '#D0D3DE', fontStyle: 'italic' }}>No link attached</div>
              )}
            </div>

            {/* Details row */}
            <div style={{ padding: '14px 16px', background: '#F7F8FC', borderRadius: 11, border: '1px solid #ECEEF5' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 10 }}>DETAILS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#9CA3B5' }}>Type</span>
                  <span style={{ color: '#3A4253', fontWeight: 600, textTransform: 'capitalize' }}>{selectedDoc.source_type.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#9CA3B5' }}>Added</span>
                  <span style={{ color: '#3A4253', fontWeight: 600 }}>{new Date(selectedDoc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            </> /* end task_result panel */}
          </div>
        </div>
      )}

    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>
      {/* Header */}
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#5B4FE8,#00C896)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✦</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', color: '#0F1B2D' }}>{sm('title')}</div>
            <div style={{ fontSize: 13, color: '#9CA3B5' }}>{docCount} {sm('subtitle')}</div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={sm('placeholder')}
              style={{ width: '100%', height: 50, borderRadius: 14, border: '1.5px solid #ECEEF5', background: '#fff', padding: '0 50px 0 18px', fontSize: 15, color: '#0F1B2D', outline: 'none', boxShadow: '0 2px 12px rgba(15,27,45,.06)', fontFamily: 'inherit' }}
            />
            {loading && (
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', border: '2px solid #ECEEF5', borderTopColor: '#5B4FE8', animation: 'spin 0.6s linear infinite' }} />
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            style={{ height: 50, padding: '0 22px', borderRadius: 14, border: 'none', background: loading || !query.trim() ? '#ECEEF5' : '#5B4FE8', color: loading || !query.trim() ? '#B7BCCB' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading || !query.trim() ? 'default' : 'pointer', transition: 'all .15s' }}
          >
            {sm('searchBtn')} ✦
          </button>
        </div>

        {/* Chips */}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => handleSearch(chip)} style={{ height: 28, padding: '0 12px', borderRadius: 99, border: '1.5px solid #ECEEF5', background: '#fff', color: '#6B7385', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {chip}
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ marginTop: 20, display: 'flex', gap: 6 }}>
          {([
            { key: 'all',         label: sm('filterAll'),        icon: '✦' },
            { key: 'task_result', label: sm('filterTask'),  icon: '📄' },
            { key: 'brainstorm',  label: sm('filterBrainstorm'), icon: '💡' },
            { key: 'meeting',     label: sm('filterMeeting'),     icon: '📋' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{ height: 32, padding: '0 14px', borderRadius: 99, border: `1.5px solid ${filter === tab.key ? '#5B4FE8' : '#ECEEF5'}`, background: filter === tab.key ? '#EEEDFB' : '#fff', color: filter === tab.key ? '#5B4FE8' : '#6B7385', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 11, background: 'rgba(229,72,77,.08)', border: '1px solid rgba(229,72,77,.2)', fontSize: 13, color: '#E5484D' }}>
            {error}
          </div>
        )}

        {/* Loading animation */}
        {loading && (
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#5B4FE8', opacity: 0.2 + i * 0.16, animation: `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate` }} />
              ))}
            </div>
            <div style={{ fontSize: 14, color: '#9CA3B5' }}>{sm('thinking')}</div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (() => {
          const filteredDocs = filter === 'all' ? result.documents : result.documents.filter(d => d.source_type === filter)
          return (
            <div style={{ marginTop: 28 }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(91,79,232,.06),rgba(0,200,150,.06))', border: '1px solid rgba(91,79,232,.15)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✦</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#5B4FE8' }}>Sync Mind compiled {filteredDocs.length} documents</span>
                  <button onClick={handleExport} style={{ marginLeft: 'auto', height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(91,79,232,.2)', background: '#fff', color: '#5B4FE8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ↓ {sm('exportBtn')}
                  </button>
                </div>
                <div style={{ marginTop: 10, fontSize: 14, color: '#3A4253', lineHeight: 1.6 }}>{result.summary}</div>
              </div>

              {result.grouping.length > 0 && filter === 'all' ? (
                result.grouping.map(group => {
                  const groupDocs = group.document_ids.map(id => result.documents.find(d => d.id === id)).filter(Boolean) as KbDoc[]
                  return (
                    <div key={group.label} style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.6px', color: '#B7BCCB', marginBottom: 10 }}>{group.label.toUpperCase()}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {groupDocs.map(doc => <DocCard key={doc.id} doc={doc} onSelect={setSelectedDoc} />)}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredDocs.length === 0
                    ? <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: '#B7BCCB' }}>No {filter === 'brainstorm' ? 'brainstorm sessions' : 'documents'} in these results</div>
                    : filteredDocs.map(doc => <DocCard key={doc.id} doc={doc} onSelect={setSelectedDoc} />)
                  }
                </div>
              )}
            </div>
          )
        })()}

        {/* Empty state / recent docs */}
        {!result && !loading && (
          <div style={{ marginTop: 36 }}>
            {docCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 40 }}>✦</div>
                <div style={{ marginTop: 14, fontSize: 17, fontWeight: 700, color: '#B7BCCB' }}>{sm('noDocsYet')}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#D0D3DE', maxWidth: 360, margin: '8px auto 0' }}>
                  {sm('noDocsDesc')}
                </div>
              </div>
            ) : (() => {
              const filteredRecent = filter === 'all' ? recentDocs : recentDocs.filter(d => d.source_type === filter)
              return (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.6px', color: '#B7BCCB', marginBottom: 10 }}>
                    {filter === 'brainstorm' ? sm('filterBrainstorm').toUpperCase() : filter === 'task_result' ? sm('filterTask').toUpperCase() : sm('recentDocs').toUpperCase()}
                  </div>
                  {filteredRecent.length === 0
                    ? <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: '#B7BCCB' }}>{sm('noDocsYet')}</div>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredRecent.map(doc => <DocCard key={doc.id} doc={doc} onSelect={setSelectedDoc} />)}
                      </div>
                  }
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg) } }
        @keyframes pulse { from { transform: scale(1); opacity: .3 } to { transform: scale(1.4); opacity: 1 } }
      `}</style>
    </div>
    </div>
  )
}

function DocCard({ doc, onSelect }: { doc: KbDoc; onSelect: (d: KbDoc) => void }) {
  const sm = useTranslations('syncMind')
  const icon = sourceIcon(doc.source_type, doc.file_name)
  return (
    <div
      onClick={() => onSelect(doc)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', background: '#fff', border: '1px solid #ECEEF5', borderRadius: 13, boxShadow: '0 1px 6px rgba(15,27,45,.04)', cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#C8C4F5'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(91,79,232,.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#ECEEF5'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(15,27,45,.04)' }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1B2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
        {doc.content && (
          <div style={{ marginTop: 2, fontSize: 12, color: '#9CA3B5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.content.slice(0, 120)}</div>
        )}
      </div>
      <span style={{ fontSize: 11, color: '#B7BCCB', flexShrink: 0 }}>{timeAgo(doc.created_at, sm)}</span>
      <span style={{ fontSize: 11, color: '#C8C4F5', flexShrink: 0 }}>›</span>
    </div>
  )
}
