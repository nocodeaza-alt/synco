'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveMeetLink, sendKnock, createOfficeRoom, saveMeetingNotes } from '@/app/actions/brainstorm'

interface Room {
  id: string; name: string; description: string; type: string
  color: string; meet_link: string | null; sort: number
}
interface Member {
  id: string; user_id: string; role: string; position: string; department_id: string | null
  profiles: { full_name: string } | null
  departments: { name: string; color: string } | null
  tasks: { id: string; title: string; stage: string }[] | null
}
interface LiveSession { id: string; topic: string; started_at: string }
interface PastMeeting {
  id: string; title: string; created_at: string
  metadata: { room_name?: string; participants?: string[]; messages?: { author: string; body: string; at: string }[]; meeting_date?: string } | null
}

interface Props {
  workspaceId: string
  workspaceName: string
  rooms: Room[]
  members: Member[]
  liveSession: LiveSession | null
  pastMeetings: PastMeeting[]
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000004' // Tom Reyes
const DEMO_MEMBER_ID = '40000000-0000-0000-0000-000000000004'

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

const STATUS_OPTS = [
  { key: 'available', label: 'Available',    dot: '#00C896', color: '#00936E', bg: 'rgba(0,200,150,.12)' },
  { key: 'focus',     label: 'In focus',     dot: '#8B5CF6', color: '#6D3FE0', bg: '#F1EEFD' },
  { key: 'meeting',   label: 'In a meeting', dot: '#F5A623', color: '#C77E0A', bg: 'rgba(245,166,35,.14)' },
  { key: 'away',      label: 'Away',         dot: '#C3C9D6', color: '#6B7385', bg: '#EEF0F6' },
]

// Demo room assignments (userId → roomId)
const DEMO_ROOMS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000003': 'c0000000-0000-0000-0000-000000000001', // Jane → Marketing
  '00000000-0000-0000-0000-000000000004': 'c0000000-0000-0000-0000-000000000001', // Tom → Marketing
  '00000000-0000-0000-0000-000000000005': 'c0000000-0000-0000-0000-000000000001', // Mia → Marketing
  '00000000-0000-0000-0000-000000000007': 'c0000000-0000-0000-0000-000000000002', // Alex → Dev
  '00000000-0000-0000-0000-000000000009': 'c0000000-0000-0000-0000-000000000002', // Lena → Dev
  '00000000-0000-0000-0000-000000000008': 'c0000000-0000-0000-0000-000000000005', // Sam → Focus
  '00000000-0000-0000-0000-000000000010': 'c0000000-0000-0000-0000-000000000003', // Omar → Sales
  '00000000-0000-0000-0000-000000000001': 'c0000000-0000-0000-0000-000000000004', // Olga → War room
  '00000000-0000-0000-0000-000000000002': 'c0000000-0000-0000-0000-000000000004', // Vera → War room
  '00000000-0000-0000-0000-000000000011': 'c0000000-0000-0000-0000-000000000006', // Ria → Lounge
}
const DEMO_STATUSES: Record<string, string> = {
  '00000000-0000-0000-0000-000000000003': 'available',
  '00000000-0000-0000-0000-000000000004': 'available',
  '00000000-0000-0000-0000-000000000005': 'available',
  '00000000-0000-0000-0000-000000000007': 'meeting',
  '00000000-0000-0000-0000-000000000009': 'meeting',
  '00000000-0000-0000-0000-000000000008': 'focus',
  '00000000-0000-0000-0000-000000000010': 'meeting',
  '00000000-0000-0000-0000-000000000001': 'meeting',
  '00000000-0000-0000-0000-000000000002': 'meeting',
  '00000000-0000-0000-0000-000000000011': 'away',
}

