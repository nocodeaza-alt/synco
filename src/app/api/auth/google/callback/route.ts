import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const workspaceId = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error || !code || !workspaceId) {
    return NextResponse.redirect(`${appUrl}/en/settings/integrations?error=google_auth_failed`)
  }

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${appUrl}/api/auth/google/callback`,
    )

    const { tokens } = await oauth2.getToken(code)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createServiceClient()
    await supabase.from('integrations').upsert({
      workspace_id: workspaceId,
      provider: 'google_drive',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      metadata: { scope: tokens.scope },
    }, { onConflict: 'workspace_id,provider' })

    return NextResponse.redirect(`${appUrl}/en/settings/integrations?connected=google_drive`)
  } catch (err) {
    console.error('[google/callback]', err)
    return NextResponse.redirect(`${appUrl}/en/settings/integrations?error=google_token_failed`)
  }
}
