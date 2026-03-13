import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/ses'
import { companionApplicationEmail } from '@/utils/emailTemplates'

export async function POST(req: NextRequest) {
  try {
    const { postId, applicantId, message } = await req.json()
    if (!postId || !applicantId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const [{ data: post }, { data: applicant }] = await Promise.all([
      supabase
        .from('companion_posts')
        .select('title, user_id')
        .eq('id', postId)
        .single(),
      supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', applicantId)
        .single(),
    ])

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const { data: host } = await supabase
      .from('profiles')
      .select('full_name, email:id')
      .eq('id', post.user_id)
      .single()

    const { data: hostAuth } = await supabase.auth.admin.getUserById(post.user_id)
    const hostEmail = hostAuth?.user?.email
    if (!hostEmail) return NextResponse.json({ error: 'Host email not found' }, { status: 404 })

    const locale = process.env.DEFAULT_LOCALE || 'en'
    const { subject, html } = companionApplicationEmail({
      hostName: (host?.full_name as string) || 'Host',
      applicantName: (applicant?.full_name as string) || 'A traveler',
      applicantAvatarUrl: (applicant?.avatar_url as string) || undefined,
      postTitle: post.title,
      postId,
      message: message || undefined,
      locale,
    })

    await sendEmail({ to: hostEmail, subject, html })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email/companion-application]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
