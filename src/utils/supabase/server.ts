/**
 * Supabase 서버 클라이언트 (Clerk 인증 호환 레이어)
 *
 * 핵심 전략:
 * - Clerk auth().userId → profiles.id(UUID)로 매핑
 * - auth.getUser() shimming으로 기존 55개 파일 수정 없이 동작
 * - 서버 사이드에서 service_role 사용 (RLS는 코드에서 보장)
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth, currentUser } from '@clerk/nextjs/server'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** service_role 클라이언트 (RLS 우회, 서버 전용) */
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

/**
 * 요청당 한 번만 실행되도록 캐시 (React cache = per-request memoization)
 */
const getCachedClerkUserId = cache(async (): Promise<string | null> => {
  try {
    const { userId } = await auth()
    return userId ?? null
  } catch {
    return null
  }
})

/**
 * Clerk userId → Supabase profiles UUID 조회/자동생성 (요청당 캐시)
 *
 * 조회 순서:
 * 1. clerk_id 컬럼으로 직접 조회 (가장 빠름)
 * 2. 이메일로 기존 프로필 조회 후 clerk_id 업데이트 (Clerk 마이그레이션 전 가입자 처리)
 * 3. 새 프로필 생성
 */
const getCachedProfile = cache(async (clerkUserId: string): Promise<{ id: string; email: string } | null> => {
  const admin = getAdminClientSafe()
  if (!admin) return null

  // 1. clerk_id로 직접 조회
  const { data: existing } = await admin
    .from('profiles')
    .select('id, email')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()

  if (existing) return { id: existing.id, email: existing.email ?? '' }

  // Clerk에서 유저 정보 가져오기 (2, 3단계 공통)
  let clerkUserObj: Awaited<ReturnType<typeof currentUser>> = null
  try {
    clerkUserObj = await currentUser()
  } catch {
    return null
  }
  if (!clerkUserObj) return null

  const email = clerkUserObj.emailAddresses?.[0]?.emailAddress ?? ''

  // 2. 이메일로 기존 프로필 조회 후 clerk_id 업데이트
  //    (Clerk 도입 전에 가입한 사용자 또는 webhook 실패 케이스 처리)
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

  // 3. 없으면 새 프로필 생성 (완전 신규 Clerk 유저)
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
    console.error('[getCachedProfile] profile create failed:', err)
    return null
  }
})

/**
 * 서버 컴포넌트 / API Route / Server Action용 Supabase 클라이언트.
 * auth.getUser() 호출 시 Clerk user → Supabase profiles UUID로 매핑.
 */
export async function createClient() {
  const serviceKey = supabaseServiceKey ?? supabaseAnonKey
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const clerkUserId = await getCachedClerkUserId()

  let mappedUser: Partial<User> | null = null
  if (clerkUserId) {
    const profile = await getCachedProfile(clerkUserId)
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

  // auth.getUser() / auth.getSession() shimming
  //
  // getSession은 항상 null을 반환해야 함.
  // session이 있으면 Supabase 클라이언트가 session.access_token을
  // Authorization 헤더로 사용하는데, 'clerk-managed' 같은 더미 토큰을
  // 보내면 모든 DB 쿼리가 실패한다.
  // service_role key는 createSupabaseClient 생성 시 이미 apiKey로 설정되어
  // session이 null이면 자동으로 apiKey(service_role)를 사용한다.
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
