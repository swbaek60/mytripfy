/**
 * 내부 링크 검사기
 *
 * src 안의 모든 `href` 를 모아 app router 의 실제 라우트 트리와 대조한다.
 * 라우트가 없는 링크(오타·삭제된 페이지)를 찾아낸다.
 *
 *   node scripts/check-internal-links.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const APP_DIR = 'src/app'
const SRC_DIR = 'src'

/** app 디렉터리를 훑어 페이지 라우트 패턴 목록을 만든다. */
function collectRoutes() {
  const routes = []
  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        // 라우트 그룹 (foo) 은 URL 에 나타나지 않는다.
        const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')')
        walk(full, isGroup ? segments : [...segments, entry.name])
      } else if (entry.name === 'page.tsx' || entry.name === 'route.ts') {
        routes.push('/' + segments.join('/'))
      }
    }
  }
  walk(APP_DIR, [])
  return routes
}

/** `/[locale]/companions/[id]` → 정규식 */
function routeToRegex(route) {
  const body = route
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (/^\[\[\.\.\..+\]\]$/.test(seg)) return '(?:/.*)?'
      if (/^\[\.\.\..+\]$/.test(seg)) return '/.+'
      if (/^\[.+\]$/.test(seg)) return '/[^/]+'
      return '/' + seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('')
  return new RegExp(`^${body || '/'}/?$`)
}

function walkSource(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkSource(full, out)
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full)
  }
  return out
}

const routes = collectRoutes()
const matchers = routes.map((r) => ({ route: r, re: routeToRegex(r) }))

/** next-intl 의 Link 는 locale 접두어를 자동으로 붙이므로 양쪽 다 시도한다. */
function isKnown(href) {
  const clean = href.split('#')[0].split('?')[0]
  if (!clean || clean === '/') return true
  const candidates = [clean, `/[locale]${clean}`]
  return candidates.some((c) => matchers.some((m) => m.re.test(c)))
}

const HREF_RE = /href=(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\}|\{'([^']+)'\}|\{"([^"]+)"\})/g

const problems = []
const seen = new Set()
let checked = 0

for (const file of walkSource(SRC_DIR)) {
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(HREF_RE)) {
    let href = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5]
    if (!href) continue
    // 외부 링크·앵커·메일·전화·API·정적 파일은 대상이 아니다.
    if (/^(https?:|mailto:|tel:|#|\/\/)/.test(href)) continue
    if (!href.startsWith('/')) continue
    if (href.startsWith('/api/')) continue
    if (/\.(png|jpg|jpeg|svg|webp|ico|json|txt|xml|pdf)$/.test(href)) continue

    // `/foo${bar}` 처럼 세그먼트 중간에 끼어드는 보간은 쿼리스트링 헬퍼인 경우가
    // 많으므로 그 지점에서 잘라낸다. `/foo/${id}` 는 임의 세그먼트로 본다.
    const normalized = href
      .replace(/\/\$\{[^}]*\}/g, '/x')
      .replace(/\$\{[^}]*\}[\s\S]*$/, '')

    const key = normalized
    if (seen.has(key + file)) continue
    seen.add(key + file)
    checked++

    if (!isKnown(normalized)) {
      problems.push({ file: file.replace(/\\/g, '/'), href })
    }
  }
}

if (problems.length === 0) {
  console.log(`OK — ${routes.length} routes, ${checked} internal links checked, none broken.`)
} else {
  console.log(`${checked} links checked, ${problems.length} suspicious:\n`)
  for (const p of problems) console.log(`  ${p.href}\n    ${p.file}`)
  process.exitCode = 1
}
