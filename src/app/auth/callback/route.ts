import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const locale = searchParams.get('locale') ?? 'en'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the appropriate page based on role
      // For now, redirect to the flow page
      return NextResponse.redirect(`${origin}/${locale}/flow`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_callback_error`)
}
