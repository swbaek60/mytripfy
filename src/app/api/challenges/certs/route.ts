import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/challenges/certs
 * Body: { challenge_id: string } — 본인 인증만 삭제 (auth.uid() = user_id, RLS 적용)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const challengeId = (body.challenge_id ?? body.challengeId)?.toString()?.trim()
    if (!challengeId) {
      return NextResponse.json({ error: 'challenge_id required' }, { status: 400 })
    }
    const { error } = await supabase
      .from('challenge_certifications')
      .delete()
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/challenges/certs', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * GET /api/challenges/certs?challengeId=xxx
 * 해당 챌린지에 인증한 전체 목록 조회 (인증 현황 보기 모달용).
 * RLS 우회를 위해 서비스 롤로 조회해 항상 전체 인증이 보이도록 함.
 */
export async function GET(req: NextRequest) {
  try {
    const challengeId = req.nextUrl.searchParams.get('challengeId')?.trim()
    if (!challengeId || challengeId === 'undefined' || challengeId === 'null') {
      return NextResponse.json({ error: 'challengeId required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: certs, error: certError } = await supabase
      .from('challenge_certifications')
      .select('user_id, challenge_id, image_url, created_at')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false })

    if (certError) {
      return NextResponse.json({ error: certError.message }, { status: 500 })
    }

    const list = certs || []
    if (list.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const userIds = [...new Set(list.map((c) => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, { full_name: p.full_name || 'User', avatar_url: p.avatar_url }])
    )

    const data = list.map((c) => ({
      user_id: c.user_id,
      challenge_id: c.challenge_id,
      image_url: c.image_url,
      created_at: c.created_at,
      dispute_status: (c as { dispute_status?: string }).dispute_status || 'clean',
      full_name: profileMap.get(c.user_id)?.full_name ?? 'User',
      avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
    }))

    return NextResponse.json({ data })
  } catch (e) {
    console.error('GET /api/challenges/certs', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
