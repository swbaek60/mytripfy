import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

const SUPPORTED = [
  // 기축통화
  'USD','EUR','GBP','CHF','CAD','AUD','NZD',
  // 아시아
  'KRW','JPY','CNY','HKD','TWD','SGD','MYR','THB','VND','IDR','PHP','INR','PKR','BDT','NPR','LKR','MMK','KHR','MNT',
  // 중동/아프리카
  'AED','SAR','QAR','KWD','BHD','JOD','TRY','ILS','EGP','ZAR','KES','NGN','GHS','MAD',
  // 유럽 (비유로)
  'SEK','NOK','DKK','PLN','CZK','HUF','RON','HRK','RSD','BGN','UAH','GEL',
  // 아메리카
  'MXN','BRL','ARS','CLP','COP','PEN','CRC',
]

// 이 API를 하루 1번 호출하면 됨
// 브라우저: /api/update-rates 접속 or Vercel Cron으로 자동화
export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('Failed to fetch exchange rates')
    const json = await res.json()

    if (!json.rates) throw new Error('Invalid response from exchange rate API')

    // Service Role Key가 있으면 RLS 우회, 없으면 일반 클라이언트 사용
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : await createServerClient()

    const upsertData = SUPPORTED.map(code => ({
      currency_code: code,
      rate_from_usd: json.rates[code] ?? 1,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('exchange_rates').upsert(upsertData)
    if (error) throw new Error(error.message)

    return NextResponse.json({
      success: true,
      updated: SUPPORTED.length,
      timestamp: new Date().toISOString(),
      sample: { KRW: json.rates['KRW'], EUR: json.rates['EUR'], JPY: json.rates['JPY'] },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
