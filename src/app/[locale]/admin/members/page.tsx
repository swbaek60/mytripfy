import { createAdminClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import AdminShell from '../AdminShell'
import AdminMembersList, { type AdminMemberRow } from '../AdminMembersList'
import type { Metadata } from 'next'

const PAGE_SIZE = 100

// 회원 목록이 담긴 화면이다. 색인은 절대 허용하지 않는다.
export const metadata: Metadata = {
  title: '전체 회원 | mytripfy 관리자',
  robots: { index: false, follow: false },
}

export default async function AdminMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page: pageParam } = await searchParams
  const returnPath = `/${locale}/admin/members`
  const { email } = await requireAdmin(locale, returnPath)

  const rawPage = Number.parseInt(pageParam ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = (safePage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: members } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, avatar_url, created_at, is_guide, travel_count, travel_level, trust_score, nationality, email_verified'
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  return (
    <AdminShell locale={locale} adminEmail={email} activePath="/admin/members">
      <AdminMembersList
        members={(members ?? []) as AdminMemberRow[]}
        locale={locale}
        page={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
      />
    </AdminShell>
  )
}
