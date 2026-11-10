'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createBrainstormSession,
  postBrainstormIdea,
  endBrainstormSession,
} from '@/app/actions/brainstorm'

interface Session {
  id: string; topic: string; audience: string; duration_min: number
  started_at: string | null; ended_at: string | null; created_by: string
}
interface Idea {
  id: string; session_id: string; author_id: string; body: string; created_at: string
}
interface Member {
  id: string; user_id: string; role: string; position: string
  profiles: { full_name: string } | null
}

interface Props {
  workspaceId: string
  sessions: Session[]
  ideas: Idea[]
  members: Member[]
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000004' // Tom Reyes
const DUR_OPTS = [10, 15, 30]
const AUD_OPTS = ['All company', 'Marketing', 'Development', 'Sales']

const DEPT_COLORS: Record<string, string> = {
  Marketing: '#5B4FE8', Development: '#00C896', Sales: '#F5A623', Owner: '#0F1B2D', Leadership: '#0F1B2D',
}
const GRADS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'linear-gradient(135deg,#0F1B2D,#34445F)',
  '00000000-0000-0000-0000-000000000002': 'linear-gradient(135deg,#8B5CF6,#6D3FE0)',
  '00000000-0000-0000-0000-000000000003': 'linear-gradient(135deg,#5B4FE8,#3B33B0)',
  '00000000-0000-0000-0000-000000000004': 'linear-gradient(135deg,#F5A623,#D98A0E)',
  '00000000-0000-0000-0000-000000000005': 'linear-gradient(135deg,#00C896,#00936E)',
  '00000000-0000-0000-0000-000000000006': 'linear-gradient(135deg,#5B4FE8,#3B33B0)',
  '00000000-0000-0000-0000-000000000007': 'linear-gradient(135deg,#5B4FE8,#3B33B0)',
  '00000000-0000-0000-0000-000000000008': 'linear-gradient(135deg,#00C896,#00936E)',
  '00000000-0000-0000-0000-000000000009': 'linear-gradient(135deg,#5B4FE8,#3B33B0)',
  '00000000-0000-0000-0000-000000000010': 'linear-gradient(135deg,#F5A623,#D98A0E)',
  '00000000-0000-0000-0000-000000000011': 'linear-gradient(135deg,#00C896,#00936E)',
}

