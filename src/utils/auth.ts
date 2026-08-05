/**
 * Clerk 기반 auth 헬퍼 유틸리티
 * 서버 컴포넌트 / Server Action / Route Handler에서 사용
 */
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'
import { isNextControlFlowError } from '@/lib/next-control-flow'
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
  referralCode?: string | null
  referralCount?: number
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
      .select('id, clerk_id, email, full_name, avatar_url, preferred_locale, referral_code, referral_count')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (!data) {
      // 프로필이 없으면 Clerk 정보로 자동 생성
      const clerk = await currentUser()
      if (!clerk) return null
      const email = clerk.emailAddresses?.[0]?.emailAddress ?? ''

      let referredBy: string | null = null
      let referralCode: string | null = null
      try {
        const { cookies } = await import('next/headers')
        const { REFERRAL_COOKIE, normalizeReferralCode } = await import('@/lib/referral')
        const jar = await cookies()
        const code = normalizeReferralCode(jar.get(REFERRAL_COOKIE)?.value)
        if (code) {
          const { data: referrer } = await admin
            .from('profiles')
            .select('id')
            .eq('referral_code', code)
            .maybeSingle()
          if (referrer?.id) referredBy = referrer.id
        }
      } catch {
        /* cookie optional outside request */
      }

      const { data: created } = await admin
        .from('profiles')
        .insert({
          clerk_id: userId,
          email,
          full_name: clerk.fullName ?? null,
          avatar_url: clerk.imageUrl ?? null,
          referred_by: referredBy,
        })
        .select('id, clerk_id, email, full_name, avatar_url, preferred_locale, referral_code, referral_count')
        .single()
      if (!created) return null

      // Ensure referral_code exists + bump referrer count
      if (!created.referral_code) {
        const code = created.id.replace(/-/g, '').slice(0, 8).toLowerCase()
        await admin.from('profiles').update({ referral_code: code }).eq('id', created.id)
        referralCode = code
      } else {
        referralCode = created.referral_code
      }
      if (referredBy) {
        const { data: refRow } = await admin
          .from('profiles')
          .select('referral_count')
          .eq('id', referredBy)
          .maybeSingle()
        await admin
          .from('profiles')
          .update({ referral_count: (refRow?.referral_count ?? 0) + 1 })
          .eq('id', referredBy)
      }

      return {
        id: created.id,
        clerkId: created.clerk_id,
        email: created.email,
        fullName: created.full_name,
        avatarUrl: created.avatar_url,
        preferredLocale: created.preferred_locale,
        referralCode,
        referralCount: created.referral_count ?? 0,
      }
    }

    let referralCode = data.referral_code as string | null
    if (!referralCode) {
      referralCode = data.id.replace(/-/g, '').slice(0, 8).toLowerCase()
      await admin.from('profiles').update({ referral_code: referralCode }).eq('id', data.id)
    }

    return {
      id: data.id,
      clerkId: data.clerk_id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      preferredLocale: data.preferred_locale,
      referralCode,
      referralCount: (data as { referral_count?: number }).referral_count ?? 0,
    }
  } catch (e) {
    // 동적 렌더링 신호·리다이렉트는 삼키면 안 된다.
    if (isNextControlFlowError(e)) throw e
    console.error('[getCurrentUserProfile] failed:', e)
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
