/**
 * Supabase 서버 클라이언트 (Clerk 인증 호환 레이어)
 *
 * 핵심 전략:
 * - Clerk auth().userId → profiles.clerk_id로 매핑 → profiles.id(UUID) 반환
 * - auth.getUser() shimming으로 기존 파일 수정 없이 동작
 * - 서버 사이드에서 service_role 사용 (RLS는 코드에서 보장)
 * - React.cache() 사용하지 않음 (API Route 호환성 보장)
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth, currentUser } from '@clerk/nextjs/server'
import type { User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createAdminClient() {
  if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function getAdminClientSafe() {
  if (!supabaseServiceKey) return null
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function resolveProfile(clerkUserId: string): Promise<{ id: string; email: string } | null> {
  const admin = getAdminClientSafe()
  if (!admin) return null

  const { data: existing } = await admin
    .from('profiles')
    .select('id, email')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()

  if (existing) return { id: existing.id, email: existing.email ?? '' }

  let clerkUserObj: Awaited<ReturnType<typeof currentUser>> = null
  try {
    clerkUserObj = await currentUser()
  } catch {
    return null
  }
  if (!clerkUserObj) return null

  const email = clerkUserObj.emailAddresses?.[0]?.emailAddress ?? ''

  if (email) {
    const { data: byEmail } = await admin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (byEmail) {
      await admin
        .from('profiles')
        .update({ clerk_id: clerkUserId, email, avatar_url: clerkUserObj.imageUrl ?? undefined })
        .eq('id', byEmail.id)
      return { id: byEmail.id, email }
    }
  }

  try {
    const { data: created } = await admin
      .from('profiles')
      .insert({
        clerk_id: clerkUserId,
        email: email || null,
        full_name: clerkUserObj.fullName ?? null,
        avatar_url: clerkUserObj.imageUrl ?? null,
        preferred_locale: 'en',
      })
      .select('id, email')
      .single()
    return created ? { id: created.id, email: created.email ?? '' } : null
  } catch (err) {
    console.error('[resolveProfile] profile create failed:', err)
    return null
  }
}

/**
 * 서버 컴포넌트 / API Route / Server Action용 Supabase 클라이언트.
 * 매 호출마다 Clerk auth()로 직접 인증 확인 (React.cache 사용 안 함).
 */
export async function createClient() {
  const serviceKey = supabaseServiceKey ?? supabaseAnonKey
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let clerkUserId: string | null = null
  try {
    const result = await auth()
    clerkUserId = result.userId ?? null
  } catch {
    clerkUserId = null
  }

  let mappedUser: Partial<User> | null = null
  if (clerkUserId) {
    const profile = await resolveProfile(clerkUserId)
    if (profile) {
      mappedUser = {
        id: profile.id,
        email: profile.email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = supabase as any
  s.auth = {
    ...s.auth,
    getUser: async () => ({
      data: { user: mappedUser ?? null },
      error: null,
    }),
    getSession: async () => ({
      data: { session: null },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  }

  return supabase
}
