import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import AdminDashboard from './AdminDashboard'

const ADMIN_EMAIL = 'swbaek60@gmail.com'

export const metadata = { title: '관리자 대시보드 | mytripfy' }

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await currentUser()

  if (!user) redirect(`/${locale}/login?returnTo=/${locale}/admin`)

  const email = user.emailAddresses?.[0]?.emailAddress ?? ''
  if (email !== ADMIN_EMAIL) redirect(`/${locale}`)

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalMembers },
    { count: activeCompanions },
    { count: totalGuides },
    { count: totalTrips },
    { count: totalGuideRequests },
    { count: newMembersThisMonth },
    { data: recentMembers },
    { data: recentCompanions },
    { count: totalSponsors },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('companion_posts').select('*', { count: 'exact', head: true }).eq('status', 'open').gte('end_date', today),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_guide', true),
    supabase.from('trips').select('*', { count: 'exact', head: true }),
    supabase.from('guide_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('id, full_name, email, avatar_url, created_at, is_guide, travel_count').order('created_at', { ascending: false }).limit(10),
    supabase.from('companion_posts').select('id, title, destination_country, start_date, end_date, status, created_at, profiles(full_name, email)').order('created_at', { ascending: false }).limit(8),
    supabase.from('sponsors').select('*', { count: 'exact', head: true }),
  ])

  return (
    <AdminDashboard
      stats={{
        totalMembers: totalMembers ?? 0,
        activeCompanions: activeCompanions ?? 0,
        totalGuides: totalGuides ?? 0,
        totalTrips: totalTrips ?? 0,
        totalGuideRequests: totalGuideRequests ?? 0,
        newMembersThisMonth: newMembersThisMonth ?? 0,
        totalSponsors: totalSponsors ?? 0,
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentMembers={(recentMembers ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentCompanions={(recentCompanions ?? []) as any}
      adminEmail={email}
      locale={locale}
    />
  )
}
