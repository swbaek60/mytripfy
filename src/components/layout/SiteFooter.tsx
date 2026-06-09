import Link from 'next/link'
import Logo from '@/components/Logo'
import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'

interface Props {
  locale: string
  isLoggedIn?: boolean
}

export default async function SiteFooter({ locale, isLoggedIn }: Props) {
  let loggedIn = isLoggedIn
  if (loggedIn === undefined) {
    try {
      const { userId } = await auth()
      loggedIn = !!userId
    } catch {
      loggedIn = false
    }
  }

  const t = await getTranslations({ locale, namespace: 'Marketing' })

  return (
    <footer className="bg-footer-bg text-footer-text py-12 sm:py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 sm:gap-12 mb-8 sm:mb-10">
          <div>
            <Logo variant="reverse" className="h-9 w-auto sm:h-10 max-w-[min(100%,18rem)]" />
            <p className="text-sm text-footer-text mt-4 max-w-xs leading-relaxed">{t('footerTagline')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 text-sm w-full sm:w-auto">
            <div>
              <div className="text-footer-heading font-semibold mb-3">{t('footerExplore')}</div>
              <div className="space-y-2.5">
                <div><Link href={`/${locale}/companions`} className="hover:text-footer-heading transition-colors">{t('footerCompanions')}</Link></div>
                <div><Link href={`/${locale}/destinations`} className="hover:text-footer-heading transition-colors">{t('navDestinations')}</Link></div>
                <div><Link href={`/${locale}/guides`} className="hover:text-footer-heading transition-colors">{t('footerGuides')}</Link></div>
                <div><Link href={`/${locale}/challenges`} className="hover:text-footer-heading transition-colors">{t('footerChallenges')}</Link></div>
                <div><Link href={`/${locale}/sponsors`} className="hover:text-footer-heading transition-colors">{t('footerSponsors')}</Link></div>
              </div>
            </div>
            <div>
              <div className="text-footer-heading font-semibold mb-3">{t('footerCommunity')}</div>
              <div className="space-y-2.5">
                <div><Link href={`/${locale}/how-it-works`} className="hover:text-footer-heading transition-colors">{t('footerHowItWorks')}</Link></div>
                <div><Link href={`/${locale}/blog`} className="hover:text-footer-heading transition-colors">{t('footerBlog')}</Link></div>
                <div><Link href={`/${locale}/personality`} className="hover:text-footer-heading transition-colors">{t('footerTripMatcher')}</Link></div>
                <div><Link href={`/${locale}/challenges/feed`} className="hover:text-footer-heading transition-colors">{t('footerCertFeed')}</Link></div>
                <div><Link href={`/${locale}/hall-of-fame`} className="hover:text-footer-heading transition-colors">{t('footerHallOfFame')}</Link></div>
              </div>
            </div>
            <div>
              <div className="text-footer-heading font-semibold mb-3">{t('footerAccount')}</div>
              <div className="space-y-2.5">
                {loggedIn ? (
                  <>
                    <div><Link href={`/${locale}/dashboard`} className="hover:text-footer-heading transition-colors">{t('footerDashboard')}</Link></div>
                    <div><Link href={`/${locale}/profile`} className="hover:text-footer-heading transition-colors">{t('footerProfile')}</Link></div>
                    <div><Link href={`/${locale}/bookmarks`} className="hover:text-footer-heading transition-colors">{t('footerSaved')}</Link></div>
                  </>
                ) : (
                  <div><Link href={`/${locale}/login`} className="hover:text-footer-heading transition-colors">{t('footerLogin')}</Link></div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-footer-border pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <span>© 2026 mytripfy.com · {t('footerRights')}</span>
            <Link href={`/${locale}/privacy`} className="hover:text-footer-heading transition-colors underline underline-offset-2">
              {t('footerPrivacy')}
            </Link>
          </div>
          <span>{t('footerMadeFor')}</span>
        </div>
      </div>
    </footer>
  )
}
