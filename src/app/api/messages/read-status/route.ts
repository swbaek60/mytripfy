import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

async function getProfileId(clerkUserId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * GET /api/messages/read-status?chatId=xxx
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    if (!chatId) return NextResponse.json({ error: 'chatId required' }, { status: 400 })

    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profileId = await getProfileId(clerkUserId)
    if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    const admin = createAdminClient()

    const { data: participant } = await admin
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', profileId)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
    }

    const { data: participants, error } = await admin
      .from('chat_participants')
      .select('user_id, last_read_at')
      .eq('chat_id', chatId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ participants: participants ?? [] })
  } catch (e) {
    console.error('read-status error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
