#!/usr/bin/env node
/**
 * 배경·글자 토큰 조합의 명도 대비를 검사한다.
 *
 * 한 className 문자열 안에 `bg-*` 와 `text-*` 토큰이 함께 있으면 실제로 겹쳐 그려지는
 * 조합이다. 그 쌍의 WCAG 대비를 계산해 4.5:1 미만이면 보고한다.
 *
 * 색 값은 src/globals.css 의 `:root` 에서 읽는다. 토큰 값을 바꾸면 이 검사도 따라온다.
 *
 * 한계
 *  - 투명도 수정자가 붙은 클래스(`bg-white/20`)는 실제 합성색을 알 수 없어 건너뛴다.
 *  - 조상 요소에서 물려받는 배경은 알 수 없다. 같은 문자열 안에 있는 쌍만 본다.
 *
 * 사용법: node scripts/check-contrast.mjs [--min 4.5]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MIN_RATIO = Number(
  process.argv.includes('--min') ? process.argv[process.argv.indexOf('--min') + 1] : 4.5
)

/** globals.css `:root` 의 `--토큰: #hex` 를 모두 읽는다. */
function readTokens() {
  const css = readFileSync('src/globals.css', 'utf8')
  const root = css.slice(css.indexOf(':root'))
  const direct = new Map()
  for (const m of root.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;/g)) {
    direct.set(m[1], m[2])
  }

  // @theme inline 의 `--color-X: var(--Y)` 매핑으로 유틸리티 이름 → 색을 만든다.
  const theme = css.slice(0, css.indexOf(':root'))
  const colors = new Map()
  for (const m of theme.matchAll(/--color-([\w-]+):\s*var\(--([\w-]+)\)\s*;/g)) {
    const hex = direct.get(m[2])
    if (hex) colors.set(m[1], hex)
  }
  // 토큰 이름과 유틸리티 이름이 같은 경우(`--brand` → `bg-brand`)도 포함한다.
  for (const [name, hex] of direct) if (!colors.has(name)) colors.set(name, hex)

  colors.set('white', '#FFFFFF')
  colors.set('black', '#000000')
  return colors
}

function srgb(c) {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
function luminance(hex) {
  let h = hex.slice(1)
  if (h.length === 3) h = [...h].map(c => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return 0.2126 * srgb((n >> 16) & 255) + 0.7152 * srgb((n >> 8) & 255) + 0.0722 * srgb(n & 255)
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, acc)
    else if (path.endsWith('.tsx')) acc.push(path)
  }
  return acc
}

const colors = readTokens()
const names = [...colors.keys()].sort((a, b) => b.length - a.length).join('|')
// 투명도 수정자(`/50`)가 붙으면 합성색을 모르므로 제외한다.
const textRe = new RegExp(`(?<![\\w:-])text-(${names})(?![\\w\\-/])`)
// 그라데이션은 정지점마다 배경색이 다르다. 밝은 색에서 시작하는 그라데이션에 흰 글자를
// 얹으면 그 부분만 글자가 사라지므로, 모든 정지점을 각각 배경으로 본다.
const bgRe = new RegExp(`(?<![\\w:-])(bg|from|via|to)-(${names})(?![\\w\\-/])`, 'g')
const stringRe = /(['"`])([^'"`\n]{0,400}?)\1/g

const findings = []
for (const file of walk('src')) {
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      for (const m of line.matchAll(stringRe)) {
        const group = m[2]
        const text = group.match(textRe)
        if (!text) continue
        for (const bg of group.matchAll(bgRe)) {
          const ratio = contrast(colors.get(bg[2]), colors.get(text[1]))
          if (ratio >= MIN_RATIO) continue
          findings.push({
            file: file.replace(/\\/g, '/'),
            line: index + 1,
            pair: `${bg[1]}-${bg[2]} + text-${text[1]}`,
            ratio,
          })
        }
      }
    })
}

findings.sort((a, b) => a.ratio - b.ratio)
console.log(`토큰 ${colors.size}개 · 대비 ${MIN_RATIO}:1 미만 조합 ${findings.length}건`)
for (const f of findings) {
  console.log(`  ${f.ratio.toFixed(2).padStart(5)}  ${f.pair.padEnd(42)} ${f.file}:${f.line}`)
}

if (findings.length) process.exit(1)
