import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { SITE_URL } from '@/lib/seo/site'

async function requestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() || h.get('host') || ''
  if (!host) return SITE_URL
  const rawProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const proto = rawProto === 'http' || rawProto === 'https' ? rawProto : 'https'
  return `${proto}://${host}`
}

/** Clerk OAuth는 redirect_url이 절대 URL이어야 모바일·www/apex 혼선이 줄어듦. 오픈 리다이렉트 방지로 상대 경로만 허용. */
function safeRedirectAfterSignIn(returnTo: string | undefined, locale: string, origin: string): string {
  const fallbackPath = `/${locale}`
  if (!returnTo || typeof returnTo !== 'string') return `${origin}${fallbackPath}`
  const t = returnTo.trim()
  if (!t.startsWith('/') || t.startsWith('//') || /[\r\n]/.test(t)) return `${origin}${fallbackPath}`
  return `${origin}${t}`
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const origin = await requestOrigin()
  const redirectAfter = safeRedirectAfterSignIn(sp.returnTo, locale, origin)
  redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectAfter)}`)
}
