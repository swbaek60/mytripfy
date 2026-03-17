/**
 * 100 Countries 챌린지 목록 조회 (title_en)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(supabaseUrl, serviceRoleKey)

const { data, error } = await admin
  .from('challenges')
  .select('id, title_en, country_code')
  .eq('category', 'countries')
  .order('title_en')

if (error) {
  console.error(error)
  process.exit(1)
}
console.log('총', data.length, '개')
data.forEach((r, i) => console.log((i + 1) + '.', r.title_en, r.country_code))
