/**
 * 나머지 페이지들의 main 컨테이너를 max-w-7xl로 통일
 */
const fs = require('fs')
const path = require('path')

const base = path.join(process.cwd(), 'src/app/[locale]')

// (from, to) 쌍 또는 파일별 직접 교체
const targets = [
  // trips
  { file: 'trips/page.tsx',           from: /max-w-4xl mx-auto px-4/g, to: 'max-w-7xl mx-auto px-4' },
  { file: 'trips/page.tsx',           from: /max-w-4xl mx-auto px-6/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'trips/new/page.tsx',       from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'trips/[id]/page.tsx',      from: /max-w-3xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'trips/[id]/edit/page.tsx', from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  // companions new/edit
  { file: 'companions/new/page.tsx',               from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'companions/[id]/edit/page.tsx',         from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  // guides/requests new/edit
  { file: 'guides/requests/new/page.tsx',          from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'guides/requests/[id]/edit/page.tsx',    from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  // sponsors
  { file: 'sponsors/new/page.tsx',                 from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'sponsors/mine/page.tsx',                from: /max-w-4xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'sponsors/[id]/edit/page.tsx',           from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  // challenges sub-pages
  { file: 'challenges/feed/page.tsx',              from: /max-w-5xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'challenges/guide/page.tsx',             from: /max-w-3xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  { file: 'challenges/disputes/[certUserId]/[challengeId]/page.tsx', from: /max-w-3xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
  // personality
  { file: 'personality/page.tsx',                  from: /max-w-2xl mx-auto px-4[^">\n]*/g, to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
]

let fixed = 0
for (const { file, from, to } of targets) {
  const fullPath = path.join(base, file)
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${file}`)
    continue
  }
  const orig = fs.readFileSync(fullPath, 'utf8')
  const updated = orig.replace(from, to)
  if (orig !== updated) {
    fs.writeFileSync(fullPath, updated)
    console.log(`FIXED: ${file}`)
    fixed++
  } else {
    console.log(`NO_CHANGE: ${file}`)
  }
}
console.log(`\nDone: ${fixed} files updated`)
