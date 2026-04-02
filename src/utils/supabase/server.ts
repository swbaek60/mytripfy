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
  if (!supabaseServiceKey) {
    console.error('[supabase/server] SUPABASE_SERVICE_ROLE_KEY not set — admin client unavailable')
    return null
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function resolveProfile(clerkUserId: string): Promise<{ id: string; email: string } | null> {
  const admin = getAdminClientSafe()
  if (!admin) {
    console.error('[resolveProfile] admin client unavailable, SUPABASE_SERVICE_ROLE_KEY missing')
    return null
  }

  // 1. clerk_id 로 기존 프로필 조회
  const { data: existing, error: existingErr } = await admin
    .from('profiles')
    .select('id, email')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()

  if (existingErr) {
    console.error('[resolveProfile] clerk_id lookup error:', existingErr.message)
  }
  if (existing) return { id: existing.id, email: existing.email ?? '' }

  // 2. Clerk 사용자 정보 조회 (email 기반 매핑용)
  let clerkUserObj: Awaited<ReturnType<typeof currentUser>> = null
  try {
    clerkUserObj = await currentUser()
  } catch (e) {
    console.error('[resolveProfile] currentUser() failed:', e)
    // currentUser 실패해도 clerkUserId는 있으므로 이메일 없이 프로필 생성 시도
  }

  const email = clerkUserObj?.emailAddresses?.[0]?.emailAddress ?? ''

  // 3. 이메일로 기존 프로필 조회
  if (email) {
    const { data: byEmail, error: emailErr } = await admin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (emailErr) {
      console.error('[resolveProfile] email lookup error:', emailErr.message)
    }
    if (byEmail) {
      // clerk_id 연결
      const { error: updateErr } = await admin
        .from('profiles')
        .update({
          clerk_id: clerkUserId,
          ...(clerkUserObj?.imageUrl && { avatar_url: clerkUserObj.imageUrl }),
        })
        .eq('id', byEmail.id)
      if (updateErr) {
        console.error('[resolveProfile] clerk_id link error:', updateErr.message)
      }
      return { id: byEmail.id, email }
    }
  }

  // 4. 신규 프로필 생성
  try {
    const insertPayload: Record<string, unknown> = {
      clerk_id: clerkUserId,
      full_name: clerkUserObj?.fullName ?? null,
      avatar_url: clerkUserObj?.imageUrl ?? null,
      preferred_locale: 'en',
    }
    if (email) insertPayload.email = email

    const { data: created, error: insertErr } = await admin
      .from('profiles')
      .insert(insertPayload)
      .select('id, email')
      .single()

    if (insertErr) {
      if (insertErr.code === '23505') {
        // unique 충돌 → email 또는 clerk_id로 재조회
        if (email) {
          const { data: retried } = await admin
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .maybeSingle()
          if (retried) {
            await admin.from('profiles').update({ clerk_id: clerkUserId }).eq('id', retried.id)
            return { id: retried.id, email }
          }
        }
        const { data: byClerk } = await admin
          .from('profiles')
          .select('id, email')
          .eq('clerk_id', clerkUserId)
          .maybeSingle()
        if (byClerk) return { id: byClerk.id, email: byClerk.email ?? '' }
      }
      console.error('[resolveProfile] profile insert failed:', insertErr.message, 'code:', insertErr.code)
      return null
    }

    return created ? { id: created.id, email: created.email ?? '' } : null
  } catch (err) {
    console.error('[resolveProfile] unexpected error:', err)
    return null
  }
}

/**
 * Clerk auth()를 직접 사용하여 현재 로그인한 사용자의 Supabase 프로필을 반환.
 * shim에 의존하지 않으므로 가장 신뢰할 수 있는 방식.
 * 비로그인 시 null 반환.
 */
export async function getAuthUser(): Promise<{
  clerkUserId: string
  profileId: string
  email: string
} | null> {
  let clerkUserId: string | null = null
  try {
    const result = await auth()
    clerkUserId = result.userId ?? null
  } catch (e) {
    console.error('[getAuthUser] auth() failed:', e)
    return null
  }

  if (!clerkUserId) return null

  const profile = await resolveProfile(clerkUserId)
  if (!profile) {
    console.warn('[getAuthUser] resolveProfile returned null for clerkUserId:', clerkUserId)
    return null
  }

  return { clerkUserId, profileId: profile.id, email: profile.email }
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
