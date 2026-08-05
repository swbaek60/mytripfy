import { NextResponse } from 'next/server'
import { createAdminClient, getAuthUser } from '@/utils/supabase/server'
import { getHeaderBadgeCounts } from '@/utils/notifications'
import { CACHE_PRIVATE_SHORT } from '@/lib/http-cache'

/** 헤더 배지·프로필 (클라이언트 1회 fetch — 페이지 SSR마다 DB 조회하지 않음) */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ signedIn: false }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id, avatar_url, full_name')
      .eq('clerk_id', authUser.clerkUserId)
      .single()

    if (!profile) {
      return NextResponse.json({ signedIn: true, profile: null, unreadNotifications: 0, unreadMessages: 0 })
    }

    const { unreadNotifications, unreadMessages } = await getHeaderBadgeCounts(admin, profile.id)

    return NextResponse.json(
      {
        signedIn: true,
        profile: {
          id: profile.id,
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
        },
        unreadNotifications,
        unreadMessages,
      },
      { headers: { 'Cache-Control': CACHE_PRIVATE_SHORT } }
    )
  } catch (e) {
    console.error('header/badges error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
