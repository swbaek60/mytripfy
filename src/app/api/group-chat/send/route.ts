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

export async function POST(req: Request) {
  try {
    const { chatId, content } = await req.json()

    if (!chatId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing chatId or content' }, { status: 400 })
    }

    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileId = await getProfileId(clerkUserId)
    if (!profileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 })
    }

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

    const { data, error } = await admin
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: profileId,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('message insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: data })
  } catch (e) {
    console.error('group-chat/send error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
