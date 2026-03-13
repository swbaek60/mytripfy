import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/** 동행 신청 (성별 조건 검사 후 저장) */
export async function POST(req: Request) {
  try {
    const { postId, message } = await req.json()
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: post } = await supabase
      .from('companion_posts')
      .select('id, gender_preference, status')
      .eq('id', postId)
      .single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.status !== 'open') return NextResponse.json({ error: 'Trip is not open for applications' }, { status: 400 })

    const pref = post.gender_preference as string
    if (pref === 'female_only' || pref === 'male_only') {
      const { data: profile } = await supabase.from('profiles').select('gender').eq('id', user.id).single()
      const myGender = (profile?.gender as string) || ''
      const allowed =
        (pref === 'female_only' && myGender === 'female') ||
        (pref === 'male_only' && myGender === 'male')
      if (!allowed) {
        return NextResponse.json(
          { error: pref === 'female_only' ? 'This trip is for women only.' : 'This trip is for men only.' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('companion_applications')
      .upsert(
        { post_id: postId, applicant_id: user.id, message: message || null, status: 'pending' },
        { onConflict: 'post_id,applicant_id' }
      )

    if (error) {
      console.error('[companion/apply]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[companion/apply]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
