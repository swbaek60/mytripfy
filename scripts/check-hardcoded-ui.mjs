#!/usr/bin/env node
/**
 * 번역을 타지 않는 영어 UI 문구를 찾는다.
 *
 * 26개 언어를 지원하는데 화면에 영어가 그대로 박혀 있으면 그 부분만 번역이 안 된다.
 * JSX 텍스트 노드와 placeholder/title/aria-label/alt 속성에서 사람이 읽는 문장처럼
 * 보이는 영어를 뽑아낸다. 판별을 기계로 하는 것이라 오탐이 있으므로, 정당한 예외는
 * ALLOW 에 이유와 함께 적어 둔다.
 *
 * 사용법: node scripts/check-hardcoded-ui.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** 검사에서 빼는 경로. 화면에 안 나오거나 영어가 정답인 곳. */
const SKIP_PATHS = [
  'src/data/',          // 데이터 카탈로그. 라벨은 별도 i18n 경로를 탄다.
  'src/lib/',           // 서버 로직. 사용자 문구 없음.
  'src/utils/',
  'src/types/',
  '.test.ts',
  'src/app/api/',       // API 응답 메시지는 클라이언트가 번역해 보여준다.
  'src/app/sitemap.ts',
  'src/app/robots.ts',
  // 로케일 세그먼트 밖이라 next-intl 컨텍스트가 없다. 영문 고정이 정답.
  'src/app/global-error.tsx',
  'src/app/not-found.tsx',
  'src/app/sso-callback/',
]

/** 영어 그대로 두는 것이 맞는 문구. */
const ALLOW = new Set([
  // 브랜드·서비스 고유명
  'MyTripfy', 'Google', 'Instagram', 'Facebook', 'WhatsApp', 'Telegram', 'LINE',
  'KakaoTalk', 'YouTube', 'TikTok', 'Booking.com', 'Airbnb', 'Klook', 'Agoda',
  // 통화·단위·코드·파일 형식
  'USD', 'KRW', 'EUR', 'JPY', 'GMT', 'UTC',
  'JPG, PNG, WebP',
  // 어느 언어에서나 그대로 쓰는 약어
  'Lv.',
  // 화면에 안 보이는 기술 값
  'New activity',
])

/** 라틴 문자가 아닌 글자. 이미 다른 언어로 쓰인 문구는 검사 대상이 아니다. */
const NON_LATIN = /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Thai}\p{Script=Devanagari}\p{Script=Bengali}]/u

/**
 * 이모지와 장식 기호를 떼어 낸다. `📷 Change Photo` 처럼 이모지가 붙어 있어도 번역이
 * 필요한 문구다. 기호 때문에 검사에서 빠지면 놓친다.
 */
