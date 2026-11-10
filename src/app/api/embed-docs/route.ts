import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { embedBatch } from '@/lib/embeddings'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/embed-docs — backfill embeddings for all kb_documents without chunks
// Secured with DIGEST_SECRET
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.DIGEST_SECRET || auth !== `Bearer ${process.env.DIGEST_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Get documents that have no chunks yet
  const { data: docs } = await svc
    .from('kb_documents')
    .select('id, title, content')
    .limit(100)

  if (!docs?.length) return NextResponse.json({ embedded: 0 })

  // Find docs with no existing chunks
  const { data: existingChunks } = await svc
    .from('kb_chunks')
    .select('document_id')
    .in('document_id', docs.map(d => d.id))

  const withChunks = new Set((existingChunks ?? []).map((c: { document_id: string }) => c.document_id))
  const needsEmbedding = docs.filter(d => !withChunks.has(d.id))

  if (!needsEmbedding.length) return NextResponse.json({ embedded: 0, message: 'All docs already embedded' })

  // Build texts to embed: title + content
  const texts = needsEmbedding.map(d => `${d.title}\n\n${d.content ?? ''}`.slice(0, 4000))

  // Batch embed (Voyage AI supports up to 128 texts per request)
  const embeddings = await embedBatch(texts)

  // Insert chunks
  let embedded = 0
  const chunks = needsEmbedding
    .map((doc, i) => {
      const emb = embeddings[i]
      if (!emb) return null
      embedded++
      return {
        document_id: doc.id,
        chunk_index: 0,
        content: (doc.content ?? '').slice(0, 4000),
        embedding: `[${emb.join(',')}]`,
      }
    })
    .filter(Boolean)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (chunks.length > 0) {
    const { error } = await svc.from('kb_chunks').insert(chunks as any[])
    if (error) console.error('[embed-docs] insert error:', error.message)
  }

  return NextResponse.json({ embedded, total: needsEmbedding.length })
}
