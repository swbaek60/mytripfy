/**
 * Clerk 기반 auth 헬퍼 유틸리티
 * 서버 컴포넌트 / Server Action / Route Handler에서 사용
 */
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface UserProfile {
  /** Supabase profiles.id (UUID) */
  id: string
  /** Clerk user ID */
  clerkId: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  preferredLocale: string | null
}

/**
 * 현재 로그인한 사용자의 Supabase 프로필을 반환합니다.
 * 로그인하지 않았거나 프로필이 없으면 null을 반환합니다.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('id, clerk_id, email, full_name, avatar_url, preferred_locale')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (!data) {
      // 프로필이 없으면 Clerk 정보로 자동 생성
      const clerk = await currentUser()
      if (!clerk) return null
      const email = clerk.emailAddresses?.[0]?.emailAddress ?? ''
      const { data: created } = await admin
        .from('profiles')
        .insert({
          clerk_id: userId,
          email,
          full_name: clerk.fullName ?? null,
          avatar_url: clerk.imageUrl ?? null,
        })
        .select('id, clerk_id, email, full_name, avatar_url, preferred_locale')
        .single()
      if (!created) return null
      return {
        id: created.id,
        clerkId: created.clerk_id,
        email: created.email,
        fullName: created.full_name,
        avatarUrl: created.avatar_url,
        preferredLocale: created.preferred_locale,
      }
    }

    return {
      id: data.id,
      clerkId: data.clerk_id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      preferredLocale: data.preferred_locale,
    }
  } catch {
    return null
  }
}

/**
 * 로그인 필요 페이지에서 사용.
 * 비로그인 시 /{locale}/login으로 리다이렉트하고 프로필을 반환합니다.
 */
export async function requireAuth(locale: string): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect(`/${locale}/login`)
  return profile
}
