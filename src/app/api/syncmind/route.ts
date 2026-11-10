import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { embed } from '@/lib/embeddings'

export const maxDuration = 30

// Rate limit: 20 queries per workspace per hour
const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRL(id: string) {
  const now = Date.now()
  const e = rlMap.get(id)
  if (!e || now > e.resetAt) { rlMap.set(id, { count: 1, resetAt: now + 3600_000 }); return true }
  if (e.count >= 20) return false
  e.count++; return true
}

type KbDocRow = {
  id: string; title: string; content: string | null; source_type: string
  file_url: string | null; file_name: string | null; department_id: string | null
  goal_id: string | null; created_at: string; metadata: Record<string, unknown> | null
}

export async function POST(req: NextRequest) {
  try {
    const { query, workspaceId } = await req.json() as { query?: string; workspaceId?: string }
    if (!query?.trim() || !workspaceId) {
      return NextResponse.json({ error: 'query and workspaceId required' }, { status: 400 })
    }
    if (!checkRL(workspaceId)) {
      return NextResponse.json({ error: 'Too many requests. Wait an hour.' }, { status: 429 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createServiceClient()
    const SELECT = 'id, title, content, source_type, file_url, file_name, department_id, goal_id, created_at, metadata'

    let docs: KbDocRow[] = []
    let searchMode = 'keyword'

    // --- Semantic search (Voyage AI) ---
    const queryEmbedding = await embed(query)
    if (queryEmbedding) {
      const { data: semResults, error: semErr } = await supabase.rpc('search_kb_semantic', {
        p_workspace_id: workspaceId,
        p_embedding: `[${queryEmbedding.join(',')}]`,
        p_limit: 10,
        p_threshold: 0.3,
      })
      if (semErr) console.error('[syncmind] semantic RPC error:', semErr.message)

      if (!semErr && semResults?.length > 0) {
        // Fetch full doc rows for the matched document_ids
        const docIds = (semResults as { document_id: string }[]).map(r => r.document_id)
        const { data: fullDocs } = await supabase
          .from('kb_documents')
          .select(SELECT)
          .in('id', docIds)

        // Preserve similarity order
        const docMap = new Map((fullDocs ?? []).map((d: KbDocRow) => [d.id, d]))
        docs = docIds.map(id => docMap.get(id)).filter(Boolean) as KbDocRow[]
        searchMode = 'semantic'
      }
    }

    // --- Keyword fallback (ILIKE) ---
    if (docs.length === 0) {
      const terms = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3)
      if (terms.length > 0) {
        const orFilter = terms.map(t => `title.ilike.%${t}%,content.ilike.%${t}%`).join(',')
        const { data: matched } = await supabase
          .from('kb_documents')
          .select(SELECT)
          .eq('workspace_id', workspaceId)
          .or(orFilter)
          .limit(20)

        type Scored = KbDocRow & { _score: number }
        docs = ((matched ?? []) as KbDocRow[])
          .map(d => {
            const hay = `${d.title} ${d.content ?? ''}`.toLowerCase()
            return { ...d, _score: terms.filter(t => hay.includes(t)).length } as Scored
          })
          .sort((a, b) => (b as Scored)._score - (a as Scored)._score)
          .slice(0, 10) as KbDocRow[]
      }
      searchMode = 'keyword'
    }

    if (docs.length === 0) {
      return NextResponse.json({
        summary: `No documents found matching "${query}". Try different keywords, or browse recent documents below.`,
        document_ids: [],
        grouping: [],
        documents: [],
        search_mode: searchMode,
      })
    }

    // Ask Claude to curate and summarise
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const candidateText = docs.map((d, i) =>
      `[${i}] id:${d.id} title:"${d.title}" excerpt:"${(d.content ?? '').slice(0, 300)}"`
    ).join('\n')

    const aiMsg = await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 512,
      system: 'You are Sync Mind. Return ONLY valid JSON, no markdown, no explanation outside the JSON.',
      messages: [{
        role: 'user',
        content: `Query: "${query}"\n\nDocuments (pre-filtered by ${searchMode} search):\n${candidateText}\n\nSelect ONLY documents whose description directly answers the query. Be strict — 1-4 docs is normal, 0 is fine if none fit. Return JSON:\n{"document_ids":["uuid"],"summary":"2-3 sentences answering the query from the selected docs","grouping":[{"label":"group","document_ids":["uuid"]}]}\nIf no documents are relevant, return {"document_ids":[],"summary":"No documents found about this topic yet.","grouping":[]}`,
      }],
    })

    // Track token usage for financial model (non-blocking)
    supabase.from('ai_usage').insert({
      workspace_id: workspaceId,
      feature: 'syncmind',
      model: 'claude-haiku-5-5',
      input_tokens: aiMsg.usage.input_tokens,
      output_tokens: aiMsg.usage.output_tokens,
      // Haiku: $0.80/1M input, $4.00/1M output (microcents)
      cost_microcents: aiMsg.usage.input_tokens * 80 + aiMsg.usage.output_tokens * 400,
    }).then(() => {})

    const { content } = aiMsg

    const raw = content[0].type === 'text' ? content[0].text.trim() : ''
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let parsed: { document_ids: string[]; summary: string; grouping: { label: string; document_ids: string[] }[] }
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      parsed = {
        document_ids: docs.map(d => d.id),
        summary: 'Here are the most relevant documents found for your query.',
        grouping: [{ label: 'Results', document_ids: docs.map(d => d.id) }],
      }
    }

    const selectedDocs = parsed.document_ids
      .map((id: string) => docs.find(d => d.id === id))
      .filter(Boolean)

    // Save compilation (non-blocking)
    supabase.from('kb_compilations').insert({
      workspace_id: workspaceId,
      query,
      document_ids: parsed.document_ids,
      summary: parsed.summary,
      grouping: parsed.grouping,
      created_by: '00000000-0000-0000-0000-000000000001',
    }).then(() => {})

    return NextResponse.json({
      summary: parsed.summary,
      document_ids: parsed.document_ids,
      grouping: parsed.grouping,
      documents: selectedDocs,
      search_mode: searchMode,
    })
  } catch (err) {
    console.error('[syncmind]', err)
    return NextResponse.json({ error: 'Search failed. Please try again.' }, { status: 500 })
  }
}