function memberName(m: Member) { return m.profiles?.full_name ?? m.position }
function memberInitials(m: Member) {
  const name = memberName(m)
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function memberDept(m: Member) {
  if (m.role === 'owner') return 'Owner'
  if (m.role === 'c_level') return 'Leadership'
  return ''
}

function timeLabel(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

function formatTimer(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function BrainstormClient({ workspaceId, sessions: initSessions, ideas: initIdeas, members }: Props) {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'
  const r = (path: string) => `/${locale}/${path}`

  const [sessions, setSessions] = useState<Session[]>(initSessions)
  const [ideas, setIdeas] = useState<Idea[]>(initIdeas)
  const [selId, setSelId] = useState<string>(initSessions[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [nTopic, setNTopic] = useState('')
  const [nDur, setNDur] = useState(15)
  const [nAud, setNAud] = useState('All company')
  const [starting, setStarting] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [justId, setJustId] = useState<string | null>(null)
  const wallRef = useRef<HTMLDivElement>(null)

  const cur = sessions.find(s => s.id === selId) ?? sessions[0]
  const curIdeas = ideas.filter(i => i.id && cur && i.session_id === cur.id)

  // Realtime clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-close sessions past their end time
  useEffect(() => {
    setSessions(prev => prev.map(s => {
      if (!s.ended_at && s.started_at) {
        const endsAt = new Date(s.started_at).getTime() + s.duration_min * 60_000
        if (now >= endsAt) return { ...s, ended_at: new Date(endsAt).toISOString() }
      }
      return s
    }))
  }, [now])

  // Realtime subscribe to ideas for selected session
  useEffect(() => {
    if (!selId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`brainstorm_ideas:${selId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'brainstorm_ideas',
        filter: `session_id=eq.${selId}`,
      }, payload => {
        const idea = payload.new as Idea
        setIdeas(prev => prev.some(i => i.id === idea.id) ? prev : [...prev, idea])
        setJustId(idea.id)
        setTimeout(() => setJustId(null), 600)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selId])

  // Scroll wall to bottom on new idea
  useEffect(() => {
    if (justId && wallRef.current) {
      wallRef.current.scrollTop = wallRef.current.scrollHeight
    }
  }, [justId, curIdeas.length])

  const isLive = (s: Session) => !s.ended_at && !!s.started_at
  const isClosed = (s: Session) => !!s.ended_at

  function timerMs(s: Session) {
    if (!s.started_at) return 0
    const endsAt = new Date(s.started_at).getTime() + s.duration_min * 60_000
    return Math.max(0, endsAt - now)
  }
  function timerPct(s: Session) {
    if (!s.started_at) return 0
    const total = s.duration_min * 60_000
    const elapsed = now - new Date(s.started_at).getTime()
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  async function handlePost() {
    if (!draft.trim() || !cur || isClosed(cur) || posting) return
    setPosting(true)
    const tempId = `tmp-${Date.now()}`
    const tempIdea: Idea = { id: tempId, session_id: cur.id, author_id: DEMO_USER_ID, body: draft.trim(), created_at: new Date().toISOString() }
    setIdeas(prev => [...prev, tempIdea])
    setJustId(tempId)
    setDraft('')
    const res = await postBrainstormIdea(cur.id, draft.trim(), DEMO_USER_ID)
    if (res.error) {
      setIdeas(prev => prev.filter(i => i.id !== tempId))
    }
    setPosting(false)
  }

  async function handleEndNow() {
    if (!cur || isClosed(cur)) return
    setSessions(prev => prev.map(s => s.id === cur.id ? { ...s, ended_at: new Date().toISOString() } : s))
    await endBrainstormSession(cur.id, workspaceId)
  }

  async function handleStart() {
    if (!nTopic.trim() || starting) return
    setStarting(true)
    const res = await createBrainstormSession({
      workspaceId, topic: nTopic.trim(), durationMin: nDur,
      audience: nAud, createdBy: DEMO_USER_ID,
    })
    if (!res.error && res.sessionId) {
      const newSession: Session = {
        id: res.sessionId, topic: nTopic.trim(), audience: nAud,
        duration_min: nDur, started_at: new Date().toISOString(),
        ended_at: null, created_by: DEMO_USER_ID,
      }
      setSessions(prev => [newSession, ...prev])
      setSelId(res.sessionId!)
      setShowNew(false)
      setNTopic('')
    }
    setStarting(false)
  }

  function memberById(userId: string) {
    return members.find(m => m.user_id === userId)
  }

  const deptColorFor = (userId: string) => {
    const m = memberById(userId)
    if (!m) return '#B7BCCB'
    return DEPT_COLORS[memberDept(m)] ?? '#5B4FE8'
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* LEFT RAIL */}
      <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRight: '1px solid #ECEEF5', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 18px 12px', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: '#0F1B2D' }}>Brainstorms</div>
          <button
            onClick={() => setShowNew(v => !v)}
            style={{ marginLeft: 'auto', height: 34, padding: '0 12px', borderRadius: 10, border: 'none', background: '#5B4FE8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {showNew ? 'Cancel' : '+ New'}
          </button>
        </div>

        {/* New session form */}
        {showNew && (
          <div style={{ margin: '0 14px 12px', border: '1px solid #E2DEF8', background: '#FBFAFF', borderRadius: 14, padding: 13 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#5B4FE8' }}>NEW SESSION</div>
            <textarea
              value={nTopic}
              onChange={e => setNTopic(e.target.value)}
              placeholder="Topic or question for the team…"
              style={{ marginTop: 9, width: '100%', height: 64, resize: 'none', borderRadius: 10, border: '1px solid #E5E7F0', background: '#fff', padding: '9px 11px', fontSize: 13, lineHeight: 1.4, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: '#6B7385' }}>Duration</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              {DUR_OPTS.map(d => (
                <div key={d} onClick={() => setNDur(d)} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: d === nDur ? '#5B4FE8' : '#6B7385', background: d === nDur ? '#EEEDFB' : '#fff', border: `1px solid ${d === nDur ? '#C8C4F5' : '#E5E7F0'}` }}>
                  {d}m
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: '#6B7385' }}>Who&apos;s invited</div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AUD_OPTS.map(a => (
                <div key={a} onClick={() => setNAud(a)} style={{ padding: '6px 10px', borderRadius: 99, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: a === nAud ? '#5B4FE8' : '#6B7385', background: a === nAud ? '#EEEDFB' : '#fff', border: `1px solid ${a === nAud ? '#C8C4F5' : '#E5E7F0'}` }}>
                  {a}
                </div>
              ))}
            </div>
            <button
              onClick={handleStart}
              disabled={!nTopic.trim() || starting}
              style={{ marginTop: 12, width: '100%', height: 40, borderRadius: 10, border: 'none', background: !nTopic.trim() ? '#ECEEF5' : '#5B4FE8', color: !nTopic.trim() ? '#B7BCCB' : '#fff', fontSize: 13, fontWeight: 700, cursor: !nTopic.trim() ? 'default' : 'pointer' }}
            >
              {starting ? 'Starting…' : 'Start session'}
            </button>
          </div>
        )}

        {/* Sessions list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: '#B7BCCB' }}>No sessions yet</div>
          )}
          {sessions.map(s => {
            const live = isLive(s)
            const closed = isClosed(s)
            const ideaCount = ideas.filter(i => i.session_id === s.id).length
            const ms = timerMs(s)
            return (
              <div
                key={s.id}
                onClick={() => setSelId(s.id)}
                style={{ cursor: 'pointer', border: `1.5px solid ${selId === s.id ? '#C8C4F5' : '#ECEEF5'}`, background: '#fff', borderRadius: 14, padding: '13px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {live && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: '.4px', color: '#E5484D', background: 'rgba(229,72,77,.1)', padding: '3px 8px', borderRadius: 99 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E5484D', animation: 'livePulse 1.2s infinite' }} />
                      LIVE · {formatTimer(ms)}
                    </span>
                  )}
                  {closed && (
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.4px', color: '#6B7385', background: '#EEF0F6', padding: '3px 8px', borderRadius: 99 }}>CLOSED</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#9CA3B5' }}>{ideaCount} ideas</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: '#0F1B2D' }}>{s.topic}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3B5' }}>{s.audience}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MAIN BOARD */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 32px 40px' }} ref={wallRef}>
        {!cur ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontSize: 14, color: '#B7BCCB' }}>
            Select or start a brainstorm session
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isLive(cur) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.5px', color: '#E5484D', background: 'rgba(229,72,77,.1)', padding: '4px 10px', borderRadius: 99 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E5484D', animation: 'livePulse 1.2s infinite' }} />
                      LIVE
                    </span>
                  )}
                  {isClosed(cur) && (
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.5px', color: '#6B7385', background: '#EEF0F6', padding: '4px 10px', borderRadius: 99 }}>CLOSED</span>
                  )}
                  <span style={{ fontSize: 12, color: '#9CA3B5' }}>{cur.audience} · {cur.duration_min} min</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-0.9px', color: '#0F1B2D', lineHeight: 1.18 }}>{cur.topic}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#6B7385' }}>Text only, no voting. When time is up, every idea goes to Sync Mind.</div>
              </div>

              {/* Timer */}
              <div style={{ width: 200, flexShrink: 0, background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3B5' }}>
                  {isLive(cur) ? 'Time remaining' : 'Session ended'}
                </div>
                <div style={{ marginTop: 2, fontSize: 34, fontWeight: 800, letterSpacing: -1, color: isLive(cur) ? (timerMs(cur) < 60_000 ? '#E5484D' : '#0F1B2D') : '#B7BCCB', fontVariantNumeric: 'tabular-nums' }}>
                  {isLive(cur) ? formatTimer(timerMs(cur)) : '00:00'}
                </div>
                <div style={{ marginTop: 8, height: 6, borderRadius: 99, background: '#EEF0F6', overflow: 'hidden' }}>
                  <div style={{ width: `${timerPct(cur)}%`, height: '100%', background: timerMs(cur) < 60_000 ? '#E5484D' : '#5B4FE8', borderRadius: 99, transition: 'width 1s linear' }} />
                </div>
                {isLive(cur) && (
                  <button onClick={handleEndNow} style={{ marginTop: 10, width: '100%', height: 32, borderRadius: 9, border: '1px solid #E5E7F0', background: '#fff', color: '#6B7385', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    End now
                  </button>
                )}
              </div>
            </div>

            {/* Participants */}
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {members.slice(0, 8).map((m, i) => (
                  <div key={m.id} title={memberName(m)} style={{ width: 32, height: 32, borderRadius: '50%', background: GRADS[m.user_id] ?? '#B7BCCB', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F7F8FC', marginRight: i < members.length - 1 ? -7 : 0 }}>
                    {memberInitials(m)}
                  </div>
                ))}
              </div>
              <div style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: '#6B7385' }}>
                {curIdeas.length > 0 ? `${new Set(curIdeas.map(i => i.author_id)).size} of ${members.length} contributed` : `${members.length} invited`}
              </div>
            </div>

            {/* Idea composer — only when live */}
            {isLive(cur) && (
              <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E2DEF8', borderRadius: 16, padding: 12, boxShadow: '0 6px 18px rgba(91,79,232,.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: GRADS[DEMO_USER_ID] ?? '#B7BCCB', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  TR
                </div>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
                  placeholder="Add your idea — one thought per card. Press Enter to post."
                  style={{ flex: 1, minWidth: 0, height: 44, border: 'none', background: 'transparent', fontSize: 15, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={handlePost}
                  disabled={!draft.trim() || posting}
                  style={{ height: 42, padding: '0 18px', borderRadius: 11, border: 'none', background: !draft.trim() ? '#ECEEF5' : '#5B4FE8', color: !draft.trim() ? '#B7BCCB' : '#fff', fontSize: 13, fontWeight: 700, cursor: !draft.trim() ? 'default' : 'pointer' }}
                >
                  Post idea
                </button>
              </div>
            )}

            {/* Closed banner */}
            {isClosed(cur) && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '14px 18px', background: '#0F1B2D', color: '#fff' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7B6FF0,#5B4FE8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, border: '2px solid #fff', borderRadius: 4 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Session closed · {curIdeas.length} ideas sent to Sync Mind</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>Ask Sync Mind to group the ideas or turn them into a goal.</div>
                </div>
                <a href={r('syncmind')} style={{ fontSize: 13, fontWeight: 700, color: '#B9B2FF', textDecoration: 'none', flexShrink: 0 }}>Open Sync Mind →</a>
              </div>
            )}

            {/* Idea wall */}
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
              {curIdeas.map(idea => {
                const m = memberById(idea.author_id)
                const name = m ? memberName(m) : 'Unknown'
                const initials = m ? memberInitials(m) : '?'
                const grad = GRADS[idea.author_id] ?? '#B7BCCB'
                const color = deptColorFor(idea.author_id)
                const isNew = idea.id === justId
                return (
                  <div key={idea.id} style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,27,45,.05)', animation: isNew ? 'popIn .25s ease both' : 'none', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 4, background: color }} />
                    <div style={{ padding: '13px 14px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: '#0F1B2D', flex: 1 }}>{idea.body}</div>
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: grad, color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#3A4253' }}>{name.split(' ')[0]}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#B7BCCB' }}>{timeLabel(idea.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {curIdeas.length === 0 && (
              <div style={{ marginTop: 4, border: '1.5px dashed #DDE0EA', borderRadius: 14, padding: 30, textAlign: 'center', fontSize: 13, color: '#B7BCCB' }}>
                No ideas yet — be the first.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes popIn{0%{transform:translateY(-10px) scale(.96);opacity:0}100%{transform:none;opacity:1}}
      `}</style>
    </div>
  )
}
