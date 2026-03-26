import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth-debug
 * 로그인 상태 및 프로필 매핑 진단용 엔드포인트 (민감 정보 미포함)
 */
export async function GET() {
  try {
    // 1. Clerk auth() 호출
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({
        step: 'auth',
        status: 'FAIL',
        error: 'auth() returned null userId - Clerk middleware may not be running',
      })
    }

    // 2. currentUser() 호출
    let clerkEmail: string | null = null
    try {
      const cu = await currentUser()
      clerkEmail = cu?.emailAddresses?.[0]?.emailAddress ?? null
    } catch (e) {
      return NextResponse.json({
        step: 'currentUser',
        status: 'FAIL',
        clerkUserId,
        error: String(e),
      })
    }

    // 3. Supabase 프로필 조회 (clerk_id)
    const admin = createAdminClient()
    const { data: profileByClerkId, error: clerkIdError } = await admin
      .from('profiles')
      .select('id, email, clerk_id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle()

    if (profileByClerkId) {
      return NextResponse.json({
        step: 'profile_by_clerk_id',
        status: 'OK',
        clerkUserId,
        clerkEmail,
        profileId: profileByClerkId.id,
        profileEmail: profileByClerkId.email,
      })
    }

    // 4. Supabase 프로필 조회 (email fallback)
    const { data: profileByEmail, error: emailError } = clerkEmail
      ? await admin.from('profiles').select('id, email, clerk_id').eq('email', clerkEmail).maybeSingle()
      : { data: null, error: null }

    return NextResponse.json({
      step: 'profile_lookup',
      status: profileByEmail ? 'WARN_NO_CLERK_ID' : 'FAIL_NO_PROFILE',
      clerkUserId,
      clerkEmail,
      profileByClerkId: null,
      profileByEmail: profileByEmail ? { id: profileByEmail.id, hasClerkId: !!profileByEmail.clerk_id } : null,
      errors: {
        clerkIdLookup: clerkIdError?.message,
        emailLookup: emailError?.message,
      },
    })
  } catch (e) {
    return NextResponse.json({ step: 'unknown', status: 'ERROR', error: String(e) }, { status: 500 })
  }
}
