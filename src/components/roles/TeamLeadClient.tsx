'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { gradFor, initialsFor } from '@/lib/utils/avatar'
import { respondToRequest, advanceTaskStage } from '@/app/actions/tasks'

export interface TLTaskResult {
  id: string; kind: string; url: string; file_name: string | null
}

export interface TLTask {
  id: string; title: string; stage: string; priority: string
  goal_label: string; goal_color: string; assignee_name: string; deadline: string | null
  results: TLTaskResult[]
}

export interface TLMember {
  id: string; user_id: string; name: string; role: string
  battery_pct: number; efficiency_pct: number; open_load: number; capacity: number
  task_count: number; stage: string
}

export interface TLRequest {
  id: string; title: string; from_name: string; is_priority: boolean; status: string; when: string
}

export interface TLGoalPiece {
  goal_label: string; goal_color: string; done: number; total: number; pct: number
}

interface Props {
  reviewQueue: TLTask[]
  requests: TLRequest[]
  team: TLMember[]
  myTasks: TLTask[]
  goalPieces: TLGoalPiece[]
  deptName: string
  leadName: string
  workspaceId: string
}

function batColor(pct: number) { return pct >= 50 ? '#00C896' : pct >= 25 ? '#F5A623' : '#E5484D' }
function stageColor(s: string) {
  return s === 'done' ? '#00C896' : s === 'in_review' ? '#F5A623' : s === 'final_review' ? '#5B4FE8' : '#9CA3B5'
}

