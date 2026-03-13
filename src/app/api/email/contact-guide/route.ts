import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/ses'
import { contactGuideEmail } from '@/utils/emailTemplates'

export async function POST(req: NextRequest) {
  try {
    const { guideId, message } = await req.json()
    if (!guideId || !message?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // 현재 로그인 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 가이드 프로필 조회
    const { data: guide } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', guideId)
      .single()

    // 발신자 프로필 조회
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // 가이드 이메일 조회 (auth.users는 서비스 롤 필요)
    const admin = createAdminClient()
    const { data: guideAuthData } = await admin.auth.admin.getUserById(guideId)
    const guideEmail = guideAuthData?.user?.email

    if (!guideEmail) {
      console.error('contact-guide: guide email not found for', guideId)
      return NextResponse.json({ error: 'Guide email not found' }, { status: 404 })
    }

    const senderName = sender?.full_name || user.email || 'A traveler'
    const guideName = guide?.full_name || 'Guide'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
    const locale = process.env.DEFAULT_LOCALE || 'en'
    const messagesUrl = `${baseUrl}/${locale}/messages/${user.id}`

    const { subject, html } = contactGuideEmail({
      guideName,
      senderName,
      message: message.trim(),
      messagesUrl,
      locale,
    })

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('contact-guide: AWS SES env vars missing (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)')
      return NextResponse.json(
        { error: 'Email delivery failed', reason: 'AWS credentials missing (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)' },
        { status: 500 }
      )
    }

    const result = await sendEmail({
      to: guideEmail,
      subject,
      html,
      replyTo: user.email,
    })
    if (!result.success) {
      const err = result.error as { name?: string; message?: string; Code?: string } | undefined
      const reason = [err?.name || err?.Code, err?.message].filter(Boolean).join(': ')
      console.error('contact-guide: SES send failed', reason)
      return NextResponse.json(
        {
          error: 'Email delivery failed',
          ...(process.env.NODE_ENV === 'development' && reason && { reason }),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('contact-guide email error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
