import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/ses'
import { guideApplicationEmail } from '@/utils/emailTemplates'

export async function POST(req: NextRequest) {
  try {
    const { requestId, guideId } = await req.json()
    if (!requestId || !guideId) {
      return NextResponse.json({ error: 'requestId and guideId required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 요청 + 작성자 정보
    const { data: request } = await supabase
      .from('guide_requests')
      .select('id, title, user_id, profiles(full_name, email)')
      .eq('id', requestId)
      .single()

    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    // 신청한 가이드 정보
    const { data: guide } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', guideId)
      .single()

    // 신청 메시지
    const { data: application } = await supabase
      .from('guide_applications')
      .select('message')
      .eq('request_id', requestId)
      .eq('guide_id', guideId)
      .single()

    const ownerRaw = request.profiles
    const owner = (Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw) as Record<string, unknown> | undefined
    const ownerEmail = owner?.email as string
    const ownerName = owner?.full_name as string || 'Traveler'

    if (!ownerEmail) {
      return NextResponse.json({ error: 'Owner email not found' }, { status: 404 })
    }

    const locale = process.env.DEFAULT_LOCALE || 'en'
    const { subject, html } = guideApplicationEmail({
      ownerName,
      guideName: guide?.full_name || 'A guide',
      guideAvatarUrl: guide?.avatar_url || undefined,
      requestTitle: request.title,
      requestId: request.id,
      message: application?.message || undefined,
      locale,
    })

    const result = await sendEmail({ to: ownerEmail, subject, html })
    return NextResponse.json(result)

  } catch (error) {
    console.error('[email/guide-application]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
