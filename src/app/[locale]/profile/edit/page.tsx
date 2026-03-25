import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import ProfileEditForm from './ProfileEditForm'

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: visitedCountries } = await supabase
    .from('visited_countries')
    .select('country_code')
    .eq('user_id', user.id)

  const visitedCodes = visitedCountries?.map(v => v.country_code) || []

  // 100 Countries 인증한 국가 코드 (가본 나라)
  const { data: certRows } = await supabase
    .from('challenge_certifications')
    .select('challenge_id')
    .eq('user_id', user.id)
  const certChallengeIds = (certRows || []).map(r => r.challenge_id)
  const { data: certChallenges } = certChallengeIds.length > 0
    ? await supabase.from('challenges').select('id, country_code').eq('category', 'countries').in('id', certChallengeIds)
    : { data: [] }
  const certifiedCountryCodes = (certChallenges || []).map(c => c.country_code).filter(Boolean) as string[]

  // 100 Countries 가고 싶음 국가 코드
  const { data: wishRows } = await supabase
    .from('challenge_wishes')
    .select('challenge_id')
    .eq('user_id', user.id)
  const wishChallengeIds = (wishRows || []).map(w => w.challenge_id)
  const { data: wishChallenges } = wishChallengeIds.length > 0
    ? await supabase.from('challenges').select('id, country_code').eq('category', 'countries').in('id', wishChallengeIds)
    : { data: [] }
  const wishedCountryCodes = (wishChallenges || []).map(c => c.country_code).filter(Boolean) as string[]

  const initialPhotos: string[] = (profile?.profile_photos as string[]) || []

  const { data: travelPersonality } = await supabase
    .from('travel_personalities')
    .select('personality_type, personality_desc')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <ProfileEditForm
          profile={profile}
          userId={user.id}
          locale={locale}
          visitedCodes={visitedCodes}
          certifiedCountryCodes={certifiedCountryCodes}
          wishedCountryCodes={wishedCountryCodes}
          initialPhotos={initialPhotos}
          travelPersonality={travelPersonality ? { personality_type: travelPersonality.personality_type, personality_desc: travelPersonality.personality_desc } : null}
        />
      </main>
    </div>
  )
}
