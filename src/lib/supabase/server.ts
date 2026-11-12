import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

function makeCookieMethods(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cookieStore.set(name, value, options as any)
        )
      } catch {
        // Called from a Server Component — ignored, middleware handles refresh.
      }
    },
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: makeCookieMethods(cookieStore) }
  )
}

// Uses the service role key directly (bypasses RLS) — never call from client components.
export async function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type UserRole = 'owner' | 'c_level' | 'team_lead' | 'member'

export interface CurrentUserInfo {
  userId: string | null
  name: string
  role: UserRole
  workspaceId: string | null
  unreadCount: number
}

// Returns the currently logged-in user's display name, role, and unread notification count.
// Falls back gracefully so pages never crash if the user is unauthenticated.
export async function getCurrentUserInfo(): Promise<CurrentUserInfo> {
  try {
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return { userId: null, name: 'Guest', role: 'member', workspaceId: null, unreadCount: 0 }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = await createServiceClient() as any

    const { data: membership } = await svc
      .from('memberships')
      .select('id, role, workspace_id, profiles(full_name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!membership) return { userId: user.id, name: user.email ?? 'Unknown', role: 'member', workspaceId: null, unreadCount: 0 }

    const { count } = await svc
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('membership_id', membership.id)
      .eq('read', false)

    const name = (membership.profiles as { full_name: string | null } | null)?.full_name ?? user.email ?? 'Unknown'

    return {
      userId: user.id,
      name,
      role: membership.role as UserRole,
      workspaceId: membership.workspace_id,
      unreadCount: count ?? 0,
    }
  } catch {
    return { userId: null, name: 'Unknown', role: 'member', workspaceId: null, unreadCount: 0 }
  }
}
