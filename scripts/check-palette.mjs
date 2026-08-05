#!/usr/bin/env node
/**
 * Tailwind 기본 팔레트 클래스가 다시 들어오는 것을 막는다.
 *
 * `bg-emerald-600` 처럼 팔레트를 직접 쓰면 같은 의미의 색이 파일마다 조금씩 달라지고,
 * 다크 모드나 브랜드 색 변경 때 한 곳만 고쳐서는 끝나지 않는다. 색은 globals.css 의
 * 의미 토큰(`bg-success`, `text-hint`)이나 외부 서비스 식별색(`bg-sns-telegram`)으로만
 * 쓴다. 새 색이 필요하면 토큰을 먼저 추가한다.
 *
 * 사용법: node scripts/check-palette.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const FAMILIES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]
const UTILITIES = [
  'bg', 'text', 'border', 'ring', 'from', 'to', 'via', 'divide', 'decoration',
  'outline', 'shadow', 'placeholder', 'accent', 'caret', 'fill', 'stroke',
]
const pattern = new RegExp(
  `(?:[a-z-]+:)?(?:${UTILITIES.join('|')})-(?:${FAMILIES.join('|')})-(?:50|100|200|300|400|500|600|700|800|900|950)`,
  'g'
)

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, acc)
    else if (/\.(tsx|ts)$/.test(path)) acc.push(path)
  }
  return acc
}

let count = 0
for (const file of walk('src')) {
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      const hits = line.match(pattern)
      if (!hits) return
      count += hits.length
      console.log(`  ${file.replace(/\\/g, '/')}:${index + 1}  ${hits.join(' ')}`)
    })
}

console.log(count === 0 ? '기본 팔레트 직접 사용 0건' : `기본 팔레트 직접 사용 ${count}건`)
if (count) process.exit(1)