function memberName(m: Member) { return m.profiles?.full_name ?? m.position }
function memberInitials(m: Member) {
  const n = memberName(m); return n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function OfficeClient({ workspaceId, workspaceName, rooms, members, liveSession, pastMeetings }: Props) {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'
  const r = (path: string) => `/${locale}/${path}`

  // Presence state: userId → { roomId, status }
  const [presence, setPresence] = useState<Record<string, { roomId: string | null; status: string }>>(() => {
    const init: Record<string, { roomId: string | null; status: string }> = {}
    members.forEach(m => {
      init[m.user_id] = {
        roomId: DEMO_ROOMS[m.user_id] ?? null,
        status: DEMO_STATUSES[m.user_id] ?? 'available',
      }
    })
    return init
  })

  const [myStatus, setMyStatus] = useState<string>('available')
  const [myRoomId, setMyRoomId] = useState<string | null>(DEMO_ROOMS[DEMO_USER_ID] ?? null)
  const [selPerson, setSelPerson] = useState<Member | null>(null)
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [linkDraft, setLinkDraft] = useState('')
  const [roomLinks, setRoomLinks] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    rooms.forEach(r => { if (r.meet_link) m[r.id] = r.meet_link })
    return m
  })
  const [knocked, setKnocked] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')
  const [onlineCount] = useState(members.filter(m => (DEMO_STATUSES[m.user_id] ?? 'available') !== 'away').length)
  const [meetingMessages, setMeetingMessages] = useState<{ author: string; body: string; at: string }[]>([])
  const [meetingDraft, setMeetingDraft] = useState('')
  const [meetingStartedAt, setMeetingStartedAt] = useState<string | null>(
    DEMO_ROOMS[DEMO_USER_ID] ? new Date().toISOString() : null
  )
  const [endingMeeting, setEndingMeeting] = useState(false)
  const [localPastMeetings, setLocalPastMeetings] = useState<PastMeeting[]>(pastMeetings)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomColor, setNewRoomColor] = useState('#5B4FE8')
  const [newRoomLink, setNewRoomLink] = useState('')
  const [newRoomStartTime, setNewRoomStartTime] = useState('')
  const [savingRoom, setSavingRoom] = useState(false)
  const [localRooms, setLocalRooms] = useState<Room[]>(rooms)

  // Supabase Realtime Presence
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`office:${workspaceId}`, { config: { presence: { key: DEMO_USER_ID } } })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ roomId: string | null; status: string }>()
        const next: Record<string, { roomId: string | null; status: string }> = { ...presence }
        Object.entries(state).forEach(([uid, payloads]) => {
          if (payloads[0]) next[uid] = { roomId: payloads[0].roomId, status: payloads[0].status }
        })
        setPresence(next)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ roomId: myRoomId, status: myStatus })
        }
      })

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getRoomPeople(roomId: string) {
    return members.filter(m => (presence[m.user_id]?.roomId ?? DEMO_ROOMS[m.user_id]) === roomId)
  }

  async function handleMoveToRoom(roomId: string) {
    if (myRoomId === roomId) return
    setMyRoomId(roomId)
    setMeetingStartedAt(new Date().toISOString())
    setMeetingMessages([])
    setMeetingDraft('')
    setPresence(prev => ({ ...prev, [DEMO_USER_ID]: { roomId, status: myStatus } }))
  }


  async function handleSaveLink(roomId: string) {
    const link = linkDraft.trim()
    setRoomLinks(prev => ({ ...prev, [roomId]: link }))
    setEditingRoom(null)
    setLinkDraft('')
    await saveMeetLink(roomId, link)
  }

  async function handleCreateRoom() {
    if (!newRoomName.trim()) return
    setSavingRoom(true)
    const res = await createOfficeRoom({
      workspaceId,
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      color: newRoomColor,
      meetLink: newRoomLink.trim() || undefined,
    })
    setSavingRoom(false)
    if (res.error) { showToast('Error: ' + res.error); return }
    if (res.room) {
      const r = res.room as Room
      setLocalRooms(prev => [...prev, r])
      if (r.meet_link) setRoomLinks(prev => ({ ...prev, [r.id]: r.meet_link! }))
      // Auto-join the newly created room and set start time
      const startTime = newRoomStartTime
        ? new Date(newRoomStartTime).toISOString()
        : new Date().toISOString()
      setMyRoomId(r.id)
      setMeetingStartedAt(startTime)
      setMeetingMessages([])
      setMeetingDraft('')
      setPresence(prev => ({ ...prev, [DEMO_USER_ID]: { roomId: r.id, status: myStatus } }))
    }
    setShowNewRoom(false)
    setNewRoomName(''); setNewRoomDesc(''); setNewRoomColor('#5B4FE8'); setNewRoomLink(''); setNewRoomStartTime('')
    showToast(`Room "${newRoomName.trim()}" created`)
  }

  function handlePostNote() {
    if (!meetingDraft.trim() || !myRoomId) return
    const me = members.find(m => m.user_id === DEMO_USER_ID)
    const author = me ? memberName(me) : 'You'
    setMeetingMessages(prev => [...prev, { author, body: meetingDraft.trim(), at: new Date().toISOString() }])
    setMeetingDraft('')
  }

  async function handleEndMeeting() {
    if (!myRoomId || endingMeeting) return
    setEndingMeeting(true)
    const room = localRooms.find(r => r.id === myRoomId)
    const roomPeople = getRoomPeople(myRoomId)
    const participantIds = roomPeople.map(p => p.user_id)
    const allMessages = meetingMessages

    if (allMessages.length > 0) {
      const notesText = allMessages.map(m => `${m.author}: ${m.body}`).join('\n')
      await saveMeetingNotes({
        workspaceId,
        roomId: myRoomId,
        roomName: room?.name ?? 'Room',
        notes: notesText,
        messages: allMessages,
        authorId: DEMO_USER_ID,
        participantIds,
      })
    }
    // Add to local past meetings immediately
    if (allMessages.length > 0 && room) {
      const newPast: PastMeeting = {
        id: `local-${Date.now()}`,
        title: `Meeting notes: ${room.name} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        created_at: new Date().toISOString(),
        metadata: {
          room_name: room.name,
          participants: getRoomPeople(myRoomId).map(p => members.find(m => m.id === p.id) ? memberName(members.find(m => m.id === p.id)!) : ''),
          messages: allMessages,
          meeting_date: new Date().toISOString(),
        },
      }
      setLocalPastMeetings(prev => [newPast, ...prev])
    }
    setMyRoomId(null)
    setMeetingStartedAt(null)
    setPresence(prev => ({ ...prev, [DEMO_USER_ID]: { roomId: null, status: myStatus } }))
    setMeetingMessages([])
    setMeetingDraft('')
    setEndingMeeting(false)
    showToast(allMessages.length > 0 ? 'Meeting ended · notes saved to Sync Mind' : 'Meeting ended')
  }

  async function handleKnock(person: Member) {
    setKnocked(prev => ({ ...prev, [person.user_id]: true }))
    showToast(`Knock sent to ${memberName(person).split(' ')[0]}`)
    await sendKnock(DEMO_USER_ID, person.user_id, myRoomId ?? '')
  }

  function statusFor(uid: string) {
    if (uid === DEMO_USER_ID) return myStatus
    return presence[uid]?.status ?? DEMO_STATUSES[uid] ?? 'available'
  }
  function roomFor(uid: string) {
    if (uid === DEMO_USER_ID) return myRoomId
    return presence[uid]?.roomId ?? DEMO_ROOMS[uid] ?? null
  }

  const statusMeta = (key: string) => STATUS_OPTS.find(s => s.key === key) ?? STATUS_OPTS[0]


  const statusCounts = STATUS_OPTS.map(s => ({
    ...s,
    count: members.filter(m => statusFor(m.user_id) === s.key).length,
  }))

  function providerLabel(link: string) {
    if (link.includes('meet.google')) return { mono: 'GM', bg: '#1A73E8' }
    if (link.includes('zoom.us')) return { mono: 'Z', bg: '#2D8CFF' }
    if (link.includes('teams')) return { mono: 'T', bg: '#5059C9' }
    return { mono: '↗', bg: '#5B4FE8' }
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, fontFamily: "'Inter',system-ui,sans-serif", position: 'relative' }}>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Sub-header */}
        <div style={{ flexShrink: 0, padding: '18px 26px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: '#0F1B2D' }}>{workspaceName} HQ</div>
            <div style={{ marginTop: 2, fontSize: 13, color: '#9CA3B5' }}>{onlineCount} online right now</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowNewRoom(true)}
              style={{ height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#5B4FE8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              + New Room
            </button>
          </div>
        </div>

        {/* Live brainstorm banner */}
        {liveSession && (
          <a href={r('brainstorm')} style={{ margin: '14px 26px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#0F1B2D', color: '#fff', textDecoration: 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E5484D', animation: 'pulse 1.2s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Brainstorm live now</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{liveSession.topic}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#B9B2FF', flexShrink: 0 }}>Join →</span>
          </a>
        )}

        {/* Rooms grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 26px 110px' }}>
          {localRooms.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', fontSize: 14, color: '#B7BCCB' }}>
              No rooms set up yet. Run the Phase 6 migration and seed.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gridAutoRows: 'minmax(230px,auto)', gap: 14 }}>
              {localRooms.map(room => {
                const people = getRoomPeople(room.id)
                const isEditing = editingRoom === room.id
                const link = roomLinks[room.id] ?? null
                const hasLink = !!link
                const imHere = myRoomId === room.id
                const prov = hasLink ? providerLabel(link) : null
                const onCall = people.some(p => statusFor(p.user_id) === 'meeting')

                return (
                  <div
                    key={room.id}
                    style={{ position: 'relative', borderRadius: 18, padding: 16, background: imHere ? 'rgba(91,79,232,.04)' : '#fff', border: `1.5px solid ${imHere ? '#C8C4F5' : '#ECEEF5'}`, boxShadow: imHere ? '0 4px 20px rgba(91,79,232,.1)' : '0 2px 10px rgba(15,27,45,.04)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => { if (!isEditing) setSelPerson(null) }}
                  >
                    {/* Room header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: room.color }} />
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1B2D' }}>{room.name}</div>
                      {onCall && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: '.4px', color: '#E5484D', background: 'rgba(229,72,77,.1)', padding: '3px 7px', borderRadius: 99 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E5484D', animation: 'pulse 1.2s infinite' }} />
                          ON A CALL
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#9CA3B5' }}>{people.length}</span>
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: '#8A91A3' }}>{room.description}</div>

                    {/* Meet link */}
                    {!isEditing && hasLink && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 10, background: '#F7F8FC', border: '1px solid #ECEEF5' }}
                      >
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: prov!.bg, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{prov!.mono}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: '#3A4253', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</span>
                        <span
                          onClick={e => { e.stopPropagation(); setEditingRoom(room.id); setLinkDraft(link) }}
                          style={{ cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#5B4FE8' }}
                        >
                          Edit
                        </span>
                      </div>
                    )}

                    {!isEditing && !hasLink && (
                      <div
                        onClick={e => { e.stopPropagation(); setEditingRoom(room.id); setLinkDraft('') }}
                        style={{ marginTop: 10, cursor: 'pointer', height: 34, borderRadius: 10, border: '1.5px dashed #D5D9E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#9CA3B5' }}
                      >
                        + Add meeting link
                      </div>
                    )}

                    {/* Edit link input */}
                    {isEditing && (
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                        <input
                          autoFocus
                          value={linkDraft}
                          onChange={e => setLinkDraft(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveLink(room.id)}
                          placeholder="Paste a Google Meet or Zoom link"
                          style={{ flex: 1, minWidth: 0, height: 34, borderRadius: 9, border: '1px solid #5B4FE8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit' }}
                        />
                        <button onClick={() => handleSaveLink(room.id)} style={{ height: 34, padding: '0 12px', borderRadius: 9, border: 'none', background: '#5B4FE8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      </div>
                    )}

                    {/* People in room */}
                    <div style={{ flex: 1, marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 14, alignContent: 'flex-start' }}>
                      {people.map(p => {
                        const st = statusFor(p.user_id)
                        const stMeta = statusMeta(st)
                        const isMe = p.user_id === DEMO_USER_ID
                        return (
                          <div
                            key={p.id}
                            onClick={e => { e.stopPropagation(); setSelPerson(selPerson?.id === p.id ? null : p) }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 64, cursor: 'pointer' }}
                          >
                            <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', padding: 3, background: selPerson?.id === p.id ? stMeta.dot : 'transparent', boxShadow: selPerson?.id === p.id ? `0 0 0 2px ${stMeta.dot}` : 'none' }}>
                              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: GRADS[p.user_id] ?? '#B7BCCB', border: '2px solid #fff', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: st === 'away' ? 0.5 : 1 }}>
                                {memberInitials(p)}
                              </div>
                              {isMe && <div style={{ position: 'absolute', left: '50%', top: -8, transform: 'translateX(-50%)', fontSize: 8, fontWeight: 800, letterSpacing: '.4px', color: '#fff', background: '#0F1B2D', padding: '2px 6px', borderRadius: 99 }}>YOU</div>}
                              <div style={{ position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%', background: stMeta.dot, border: '2px solid #fff' }} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#0F1B2D', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 64 }}>
                              {memberName(p).split(' ')[0]}
                            </div>
                          </div>
                        )
                      })}
                      {people.length === 0 && (
                        <div style={{ width: '100%', fontSize: 12, color: '#B7BCCB' }}>Empty right now</div>
                      )}
                    </div>

                    {/* Move / You're here */}
                    {imHere ? (
                      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: '#5B4FE8' }}>● You&apos;re here</div>
                    ) : (
                      <div style={{ marginTop: 12 }}>
                        <button
                          onClick={e => { e.stopPropagation(); handleMoveToRoom(room.id) }}
                          style={{ height: 34, padding: '0 13px', borderRadius: 9, border: '1px solid #E5E7F0', background: '#fff', color: '#0F1B2D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Move here
                        </button>
                        {hasLink && (
                          <a
                            href={`https://${link}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ marginLeft: 8, height: 34, padding: '0 13px', borderRadius: 9, border: '1px solid #C8C4F5', background: '#EEEDFB', color: '#5B4FE8', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            Join ↗
                          </a>
                        )}
                      </div>
                    )}
                    {imHere && hasLink && (
                      <a
                        href={`https://${link}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ marginTop: 8, height: 34, padding: '0 13px', borderRadius: 9, border: '1px solid #C8C4F5', background: '#EEEDFB', color: '#5B4FE8', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}
                      >
                        Join meeting ↗
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {/* Past meetings (last 24h) */}
          {localPastMeetings.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.6px', color: '#B7BCCB', marginBottom: 12 }}>PAST MEETINGS · LAST 24H</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
                {localPastMeetings.map(pm => {
                  const m = pm.metadata
                  const duration = m?.meeting_date
                    ? Math.round((new Date(pm.created_at).getTime() - new Date(m.meeting_date).getTime()) / 60000)
                    : null
                  return (
                    <div key={pm.id} style={{ borderRadius: 14, padding: '14px 16px', background: '#F4F5F9', border: '1px solid #E8EAF0', opacity: 0.85 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>📋</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#6B7385', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m?.room_name ?? 'Meeting'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3B5', marginBottom: 8 }}>
                        {new Date(pm.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {duration !== null && duration > 0 ? ` · ${duration} min` : ''}
                      </div>
                      {(m?.participants?.length ?? 0) > 0 && (
                        <div style={{ fontSize: 11, color: '#9CA3B5', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: '#B7BCCB' }}>Attended: </span>
                          {m!.participants!.filter(Boolean).join(', ')}
                        </div>
                      )}
                      {(m?.messages?.length ?? 0) > 0 && (
                        <div style={{ fontSize: 11, color: '#9CA3B5' }}>
                          {m!.messages!.length} note{m!.messages!.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: 340, flexShrink: 0, background: '#fff', borderLeft: '1px solid #ECEEF5', overflowY: 'auto', padding: 20 }}>
        {selPerson ? (
          /* Person detail */
          <div style={{ animation: 'fadeUp .2s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', padding: 3, background: statusMeta(statusFor(selPerson.user_id)).dot }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: GRADS[selPerson.user_id] ?? '#B7BCCB', border: '2px solid #fff', color: '#fff', fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {memberInitials(selPerson)}
                </div>
              </div>
              <button onClick={() => setSelPerson(null)} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, background: '#F2F3F9', border: 'none', fontSize: 17, color: '#6B7385', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ marginTop: 12, fontSize: 19, fontWeight: 800, color: '#0F1B2D' }}>{memberName(selPerson)}</div>
            <div style={{ marginTop: 2, fontSize: 13, color: '#9CA3B5' }}>{selPerson.position} · {selPerson.departments?.name ?? 'Leadership'}</div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 99, background: statusMeta(statusFor(selPerson.user_id)).bg }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusMeta(statusFor(selPerson.user_id)).dot }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: statusMeta(statusFor(selPerson.user_id)).color }}>{statusMeta(statusFor(selPerson.user_id)).label}</span>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: '#F7F8FC', borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3B5' }}>Room</div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{localRooms.find(r => r.id === roomFor(selPerson.user_id))?.name ?? 'Not in a room'}</div>
              </div>
              <div style={{ background: '#F7F8FC', borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3B5' }}>Working on</div>
                <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>
                  {(selPerson.tasks ?? []).find((t: { stage: string }) => ['in_progress', 'ready', 'in_review'].includes(t.stage))?.title ?? 'No active task'}
                </div>
              </div>
            </div>

            {statusFor(selPerson.user_id) === 'focus' && (
              <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.45, color: '#6D3FE0', background: '#F1EEFD', borderRadius: 10, padding: '9px 11px' }}>
                In focus — a knock is delivered quietly and shown when they come back.
              </div>
            )}

            {selPerson.user_id !== DEMO_USER_ID && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleKnock(selPerson)}
                  disabled={knocked[selPerson.user_id]}
                  style={{ flex: 1, height: 42, borderRadius: 11, border: 'none', background: knocked[selPerson.user_id] ? '#ECEEF5' : '#5B4FE8', color: knocked[selPerson.user_id] ? '#B7BCCB' : '#fff', fontSize: 13, fontWeight: 700, cursor: knocked[selPerson.user_id] ? 'default' : 'pointer' }}
                >
                  {knocked[selPerson.user_id] ? 'Knocked ✓' : '🔔 Knock'}
                </button>
                {roomFor(selPerson.user_id) !== myRoomId && (
                  <button
                    onClick={() => { handleMoveToRoom(roomFor(selPerson.user_id) ?? ''); setSelPerson(null) }}
                    style={{ flex: 1, height: 42, borderRadius: 11, border: '1px solid #E5E7F0', background: '#fff', color: '#0F1B2D', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Join room
                  </button>
                )}
              </div>
            )}
          </div>
        ) : myRoomId ? (
          /* Meeting card — user is in a room */
          (() => {
            const curRoom = localRooms.find(r => r.id === myRoomId)
            const roomPeople = getRoomPeople(myRoomId)
            const link = roomLinks[myRoomId] ?? null
            return (
              <div style={{ animation: 'fadeUp .2s ease both' }}>
                {/* Room header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: curRoom?.color ?? '#5B4FE8', flexShrink: 0 }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>{curRoom?.name ?? 'Room'}</div>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, color: '#E5484D', background: 'rgba(229,72,77,.1)', padding: '3px 8px', borderRadius: 99 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E5484D', animation: 'pulse 1.2s infinite' }} />
                    LIVE
                  </span>
                </div>
                {meetingStartedAt && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#9CA3B5' }}>
                    Started {new Date(meetingStartedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {curRoom?.description ? ` · ${curRoom.description}` : ''}
                  </div>
                )}

                {/* Participants */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 10 }}>PARTICIPANTS · {roomPeople.length}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {roomPeople.map(p => {
                      const st = statusFor(p.user_id)
                      const stMeta = statusMeta(st)
                      const isMe = p.user_id === DEMO_USER_ID
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 10, background: isMe ? 'rgba(91,79,232,.04)' : '#F7F8FC', border: `1px solid ${isMe ? '#C8C4F5' : '#F0F1F6'}` }}>
                          <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: GRADS[p.user_id] ?? '#B7BCCB', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{memberInitials(p)}</div>
                            <div style={{ position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: '50%', background: stMeta.dot, border: '2px solid #fff' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{memberName(p)}{isMe ? ' (you)' : ''}</div>
                            <div style={{ fontSize: 11, color: '#9CA3B5' }}>{stMeta.label}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Join meeting link */}
                {link && (
                  <a
                    href={`https://${link}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 11, background: '#EEEDFB', border: '1px solid #C8C4F5', textDecoration: 'none' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#5B4FE8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#5B4FE8', flexShrink: 0 }}>↗</span>
                  </a>
                )}

                {/* Notes feed */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.5px', color: '#B7BCCB', marginBottom: 8 }}>
                    NOTES{meetingMessages.length > 0 ? ` · ${meetingMessages.length}` : ''}
                  </div>

                  {/* Messages list */}
                  {meetingMessages.length > 0 && (
                    <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                      {meetingMessages.map((msg, i) => (
                        <div key={i} style={{ padding: '8px 10px', background: '#F7F8FC', borderRadius: 9, border: '1px solid #ECEEF5' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#5B4FE8' }}>{msg.author}</span>
                            <span style={{ fontSize: 10, color: '#C3C9D6' }}>
                              {new Date(msg.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: '#0F1B2D', lineHeight: 1.5 }}>{msg.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {meetingMessages.length === 0 && (
                    <div style={{ marginBottom: 10, padding: '12px', textAlign: 'center', fontSize: 12, color: '#C3C9D6', background: '#F7F8FC', borderRadius: 9, border: '1px solid #ECEEF5' }}>
                      No notes yet — add the first one
                    </div>
                  )}

                  {/* Input */}
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input
                      value={meetingDraft}
                      onChange={e => setMeetingDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePostNote()}
                      placeholder="Add a note or action item…"
                      style={{ flex: 1, height: 38, borderRadius: 10, border: '1.5px solid #ECEEF5', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <button
                      onClick={handlePostNote}
                      disabled={!meetingDraft.trim()}
                      style={{ height: 38, padding: '0 13px', borderRadius: 10, border: 'none', background: !meetingDraft.trim() ? '#ECEEF5' : '#5B4FE8', color: !meetingDraft.trim() ? '#B7BCCB' : '#fff', fontSize: 13, fontWeight: 700, cursor: !meetingDraft.trim() ? 'default' : 'pointer' }}
                    >
                      Post
                    </button>
                  </div>
                  <div style={{ marginTop: 5, fontSize: 11, color: '#B7BCCB' }}>Saved to Sync Mind when you end the meeting</div>
                </div>

                {/* End meeting */}
                <button
                  onClick={handleEndMeeting}
                  disabled={endingMeeting}
                  style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, border: 'none', background: endingMeeting ? '#ECEEF5' : '#0F1B2D', color: endingMeeting ? '#B7BCCB' : '#fff', fontSize: 14, fontWeight: 800, cursor: endingMeeting ? 'default' : 'pointer' }}
                >
                  {endingMeeting ? 'Saving…' : 'End meeting'}
                </button>
              </div>
            )
          })()
        ) : (
          /* Who's around */
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F1B2D' }}>Who&apos;s around</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {statusCounts.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F8FC', borderRadius: 10, padding: '9px 11px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0F1B2D', flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F1B2D' }}>{s.count}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map(p => {
                const st = statusFor(p.user_id)
                const stMeta = statusMeta(st)
                const room = localRooms.find(r => r.id === roomFor(p.user_id))
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelPerson(p)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 11, border: '1px solid #F0F1F6' }}
                  >
                    <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: GRADS[p.user_id] ?? '#B7BCCB', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{memberInitials(p)}</div>
                      <div style={{ position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: '50%', background: stMeta.dot, border: '2px solid #fff' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D' }}>{memberName(p)}</div>
                      <div style={{ fontSize: 11, color: '#9CA3B5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room?.name ?? 'Not in a room'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* New Room Modal */}
      {showNewRoom && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowNewRoom(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 440, background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 24px 64px rgba(15,27,45,.25)', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1B2D' }}>New Room</div>
              <button onClick={() => setShowNewRoom(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#B7BCCB', cursor: 'pointer' }}>×</button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7385', display: 'block', marginBottom: 6 }}>Room name *</label>
              <input
                autoFocus
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="e.g. Design Room"
                style={{ width: '100%', height: 42, borderRadius: 11, border: '1.5px solid #ECEEF5', background: '#fff', padding: '0 14px', fontSize: 14, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7385', display: 'block', marginBottom: 6 }}>Description</label>
              <input
                value={newRoomDesc}
                onChange={e => setNewRoomDesc(e.target.value)}
                placeholder="What is this room for?"
                style={{ width: '100%', height: 42, borderRadius: 11, border: '1.5px solid #ECEEF5', background: '#fff', padding: '0 14px', fontSize: 14, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7385', display: 'block', marginBottom: 6 }}>Start time (optional)</label>
              <input
                type="datetime-local"
                value={newRoomStartTime}
                onChange={e => setNewRoomStartTime(e.target.value)}
                style={{ width: '100%', height: 42, borderRadius: 11, border: '1.5px solid #ECEEF5', background: '#fff', padding: '0 14px', fontSize: 14, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7385', display: 'block', marginBottom: 8 }}>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#5B4FE8', '#00C896', '#F5A623', '#E5484D', '#8B5CF6', '#0F1B2D', '#1A73E8', '#2D8CFF'].map(c => (
                  <div
                    key={c}
                    onClick={() => setNewRoomColor(c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: newRoomColor === c ? '3px solid #0F1B2D' : '3px solid transparent', boxSizing: 'border-box' }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7385', display: 'block', marginBottom: 6 }}>Meeting link (optional)</label>
              <input
                value={newRoomLink}
                onChange={e => setNewRoomLink(e.target.value)}
                placeholder="meet.google.com/abc-defg or zoom link"
                style={{ width: '100%', height: 42, borderRadius: 11, border: '1.5px solid #ECEEF5', background: '#fff', padding: '0 14px', fontSize: 14, color: '#0F1B2D', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowNewRoom(false)}
                style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid #ECEEF5', background: '#fff', color: '#6B7385', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || savingRoom}
                style={{ flex: 2, height: 44, borderRadius: 12, border: 'none', background: !newRoomName.trim() ? '#ECEEF5' : '#5B4FE8', color: !newRoomName.trim() ? '#B7BCCB' : '#fff', fontSize: 14, fontWeight: 700, cursor: !newRoomName.trim() ? 'default' : 'pointer' }}
              >
                {savingRoom ? 'Creating…' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'absolute', left: '50%', top: 16, transform: 'translateX(-50%)', background: '#0F1B2D', color: '#fff', fontSize: 13, fontWeight: 600, padding: '11px 16px', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,27,45,.3)', animation: 'fadeUp .25s ease both', zIndex: 50, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes arrive{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
      `}</style>
    </div>
  )
}
