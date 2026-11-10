'use server'

export async function sendTestDigest(): Promise<{ sent?: number; errors?: string[]; error?: string }> {
  const secret = process.env.DIGEST_SECRET
  if (!secret) return { error: 'DIGEST_SECRET not set' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

  const res = await fetch(`${appUrl}/api/digest`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  })

  if (!res.ok) {
    const text = await res.text()
    return { error: `HTTP ${res.status}: ${text}` }
  }

  return res.json()
}
