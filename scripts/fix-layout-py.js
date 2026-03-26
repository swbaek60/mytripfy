/**
 * main 태그에 py 가 없는 경우 py-6 sm:py-8 추가
 */
const fs = require('fs')
const path = require('path')

const base = path.join(process.cwd(), 'src/app/[locale]')

const files = [
  'companions/new/page.tsx',
  'companions/[id]/edit/page.tsx',
  'trips/new/page.tsx',
  'trips/[id]/page.tsx',
  'trips/[id]/edit/page.tsx',
  'guides/requests/new/page.tsx',
  'guides/requests/[id]/edit/page.tsx',
  'sponsors/new/page.tsx',
  'sponsors/[id]/edit/page.tsx',
  'challenges/guide/page.tsx',
  'challenges/disputes/[certUserId]/[challengeId]/page.tsx',
  'personality/page.tsx',
  'challenges/feed/page.tsx',
  'sponsors/mine/page.tsx',
]

let fixed = 0
for (const file of files) {
  const fullPath = path.join(base, file)
  if (!fs.existsSync(fullPath)) continue

  const orig = fs.readFileSync(fullPath, 'utf8')
  // main이 있고 py-가 없는 경우에만 추가
  const updated = orig.replace(
    /<main className="(max-w-7xl mx-auto px-4 sm:px-6 lg:px-8)">/g,
    '<main className="$1 py-6 sm:py-8">'
  )
  if (orig !== updated) {
    fs.writeFileSync(fullPath, updated)
    console.log(`FIXED: ${file}`)
    fixed++
  } else {
    console.log(`NO_CHANGE: ${file}`)
  }
}
console.log(`\nDone: ${fixed} files updated`)
