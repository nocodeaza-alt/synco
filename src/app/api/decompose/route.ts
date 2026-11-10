import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

// Simple in-process rate limit: max 10 calls per workspace per 10 min
const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(workspaceId: string): boolean {
  const now = Date.now()
  const entry = rlMap.get(workspaceId)
  if (!entry || now > entry.resetAt) {
    rlMap.set(workspaceId, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

const TaskSchema = z.object({
  title: z.string().max(70),
  description: z.string(),
  department_id: z.string().uuid(),
  priority: z.enum(['high', 'medium', 'low']),
  tag: z.string().optional(),
  due_date: z.string().optional().default(''),
  expected_result: z.enum(['document', 'link', 'image']).optional().default('document'),
})

const ResponseSchema = z.object({
  tasks: z.array(TaskSchema),
})

export type DecompTask = z.infer<typeof TaskSchema>

const TOOL_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    tasks: {
      type: 'array' as const,
      description: '2-3 tasks per relevant department',
      items: {
        type: 'object' as const,
        properties: {
          title:           { type: 'string' as const, description: 'Max 70 chars' },
          description:     { type: 'string' as const },
          department_id:   { type: 'string' as const, description: 'UUID from the departments list' },
          priority:        { type: 'string' as const, enum: ['high', 'medium', 'low'] },
          tag:             { type: 'string' as const },
          due_date:        { type: 'string' as const, description: 'YYYY-MM-DD' },
          expected_result: { type: 'string' as const, enum: ['document', 'link', 'image'] },
        },
        required: ['title', 'description', 'department_id', 'priority', 'due_date', 'expected_result'],
      },
    },
  },
  required: ['tasks'],
}

type UsageData = { input_tokens: number; output_tokens: number }

async function logAiUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workspaceId: string,
  feature: string,
  model: string,
  usage: UsageData
) {
  // Haiku pricing: $0.80 / 1M input, $4.00 / 1M output  (as of 2025-11)
  const inputCost  = usage.input_tokens  * 80  // microcents per token
  const outputCost = usage.output_tokens * 400
  await supabase.from('ai_usage').insert({
    workspace_id: workspaceId, feature, model,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cost_microcents: inputCost + outputCost,
  })
}

async function callClaude(client: Anthropic, userContent: string): Promise<{
  result: z.infer<typeof ResponseSchema>
  usage: UsageData
}> {
  const msg = await client.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 1024,
    system: 'You are a planning assistant. Break the goal into 2-3 concrete tasks per relevant department using the plan_tasks tool.',
    tools: [{ name: 'plan_tasks', description: 'Return the task plan', input_schema: TOOL_INPUT_SCHEMA }],
    tool_choice: { type: 'tool', name: 'plan_tasks' },
    messages: [{ role: 'user', content: userContent }],
  })

  const toolUse = msg.content.find(c => c.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('No tool_use block in response')
  }

  return {
    result: ResponseSchema.parse(toolUse.input),
    usage: { input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goalText, workspaceId } = body as { goalText?: string; workspaceId?: string }

    if (!goalText?.trim() || !workspaceId) {
      return NextResponse.json({ error: 'goalText and workspaceId are required' }, { status: 400 })
    }

    if (!checkRateLimit(workspaceId)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })
    }

    const supabase = await createServiceClient()

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, task_capacity')
      .eq('id', workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 })
    }

    type Dept = { id: string; name: string }

    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('sort')

    const depts = (departments ?? []) as Dept[]
    const ws = workspace as { name: string; task_capacity: number | null }

    const dueDate = new Date()
    dueDate.setFullYear(dueDate.getFullYear() + 1)

    // Keep context minimal — AI only needs dept IDs and names to assign tasks
    const userContent = JSON.stringify({
      goal: goalText,
      due_date: dueDate.toISOString().split('T')[0],
      company: ws.name,
      departments: depts.map(d => ({ id: d.id, name: d.name })),
    })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const { result, usage } = await callClaude(anthropic, userContent)

    // Track token usage for financial model (non-blocking, never blocks response)
    logAiUsage(supabase, workspaceId, 'decompose', 'claude-haiku-5-5', usage).catch(() => {})

    return NextResponse.json(result)
  } catch (err) {
    console.error('[decompose] error:', err)
    return NextResponse.json({ error: 'Decomposition failed. Please try again.' }, { status: 500 })
  }
}
