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

    const { cert_user_id, cert_challenge_id, vote } = await req.json()

    if (!cert_user_id || !cert_challenge_id || !['valid', 'invalid'].includes(vote)) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    // 자기 자신 인증에는 투표 불가
    if (cert_user_id === user.id) {
      return NextResponse.json({ error: '본인 인증에는 투표할 수 없습니다.' }, { status: 403 })
    }

    // 본인이 신고한 건에는 투표 불가 (이해충돌)
    const { data: isReporter } = await supabase
      .from('challenge_disputes')
      .select('id')
      .eq('cert_user_id', cert_user_id)
      .eq('cert_challenge_id', cert_challenge_id)
      .eq('reporter_id', user.id)
      .maybeSingle()

    if (isReporter) {
      return NextResponse.json({ error: '본인이 신고한 건에는 배심원으로 참여할 수 없습니다.' }, { status: 403 })
    }

    // 인증 상태 확인
    const { data: cert } = await supabase
      .from('challenge_certifications')
      .select('dispute_status')
      .eq('user_id', cert_user_id)
      .eq('challenge_id', cert_challenge_id)
      .single()

    if (!cert || cert.dispute_status !== 'reviewing') {
      return NextResponse.json({ error: '배심원 심사 중인 인증이 아닙니다.' }, { status: 400 })
    }

    // 중복 투표 확인
    const { data: existingVote } = await supabase
      .from('dispute_votes')
      .select('id')
      .eq('cert_user_id', cert_user_id)
      .eq('cert_challenge_id', cert_challenge_id)
      .eq('voter_id', user.id)
      .maybeSingle()

    if (existingVote) {
      return NextResponse.json({ error: '이미 투표하셨습니다.' }, { status: 409 })
    }

    // 투표 등록
    const { error: voteErr } = await supabase
      .from('dispute_votes')
      .insert({
        cert_user_id,
        cert_challenge_id,
        voter_id: user.id,
        vote,
      })

    if (voteErr) throw voteErr

    // 자동 판결 처리 (3표 이상 시 결정)
    const { data: result } = await supabase.rpc('resolve_cert_dispute', {
      p_cert_user_id: cert_user_id,
      p_cert_challenge_id: cert_challenge_id,
    })

    return NextResponse.json({ success: true, result: result ?? 'pending' })
  } catch (e: any) {
    console.error('[vote]', e)
    return NextResponse.json({ error: e.message ?? '서버 오류' }, { status: 500 })
  }
}
