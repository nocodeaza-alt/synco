'use server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { embed } from '@/lib/embeddings'

export async function createGoalWithTasks(
  workspaceId: string,
  goal: { title: string; label: string; color: string },
  tasks: Array<{
    department_id: string; title: string; description: string
    priority: string; tag?: string | null; deadline?: string | null; sort: number
  }>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = await createServiceClient()
  const { data: newGoal, error: goalErr } = await supabase
    .from('goals')
    .insert({ workspace_id: workspaceId, title: goal.title, label: goal.label, color: goal.color, created_by: '00000000-0000-0000-0000-000000000001' })
    .select('id')
    .single()
  if (goalErr || !newGoal) return { error: goalErr?.message ?? 'Failed to create goal' }

  const taskInserts = tasks.map(t => ({
    workspace_id: workspaceId,
    goal_id: newGoal.id,
    department_id: t.department_id,
    title: t.title,
    description: t.description,
    stage: 'todo',
    priority: t.priority,
    source: 'owner',
    tag: t.tag ?? null,
    deadline: t.deadline ?? null,
    sort: t.sort,
  }))
  const { error: tasksErr } = await supabase.from('tasks').insert(taskInserts)
  if (tasksErr) return { error: tasksErr.message }

  revalidatePath('/[locale]/goals', 'page')
  revalidatePath('/[locale]/flow', 'page')
  revalidatePath('/[locale]/workspace', 'page')
  return { ok: true, goalId: newGoal.id as string }
}

export async function deleteGoal(goalId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = await createServiceClient()
  // Tasks cascade-delete via FK ON DELETE CASCADE
  const { error } = await supabase.from('goals').delete().eq('id', goalId)
  if (error) return { error: error.message }
  revalidatePath('/[locale]/goals', 'page')
  revalidatePath('/[locale]/flow', 'page')
  revalidatePath('/[locale]/workspace', 'page')
  return { ok: true }
}

// Helper for typed RPC + table ops that TypeScript struggles to infer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export async function advanceTaskStage(taskId: string) {
  const supabase: AnyClient = await createClient()
  const { error } = await supabase.rpc('advance_task_stage', { p_task_id: taskId })
  if (error) return { error: error.message }

  // Auto-index results when task reaches 'done'
  const svc: AnyClient = await createServiceClient()
  const { data: task } = await svc.from('tasks').select('stage').eq('id', taskId).single()
  if (task?.stage === 'done') {
    const { data: results } = await svc
      .from('task_results')
      .select('id')
      .eq('task_id', taskId)
    if (results?.length) {
      await Promise.all(results.map((r: { id: string }) => indexTaskResult(r.id)))
    }
  }

  revalidatePath('/[locale]/flow', 'page')
  revalidatePath('/[locale]/workspace', 'page')
  return { ok: true }
}

export async function returnTask(taskId: string, note: string) {
  const supabase: AnyClient = await createClient()
  const { error } = await supabase.rpc('return_task', { p_task_id: taskId, p_note: note })
  if (error) return { error: error.message }
  revalidatePath('/[locale]/flow', 'page')
  revalidatePath('/[locale]/workspace', 'page')
  return { ok: true }
}

export async function assignTask(taskId: string, assignedTo: string, assignedBy: string) {
  const supabase: AnyClient = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ assigned_to: assignedTo, assigned_by: assignedBy, stage: 'todo' })
    .eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/[locale]/assign', 'page')
  revalidatePath('/[locale]/flow', 'page')
  return { ok: true }
}

export async function addComment(taskId: string, body: string) {
  const supabase: AnyClient = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, author_id: user.id, body })
  if (error) return { error: error.message }
  revalidatePath('/[locale]/flow', 'page')
  revalidatePath('/[locale]/workspace', 'page')
  return { ok: true }
}

export async function uploadTaskResult(
  taskId: string,
  kind: 'document' | 'link' | 'image',
  url: string,
  fileName?: string
) {
  const supabase: AnyClient = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase
    .from('task_results')
    .insert({ task_id: taskId, kind, url, file_name: fileName, uploaded_by: user.id })
  if (error) return { error: error.message }
  return { ok: true }
}

