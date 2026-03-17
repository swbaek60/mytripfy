/**
 * 100 Countries 챌린지에 홍콩(Hong Kong) 추가 적용
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 * 사용: node --env-file=.env.local scripts/apply-hong-kong-challenge.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const HONG_KONG_ROW = {
  category: 'countries',
  title_ko: '홍콩',
  title_en: 'Hong Kong',
  country_code: 'HK',
  description_en: "Hong Kong blends skyscrapers and street food, Victoria Peak and Star Ferry, Cantonese dim sum and neon-lit nightlife. A former British colony and now a special administrative region, it offers world-class dining, hiking, and harbour views. Selected for our World 100 as Asia's most dynamic city and gateway.",
  points: 10,
}

async function run() {
  const { data: existing } = await admin
    .from('challenges')
    .select('id')
    .eq('category', 'countries')
    .eq('title_en', 'Hong Kong')
    .maybeSingle()

  if (existing) {
    const { error: updErr } = await admin
      .from('challenges')
      .update({ description_en: HONG_KONG_ROW.description_en })
      .eq('category', 'countries')
      .eq('title_en', 'Hong Kong')
    if (updErr) {
      console.error('설명 업데이트 실패:', updErr.message)
      process.exit(1)
    }
    console.log('Hong Kong 이미 있음. 설명만 업데이트 완료.')
    return
  }

  const { error: insErr } = await admin.from('challenges').insert(HONG_KONG_ROW)
  if (insErr) {
    console.error('Hong Kong 추가 실패:', insErr.message)
    process.exit(1)
  }
  console.log('100 Countries에 Hong Kong 추가 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
