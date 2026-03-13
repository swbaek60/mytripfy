import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Next.js가 1시간 동안 응답을 캐싱 (사용자가 많아도 DB 쿼리 최소화)
export const revalidate = 3600

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('exchange_rates')
      .select('currency_code, rate_from_usd')

    if (data && data.length > 0) {
      const rates: Record<string, number> = {}
      data.forEach(row => {
        rates[row.currency_code] = Number(row.rate_from_usd)
      })
      return NextResponse.json({ rates, source: 'db' })
    }

    // DB에 데이터 없으면 API 직접 호출 (fallback)
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    })
    const json = await res.json()
    return NextResponse.json({ rates: json.rates || {}, source: 'api' })
  } catch {
    return NextResponse.json({ rates: { USD: 1 }, source: 'fallback' })
  }
}
