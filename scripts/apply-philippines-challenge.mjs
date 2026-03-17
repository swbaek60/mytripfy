/**
 * 100 Countries 챌린지에 필리핀(Philippines) 추가 적용
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 * 사용: node --env-file=.env.local scripts/apply-philippines-challenge.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const PHILIPPINES_ROW = {
  category: 'countries',
  title_ko: '필리핀',
  title_en: 'Philippines',
  country_code: 'PH',
  description_en: "The Philippines is 7,000 islands: Palawan's limestone lagoons, Boracay sunsets, Cebu diving, and Manila's mix of colonial and modern. Spanish heritage, Banaue rice terraces, and Tubbataha Reef define a nation of warmth and variety. Selected for our World 100 as Southeast Asia's most island-rich and welcoming destination.",
  points: 10,
}

async function run() {
  const { data: existing } = await admin
    .from('challenges')
    .select('id')
    .eq('category', 'countries')
    .eq('title_en', 'Philippines')
    .maybeSingle()

  if (existing) {
    const { error: updErr } = await admin
      .from('challenges')
      .update({ description_en: PHILIPPINES_ROW.description_en })
      .eq('category', 'countries')
      .eq('title_en', 'Philippines')
    if (updErr) {
      console.error('설명 업데이트 실패:', updErr.message)
      process.exit(1)
    }
    console.log('Philippines 이미 있음. 설명만 업데이트 완료.')
    return
  }

  const { error: insErr } = await admin.from('challenges').insert(PHILIPPINES_ROW)
  if (insErr) {
    console.error('Philippines 추가 실패:', insErr.message)
    process.exit(1)
  }
  console.log('100 Countries에 Philippines 추가 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
