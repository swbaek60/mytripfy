import type { MetadataRoute } from 'next'
import { getAdminClientSafe } from '@/utils/supabase/server'
import { SITE_URL, hreflangAlternates } from '@/lib/seo/site'
import { CHALLENGE_CATEGORY_KEYS } from '@/data/challenge-category-keys'

const STATIC_PATHS = [
  '',
  '/companions',
  '/guides',
  '/guides/requests',
  '/sponsors',
  '/challenges',
  '/challenges/feed',
  '/challenges/guide',
  '/hall-of-fame',
  '/trips',
  '/privacy',
  '/account-data-deletion',
] as const

function entryForPath(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'],
  priority: number
): MetadataRoute.Sitemap[0] {
  const languages = hreflangAlternates(path)
  return {
    url:
      path === '' || path === '/'
        ? `${SITE_URL}/en`
        : `${SITE_URL}/en${path.startsWith('/') ? path : `/${path}`}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const path of STATIC_PATHS) {
    entries.push(
      entryForPath(
        path === '' ? '' : path,
        now,
        path === '' ? 'daily' : 'weekly',
        path === '' ? 1 : 0.85
      )
    )
  }

  for (const key of CHALLENGE_CATEGORY_KEYS) {
    entries.push(
      entryForPath(
        `/challenges/${key}`,
        now,
        'weekly',
        0.75
      )
    )
  }

  const admin = getAdminClientSafe()
  if (!admin) {
    return entries
  }

  const today = new Date().toISOString().split('T')[0]

  try {
    const [{ data: posts }, { data: requests }, { data: sponsorRows }, { data: guides }, { data: publicTrips }] =
      await Promise.all([
        admin
          .from('companion_posts')
          .select('id, updated_at')
          .eq('status', 'open')
          .gte('end_date', today)
          .order('updated_at', { ascending: false })
          .limit(2000),
        admin
          .from('guide_requests')
          .select('id, updated_at')
          .eq('status', 'open')
          .gte('end_date', today)
          .order('updated_at', { ascending: false })
          .limit(1500),
        admin
          .from('sponsors')
          .select('id, updated_at')
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1000),
        admin
          .from('profiles')
          .select('id, updated_at')
          .eq('is_guide', true)
          .order('updated_at', { ascending: false })
          .limit(3000),
        admin.from('trips').select('id').eq('visibility', 'public').limit(1500),
      ])

    const pushDynamic = (
      pathFn: (id: string) => string,
      rows: { id: string; updated_at?: string | null }[] | null,
      freq: MetadataRoute.Sitemap[0]['changeFrequency'],
      priority: number
    ) => {
      for (const row of rows ?? []) {
        const path = pathFn(row.id)
        const lm = row.updated_at ? new Date(row.updated_at) : now
        entries.push(entryForPath(path, lm, freq, priority))
      }
    }

    pushDynamic((id) => `/companions/${id}`, posts ?? [], 'daily', 0.7)
    pushDynamic((id) => `/guides/requests/${id}`, requests ?? [], 'daily', 0.65)
    pushDynamic((id) => `/sponsors/${id}`, sponsorRows ?? [], 'weekly', 0.65)
    pushDynamic((id) => `/guides/${id}`, guides ?? [], 'weekly', 0.7)

    for (const row of publicTrips ?? []) {
      entries.push(
        entryForPath(`/trips/${row.id}`, now, 'weekly', 0.55)
      )
    }
  } catch (e) {
    console.error('[sitemap] dynamic URLs skipped:', e)
  }

  return entries
}
