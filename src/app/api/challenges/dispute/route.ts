import { createClient, getAuthUser } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const authUser = await getAuthUser()
    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { cert_user_id, cert_challenge_id, reason } = await req.json()

    if (!cert_user_id || !cert_challenge_id || !reason) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    if (reason.trim().length < 10) {
      return NextResponse.json({ error: '신고 이유는 최소 10자 이상이어야 합니다.' }, { status: 400 })
    }

    // 자기 자신 인증은 신고 불가
    if (cert_user_id === user.id) {
      return NextResponse.json({ error: '본인의 인증은 신고할 수 없습니다.' }, { status: 400 })
    }

    // 딴지 자격 조건: 3개 이상 인증
    const { count: myCertCount } = await supabase
      .from('challenge_certifications')
      .select('challenge_id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((myCertCount ?? 0) < 3) {
      return NextResponse.json({ error: '딴지걸기 자격이 없습니다. 본인이 먼저 3개 이상 챌린지를 인증해야 합니다.' }, { status: 403 })
    }

    // 30일 시효 확인
    const { data: cert } = await supabase
      .from('challenge_certifications')
      .select('created_at, dispute_status')
      .eq('user_id', cert_user_id)
      .eq('challenge_id', cert_challenge_id)
      .single()

    if (!cert) {
      return NextResponse.json({ error: '존재하지 않는 인증입니다.' }, { status: 404 })
    }

    const certAge = Date.now() - new Date(cert.created_at).getTime()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    if (certAge > thirtyDays) {
      return NextResponse.json({ error: '인증 후 30일이 지난 인증은 딴지 대상이 되지 않습니다.' }, { status: 400 })
    }

    if (cert.dispute_status === 'invalidated') {
      return NextResponse.json({ error: '이미 무효 처리된 인증입니다.' }, { status: 400 })
    }

    // 중복 신고 확인
    const { data: existing } = await supabase
      .from('challenge_disputes')
      .select('id')
      .eq('cert_user_id', cert_user_id)
      .eq('cert_challenge_id', cert_challenge_id)
      .eq('reporter_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: '이미 이 인증에 딴지를 걸었습니다.' }, { status: 409 })
    }

    // 딴지 등록
    const { error: insertErr } = await supabase
      .from('challenge_disputes')
      .insert({
        cert_user_id,
        cert_challenge_id,
        reporter_id: user.id,
        reason: reason.trim(),
        points_staked: 5,
      })

    if (insertErr) throw insertErr

    // SECURITY DEFINER 함수로 상태 업데이트 (3건 이상 → reviewing)
    await supabase.rpc('handle_new_dispute', {
      p_cert_user_id: cert_user_id,
      p_cert_challenge_id: cert_challenge_id,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[dispute]', e)
    return NextResponse.json({ error: e.message ?? '서버 오류' }, { status: 500 })
  }
}