function stripDecoration(text) {
  return text
    // HTML 엔티티. `&nbsp;· Removed` 처럼 앞에 붙으면 코드 조각으로 오해된다.
    .replace(/&(nbsp|middot|bull|ndash|mdash|hellip|amp|ldquo|rdquo|lsquo|rsquo|quot);/g, ' ')
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F\u20E3]/gu, ' ')
    .replace(/[·•—–→←↑↓…“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Tailwind 클래스 목록인지. `bg-surface text-body hover:bg-surface-hover` 같은 문자열이
 * 삼항으로 오가는 곳이 아주 많다. 클래스는 모두 소문자에 하이픈·콜론으로 이어진다.
 */
function looksLikeClassList(s) {
  if (/[A-Z]/.test(s)) return false
  return s.split(/\s+/).every(token =>
    /^[a-z0-9][a-z0-9:./[\]%_-]*$/.test(token) && (/[-:/[]/.test(token) || BARE_UTILITIES.has(token))
  )
}

/** 하이픈이 없는 Tailwind 유틸리티. 클래스 목록 판정에서 문장으로 오해받는다. */
const BARE_UTILITIES = new Set([
  'block', 'inline', 'flex', 'grid', 'hidden', 'contents', 'table',
  'border', 'rounded', 'shadow', 'ring', 'outline', 'italic', 'underline',
  'truncate', 'relative', 'absolute', 'fixed', 'sticky', 'static',
  'uppercase', 'lowercase', 'capitalize', 'invisible', 'visible', 'transform',
  'transition', 'group', 'peer', 'container', 'sr',
])

/** 사람이 읽는 문장인지. 코드/식별자/한 단어 기호는 걸러 낸다. */
function looksLikeSentence(text) {
  const s = stripDecoration(text)
  if (s.length < 3) return false
  // 문구 뒤에 붙는 구두점은 원문의 일부가 아니다. `WhatsApp:` 은 `WhatsApp` 과 같다.
  if (ALLOW.has(s) || ALLOW.has(s.replace(/[:.,]+$/, ''))) return false
  if (looksLikeClassList(s)) return false
  // 중첩 삼항을 정규식으로 자르다 짝이 어긋난 조각. 따옴표가 남아 있으면 문구가 아니다.
  if (/["']/.test(s) || s.includes('===')) return false
  if (!/[A-Za-z]/.test(s)) return false          // 숫자·기호만
  if (NON_LATIN.test(s)) return false
  if (!/^[\x20-\x7E]+$/.test(s)) return false
  if (/^[a-z0-9_-]+$/.test(s)) return false      // css 클래스·키 같은 소문자 식별자
  if (/^[A-Z][a-zA-Z]*$/.test(s) && s.length < 4) return false
  if (/[{}<>$]/.test(s)) return false            // 템플릿·JSX 조각
  if (/^[&|=]/.test(s) || s.includes(' = ')) return false // 제네릭 타입 인자 등 코드 조각
  if (/^(https?:|\/|#|\.|@)/.test(s)) return false
  if (/^[A-Z_]+$/.test(s)) return false          // 상수명
  return /[A-Z]/.test(s) || s.includes(' ')
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, acc)
    else if (/\.tsx$/.test(path)) acc.push(path)
  }
  return acc
}

// JSX 텍스트 노드. `✅ Compressed: {size}` 처럼 표현식이 섞여 있어도 앞뒤 글자는 문구다.
const jsxTextRe = />([^<>\n]{3,160})</g
// 문자열 리터럴로 넘기는 사용자 문구 속성.
const attrRe = /\b(placeholder|title|aria-label|alt|label)=(["'])([^"'\n]{3,120})\2/g
/**
 * 두 문구 중 하나를 고르는 삼항. `{uploading ? '업로드 중…' : '사진 바꾸기'}` 형태다.
 * 화면 문구를 이렇게 고르는 곳이 흔한데 JSX 텍스트 노드가 아니라서 위 검사에 안 걸린다.
 * 객체 리터럴이나 함수 인자에 섞인 문자열까지 보면 오탐이 쏟아지므로, 양쪽 가지가 모두
 * 문자열인 삼항만 본다.
 */
const ternaryRe = /\?\s*(["'])((?:[^\\\n]|\\.){2,160}?)\1\s*:\s*(["'])((?:[^\\\n]|\\.){2,160}?)\3/g

/** `name?: string | null` 형태의 타입 멤버. 원시 타입이나 대문자 타입명으로 끝난다. */
const TYPE_NAME = '(?:string|number|boolean|null|undefined|void|unknown|any|[A-Z][\\w$]*)'
const TYPE_MEMBER = new RegExp(`^[A-Za-z_$][\\w$]*\\??:\\s*${TYPE_NAME}(?:\\s*\\|\\s*${TYPE_NAME})*$`)

/**
 * 여는 태그가 길어 문구만 다음 줄에 남은 경우. `>` 와 `<` 가 다른 줄에 있어 위 정규식에
 * 안 걸린다. 코드 기호가 하나도 없는 줄이면서 바로 앞이 여는 태그로 끝나면 텍스트 노드다.
 * `=>` 나 `/>` 로 끝나는 줄은 각각 화살표 함수와 자식 없는 태그라서 제외한다.
 */
function isStandaloneJsxText(lines, index) {
  const line = lines[index].trim()
  if (line.length < 3) return false
  if (/[<>{}()=;[\]`]/.test(line)) return false
  if (/^(\/\/|\/\*|\*)/.test(line)) return false
  // `totalMembers: number` 같은 타입 멤버. 바로 위가 제네릭으로 끝나면 태그로 오해된다.
  if (TYPE_MEMBER.test(line)) return false
  return opensTagAbove(lines, index)
}

/** 앞 줄이 여는 태그로 끝나면, 이 줄에서 첫 `<` 앞까지는 텍스트 노드다. */
function leadingJsxText(lines, index) {
  const line = lines[index]
  const cut = line.indexOf('<')
  if (cut <= 0) return ''
  const head = line.slice(0, cut).trim()
  if (!head || /[>}=;]/.test(head)) return ''
  // `searchParams: Promise<{...}>` 의 앞부분. 제네릭 여는 꺾쇠를 태그로 오해한 것이다.
  if (TYPE_MEMBER.test(head)) return ''
  if (!opensTagAbove(lines, index)) return ''
  return head
}

/** 줄 끝이 태그가 아니라 글자로 끝나고 다음 줄이 태그로 시작하면, 그 끝부분은 텍스트 노드다. */
function trailingJsxText(lines, index) {
  const line = lines[index]
  const cut = line.lastIndexOf('>')
  if (cut < 0 || cut === line.length - 1) return ''
  const tail = line.slice(cut + 1).trim()
  if (!tail || /[<>{}();=]/.test(tail)) return ''
  for (let i = index + 1; i < lines.length; i++) {
    const next = lines[i].trim()
    if (!next) continue
    return next.startsWith('<') ? tail : ''
  }
  return ''
}

/** 바로 위 비어 있지 않은 줄이 자식을 받는 여는 태그로 끝나는지. */
function opensTagAbove(lines, index) {
  for (let i = index - 1; i >= 0; i--) {
    const prev = lines[i].trim()
    if (!prev) continue
    return prev.endsWith('>') && !prev.endsWith('/>') && !prev.endsWith('=>')
  }
  return false
}

const findings = []
for (const file of walk('src')) {
  const normalized = file.replace(/\\/g, '/')
  if (SKIP_PATHS.some(skip => normalized.includes(skip))) continue

  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    const at = (text, kind) => {
      if (!looksLikeSentence(text)) return
      findings.push({ file: normalized, line: index + 1, text: text.trim(), kind })
    }

    for (const m of line.matchAll(jsxTextRe)) {
      // 표현식 부분을 걷어 내고 남은 글자만 본다.
      for (const chunk of m[1].split(/\{[^}]*\}?/)) at(chunk, 'text')
    }
    for (const m of line.matchAll(attrRe)) at(m[3], m[1])
    for (const m of line.matchAll(ternaryRe)) {
      at(m[2], 'ternary')
      at(m[4], 'ternary')
    }
    if (isStandaloneJsxText(lines, index)) at(line, 'text')
    // `Accepted <span>{n}</span>` 처럼 줄 앞부분이 문구이고 곧바로 인라인 태그가 오는 경우.
    const leading = leadingJsxText(lines, index)
    if (leading) for (const chunk of leading.split(/\{[^}]*\}?/)) at(chunk, 'text')
    // `<Icon /> Message` 처럼 아이콘 뒤에 문구만 남고 닫는 태그는 다음 줄에 있는 경우.
    const trailing = trailingJsxText(lines, index)
    if (trailing) for (const chunk of trailing.split(/\{[^}]*\}?/)) at(chunk, 'text')
  })
}

for (const f of findings) {
  console.log(`  ${f.file}:${f.line}  [${f.kind}] ${f.text}`)
}
console.log(
  findings.length === 0
    ? '하드코딩 영어 문구 0건'
    : `하드코딩 영어 문구 ${findings.length}건`
)
if (findings.length) process.exit(1)
