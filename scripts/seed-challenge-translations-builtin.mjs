#!/usr/bin/env node
/**
 * en/ko 번역 시드 — Google API 없이 challenges 테이블에서 동기화
 * (schema-v28 SQL과 동일; 누락·갱신 시 재실행)
 *
 * 실행: node --env-file=.env.local scripts/seed-challenge-translations-builtin.mjs
 */
import { createClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

async function fetchAllChallenges(supabase) {
  const all = []
  let page = 0
  while (true) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('challenges')
      .select('id, title_en, title_ko, description_en')
      .order('id', { ascending: true })
      .range(from, to)
    if (error) throw error
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    page += 1
  }
  return all
}

async function upsertLang(supabase, challenges, lang, titleField, descField) {
  const rows = challenges.map((c) => ({
    challenge_id: c.id,
    lang,
    title: (c[titleField] || c.title_en || '').trim(),
    description: c[descField] ?? c.description_en ?? null,
  }))

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    const { error } = await supabase
      .from('challenge_translations')
      .upsert(batch, { onConflict: 'challenge_id,lang' })
    if (error) throw error
    process.stdout.write(`  ${lang} ${Math.min(i + 200, rows.length)}/${rows.length}\r`)
  }
  console.log(`  ${lang} 완료: ${rows.length}건`)
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const challenges = await fetchAllChallenges(supabase)
  if (!challenges.length) {
    console.log('챌린지 없음.')
    return
  }

  console.log(`챌린지 ${challenges.length}건 — en/ko 동기화 (API 불필요)\n`)
  await upsertLang(supabase, challenges, 'en', 'title_en', 'description_en')
  await upsertLang(supabase, challenges, 'ko', 'title_ko', 'description_en')
  console.log('\n내장 시드 완료.')
  console.log('ja/zh 등 추가 언어: npm run seed:translations (LANGUAGES=ja,zh MAX_CHARS=500000)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
