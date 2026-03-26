/**
 * 모든 페이지의 <main> 컨테이너를 max-w-7xl 로 통일
 * globals.css의 ds-page 클래스 기준
 */
const fs = require('fs')
const path = require('path')

// 파일별 교체 패턴 정의
const targets = [
  // 단순 너비만 변경
  {
    file: 'src/app/[locale]/guides/requests/page.tsx',
    from: /max-w-5xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-8/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  },
  {
    file: 'src/app/[locale]/dashboard/page.tsx',
    from: /max-w-5xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
  {
    file: 'src/app/[locale]/challenges/[category]/page.tsx',
    from: /max-w-5xl mx-auto/g,
    to: 'max-w-7xl mx-auto',
  },
  {
    file: 'src/app/[locale]/bookmarks/page.tsx',
    from: /max-w-4xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
  {
    file: 'src/app/[locale]/notifications/page.tsx',
    from: /max-w-2xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
  {
    file: 'src/app/[locale]/reviews/mine/page.tsx',
    from: /max-w-2xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
  {
    file: 'src/app/[locale]/reviews/write/page.tsx',
    from: /max-w-2xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
  {
    file: 'src/app/[locale]/messages/page.tsx',
    from: /max-w-2xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
  {
    file: 'src/app/[locale]/sponsors/[id]/page.tsx',
    from: /max-w-4xl mx-auto px-4 sm:px-6(?:\s+lg:px-8)? py-\S+/g,
    to: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  },
]

let fixed = 0
for (const { file, from, to } of targets) {
  const fullPath = path.join(process.cwd(), file)
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
    console.log(`NO_CHANGE (pattern not matched): ${file}`)
  }
}
console.log(`\nDone: ${fixed} files updated`)