export async function createRequest(data: {
  workspaceId: string
  fromMembershipId: string
  toDepartmentId: string
  title: string
  isPriority: boolean
  goalId?: string
}) {
  const supabase: AnyClient = await createClient()
  const { error } = await supabase.from('requests').insert({
    workspace_id: data.workspaceId,
    from_membership_id: data.fromMembershipId,
    to_department_id: data.toDepartmentId,
    title: data.title,
    is_priority: data.isPriority,
    status: 'pending',
  })
  if (error) return { error: error.message }
  revalidatePath('/[locale]/flow', 'page')
  return { ok: true }
}

export async function respondToRequest(
  requestId: string,
  action: 'accept' | 'decline',
  declineReason?: string
) {
  const supabase: AnyClient = await createClient()
  const { error } = await supabase
    .from('requests')
    .update({
      status: action === 'accept' ? 'accepted' : 'declined',
      decline_reason: declineReason ?? null,
    })
    .eq('id', requestId)
  if (error) return { error: error.message }
  revalidatePath('/[locale]/flow', 'page')
  return { ok: true }
}

export async function markNotificationRead(notifId: string) {
  const supabase: AnyClient = await createServiceClient()
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId)
  if (error) return { error: error.message }
  revalidatePath('/[locale]/notifications', 'page')
  return { ok: true }
}

export async function markAllNotificationsRead() {
  const supabase: AnyClient = await createServiceClient()
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
  if (error) return { error: error.message }
  revalidatePath('/[locale]/notifications', 'page')
  return { ok: true }
}

// Index a task result into the knowledge base when task is done
export async function indexTaskResult(taskResultId: string) {
  const supabase: AnyClient = await createServiceClient()

  const { data: result } = await supabase
    .from('task_results')
    .select('id, task_id, kind, url, file_name, tasks(id, title, description, workspace_id, department_id, goal_id, assigned_to, assigned_by, updated_at, departments(name))')
    .eq('id', taskResultId)
    .single()

  if (!result) return { error: 'Result not found' }

  const task = result.tasks as {
    id: string; title: string; description: string | null
    workspace_id: string; department_id: string; goal_id: string | null
    assigned_to: string | null; assigned_by: string | null; updated_at: string
    departments: { name: string } | null
  } | null
  if (!task) return { error: 'Task not found' }

  // Fetch assignee and assigner names
  const userIds = [task.assigned_to, task.assigned_by].filter(Boolean) as string[]
  const nameMap: Record<string, string> = {}
  const posMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: mems } = await supabase
      .from('memberships')
      .select('user_id, position, profiles(full_name)')
      .eq('workspace_id', task.workspace_id)
      .in('user_id', userIds)
    if (mems) {
      mems.forEach((m: { user_id: string; position: string; profiles: { full_name: string } | null }) => {
        nameMap[m.user_id] = m.profiles?.full_name ?? m.position
        posMap[m.user_id] = m.position
      })
    }
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('task_comments')
    .select('body, author_id, created_at, profiles:author_id(full_name)')
    .eq('task_id', task.id)
    .order('created_at', { ascending: true })
    .limit(10)

  // Fetch reviews (approve/return actions)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('action, note, reviewer_id, created_at, profiles:reviewer_id(full_name)')
    .eq('task_id', task.id)
    .order('created_at', { ascending: true })

  // Build rich text content for search
  const assigneeName = task.assigned_to ? (nameMap[task.assigned_to] ?? '') : ''
  const assignerName = task.assigned_by ? (nameMap[task.assigned_by] ?? '') : ''
  const commentLines = (comments ?? []).map((c: { body: string; author_id: string; profiles: { full_name: string } | null }) =>
    `${c.profiles?.full_name ?? 'Unknown'}: ${c.body}`
  )
  const reviewLines = (reviews ?? []).map((r: { action: string; note: string | null; reviewer_id: string; profiles: { full_name: string } | null }) =>
    `${r.profiles?.full_name ?? 'Reviewer'} (${r.action})${r.note ? ': ' + r.note : ''}`
  )

  const content = [
    task.title,
    task.description ?? '',
    task.departments?.name ?? '',
    assigneeName,
    assignerName,
    result.file_name ?? '',
    ...commentLines,
    ...reviewLines,
  ].filter(Boolean).join('. ')

  // Structured metadata for the detail panel
  const metadata = {
    executed_by: assigneeName || null,
    executed_by_role: task.assigned_to ? (posMap[task.assigned_to] ?? null) : null,
    assigned_by: assignerName || null,
    completed_at: task.updated_at,
    department: task.departments?.name ?? null,
    task_description: task.description ?? null,
    reviews: (reviews ?? []).map((r: { action: string; note: string | null; reviewer_id: string; created_at: string; profiles: { full_name: string } | null }) => ({
      reviewer: r.profiles?.full_name ?? 'Reviewer',
      action: r.action,
      note: r.note ?? null,
      at: r.created_at,
    })),
    comments: (comments ?? []).map((c: { body: string; author_id: string; created_at: string; profiles: { full_name: string } | null }) => ({
      author: c.profiles?.full_name ?? 'Unknown',
      body: c.body,
      at: c.created_at,
    })),
  }

  const title = result.file_name ?? result.url ?? task.title

  const { data: newDoc } = await supabase.from('kb_documents').insert({
    workspace_id: task.workspace_id,
    task_result_id: result.id,
    title,
    content,
    file_url: result.url,
    file_name: result.file_name,
    source_type: 'task_result',
    department_id: task.department_id,
    goal_id: task.goal_id,
    metadata,
  }).select('id').single()

  // Generate and store embedding (non-blocking, best-effort)
  if (newDoc?.id) {
    const embeddingText = `${title}\n\n${content}`.slice(0, 4000)
    embed(embeddingText).then(async (embedding) => {
      if (!embedding) return
      await supabase.from('kb_chunks').insert({
        document_id: newDoc.id,
        chunk_index: 0,
        content: content.slice(0, 4000),
        embedding: `[${embedding.join(',')}]`,
      })
    }).catch(() => {})
  }

  return { ok: true }
}

