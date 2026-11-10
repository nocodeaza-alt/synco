'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { gradFor, initialsFor } from '@/lib/utils/avatar'
import { markNotificationRead, markAllNotificationsRead } from '@/app/actions/tasks'

export interface NotifItem {
  id: string; type: string; title: string; body: string | null; link: string | null
  actor_name: string | null; read: boolean; created_at: string; group: 'Today' | 'Earlier'
}

interface Props {
  notifications: NotifItem[]
  unreadCount: number
}

type Tab = 'All' | 'Unread' | 'Reviews' | 'Requests' | 'Goals'

const TAB_TYPES: Record<Tab, string[] | null> = {
  All: null,
  Unread: null,
  Reviews: ['review_approved', 'review_returned', 'review_request'],
  Requests: ['request_accepted', 'request_declined', 'priority_request'],
  Goals: ['goal_created', 'goal_progress', 'goal_done'],
}

function typeIcon(type: string) {
  if (type.includes('review')) return { bg: '#5B4FE8', label: '✓' }
  if (type.includes('request') || type.includes('priority')) return { bg: '#6D3FE0', label: '★' }
  if (type.includes('goal')) return { bg: '#00C896', label: '◆' }
  if (type.includes('mention')) return { bg: '#F5A623', label: '@' }
  return { bg: '#9CA3B5', label: '·' }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function NotificationsClient({ notifications: initNotifs, unreadCount: initCount }: Props) {
  const nt = useTranslations('notificationsPage')
  const [notifs, setNotifs] = useState(initNotifs)
  const [tab, setTab] = useState<Tab>('All')
  const [unread, setUnread] = useState(initCount)
  const [toast, setToast] = useState('')

  function tabLabel(tb: Tab) {
    if (tb === 'All') return nt('tabAll')
    if (tb === 'Unread') return nt('tabUnread')
    if (tb === 'Reviews') return nt('tabReviews')
    if (tb === 'Requests') return nt('tabRequests')
    return nt('tabGoals')
  }

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2400) }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id).catch(() => {})
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    setUnread(c => Math.max(0, c - 1))
  }

  async function handleMarkAll() {
    await markAllNotificationsRead().catch(() => {})
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    setUnread(0)
    flash('All notifications marked as read')
  }

  const filtered = notifs.filter(n => {
    if (tab === 'Unread') return !n.read
    const types = TAB_TYPES[tab]
    if (types) return types.some(t => n.type.includes(t.split('_')[0]))
    return true
  })

  const groups = ['Today', 'Earlier'] as const
  const grouped = groups.map(g => ({ label: g, items: filtered.filter(n => n.group === g) })).filter(g => g.items.length > 0)

  const tabs: Tab[] = ['All', 'Unread', 'Reviews', 'Requests', 'Goals']

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 740, margin: '0 auto', width: '100%', padding: '26px 20px 40px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: '#0F1B2D' }}>{nt('title')}</div>
        {unread > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#5B4FE8', minWidth: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px' }}>{unread}</span>
        )}
        {unread > 0 && (
          <button onClick={handleMarkAll} style={{ marginLeft: 'auto', height: 34, padding: '0 14px', borderRadius: 10, border: '1px solid #ECEEF5', background: '#fff', color: '#5B4FE8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {nt('markAllRead')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
        {tabs.map(t => {
          const active = tab === t
          const cnt = t === 'Unread' ? unread : null
          return (
            <button key={t} onClick={() => setTab(t)} style={{ height: 32, padding: '0 13px', borderRadius: 99, border: active ? '1.5px solid #5B4FE8' : '1.5px solid #ECEEF5', background: active ? '#5B4FE8' : '#fff', color: active ? '#fff' : '#6B7385', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {tabLabel(t)}
              {cnt != null && cnt > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#fff' : '#5B4FE8', background: active ? 'rgba(255,255,255,.2)' : 'rgba(91,79,232,.12)', borderRadius: 99, padding: '0 5px', lineHeight: '16px' }}>{cnt}</span>}
            </button>
          )
        })}
      </div>

      {/* Groups */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {grouped.length === 0 && (
          <div style={{ background: '#fff', border: '1.5px dashed #DDE0EA', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>🔔</div>
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: '#B7BCCB' }}>{nt('allCaughtUp')}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#D0D3DE' }}>{nt('noInFilter')}</div>
          </div>
        )}
        {grouped.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.8px', color: '#B7BCCB', marginBottom: 8 }}>{(group.label === 'Today' ? nt('today') : nt('earlier')).toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map((n, idx) => {
                const icon = typeIcon(n.type)
                const actorName = n.actor_name ?? 'System'
                const isLast = idx === group.items.length - 1
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.read) handleMarkRead(n.id) }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                      background: n.read ? '#fff' : '#F3F2FD',
                      borderRadius: idx === 0 ? '14px 14px 0 0' : isLast ? '0 0 14px 14px' : 0,
                      border: '1px solid #ECEEF5',
                      borderTop: idx === 0 ? '1px solid #ECEEF5' : 'none',
                      cursor: n.read ? 'default' : 'pointer',
                    }}
                  >
                    {/* Actor avatar / icon */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: gradFor(actorName), color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {initialsFor(actorName)}
                      </div>
                      <div style={{ position: 'absolute', right: -2, bottom: -2, width: 16, height: 16, borderRadius: '50%', background: icon.bg, color: '#fff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                        {icon.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: '#0F1B2D' }}>{n.title}</span>
                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B4FE8', flexShrink: 0 }} />}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#B7BCCB', whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</span>
                      </div>
                      {n.body && <div style={{ marginTop: 3, fontSize: 12, color: '#6B7385', lineHeight: 1.4 }}>{n.body}</div>}
                      {n.link && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 7 }}>
                          <a href={n.link} style={{ height: 28, padding: '0 12px', borderRadius: 8, border: 'none', background: '#5B4FE8', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                            {n.type.includes('review') ? nt('reviewNow') : n.type.includes('request') ? nt('openRequest') : nt('view')}
                          </a>
                          {!n.read && (
                            <button onClick={e => { e.stopPropagation(); handleMarkRead(n.id) }} style={{ height: 28, padding: '0 12px', borderRadius: 8, border: '1px solid #E5E7F0', background: '#fff', color: '#6B7385', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              {nt('dismiss')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: '#0F1B2D', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 18px', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,27,45,.3)', zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
