import { NextResponse } from 'next/server'
import { createAdminClient, getAuthUser } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser?.profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, platform } = await req.json()
    if (!token || !platform) {
      return NextResponse.json({ error: 'Missing token or platform' }, { status: 400 })
    }
    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('push_device_tokens').upsert(
      {
        user_id: authUser.profileId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    )

    if (error) {
      console.error('[push/register]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[push/register]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
