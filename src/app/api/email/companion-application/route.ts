import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/email'
import { companionApplicationEmail } from '@/utils/emailTemplates'

export async function POST(req: NextRequest) {
  try {
    const { postId, applicantId, message } = await req.json()
    if (!postId || !applicantId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    const [{ data: post }, { data: applicant }] = await Promise.all([
      admin
        .from('companion_posts')
        .select('title, user_id')
        .eq('id', postId)
        .single(),
      admin
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', applicantId)
        .single(),
    ])

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const { data: host } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', post.user_id)
      .single()

    if (!host?.email) return NextResponse.json({ error: 'Host email not found' }, { status: 404 })

    const locale = process.env.DEFAULT_LOCALE || 'en'
    const { subject, html } = companionApplicationEmail({
      hostName: host.full_name || 'Host',
      applicantName: applicant?.full_name || 'A traveler',
      applicantAvatarUrl: applicant?.avatar_url || undefined,
      postTitle: post.title,
      postId,
      message: message || undefined,
      locale,
    })

    await sendEmail({ to: host.email, subject, html })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email/companion-application]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
