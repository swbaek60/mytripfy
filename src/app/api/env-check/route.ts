import { NextResponse } from 'next/server'

/**
 * 환경 변수 설정 여부 확인 (개발용).
 * 프로덕션에서는 404 반환. 값은 절대 노출하지 않음.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? 'set' : 'not set',
  })
}
