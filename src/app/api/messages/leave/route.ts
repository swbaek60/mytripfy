import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

async function getProfileId(clerkUserId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()
  return data?.id ?? null
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getProfileId(clerkUserId)
    if (!userId) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get('chatId')
    if (!chatId) return NextResponse.json({ error: 'chatId required' }, { status: 400 })

    const admin = createAdminClient()

    const { data: participant } = await admin
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
    }

    const { data: chat } = await admin
      .from('chats')
      .select('is_group, type')
      .eq('id', chatId)
      .single()

    let otherUserId: string | null = null
    if (!chat?.is_group) {
      const { data: others } = await admin
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', userId)
      otherUserId = others?.[0]?.user_id ?? null
    }

    await admin
      .from('chat_participants')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId)

    if (!chat?.is_group) {
      const { count } = await admin
        .from('chat_participants')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)

      if (!count || count === 0) {
        await admin.from('messages').delete().eq('chat_id', chatId)
        await admin.from('chats').delete().eq('id', chatId)
      }
    }

    if (chat?.is_group) {
      await admin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('type', 'message')
        .eq('reference_type', 'group_chat')
        .eq('reference_id', chatId)
    } else if (otherUserId) {
      await admin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('type', 'message')
        .eq('reference_type', 'user')
        .eq('reference_id', otherUserId)
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('messages/leave DELETE error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
