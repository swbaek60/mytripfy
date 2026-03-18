import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Next.js가 1시간 동안 응답을 캐싱 (사용자가 많아도 DB 쿼리 최소화)
export const revalidate = 3600

const DB_TIMEOUT_MS = 2000
const FETCH_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race<T | null>([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export async function GET() {
  try {
    const supabase = await createClient()
    const dbResult = await withTimeout(
      supabase
        .from('exchange_rates')
        .select('currency_code, rate_from_usd'),
      DB_TIMEOUT_MS
    )

    if (dbResult?.data && dbResult.data.length > 0) {
      const rates: Record<string, number> = {}
      dbResult.data.forEach(row => {
        rates[row.currency_code] = Number(row.rate_from_usd)
      })
      return NextResponse.json({ rates, source: 'db' })
    }

    // DB에 데이터 없으면 API 직접 호출 (fallback)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
      signal: controller.signal,
    }).catch(() => null)

    clearTimeout(timer)

    if (!res) {
      return NextResponse.json({ rates: { USD: 1 }, source: 'fallback' })
    }

    const json = await res.json()
    return NextResponse.json({ rates: json.rates || {}, source: 'api' })
  } catch {
    return NextResponse.json({ rates: { USD: 1 }, source: 'fallback' })
  }
}
