import { NextResponse } from 'next/server'

/**
 * /ko/auth/callback 등 locale이 붙은 URL로 오면, 쿼리 유지한 채 루트 /auth/callback으로 보냄.
 * (OAuth 팝업 닫기 + postMessage는 app/auth/callback/route.ts 에서만 처리)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const { searchParams, origin } = new URL(request.url)
  const paramsWithLocale = new URLSearchParams(searchParams)
  if (!paramsWithLocale.has('locale')) paramsWithLocale.set('locale', locale)
  return NextResponse.redirect(`${origin}/auth/callback?${paramsWithLocale.toString()}`, 302)
}
