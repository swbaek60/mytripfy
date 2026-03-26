import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { sendEmail } from '@/utils/ses'
import { contactGuideEmail } from '@/utils/emailTemplates'

async function getProfileById(id: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', id)
    .single()
  return data
}

async function getProfileByClerkId(clerkId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('clerk_id', clerkId)
    .maybeSingle()
  return data
}

export async function POST(req: NextRequest) {
  try {
    const { guideId, message } = await req.json()
    if (!guideId || !message?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sender = await getProfileByClerkId(clerkUserId)
    if (!sender) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 })
    }

    const guide = await getProfileById(guideId)
    let guideEmail = guide?.email

    if (!guideEmail) {
      const admin = createAdminClient()
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(guideId)
        guideEmail = authUser?.user?.email ?? null
      } catch { /* ignore */ }
    }

    if (!guideEmail) {
      console.error('contact-guide: guide email not found for', guideId)
      return NextResponse.json({ error: 'Guide email not found' }, { status: 404 })
    }

    const senderName = sender.full_name || sender.email || 'A traveler'
    const guideName = guide?.full_name || 'Guide'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
    const locale = process.env.DEFAULT_LOCALE || 'en'
    const messagesUrl = `${baseUrl}/${locale}/messages/${sender.id}`

    const { subject, html } = contactGuideEmail({
      guideName,
      senderName,
      message: message.trim(),
      messagesUrl,
      locale,
    })

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('contact-guide: AWS SES env vars missing')
      return NextResponse.json(
        { error: 'Email delivery failed', code: 'AWS_CREDENTIALS_MISSING' },
        { status: 500 }
      )
    }

    const result = await sendEmail({
      to: guideEmail,
      subject,
      html,
      replyTo: sender.email ?? undefined,
    })
    if (!result.success) {
      const err = result.error as { name?: string; message?: string; Code?: string } | undefined
      const code = err?.name || err?.Code
      const reason = [code, err?.message].filter(Boolean).join(': ')
      console.error('contact-guide: SES send failed', reason)

      const isSandboxRecipient = code === 'MessageRejected' || (err?.message && /recipient|verify|sandbox/i.test(String(err.message)))
      const errorCode = isSandboxRecipient ? 'SES_SANDBOX_RECIPIENT' : 'SES_SEND_FAILED'

      return NextResponse.json(
        { error: 'Email delivery failed', code: errorCode, detail: reason },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('contact-guide email error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
