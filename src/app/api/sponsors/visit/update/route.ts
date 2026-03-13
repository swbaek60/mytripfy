import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const visitId = formData.get('visitId')?.toString()
    const photo = formData.get('photo') as File | null
    if (!visitId || !photo?.size) {
      return NextResponse.json({ error: 'visitId and photo required' }, { status: 400 })
    }
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
    }

    const { data: visit } = await supabase
      .from('sponsor_visits')
      .select('id, user_id')
      .eq('id', visitId)
      .single()

    if (!visit || visit.user_id !== user.id) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }

    const ext = photo.name.split('.').pop() || 'jpg'
    const path = `${user.id}/sponsor-visits/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, photo, { upsert: false, contentType: photo.type })

    if (uploadError) {
      console.error('sponsor visit photo update upload', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    const photoUrl = urlData.publicUrl

    const { error: updateError } = await supabase
      .from('sponsor_visits')
      .update({ photo_url: photoUrl })
      .eq('id', visitId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('sponsor_visits update', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/sponsors/visit/update', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const visitId = searchParams.get('visitId')
    if (!visitId) return NextResponse.json({ error: 'visitId required' }, { status: 400 })

    const { data: visit } = await supabase
      .from('sponsor_visits')
      .select('id, user_id, sponsor_id')
      .eq('id', visitId)
      .single()

    if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

    const isOwnVisit = visit.user_id === user.id
    let isSponsorOwner = false
    if (!isOwnVisit) {
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('user_id')
        .eq('id', visit.sponsor_id)
        .single()
      isSponsorOwner = sponsor?.user_id === user.id
    }

    if (!isOwnVisit && !isSponsorOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('sponsor_visits')
      .delete()
      .eq('id', visitId)

    if (error) {
      console.error('sponsor_visits delete', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/sponsors/visit/update', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