export function TeamLeadClient({ reviewQueue: initQueue, requests: initReqs, team, myTasks: initMine, goalPieces, deptName, leadName }: Props) {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'
  const r = (path: string) => `/${locale}/${path}`
  const tl = useTranslations('teamLead')

  function stageLabel(s: string) {
    return s === 'assigned' ? tl('stageAssigned') : s === 'in_progress' ? tl('stageInProgress') : s === 'in_review' ? tl('stageInReview')
      : s === 'ready' ? tl('stageReady') : s === 'final_review' ? tl('stageFinalReview') : s === 'done' ? tl('stageDone') : s
  }

  function priBadge(p: string) {
    return p === 'urgent' ? { bg: 'rgba(229,72,77,.12)', color: '#E5484D', label: tl('urgent') }
      : p === 'high' ? { bg: 'rgba(245,166,35,.14)', color: '#C77E0A', label: tl('high') }
      : { bg: 'rgba(91,79,232,.1)', color: '#5B4FE8', label: tl('normal') }
  }

  const [queue, setQueue] = useState(initQueue)
  const [reqs, setReqs] = useState(initReqs)
  const [myTasks, setMyTasks] = useState(initMine)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [openReqId, setOpenReqId] = useState<string | null>(null)
  const [declineNote, setDeclineNote] = useState('')
  const [selectedTask, setSelectedTask] = useState<TLTask | null>(null)
  const [returnNote, setReturnNote] = useState('')
  const [returning, setReturning] = useState(false)

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2400) }

  async function handleApproveTask(id: string, title: string) {
    await advanceTaskStage(id).catch(() => {})
    setQueue(q => q.filter(x => x.id !== id))
    if (selectedTask?.id === id) setSelectedTask(null)
    flash(`"${title}" approved`)
  }

  async function handleReturnTask(id: string, title: string) {
    await respondToRequest(id, 'decline').catch(() => {})
    setQueue(q => q.filter(x => x.id !== id))
    if (selectedTask?.id === id) setSelectedTask(null)
    setNoteFor(null); setNote(''); setReturning(false); setReturnNote('')
    flash(`"${title}" returned for revision`)
  }

  async function handleAcceptReq(id: string) {
    await respondToRequest(id, 'accept').catch(() => {})
    setReqs(r => r.map(x => x.id === id ? { ...x, status: 'accepted' } : x))
    setOpenReqId(null)
    flash('Request accepted')
  }

  async function handleDeclineReq(id: string) {
    await respondToRequest(id, 'decline').catch(() => {})
    setReqs(r => r.map(x => x.id === id ? { ...x, status: 'declined' } : x))
    setOpenReqId(null); setDeclineNote('')
    flash('Request declined')
  }

  async function handleAdvanceMine(id: string, title: string) {
    await advanceTaskStage(id).catch(() => {})
    setMyTasks(t => t.map(x => x.id === id ? { ...x, stage: 'in_review' } : x))
    flash(`"${title}" sent for review`)
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflowY: 'hidden', fontFamily: "'Inter',system-ui,sans-serif", position: 'relative' }}>
      {/* Main scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: '#0F1B2D' }}>{tl('goodMorning')}, {leadName.split(' ')[0]}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#9CA3B5' }}>{tl('teamLeadRole')} · {deptName} · {team.length} {tl('people')}</div>
          </div>
          <a href={r('flow')} style={{ marginLeft: 'auto', height: 40, padding: '0 15px', borderRadius: 11, background: '#0F1B2D', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', boxShadow: '0 6px 14px rgba(15,27,45,.18)' }}>→ {tl('openWorkFlow')}</a>
        </div>

        {/* 3-col grid */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr) minmax(0,0.9fr)', gap: 18 }}>
          {/* Col 1: Review queue + Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Review queue */}
            <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D' }}>{tl('reviewQueue')}</span>
                {queue.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#5B4FE8', minWidth: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{queue.length}</span>}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {queue.map(t => {
                  const pri = priBadge(t.priority)
                  const isSelected = selectedTask?.id === t.id
                  return (
                    <div
                      key={t.id}
                      onClick={() => { setSelectedTask(isSelected ? null : t); setReturning(false); setReturnNote('') }}
                      style={{ border: isSelected ? '1.5px solid #5B4FE8' : '1px solid #ECEEF5', borderRadius: 12, padding: '10px 11px', cursor: 'pointer', background: isSelected ? '#F3F2FD' : '#fff', transition: 'all .15s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, background: t.goal_color + '1A', color: t.goal_color, padding: '2px 6px', borderRadius: 99 }}>{t.goal_label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, background: pri.bg, color: pri.color, padding: '2px 6px', borderRadius: 99 }}>{pri.label}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{t.title}</div>
                      <div style={{ marginTop: 5, fontSize: 11, color: '#9CA3B5', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: gradFor(t.assignee_name), color: '#fff', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initialsFor(t.assignee_name)}</span>
                        {t.assignee_name}{t.deadline ? ' · ' + tl('due') + ' ' + t.deadline.slice(0, 10) : ''}

                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, color: '#5B4FE8' }}>{tl('clickToReview')}</div>
                    </div>
                  )
                })}
                {queue.length === 0 && (
                  <div style={{ border: '1.5px dashed #DDE0EA', borderRadius: 11, padding: 16, textAlign: 'center', fontSize: 12, color: '#B7BCCB' }}>
                    {tl('nothingInReview')}
                  </div>
                )}
              </div>
            </div>

            {/* Incoming requests */}
            <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D' }}>{tl('incomingRequests')}</span>
                {reqs.filter(r => r.status === 'pending').length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#F5A623', minWidth: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{reqs.filter(r => r.status === 'pending').length}</span>}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reqs.map(req => (
                  <div key={req.id} style={{ border: openReqId === req.id ? '1px solid #5B4FE8' : '1px solid #ECEEF5', borderRadius: 12, padding: '10px 11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {req.is_priority && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#6D3FE0', padding: '2px 7px', borderRadius: 99 }}>★ {tl('priority')}</span>}
                      <span style={{ marginLeft: req.is_priority ? 0 : 'auto', fontSize: 9, fontWeight: 700, color: req.status === 'pending' ? '#C77E0A' : req.status === 'accepted' ? '#00936E' : '#9CA3B5', background: req.status === 'pending' ? 'rgba(245,166,35,.14)' : req.status === 'accepted' ? 'rgba(0,200,150,.14)' : '#F0F1F6', padding: '2px 7px', borderRadius: 99 }}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{req.title}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#9CA3B5' }}>{tl('from')} {req.from_name} · {req.when}</div>
                    {req.status === 'pending' && openReqId !== req.id && (
                      <button onClick={() => setOpenReqId(req.id)} style={{ marginTop: 8, width: '100%', height: 30, borderRadius: 9, border: '1px solid #ECEEF5', background: '#F7F8FC', color: '#5B4FE8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{tl('respond')}</button>
                    )}
                    {req.status === 'pending' && openReqId === req.id && (
                      <div style={{ marginTop: 8 }}>
                        <textarea value={declineNote} onChange={e => setDeclineNote(e.target.value)} placeholder={tl('declinePlaceholder')} style={{ width: '100%', height: 44, resize: 'none', borderRadius: 9, border: '1px solid #E5E7F0', background: '#F7F8FC', padding: '7px 9px', fontSize: 11, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit' }} />
                        <div style={{ marginTop: 6, display: 'flex', gap: 7 }}>
                          <button onClick={() => handleAcceptReq(req.id)} style={{ flex: 1, height: 30, borderRadius: 8, border: 'none', background: '#00C896', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{tl('accept')}</button>
                          <button onClick={() => handleDeclineReq(req.id)} style={{ flex: 1, height: 30, borderRadius: 8, border: '1px solid #E5E7F0', background: '#fff', color: '#E5484D', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{tl('decline')}</button>
                          <button onClick={() => setOpenReqId(null)} style={{ height: 30, padding: '0 9px', borderRadius: 8, border: '1px solid #E5E7F0', background: '#fff', color: '#9CA3B5', fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {reqs.length === 0 && <div style={{ border: '1.5px dashed #DDE0EA', borderRadius: 11, padding: 16, textAlign: 'center', fontSize: 12, color: '#B7BCCB' }}>{tl('noRequests')}</div>}
              </div>
            </div>
          </div>

          {/* Col 2: Team today */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D' }}>{tl('teamToday')}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {team.map(m => {
                const bc = batColor(m.battery_pct)
                const over = m.open_load >= m.capacity
                return (
                  <div key={m.id} style={{ border: '1px solid #F0F1F6', borderRadius: 13, padding: '12px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: gradFor(m.name), color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initialsFor(m.name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {m.name}
                          {m.role === 'team_lead' && <span style={{ fontSize: 9, fontWeight: 700, color: '#5B4FE8', background: 'rgba(91,79,232,.1)', padding: '2px 6px', borderRadius: 99 }}>{tl('lead').toUpperCase()}</span>}
                        </div>
                        <div style={{ marginTop: 2, fontSize: 11, color: '#9CA3B5' }}>{m.task_count} {tl('tasks')} · {stageLabel(m.stage || 'assigned')}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: over ? '#E5484D' : '#00936E', background: over ? 'rgba(229,72,77,.1)' : 'rgba(0,200,150,.1)', padding: '3px 7px', borderRadius: 99 }}>{over ? tl('full').toUpperCase() : tl('ok').toUpperCase()}</span>
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#B7BCCB', marginBottom: 4 }}>{tl('efficiency').toUpperCase()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#EEF0F6', overflow: 'hidden' }}>
                            <div style={{ width: `${m.efficiency_pct}%`, height: '100%', background: m.efficiency_pct >= 85 ? '#00C896' : m.efficiency_pct >= 70 ? '#F5A623' : '#E5484D', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7385' }}>{m.efficiency_pct}%</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#B7BCCB', marginBottom: 4 }}>{tl('battery').toUpperCase()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 32, height: 15, border: `1.5px solid ${bc}`, borderRadius: 3, padding: 1.5, display: 'block' }}>
                            <span style={{ display: 'block', width: `${m.battery_pct}%`, height: '100%', background: bc, borderRadius: 1 }} />
                          </span>
                          <span style={{ width: 2, height: 7, background: bc, borderRadius: '0 2px 2px 0', display: 'block' }} />
                          <span style={{ marginLeft: 4, fontSize: 11, color: '#9CA3B5' }}>{m.capacity - m.open_load} {tl('left')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Col 3: On your desk + Goal pieces */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D' }}>{tl('onYourDesk')}</div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTasks.map(t => {
                  const pri = priBadge(t.priority)
                  const done = t.stage === 'done'
                  return (
                    <div key={t.id} style={{ border: '1px solid #F0F1F6', borderRadius: 11, padding: '10px 11px', opacity: done ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, background: t.goal_color + '1A', color: t.goal_color, padding: '2px 6px', borderRadius: 99 }}>{t.goal_label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, background: pri.bg, color: pri.color, padding: '2px 6px', borderRadius: 99 }}>{pri.label}</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: '#0F1B2D', textDecoration: done ? 'line-through' : 'none' }}>{t.title}</div>
                      <div style={{ marginTop: 5, fontSize: 11, color: '#9CA3B5' }}>{stageLabel(t.stage)}{t.deadline ? ' · ' + t.deadline.slice(0, 10) : ''}</div>
                      {!done && t.stage === 'in_progress' && (
                        <button onClick={() => handleAdvanceMine(t.id, t.title)} style={{ marginTop: 8, width: '100%', height: 28, borderRadius: 8, border: 'none', background: 'rgba(91,79,232,.1)', color: '#5B4FE8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{tl('submitForReview')}</button>
                      )}
                    </div>
                  )
                })}
                {myTasks.length === 0 && <div style={{ border: '1.5px dashed #DDE0EA', borderRadius: 11, padding: 14, textAlign: 'center', fontSize: 12, color: '#B7BCCB' }}>{tl('noTasksAssigned')}</div>}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D' }}>{tl('teamPieces')}</div>
              <div style={{ marginTop: 2, fontSize: 11, color: '#9CA3B5' }}>{tl('progressByGoal')}</div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {goalPieces.map(g => (
                  <div key={g.goal_label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: g.goal_color, padding: '2px 8px', borderRadius: 99 }}>{g.goal_label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#0F1B2D' }}>{g.pct}%</span>
                    </div>
                    <div style={{ marginTop: 6, height: 8, borderRadius: 99, background: '#EEF0F6', overflow: 'hidden' }}>
                      <div style={{ width: `${g.pct}%`, height: '100%', background: g.goal_color, borderRadius: 99 }} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#9CA3B5' }}>{g.done} {tl('of')} {g.total} {tl('pieces')}</div>
                  </div>
                ))}
                {goalPieces.length === 0 && <div style={{ fontSize: 13, color: '#B7BCCB' }}>{tl('noGoalPieces')}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task detail panel (slides in from right) */}
      {selectedTask && (
        <>
          {/* Overlay */}
          <div onClick={() => { setSelectedTask(null); setReturning(false); setReturnNote('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,.18)', zIndex: 40 }} />
          {/* Panel */}
          <div style={{ position: 'fixed', right: 0, top: 60, bottom: 0, width: 400, background: '#fff', borderLeft: '1px solid #ECEEF5', boxShadow: '-8px 0 32px rgba(15,27,45,.12)', zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Panel header */}
            <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid #F0F1F6', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: selectedTask.goal_color, padding: '3px 9px', borderRadius: 99 }}>{selectedTask.goal_label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: priBadge(selectedTask.priority).bg, color: priBadge(selectedTask.priority).color, padding: '2px 7px', borderRadius: 99 }}>{priBadge(selectedTask.priority).label}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 17, fontWeight: 800, color: '#0F1B2D', lineHeight: 1.3 }}>{selectedTask.title}</div>
              </div>
              <button onClick={() => { setSelectedTask(null); setReturning(false); setReturnNote('') }} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #ECEEF5', background: '#F7F8FC', cursor: 'pointer', fontSize: 14, color: '#9CA3B5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#B7BCCB', width: 80 }}>{tl('stage').toUpperCase()}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stageColor(selectedTask.stage), background: stageColor(selectedTask.stage) + '18', padding: '3px 9px', borderRadius: 99 }}>{stageLabel(selectedTask.stage)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#B7BCCB', width: 80 }}>{tl('assignee').toUpperCase()}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: gradFor(selectedTask.assignee_name), color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initialsFor(selectedTask.assignee_name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{selectedTask.assignee_name}</span>
                  </div>
                </div>
                {selectedTask.deadline && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#B7BCCB', width: 80 }}>{tl('deadline').toUpperCase()}</span>
                    <span style={{ fontSize: 13, color: '#6B7385' }}>{selectedTask.deadline.slice(0, 10)}</span>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: '#F0F1F6' }} />

              {/* Submitted materials */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B7BCCB', marginBottom: 8 }}>{tl('submittedMaterials').toUpperCase()}</div>
                {selectedTask.results.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedTask.results.map(res => {
                      const isLink = res.kind === 'link'
                      const isImage = res.kind === 'image'
                      const icon = isLink ? '🔗' : isImage ? '🖼️' : '📄'
                      const label = res.file_name ?? (isLink ? res.url : `${res.kind} file`)
                      return (
                        <a key={res.id} href={res.url} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: '1px solid #ECEEF5', background: '#F7F8FC', textDecoration: 'none', color: '#0F1B2D' }}>
                          <span style={{ fontSize: 16 }}>{icon}</span>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                          <span style={{ fontSize: 11, color: '#5B4FE8', fontWeight: 700 }}>{tl('openLink')} →</span>
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#9CA3B5', background: '#F7F8FC', borderRadius: 11, padding: '12px 14px', lineHeight: 1.6, border: '1.5px dashed #DDE0EA' }}>
                    {tl('noMaterials')}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!returning ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => handleApproveTask(selectedTask.id, selectedTask.title)}
                    style={{ width: '100%', height: 44, borderRadius: 12, border: 'none', background: '#00C896', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,200,150,.28)' }}
                  >
                    ✓ {tl('approveBtn')}
                  </button>
                  <button
                    onClick={() => setReturning(true)}
                    style={{ width: '100%', height: 44, borderRadius: 12, border: '1.5px solid #ECEEF5', background: '#fff', color: '#0F1B2D', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {tl('returnForRevision')}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1B2D' }}>{tl('whatToChange')}</div>
                  <textarea
                    value={returnNote}
                    onChange={e => setReturnNote(e.target.value)}
                    placeholder={tl('describeRevision')}
                    autoFocus
                    style={{ width: '100%', height: 90, resize: 'none', borderRadius: 11, border: '1px solid #E5E7F0', background: '#F7F8FC', padding: '10px 12px', fontSize: 13, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleReturnTask(selectedTask.id, selectedTask.title)} style={{ flex: 1, height: 40, borderRadius: 11, border: 'none', background: '#E5484D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{tl('sendBack')}</button>
                    <button onClick={() => { setReturning(false); setReturnNote('') }} style={{ height: 40, padding: '0 14px', borderRadius: 11, border: '1px solid #E5E7F0', background: '#fff', color: '#9CA3B5', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{tl('cancel')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: '#0F1B2D', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 18px', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,27,45,.3)', zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
