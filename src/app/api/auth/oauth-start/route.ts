/**
 * [DEPRECATED] Supabase OAuth 시작 라우트
 * Clerk으로 인증이 교체되어 더 이상 사용하지 않습니다.
 * Clerk이 OAuth(Google, Facebook, Apple)를 직접 처리합니다.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'OAuth is now handled by Clerk. Use /sign-in instead.' },
    { status: 410 }
  )
}
