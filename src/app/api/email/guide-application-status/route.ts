import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/ses'
import { guideApplicationAcceptedEmail, guideApplicationRejectedEmail } from '@/utils/emailTemplates'

export async function POST(req: NextRequest) {
  try {
    const { requestId, guideId, status } = await req.json()
    if (!requestId || !guideId || !status) {
      return NextResponse.json({ error: 'requestId, guideId, status required' }, { status: 400 })
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status must be accepted or rejected' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 요청 + 작성자 정보
    const { data: request } = await supabase
      .from('guide_requests')
      .select('id, title, profiles(full_name)')
      .eq('id', requestId)
      .single()

    // 가이드 정보
    const { data: guide } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', guideId)
      .single()

    if (!guide?.email) {
      return NextResponse.json({ error: 'Guide email not found' }, { status: 404 })
    }

    const requestTitle = request?.title || 'Guide request'
    const prof = request?.profiles && Array.isArray(request.profiles) ? request.profiles[0] : request?.profiles
    const ownerName = (prof as Record<string, unknown> | undefined)?.full_name as string || 'The traveler'
    const guideName = guide.full_name || 'Guide'
    const locale = process.env.DEFAULT_LOCALE || 'en'

    let subject: string
    let html: string

    if (status === 'accepted') {
      const result = guideApplicationAcceptedEmail({ guideName, ownerName, requestTitle, requestId, locale })
      subject = result.subject
      html = result.html
    } else {
      const result = guideApplicationRejectedEmail({ guideName, requestTitle, requestId, locale })
      subject = result.subject
      html = result.html
    }

    const result = await sendEmail({ to: guide.email, subject, html })
    return NextResponse.json(result)

  } catch (error) {
    console.error('[email/guide-application-status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
