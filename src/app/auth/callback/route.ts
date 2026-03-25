/**
 * [DEPRECATED] Supabase OAuth 콜백 라우트
 * Clerk으로 인증이 교체되어 더 이상 사용하지 않습니다.
 * Clerk이 OAuth 콜백을 직접 처리합니다.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mytripfy.com'))
}
