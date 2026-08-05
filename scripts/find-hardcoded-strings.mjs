/**
 * JSX 안에 박혀 있는 미번역 영문 문구를 찾는다.
 *
 * 25개 로케일을 지원하는데 화면 문구가 소스에 영어로 하드코딩되어 있으면
 * 그 자리만 영어로 남는다. 눈으로 훑기에는 파일이 너무 많아서 기계로 뽑는다.
 *
 * 휴리스틱이라 오탐이 있다. 사람이 목록을 보고 판단하는 용도다.
 *
 * 사용법: node scripts/find-hardcoded-strings.mjs [--all]
 *   기본값은 사용자에게 보이는 페이지·컴포넌트만. --all 은 admin 까지 포함.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'src')
const includeAdmin = process.argv.includes('--all')

/** 화면 문구가 아니라 코드/설정인 것들 */
const IGNORE_EXACT = new Set([
  'use client', 'use server', 'utf-8', 'UTF-8', 'true', 'false', 'null',
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'application/json',
])

function isLikelyUiText(s) {
  const t = s.trim()
  if (t.length < 4) return false
  if (IGNORE_EXACT.has(t)) return false
  // 영문 낱말이 2개 이상이거나, 대문자로 시작하는 4자 이상 단어
  if (!/[A-Za-z]/.test(t)) return false
  // 클래스명·경로·식별자 배제
  if (/[{}<>|\\]/.test(t)) return false
  if (/^[a-z0-9-]+(\/[a-z0-9-]+)+$/.test(t)) return false
  if (/^[a-z]+([A-Z][a-z]+)+$/.test(t)) return false // camelCase
  if (/^[a-z0-9_]+$/.test(t)) return false            // snake_case / 단일 소문자 토큰
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false
  if (/^\d/.test(t)) return false
  // 이모지만 있는 경우
  if (!/[A-Za-z]{3}/.test(t)) return false
  return true
}

const results = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      if (!includeAdmin && entry.name === 'admin') continue
      walk(full)
      continue
    }
    if (!/\.tsx$/.test(entry.name)) continue
    scan(full)
  }
}

function scan(file) {
  const src = fs.readFileSync(file, 'utf8')
  // 번역 함수를 아예 안 쓰는 파일은 의도적으로 영문 고정인 경우가 많다(에러 페이지 등)
  const lines = src.split(/\r?\n/)
  const hits = []

  lines.forEach((line, i) => {
    const code = line.trim()
    if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return
    if (/^import\s/.test(code) || /^export\s+(const|type|interface)/.test(code)) return

    // 1) JSX 텍스트 노드: >텍스트<
    for (const m of line.matchAll(/>([^<>{}\n]{4,})</g)) {
      if (isLikelyUiText(m[1])) hits.push({ line: i + 1, text: m[1].trim(), kind: 'text' })
    }
    // 2) 사용자에게 보이는 속성값
    for (const m of line.matchAll(/\b(placeholder|title|aria-label|alt|label)="([^"]{4,})"/g)) {
      if (isLikelyUiText(m[2])) hits.push({ line: i + 1, text: `${m[1]}="${m[2]}"`, kind: 'attr' })
    }
  })

  if (hits.length) {
    results.push({
      file: path.relative(process.cwd(), file),
      usesI18n: /useTranslations|getTranslations/.test(src),
      hits,
    })
  }
}

walk(ROOT)

results.sort((a, b) => b.hits.length - a.hits.length)

let total = 0
for (const r of results) {
  total += r.hits.length
  console.log(`\n${r.file}  (${r.hits.length}${r.usesI18n ? '' : ', i18n 미사용'})`)
  for (const h of r.hits) console.log(`  L${h.line}  ${h.text}`)
}
console.log(`\n총 ${total}건 / ${results.length}개 파일`)