// Save task result to Google Drive
export async function saveResultToDrive(taskResultId: string, workspaceId: string) {
  const { google } = await import('googleapis')
  const supabase: AnyClient = await createServiceClient()

  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'google_drive')
    .single()

  if (!integration?.access_token) return { error: 'Google Drive not connected' }

  const { data: result } = await supabase
    .from('task_results')
    .select('id, url, file_name, kind, tasks(title, departments(name))')
    .eq('id', taskResultId)
    .single()

  if (!result) return { error: 'Result not found' }

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    )
    oauth2.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    })

    const drive = google.drive({ version: 'v3', auth: oauth2 })
    const task = result.tasks as { title: string; departments: { name: string } | null } | null
    const deptName = task?.departments?.name ?? 'General'
    const taskTitle = task?.title ?? 'Task'

    // Find or create SYNCO root folder
    const findOrCreate = async (name: string, parentId?: string) => {
      const q = `name='${name}' and mimeType='application/vnd.google-apps.folder'${parentId ? ` and '${parentId}' in parents` : ''} and trashed=false`
      const { data: list } = await drive.files.list({ q, fields: 'files(id)', pageSize: 1 })
      if (list?.files?.[0]) return list.files[0].id!
      const { data: created } = await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] },
        fields: 'id',
      })
      return created.id!
    }

    const rootId = await findOrCreate('SYNCO')
    const deptId = await findOrCreate(deptName, rootId)
    const taskId = await findOrCreate(taskTitle, deptId)

    // Create a shortcut/link file pointing to the original URL
    const { data: file } = await drive.files.create({
      requestBody: {
        name: result.file_name ?? `${taskTitle} result`,
        mimeType: 'application/vnd.google-apps.shortcut',
        parents: [taskId],
        shortcutDetails: { targetId: undefined },
      },
      fields: 'id,webViewLink',
    })

    // Update task_result with drive info
    await supabase.from('task_results')
      .update({ drive_file_id: file?.id, drive_file_url: file?.webViewLink })
      .eq('id', taskResultId)

    return { ok: true, driveUrl: file?.webViewLink }
  } catch (err) {
    console.error('[saveResultToDrive]', err)
    return { error: 'Drive upload failed' }
  }
}
