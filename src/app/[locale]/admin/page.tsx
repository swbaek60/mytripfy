import { createAdminClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import AdminDashboard from './AdminDashboard'
import AdminShell from './AdminShell'
import { computeBeachheadStats } from '@/lib/admin/beachhead-stats'
import type { Metadata } from 'next'

// 운영자만 들어오는 화면이다. 링크가 어디에 새더라도 검색에 올라가면 안 된다.
export const metadata: Metadata = {
  title: '관리자 대시보드 | mytripfy',
  robots: { index: false, follow: false },
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { email } = await requireAdmin(locale, `/${locale}/admin`)

  const supabase = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

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
    { data: allCompanionPosts },
    { data: allSponsors },
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
    supabase.from('companion_posts').select('destination_country, destination_city, status, end_date'),
    supabase.from('sponsors').select('country_code, city, status'),
  ])

  const beachheadStats = computeBeachheadStats(allCompanionPosts ?? [], allSponsors ?? [], today)

  return (
    <AdminShell locale={locale} adminEmail={email} activePath="/admin">
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
        beachheadStats={beachheadStats}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentMembers={(recentMembers ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentCompanions={(recentCompanions ?? []) as any}
        locale={locale}
      />
    </AdminShell>
  )
}
