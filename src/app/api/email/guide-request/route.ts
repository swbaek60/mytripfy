import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/ses'
import { guideRequestNotifyEmail } from '@/utils/emailTemplates'
import { getLanguageByCode } from '@/data/languages'

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json()
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

    const supabase = await createClient()

    // 요청 정보 조회
    const { data: request } = await supabase
      .from('guide_requests')
      .select('*, profiles(full_name)')
      .eq('id', requestId)
      .single()

    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    const requesterName = (request.profiles as Record<string, unknown>)?.full_name as string || 'A traveler'

    // 매칭 가이드 조회: 같은 지역 + 가이드 등록 + 이메일 있음
    let guidesQuery = supabase
      .from('profiles')
      .select('id, full_name, email, spoken_languages')
      .eq('is_guide', true)
      .not('email', 'is', null)
      .neq('id', request.user_id)

    // 지역 매칭
    if (request.destination_country) {
      guidesQuery = guidesQuery.contains('guide_regions', [request.destination_country])
    }

    const { data: allGuides } = await guidesQuery

    if (!allGuides || allGuides.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No matching guides' })
    }

    // 언어 필터 (preferred_languages가 있는 경우)
    const preferredLangs: string[] = request.preferred_languages || []
    const matchedGuides = preferredLangs.length > 0
      ? allGuides.filter(g => {
          const skills = (g.spoken_languages as Array<{ lang: string }>) || []
          return skills.some(s => preferredLangs.includes(s.lang))
        })
      : allGuides

    if (matchedGuides.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No language-matched guides' })
    }

    // 언어 이름 변환
    const languageNames = preferredLangs
      .map(code => getLanguageByCode(code)?.name)
      .filter(Boolean) as string[]

    const locale = process.env.DEFAULT_LOCALE || 'en'
    const results = await Promise.allSettled(
      matchedGuides.map(guide => {
        const { subject, html } = guideRequestNotifyEmail({
          guideName: guide.full_name || 'Guide',
          requesterName,
          requestTitle: request.title,
          country: request.destination_country,
          city: request.destination_city || undefined,
          startDate: request.start_date,
          endDate: request.end_date,
          languages: languageNames.length > 0 ? languageNames : undefined,
          requestId: request.id,
          locale,
        })
        return sendEmail({ to: guide.email, subject, html })
      })
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent: succeeded, total: matchedGuides.length })

  } catch (error) {
    console.error('[email/guide-request]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
