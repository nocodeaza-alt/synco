'use server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AC = any

export async function createBrainstormSession(data: {
  workspaceId: string
  topic: string
  durationMin: number
  audience: string
  createdBy: string
}) {
  const svc: AC = await createServiceClient()
  const endsAt = new Date(Date.now() + data.durationMin * 60_000).toISOString()
  const { data: session, error } = await svc
    .from('brainstorm_sessions')
    .insert({
      workspace_id: data.workspaceId,
      topic: data.topic,
      duration_min: data.durationMin,
      audience: data.audience,
      created_by: data.createdBy,
      started_at: new Date().toISOString(),
      ended_at: null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/[locale]/brainstorm', 'page')
  return { ok: true, sessionId: session.id as string }
}

export async function postBrainstormIdea(sessionId: string, body: string, authorId: string) {
  const svc: AC = await createServiceClient()
  const { error } = await svc
    .from('brainstorm_ideas')
    .insert({ session_id: sessionId, author_id: authorId, body })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function endBrainstormSession(sessionId: string, workspaceId: string) {
  const svc: AC = await createServiceClient()
  const { error } = await svc
    .from('brainstorm_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) return { error: error.message }

  // Index ideas into kb_documents
  const { data: ideas } = await svc
    .from('brainstorm_ideas')
    .select('id, body, author_id')
    .eq('session_id', sessionId)

  const { data: session } = await svc
    .from('brainstorm_sessions')
    .select('topic, started_at, duration_min')
    .eq('id', sessionId)
    .single()

  if (ideas?.length && session) {
    // Fetch author names
    const authorIds = [...new Set((ideas as { author_id: string }[]).map(i => i.author_id))]
    const { data: mems } = await svc
      .from('memberships')
      .select('user_id, profiles(full_name)')
      .eq('workspace_id', workspaceId)
      .in('user_id', authorIds)
    const nameMap: Record<string, string> = {}
    if (mems) {
      mems.forEach((m: { user_id: string; profiles: { full_name: string } | null }) => {
        nameMap[m.user_id] = m.profiles?.full_name ?? 'Team member'
      })
    }

    const typedIdeas = ideas as { id: string; body: string; author_id: string }[]
    const combined = typedIdeas.map((i, n) => `${n + 1}. ${i.body}`).join('\n')

    const metadata = {
      topic: session.topic,
      session_id: sessionId,
      session_started_at: session.started_at ?? null,
      duration_min: session.duration_min ?? null,
      idea_count: typedIdeas.length,
      ideas: typedIdeas.map(i => ({
        body: i.body,
        author: nameMap[i.author_id] ?? 'Team member',
      })),
    }

    await svc.from('kb_documents').insert({
      workspace_id: workspaceId,
      title: `Brainstorm: ${session.topic}`,
      content: combined,
      source_type: 'brainstorm',
      metadata,
    })
  }

  revalidatePath('/[locale]/brainstorm', 'page')
  revalidatePath('/[locale]/syncmind', 'page')
  return { ok: true }
}

export async function saveMeetLink(roomId: string, link: string) {
  const svc: AC = await createServiceClient()
  const { error } = await svc
    .from('office_rooms')
    .update({ meet_link: link || null })
    .eq('id', roomId)
  if (error) return { error: error.message }
  revalidatePath('/[locale]/office', 'page')
  return { ok: true }
}

export async function sendKnock(fromId: string, toId: string, roomId: string) {
  const svc: AC = await createServiceClient()
  const { error } = await svc
    .from('knocks')
    .insert({ from_id: fromId, to_id: toId, room_id: roomId })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function saveMeetingNotes(data: {
  workspaceId: string
  roomId: string
  roomName: string
  notes: string
  messages: { author: string; body: string; at: string }[]
  authorId: string
  participantIds: string[]
}) {
  const svc: AC = await createServiceClient()

  // Fetch participant names
  const { data: mems } = await svc
    .from('memberships')
    .select('user_id, position, profiles(full_name)')
    .eq('workspace_id', data.workspaceId)
    .in('user_id', data.participantIds)

  const participants: string[] = (mems ?? []).map(
    (m: { user_id: string; profiles: { full_name: string } | null }) =>
      m.profiles?.full_name ?? 'Team member'
  )

  const authorMem = (mems ?? []).find(
    (m: { user_id: string }) => m.user_id === data.authorId
  ) as { user_id: string; profiles: { full_name: string } | null } | undefined
  const authorProfile = authorMem?.profiles?.full_name ?? 'Team member'

  const meetingDate = new Date().toISOString()
  const title = `Meeting notes: ${data.roomName} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const metadata = {
    room_name: data.roomName,
    room_id: data.roomId,
    meeting_date: meetingDate,
    author: authorProfile,
    participants,
    notes: data.notes,
    messages: data.messages,
  }

  const { error } = await svc.from('kb_documents').insert({
    workspace_id: data.workspaceId,
    title,
    content: `${data.roomName}. Participants: ${participants.join(', ')}. ${data.notes}`,
    source_type: 'meeting',
    metadata,
  })

  if (error) return { error: error.message }
  revalidatePath('/[locale]/syncmind', 'page')
  return { ok: true }
}

export async function createOfficeRoom(data: {
  workspaceId: string
  name: string
  description: string
  color: string
  meetLink?: string
}) {
  const svc: AC = await createServiceClient()
  const { data: room, error } = await svc
    .from('office_rooms')
    .insert({
      workspace_id: data.workspaceId,
      name: data.name,
      description: data.description,
      color: data.color,
      meet_link: data.meetLink || null,
      type: 'custom',
      sort: 999,
    })
    .select('id, name, description, type, color, meet_link, sort')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/[locale]/office', 'page')
  return { ok: true, room }
}
