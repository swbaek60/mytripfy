/**
 * 100 Countries에서 덜 유명한 국가 2개 삭제 (102 → 100)
 * 삭제 대상: Eswatini, Sao Tome and Principe
 * SUPABASE_SERVICE_ROLE_KEY 필요.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local 확인)')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const TO_REMOVE = ['Lesotho', 'Palau']

async function run() {
  for (const titleEn of TO_REMOVE) {
    const { data, error } = await admin
      .from('challenges')
      .delete()
      .eq('category', 'countries')
      .eq('title_en', titleEn)
      .select('id')
    if (error) {
      console.error(titleEn, '삭제 실패:', error.message)
      process.exit(1)
    }
    console.log('삭제:', titleEn, data?.length ? '(1행)' : '(없음)')
  }
  console.log('100 Countries에서 2개 국가 삭제 완료.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
