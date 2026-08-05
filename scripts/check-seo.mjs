#!/usr/bin/env node
/**
 * 페이지마다 metadata 가 있는지, 비공개 페이지가 색인을 막았는지 검사한다.
 *
 * metadata 가 없는 페이지는 상위 레이아웃의 제목·설명을 그대로 물려받는다. 그러면
 * 검색 결과에서 여러 페이지가 같은 제목으로 나와 어느 것을 눌러야 할지 알 수 없다.
 * 비공개 페이지에 noindex 가 없으면 대시보드·채팅 URL 이 검색에 뜬다.
 *
 * 사용법: node scripts/check-seo.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** 색인해서는 안 되는 경로. robots.txt 만으로는 URL 색인을 막지 못한다. */
const MUST_NOINDEX = [
  '/admin',
  '/bookmarks',
  '/dashboard',
  '/messages',
  '/notifications',
  '/profile',
  '/login',
  '/reviews/mine',
  '/reviews/write',
  '/users/',
  '/companions/new',
  '/companions/[id]/edit',
  '/trips/new',
  '/trips/[id]/edit',
  '/guides/requests/new',
  '/guides/requests/[id]/edit',
  '/sponsors/new',
  '/sponsors/mine',
  '/sponsors/[id]/edit',
  '/sponsors/[id]/coupon/',
  '/challenges/disputes/',
]

/** metadata 를 요구하지 않는 페이지. 화면을 그리지 않고 곧바로 다른 곳으로 보낸다. */
const REDIRECT_ONLY = ['src/app/page.tsx', 'src/app/[locale]/invite/[code]/page.tsx']

/** 클라이언트 컴포넌트라 metadata 를 내보낼 수 없는 페이지. robots.txt 로 막는다. */
const CLIENT_ONLY = ['src/app/sso-callback/page.tsx']

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, acc)
    else if (entry === 'page.tsx') acc.push(path)
  }
  return acc
}

const problems = []
for (const file of walk('src/app')) {
  const normalized = file.replace(/\\/g, '/')
  if (REDIRECT_ONLY.includes(normalized) || CLIENT_ONLY.includes(normalized)) continue

  const src = readFileSync(file, 'utf8')
  const route = normalized.replace('src/app/[locale]', '').replace('src/app', '').replace('/page.tsx', '') || '/'

  const hasMetadata = /export (const metadata|async function generateMetadata)/.test(src)
  if (!hasMetadata) {
    problems.push({ route, kind: 'metadata 없음' })
    continue
  }

  if (MUST_NOINDEX.some(p => route.startsWith(p))) {
    const blocked = /noindex|buildPrivateMetadata|index: false/.test(src)
    if (!blocked) problems.push({ route, kind: 'noindex 없음 (비공개 경로)' })
  }
}

// robots.txt 와 sitemap 이 서로 어긋나는지. 한쪽은 오라고 하고 한쪽은 오지 말라고 하면
// 크롤러는 사이트맵을 신뢰하지 않게 된다.
const robotsSrc = readFileSync('src/app/robots.ts', 'utf8')
const sitemapSrc = readFileSync('src/app/sitemap.ts', 'utf8')
const disallowed = [...robotsSrc.matchAll(/'\/\*(\/[^']+)'/g)].map(m => m[1].replace(/\/$/, ''))
const sitemapPaths = [...sitemapSrc.matchAll(/^\s*'(\/[^']*)',/gm)].map(m => m[1])
for (const path of sitemapPaths) {
  if (disallowed.includes(path)) {
    problems.push({ route: path, kind: 'sitemap 에 있는데 robots.txt 가 차단' })
  }
}

for (const p of problems) {
  console.log(`  ${p.route}  — ${p.kind}`)
}
console.log(problems.length === 0 ? 'SEO 검사 통과' : `SEO 문제 ${problems.length}건`)
if (problems.length) process.exit(1)
