'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { gradFor, initialsFor } from '@/lib/utils/avatar'
import { respondToRequest } from '@/app/actions/tasks'

export interface GoalStat {
  id: string; label: string; title: string; color: string
  pct: number; marketing_pct: number; dev_pct: number; sales_pct: number
  status: 'On track' | 'At risk'; meta: string
}

export interface DeptStat {
  id: string; name: string; color: string
  lead_name: string; efficiency_pct: number; battery_pct: number; open_load: number; capacity: number
  in_review: number; status: string
}

export interface ReviewItem {
  id: string; title: string; dept: string; goal_label: string; goal_color: string
  assignee_name: string; when: string; file: string; lead_name: string
}

export interface PriorityReq {
  id: string; title: string; to_dept: string; dept_color: string; status: string; when: string
}

interface Props {
  goals: GoalStat[]
  departments: DeptStat[]
  reviewQueue: ReviewItem[]
  priorityRequests: PriorityReq[]
  workspaceId: string
}

function batColor(pct: number) { return pct >= 50 ? '#00C896' : pct >= 25 ? '#F5A623' : '#E5484D' }
function effColor(pct: number) { return pct >= 85 ? '#00C896' : pct >= 70 ? '#F5A623' : '#E5484D' }

export function CLevelClient({ goals, departments, reviewQueue: initialQueue, priorityRequests }: Props) {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'
  const r = (path: string) => `/${locale}/${path}`
  const t = useTranslations('cLevel')

  const [queue, setQueue] = useState(initialQueue)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2400) }

  async function handleApprove(item: ReviewItem) {
    await respondToRequest(item.id, 'accept').catch(() => {})
    setQueue(q => q.filter(x => x.id !== item.id))
    flash(`"${item.title}" approved — sent to Sync Mind`)
  }

  async function handleReturn(id: string, title: string, assigneeName: string) {
    await respondToRequest(id, 'decline').catch(() => {})
    setQueue(q => q.filter(x => x.id !== id))
    setNoteFor(null); setNote('')
    flash(`Returned to ${assigneeName} with your notes`)
  }

  const overloaded = departments.filter(d => d.open_load >= d.capacity)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '26px 30px 40px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: '#0F1B2D' }}>{t('goodMorning')}, Vera</div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#9CA3B5' }}>COO · C-Level · oversees Marketing, Development and Sales</div>
        </div>
        <a href={r('flow')} style={{ marginLeft: 'auto', height: 40, padding: '0 15px', borderRadius: 11, background: '#6D3FE0', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', boxShadow: '0 6px 14px rgba(109,63,224,.28)' }}>
          ★ {t('newPriorityRequest')}
        </a>
      </div>

      {/* Stat cards */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: t('goalsOnTrack'), value: `${goals.filter(g => g.status === 'On track').length} of ${goals.length}`, sub: goals.find(g => g.status === 'At risk') ? `${goals.find(g => g.status === 'At risk')!.label} · ${goals.find(g => g.status === 'At risk')!.title.split(' ').slice(0,3).join(' ')} ${t('needsAttention')}` : t('allOnTrack'), subColor: '#C77E0A' },
          { label: t('waitingReview'), value: queue.length.toString(), sub: t('finalSignOff'), subColor: '#9CA3B5', valueColor: '#5B4FE8' },
          { label: t('overloadedPeople'), value: overloaded.length.toString(), sub: overloaded.length > 0 ? overloaded.map(d => d.name).join(', ') : t('noOneOverloaded'), subColor: '#9CA3B5', valueColor: overloaded.length > 0 ? '#E5484D' : '#00936E' },
          { label: t('openPriorityReqs'), value: priorityRequests.filter(r => r.status === 'pending').length.toString(), sub: t('waitingOnLeads'), subColor: '#9CA3B5', valueColor: '#6D3FE0' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3B5' }}>{s.label}</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', color: s.valueColor ?? '#0F1B2D' }}>{s.value}</div>
            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: s.subColor }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)', gap: 18 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Company goals */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{t('companyGoals')}</div>
              <a href={r('goals')} style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#5B4FE8', textDecoration: 'none' }}>{t('openPuzzles')}</a>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {goals.map(g => {
                const atRisk = g.status === 'At risk'
                return (
                  <div key={g.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: g.color, padding: '3px 8px', borderRadius: 99 }}>{g.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F1B2D', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: atRisk ? '#C77E0A' : '#00936E', background: atRisk ? 'rgba(245,166,35,.16)' : 'rgba(0,200,150,.14)', padding: '3px 8px', borderRadius: 99 }}>{g.status}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', width: 42, textAlign: 'right' }}>{g.pct}%</span>
                    </div>
                    <div style={{ marginTop: 8, height: 10, borderRadius: 99, background: '#EEF0F6', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${g.marketing_pct}%`, background: '#5B4FE8' }} />
                      <div style={{ width: `${g.dev_pct}%`, background: '#00C896' }} />
                      <div style={{ width: `${g.sales_pct}%`, background: '#F5A623' }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3B5' }}>{g.meta}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 16, fontSize: 12, color: '#6B7385' }}>
              {[['#5B4FE8','Marketing'],['#00C896','Development'],['#F5A623','Sales']].map(([c,n]) => (
                <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />{n}
                </span>
              ))}
              <span style={{ color: '#9CA3B5' }}>· {t('barDesc')}</span>
            </div>
          </div>

          {/* Departments today */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{t('departmentsToday')}</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.2fr .9fr .8fr .9fr', gap: 10, padding: '0 4px 8px', borderBottom: '1px solid #F0F1F6', fontSize: 10, fontWeight: 700, letterSpacing: '.4px', color: '#9CA3B5' }}>
              {[t('colDept'),t('colLead'),t('colEfficiency'),t('colBattery'),t('colInReview'),t('colStatus')].map(h => <span key={h}>{h}</span>)}
            </div>
            {departments.map(d => {
              const over = d.open_load >= d.capacity
              const bc = batColor(d.battery_pct)
              const batFill = `${d.battery_pct}%`
              return (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.2fr .9fr .8fr .9fr', gap: 10, alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid #F5F6FA' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />{d.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3A4253' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: gradFor(d.lead_name), color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initialsFor(d.lead_name)}</span>
                    {d.lead_name.split(' ')[0]}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ flex: 1, height: 6, borderRadius: 99, background: '#EEF0F6', overflow: 'hidden' }}>
                      <span style={{ display: 'block', width: `${d.efficiency_pct}%`, height: '100%', borderRadius: 99, background: effColor(d.efficiency_pct) }} />
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: effColor(d.efficiency_pct) }}>{d.efficiency_pct}%</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ width: 28, height: 14, border: `1.5px solid ${bc}`, borderRadius: 3, padding: 1.5, display: 'block' }}>
                      <span style={{ display: 'block', width: batFill, height: '100%', background: bc, borderRadius: 1 }} />
                    </span>
                    <span style={{ width: 2, height: 6, background: bc, borderRadius: '0 2px 2px 0', display: 'block' }} />
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#9CA3B5' }}>{Math.round((d.capacity - d.open_load) * 10) / 10} {t('left')}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{d.in_review}</span>
                  <span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: over ? '#E5484D' : '#00936E', background: over ? 'rgba(229,72,77,.12)' : 'rgba(0,200,150,.14)', padding: '3px 8px', borderRadius: 99 }}>
                      {over ? t('overload') : t('onTrack')}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Review queue */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{t('needsSignOff')}</div>
              {queue.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#5B4FE8', minWidth: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{queue.length}</span>}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#9CA3B5' }}>{t('tasksDesc')}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queue.map(r => (
                <div key={r.id} style={{ border: noteFor === r.id ? '1px solid #E5484D' : '1px solid #ECEEF5', borderRadius: 13, padding: '12px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, color: r.goal_color, background: r.goal_color + '1A', padding: '2px 7px', borderRadius: 99 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.goal_color }} />{r.goal_label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#9CA3B5' }}>{r.dept} · {r.when}</span>
                  </div>
                  <div style={{ marginTop: 7, fontSize: 14, fontWeight: 700, color: '#0F1B2D' }}>{r.title}</div>
                  <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: gradFor(r.assignee_name), color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initialsFor(r.assignee_name)}</div>
                    <span style={{ fontSize: 12, color: '#6B7385' }}>{r.assignee_name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#5B4FE8', background: '#EEEDFB', padding: '3px 8px', borderRadius: 6 }}>{r.file}</span>
                  </div>
                  <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#00936E' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#00C896', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                    {t('stageApproved')} {r.lead_name}
                  </div>
                  {noteFor !== r.id && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApprove(r)} style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: '#00C896', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('approveToSyncMind')}</button>
                      <button onClick={() => { setNoteFor(r.id); setNote('') }} style={{ flex: 1, height: 36, borderRadius: 10, border: '1px solid #E5E7F0', background: '#fff', color: '#0F1B2D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('returnBtn')}</button>
                    </div>
                  )}
                  {noteFor === r.id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0F1F6' }}>
                      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('returnPlaceholder')} style={{ width: '100%', height: 58, resize: 'none', borderRadius: 10, border: '1px solid #E5E7F0', background: '#F7F8FC', padding: '8px 10px', fontSize: 12, lineHeight: 1.4, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit' }} />
                      <div style={{ marginTop: 7, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleReturn(r.id, r.title, r.assignee_name)} style={{ flex: 1, height: 34, borderRadius: 9, border: 'none', background: '#E5484D', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('sendBackRevision')}</button>
                        <button onClick={() => { setNoteFor(null); setNote('') }} style={{ height: 34, padding: '0 12px', borderRadius: 9, border: '1px solid #E5E7F0', background: '#fff', color: '#6B7385', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('cancel')}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {queue.length === 0 && (
                <div style={{ border: '1.5px dashed #DDE0EA', borderRadius: 12, padding: 20, textAlign: 'center', fontSize: 13, color: '#B7BCCB' }}>{t('allSignedOff')}</div>
              )}
            </div>
          </div>

          {/* Priority requests */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF5', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(15,27,45,.04)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{t('yourPriorityReqs')}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {priorityRequests.map(q => {
                const pending = q.status === 'pending'
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #F0F1F6', borderRadius: 11, padding: '10px 12px' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: q.dept_color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: '#9CA3B5' }}>{t('to')} {q.to_dept} · {q.when}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: pending ? '#C77E0A' : '#00936E', background: pending ? 'rgba(245,166,35,.16)' : 'rgba(0,200,150,.14)', padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                      {pending ? t('waiting') : t('accepted')}
                    </span>
                  </div>
                )
              })}
              {priorityRequests.length === 0 && (
                <div style={{ border: '1.5px dashed #DDE0EA', borderRadius: 12, padding: 16, textAlign: 'center', fontSize: 13, color: '#B7BCCB' }}>{t('noPriorityReqs')}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: '#0F1B2D', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 18px', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,27,45,.3)', zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
