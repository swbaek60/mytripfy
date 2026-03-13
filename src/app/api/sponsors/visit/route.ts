import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VISIT_POINTS = 10

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const sponsorId = formData.get('sponsorId')?.toString()
    const photo = formData.get('photo') as File | null
    if (!sponsorId || !photo?.size) {
      return NextResponse.json({ error: 'sponsorId and photo required' }, { status: 400 })
    }
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
    }

    const { data: sponsor } = await supabase.from('sponsors').select('id').eq('id', sponsorId).eq('status', 'active').single()
    if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

    const ext = photo.name.split('.').pop() || 'jpg'
    const path = `${user.id}/sponsor-visits/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, photo, { upsert: false, contentType: photo.type })

    if (uploadError) {
      console.error('sponsor visit upload', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    const photoUrl = urlData.publicUrl

    const { data: existing } = await supabase
      .from('sponsor_visits')
      .select('id')
      .eq('user_id', user.id)
      .eq('sponsor_id', sponsorId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already submitted a visit for this store' }, { status: 409 })
    }

    const { error: insertError } = await supabase.from('sponsor_visits').insert({
      user_id: user.id,
      sponsor_id: sponsorId,
      photo_url: photoUrl,
      status: 'approved',
      points_granted: VISIT_POINTS,
      reviewed_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('sponsor_visits insert', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, points: VISIT_POINTS })
  } catch (e) {
    console.error('sponsors/visit', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
