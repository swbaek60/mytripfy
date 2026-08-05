import { NextRequest } from 'next/server'
import { adminDb, requireCronSecret } from '@/lib/api/guard'
import { apiDbFailure, apiError, apiFailure, apiOk } from '@/lib/api/respond'

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

export const dynamic = 'force-dynamic'

/**
 * 환율 테이블을 갱신한다. 내부 자동화 전용이므로 `CRON_SECRET` 을 요구한다.
 *
 * 호출 예:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://mytripfy.com/api/update-rates
 *
 * `CRON_SECRET` 이 설정돼 있지 않으면 요청은 거부된다. 이 라우트가 없어도
 * `/api/rates` 가 외부 API 를 폴백으로 사용하므로 사이트는 정상 동작한다.
 */
export async function GET(req: NextRequest) {
  const denied = requireCronSecret(req)
  if (denied) return denied.response

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
    if (!res.ok) return apiError('unavailable', 'Exchange rate provider is unavailable.')

    const json = (await res.json()) as { rates?: Record<string, number> }
    if (!json.rates) return apiError('unavailable', 'Exchange rate provider returned no data.')

    const now = new Date().toISOString()
    const upsertData = SUPPORTED.map((code) => ({
      currency_code: code,
      rate_from_usd: json.rates![code] ?? 1,
      updated_at: now,
    }))

    const { error } = await adminDb().from('exchange_rates').upsert(upsertData)
    if (error) return apiDbFailure('update-rates', error)

    return apiOk({ updated: SUPPORTED.length, timestamp: now })
  } catch (err) {
    return apiFailure('update-rates', err)
  }
}
