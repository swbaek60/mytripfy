import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/** OAuth 해시 플로우: 클라이언트가 #access_token/#refresh_token 을 POST로 보내면 서버에서 세션(쿠키) 설정 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const access_token = body?.access_token
    const refresh_token = body?.refresh_token
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'access_token and refresh_token required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, user_id: data.user?.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
