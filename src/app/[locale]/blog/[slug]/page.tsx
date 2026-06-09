import Header from '@/components/Header'
import SectionShell from '@/components/layout/SectionShell'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/build-metadata'
import { BLOG_SLUGS, BLOG_PUBLISHED_AT, isBlogSlug } from '@/data/blog-articles'
import { blogKey } from '@/lib/blog-i18n'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo/json-ld'

export function generateStaticParams() {
  return BLOG_SLUGS.flatMap((slug) =>
    ['en', 'ko'].map((locale) => ({ locale, slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isBlogSlug(slug)) return {}
  const t = await getTranslations({ locale, namespace: 'Blog' })
  return buildPageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: t(blogKey(slug, 'metaTitle')),
    description: t(blogKey(slug, 'metaDesc')),
    keywords: t(blogKey(slug, 'keywords')).split(',').map((k) => k.trim()).filter(Boolean),
    openGraphType: 'article',
  })
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isBlogSlug(slug)) notFound()

  const t = await getTranslations({ locale, namespace: 'Blog' })
  const tb = await getTranslations({ locale, namespace: 'SeoPages' })

  const sections = [1, 2, 3, 4] as const

  const published = BLOG_PUBLISHED_AT[slug]
  const articleLd = buildArticleJsonLd({
    locale,
    path: `/blog/${slug}`,
    headline: t(blogKey(slug, 'title')),
    description: t(blogKey(slug, 'metaDesc')),
    datePublished: published,
  })
  const breadcrumb = buildBreadcrumbJsonLd(locale, [
    { name: tb('blogIndexTitle'), path: '/blog' },
    { name: t(blogKey(slug, 'title')), path: `/blog/${slug}` },
  ])

  return (
    <div className="min-h-screen bg-surface-warm">
      <JsonLdScript data={articleLd} />
      <JsonLdScript data={breadcrumb} />
      <Header locale={locale} currentPath="/blog" />

      <article>
        <header className="relative bg-midnight text-white py-14 sm:py-20">
          <div className="ds-container-wide max-w-3xl mx-auto">
            <Link href="/blog" className="text-sm text-white/60 hover:text-white mb-6 inline-block">
              ← {t('backToBlog')}
            </Link>
            <p className="text-xs font-bold text-brand-light mb-3">{t(blogKey(slug, 'readMin'))} · {published}</p>
            <h1 className="ds-hero-display text-3xl sm:text-4xl mb-4">{t(blogKey(slug, 'title'))}</h1>
            <p className="text-white/75 text-lg leading-relaxed">{t(blogKey(slug, 'excerpt'))}</p>
          </div>
        </header>

        <SectionShell variant="light">
          <div className="max-w-3xl mx-auto prose prose-neutral prose-headings:font-bold prose-a:text-brand">
            <p className="text-lg text-subtle leading-relaxed">{t(blogKey(slug, 'intro'))}</p>

            {sections.map((n) => (
              <section key={n} className="mt-10">
                <h2 className="text-xl font-bold text-heading mb-3">{t(blogKey(slug, `section${n}Title`))}</h2>
                <p className="text-subtle leading-relaxed whitespace-pre-line">{t(blogKey(slug, `section${n}Body`))}</p>
              </section>
            ))}

            <div className="mt-12 p-6 rounded-2xl bg-brand-light border border-brand/20">
              <h3 className="font-bold text-heading mb-2">{t(blogKey(slug, 'ctaTitle'))}</h3>
              <p className="text-sm text-subtle mb-4">{t(blogKey(slug, 'ctaBody'))}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={t(blogKey(slug, 'ctaHref'))}>
                  <Button className="rounded-full bg-brand hover:bg-brand-hover">{t(blogKey(slug, 'ctaButton'))}</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="rounded-full">{t('joinFree')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </SectionShell>
      </article>
    </div>
  )
}
