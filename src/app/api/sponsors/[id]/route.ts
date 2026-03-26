import { createClient, getAuthUser } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BENEFIT_TYPES = ['discount_percent', 'discount_fixed', 'free_item', 'free_drink', 'free_entry', 'bogo', 'other']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const authUser = await getAuthUser()
    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('sponsors')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let name: string | undefined
    let name_en: string | null | undefined
    let description: string | null | undefined
    let description_en: string | null | undefined
    let business_type: string | undefined
    let country_code: string | undefined
    let region: string | null | undefined
    let city: string | null | undefined
    let address: string | null | undefined
    let website_url: string | null | undefined
    let instagram_url: string | null | undefined
    let facebook_url: string | null | undefined
    let twitter_url: string | null | undefined
    let phone: string | null | undefined
    let status: string | undefined
    let benefitsPayload: unknown
    let removeLogo: boolean = false
    let removeCover: boolean = false
    let logoFile: File | null = null
    let coverFile: File | null = null

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      name = formData.get('name')?.toString()
      name_en = formData.get('name_en')?.toString()?.trim() || null
      description = formData.get('description')?.toString()?.trim() || null
      description_en = formData.get('description_en')?.toString()?.trim() || null
      business_type = formData.get('business_type')?.toString()
      country_code = formData.get('country_code')?.toString()
      region = formData.get('region')?.toString()?.trim() || null
      city = formData.get('city')?.toString()?.trim() || null
      address = formData.get('address')?.toString()?.trim() || null
      website_url = formData.get('website_url')?.toString()?.trim() || null
      instagram_url = formData.get('instagram_url')?.toString()?.trim() || null
      facebook_url = formData.get('facebook_url')?.toString()?.trim() || null
      twitter_url = formData.get('twitter_url')?.toString()?.trim() || null
      phone = formData.get('phone')?.toString()?.trim() || null
      status = formData.get('status')?.toString()
      removeLogo = formData.get('removeLogo') === '1'
      removeCover = formData.get('removeCover') === '1'
      logoFile = formData.get('logo') as File | null
      coverFile = formData.get('cover') as File | null
      const benefitsStr = formData.get('benefits')?.toString()
      if (benefitsStr) {
        try {
          benefitsPayload = JSON.parse(benefitsStr)
        } catch {
          benefitsPayload = undefined
        }
      }
    } else {
      const body = await req.json()
      name = body.name
      name_en = body.name_en
      description = body.description
      description_en = body.description_en
      business_type = body.business_type
      country_code = body.country_code
      region = body.region
      city = body.city
      address = body.address
      website_url = body.website_url
      instagram_url = body.instagram_url
      facebook_url = body.facebook_url
      twitter_url = body.twitter_url
      phone = body.phone
      status = body.status
      benefitsPayload = body.benefits
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (name_en !== undefined) updates.name_en = name_en
    if (description !== undefined) updates.description = description
    if (description_en !== undefined) updates.description_en = description_en
    if (business_type !== undefined) updates.business_type = business_type
    if (country_code !== undefined) updates.country_code = country_code
    if (region !== undefined) updates.region = region
    if (city !== undefined) updates.city = city
    if (address !== undefined) updates.address = address
    if (website_url !== undefined) updates.website_url = website_url
    if (instagram_url !== undefined) updates.instagram_url = instagram_url
    if (facebook_url !== undefined) updates.facebook_url = facebook_url
    if (twitter_url !== undefined) updates.twitter_url = twitter_url
    if (phone !== undefined) updates.phone = phone
    if (status !== undefined) updates.status = status
    if (removeLogo) updates.logo_url = null
    if (removeCover) updates.cover_image_url = null

    const { error } = await supabase.from('sponsors').update(updates).eq('id', id)
    if (error) {
      console.error('sponsors PATCH', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (Array.isArray(benefitsPayload)) {
      const today = new Date().toISOString().slice(0, 10)
      const keptIds = benefitsPayload.filter((b: { id?: string }) => b.id).map((b: { id: string }) => b.id)
      const { data: existingBenefits } = await supabase.from('sponsor_benefits').select('id').eq('sponsor_id', id)
      const existingIds = (existingBenefits ?? []).map((r: { id: string }) => r.id)
      const toDelete = existingIds.filter((bid: string) => !keptIds.includes(bid))
      for (const bid of toDelete) {
        await supabase.from('sponsor_benefits').delete().eq('id', bid).eq('sponsor_id', id)
      }
      for (const b of benefitsPayload) {
        if (!b.title?.trim() || !BENEFIT_TYPES.includes(b.benefit_type) || !b.start_date || !b.end_date || b.end_date < today) continue
        if (b.id) {
          await supabase
            .from('sponsor_benefits')
            .update({
              title: b.title.trim(),
              title_en: b.title_en?.trim() || null,
              benefit_type: b.benefit_type,
              value_num: b.value_num ?? null,
              value_text: b.value_text?.trim() || null,
              start_date: b.start_date,
              end_date: b.end_date,
            })
            .eq('id', b.id)
            .eq('sponsor_id', id)
        } else {
          await supabase.from('sponsor_benefits').insert({
            sponsor_id: id,
            title: b.title.trim(),
            title_en: b.title_en?.trim() || null,
            benefit_type: b.benefit_type,
            value_num: b.value_num ?? null,
            value_text: b.value_text?.trim() || null,
            start_date: b.start_date,
            end_date: b.end_date,
          })
        }
      }
    }

    const prefix = `${user.id}/sponsors/${id}`
    if (logoFile?.size && logoFile.type.startsWith('image/')) {
      const ext = logoFile.name.split('.').pop() || 'webp'
      const path = `${prefix}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, logoFile, { upsert: true, contentType: logoFile.type })
      if (!upErr) {
        const { data: u } = supabase.storage.from('photos').getPublicUrl(path)
        await supabase.from('sponsors').update({ logo_url: u.publicUrl }).eq('id', id)
      }
    }
    if (coverFile?.size && coverFile.type.startsWith('image/')) {
      const ext = coverFile.name.split('.').pop() || 'webp'
      const path = `${prefix}/cover.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, coverFile, { upsert: true, contentType: coverFile.type })
      if (!upErr) {
        const { data: u } = supabase.storage.from('photos').getPublicUrl(path)
        await supabase.from('sponsors').update({ cover_image_url: u.publicUrl }).eq('id', id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/sponsors/[id]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
