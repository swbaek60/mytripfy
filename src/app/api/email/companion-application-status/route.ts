import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/ses'
import { companionApplicationAcceptedEmail, companionApplicationRejectedEmail } from '@/utils/emailTemplates'
import { getCountryByCode } from '@/data/countries'

export async function POST(req: NextRequest) {
  try {
    const { postId, applicantId, status } = await req.json()
    if (!postId || !applicantId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const [{ data: post }, { data: applicant }] = await Promise.all([
      supabase
        .from('companion_posts')
        .select('title, user_id, destination_country, start_date, end_date')
        .eq('id', postId)
        .single(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', applicantId)
        .single(),
    ])

    if (!post || !applicant) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', post.user_id)
      .single()

    const { data: applicantAuth } = await supabase.auth.admin.getUserById(applicantId)
    const applicantEmail = applicantAuth?.user?.email
    if (!applicantEmail) return NextResponse.json({ error: 'Email not found' }, { status: 404 })

    const country = getCountryByCode(post.destination_country)
    const applicantName = (applicant.full_name as string) || 'Traveler'
    const postTitle = post.title
    const locale = process.env.DEFAULT_LOCALE || 'en'

    let subject: string
    let html: string

    if (status === 'accepted') {
      const result = companionApplicationAcceptedEmail({
        applicantName,
        hostName: (hostProfile?.full_name as string) || 'Host',
        postTitle,
        postId,
        country: country?.name || post.destination_country,
        startDate: new Date(post.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: new Date(post.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        locale,
      })
      subject = result.subject
      html = result.html
    } else {
      const result = companionApplicationRejectedEmail({ applicantName, postTitle, postId, locale })
      subject = result.subject
      html = result.html
    }

    await sendEmail({ to: applicantEmail, subject, html })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email/companion-application-status]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
