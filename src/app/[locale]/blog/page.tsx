import Header from '@/components/Header'
import SectionShell from '@/components/layout/SectionShell'
import { Link } from '@/i18n/routing'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { BLOG_SLUGS } from '@/data/blog-articles'
import { blogKey } from '@/lib/blog-i18n'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo/json-ld'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SeoPages' })
  return buildPageMetadata({
    locale,
    path: '/blog',
    title: t('blogIndexTitle'),
    description: t('blogIndexDesc'),
    keywords: ['travel blog', 'travel companion guide', 'mytripfy', '100 countries challenge'],
  })
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Blog' })
  const tb = await getTranslations({ locale, namespace: 'SeoPages' })

  const articles = BLOG_SLUGS.map((slug) => ({
    slug,
    title: t(blogKey(slug, 'title')),
    excerpt: t(blogKey(slug, 'excerpt')),
    readMin: t(blogKey(slug, 'readMin')),
  }))

  const breadcrumb = buildBreadcrumbJsonLd(locale, [
    { name: tb('blogIndexTitle'), path: '/blog' },
  ])
  const itemList = buildItemListJsonLd(
    locale,
    tb('blogIndexTitle'),
    articles.map((a) => ({ name: a.title, path: `/blog/${a.slug}` }))
  )

  return (
    <div className="min-h-screen bg-surface-warm">
      <JsonLdScript data={breadcrumb} />
      <JsonLdScript data={itemList} />
      <Header locale={locale} />

      <section className="relative bg-midnight text-white py-16 sm:py-20">
        <div className="ds-container-wide text-center max-w-3xl mx-auto">
          <h1 className="ds-hero-display text-3xl sm:text-4xl mb-4">{t('indexTitle')}</h1>
          <p className="text-white/70 text-lg">{t('indexSubtitle')}</p>
        </div>
      </section>

      <SectionShell variant="light">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group block rounded-2xl border border-edge/60 bg-surface overflow-hidden hover:border-brand/30 hover:shadow-lg transition-all"
            >
              <div className="h-2 bg-gradient-to-r from-brand via-challenge to-gold" />
              <div className="p-6">
                <p className="text-xs font-bold text-brand mb-2">{article.readMin}</p>
                <h2 className="text-lg font-bold text-heading group-hover:text-brand transition-colors mb-2">
                  {article.title}
                </h2>
                <p className="text-sm text-subtle leading-relaxed line-clamp-3">{article.excerpt}</p>
                <span className="inline-block mt-4 text-sm font-semibold text-brand">
                  {t('readMore')} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionShell>
    </div>
  )
}
