const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const MODEL = 'voyage-3'

export async function embed(text: string): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) return null

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: text }),
  })

  if (!res.ok) {
    console.error('[embed] Voyage API error', res.status, await res.text())
    return null
  }

  const data = await res.json() as { data: { embedding: number[] }[] }
  return data.data[0]?.embedding ?? null
}

export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) return texts.map(() => null)

  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  })

  if (!res.ok) {
    console.error('[embedBatch] Voyage API error', res.status, await res.text())
    return texts.map(() => null)
  }

  const data = await res.json() as { data: { index: number; embedding: number[] }[] }
  const result: (number[] | null)[] = texts.map(() => null)
  for (const item of data.data) {
    result[item.index] = item.embedding
  }
  return result
}
