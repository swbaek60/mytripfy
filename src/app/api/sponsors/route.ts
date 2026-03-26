import { createClient, getAuthUser } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BUSINESS_TYPES = ['restaurant', 'cafe', 'bar', 'shop', 'accommodation', 'experience', 'other']
const BENEFIT_TYPES = ['discount_percent', 'discount_fixed', 'free_item', 'free_drink', 'free_entry', 'bogo', 'other']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const authUser = await getAuthUser()
    const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const name = formData.get('name')?.toString()
    const nameEn = formData.get('name_en')?.toString() || null
    const description = formData.get('description')?.toString() || null
    const descriptionEn = formData.get('description_en')?.toString() || null
    const businessType = formData.get('business_type')?.toString()
    const countryCode = formData.get('country_code')?.toString()
    const region = formData.get('region')?.toString() || null
    const city = formData.get('city')?.toString() || null
    const address = formData.get('address')?.toString() || null
    const websiteUrl = formData.get('website_url')?.toString() || null
    const instagramUrl = formData.get('instagram_url')?.toString() || null
    const facebookUrl = formData.get('facebook_url')?.toString() || null
    const twitterUrl = formData.get('twitter_url')?.toString() || null
    const phone = formData.get('phone')?.toString()?.trim() || null
    const logo = formData.get('logo') as File | null
    const cover = formData.get('cover') as File | null
    const benefitsJson = formData.get('benefits')?.toString()

    if (!name?.trim() || !businessType || !countryCode) {
      return NextResponse.json({ error: 'Name, business type and country are required' }, { status: 400 })
    }
    if (!BUSINESS_TYPES.includes(businessType)) {
      return NextResponse.json({ error: 'Invalid business type' }, { status: 400 })
    }

    const { data: sponsor, error: insertError } = await supabase
      .from('sponsors')
      .insert({
        user_id: user.id,
        name: name.trim(),
        name_en: nameEn?.trim() || null,
        description: description?.trim() || null,
        description_en: descriptionEn?.trim() || null,
        business_type: businessType,
        country_code: countryCode,
        region: region?.trim() || null,
        city: city?.trim() || null,
        address: address?.trim() || null,
        website_url: websiteUrl?.trim() || null,
        instagram_url: instagramUrl?.trim() || null,
        facebook_url: facebookUrl?.trim() || null,
        twitter_url: twitterUrl?.trim() || null,
        phone,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError || !sponsor) {
      console.error('sponsors insert', insertError)
      return NextResponse.json({ error: insertError?.message || 'Failed to create sponsor' }, { status: 500 })
    }

    const sponsorId = sponsor.id
    const prefix = `${user.id}/sponsors/${sponsorId}`

    if (logo?.size && logo.type.startsWith('image/')) {
      const ext = logo.name.split('.').pop() || 'webp'
      const path = `${prefix}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, logo, { upsert: true, contentType: logo.type })
      if (!upErr) {
        const { data: u } = supabase.storage.from('photos').getPublicUrl(path)
        await supabase.from('sponsors').update({ logo_url: u.publicUrl }).eq('id', sponsorId)
      }
    }
    if (cover?.size && cover.type.startsWith('image/')) {
      const ext = cover.name.split('.').pop() || 'webp'
      const path = `${prefix}/cover.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, cover, { upsert: true, contentType: cover.type })
      if (!upErr) {
        const { data: u } = supabase.storage.from('photos').getPublicUrl(path)
        await supabase.from('sponsors').update({ cover_image_url: u.publicUrl }).eq('id', sponsorId)
      }
    }

    let benefits: Array<{ title: string; title_en?: string; description?: string; terms?: string; benefit_type: string; value_num?: number; value_text?: string; currency?: string; start_date: string; end_date: string; country_code?: string; region?: string; max_redemptions?: number }> = []
    try {
      if (benefitsJson) benefits = JSON.parse(benefitsJson)
    } catch (_) {}
    const today = new Date().toISOString().slice(0, 10)
    for (const b of benefits) {
      if (!b.title?.trim() || !b.benefit_type || !BENEFIT_TYPES.includes(b.benefit_type) || !b.start_date || !b.end_date) continue
      if (b.end_date < today) continue
      await supabase.from('sponsor_benefits').insert({
        sponsor_id: sponsorId,
        title: b.title.trim(),
        title_en: b.title_en?.trim() || null,
        description: b.description?.trim() || null,
        terms: b.terms?.trim() || null,
        benefit_type: b.benefit_type,
        value_num: b.value_num ?? null,
        value_text: b.value_text?.trim() || null,
        currency: b.currency?.trim() || null,
        start_date: b.start_date,
        end_date: b.end_date,
        country_code: b.country_code?.trim() || null,
        region: b.region?.trim() || null,
        max_redemptions: b.max_redemptions ?? null,
      })
    }

    return NextResponse.json({ success: true, id: sponsorId })
  } catch (e) {
    console.error('POST /api/sponsors', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
