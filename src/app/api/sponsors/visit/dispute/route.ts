import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { visit_id, reason } = await req.json()
    if (!visit_id || !reason || typeof reason !== 'string') {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }
    if (reason.trim().length < 10) {
      return NextResponse.json({ error: '신고 이유는 최소 10자 이상이어야 합니다.' }, { status: 400 })
    }

    const { data: visit } = await supabase
      .from('sponsor_visits')
      .select('id, user_id, status')
      .eq('id', visit_id)
      .single()

    if (!visit) return NextResponse.json({ error: '존재하지 않는 방문 인증입니다.' }, { status: 404 })
    if (visit.status !== 'approved') {
      return NextResponse.json({ error: '승인된 방문 인증만 신고할 수 있습니다.' }, { status: 400 })
    }
    if (visit.user_id === user.id) {
      return NextResponse.json({ error: '본인의 인증은 신고할 수 없습니다.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('sponsor_visit_disputes')
      .select('id')
      .eq('visit_id', visit_id)
      .eq('reporter_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: '이미 이 방문 인증에 딴지를 걸었습니다.' }, { status: 409 })
    }

    const { error: insertErr } = await supabase.from('sponsor_visit_disputes').insert({
      visit_id,
      reporter_id: user.id,
      reason: reason.trim(),
    })
    if (insertErr) throw insertErr

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[sponsors/visit/dispute]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '서버 오류' },
      { status: 500 }
    )
  }
}
