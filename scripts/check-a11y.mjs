#!/usr/bin/env node
/**
 * 이름 없는 조작 요소를 찾는다.
 *
 * 아이콘만 들어간 버튼은 보이는 사람에게는 뜻이 분명하지만 스크린리더에는 "버튼" 으로만
 * 읽힌다. 라벨 없는 입력칸도 마찬가지로 무엇을 적어야 하는지 알 수 없다. 눈으로 훑어서는
 * 빠진 곳을 찾기 어려우므로 기계로 훑는다.
 *
 * 판정 방식: 여는 태그의 속성과 그 요소의 자식 텍스트를 본다. aria-label / aria-labelledby /
 * title / 눈에 보이는 글자 중 하나라도 있으면 이름이 있다고 본다. 자식이 <Icon /> 같은
 * 컴포넌트뿐이면 이름이 없다고 본다.
 *
 * 사용법: node scripts/check-a11y.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** 이 요소들은 눌리거나 값을 받는다. 이름이 필요하다. */
const INTERACTIVE = ['button', 'a', 'input', 'select', 'textarea']

/** 이름을 직접 지정하는 속성. 하나라도 있으면 통과. */
const NAME_ATTRS = ['aria-label', 'aria-labelledby', 'title', 'placeholder', 'alt']

/**
 * 원시 컴포넌트는 받은 props 를 그대로 넘긴다. 이름은 쓰는 쪽이 정하므로 여기서는 볼 수 없다.
 * 대신 이 컴포넌트를 쓰는 화면 파일에서 검사된다.
 */
const SKIP_PATHS = ['src/components/ui/']

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, acc)
    else if (/\.tsx$/.test(path) && !/\.test\.tsx$/.test(path)) acc.push(path)
  }
  return acc
}

/**
 * 여는 태그 하나를 소스에서 잘라낸다. 속성값 안의 `>` 에 속지 않도록 문자열과 중괄호
 * 깊이를 따라간다. 반환값의 end 는 태그를 닫는 `>` 의 인덱스.
 */
function readOpenTag(src, start) {
  let depth = 0
  let quote = null
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (quote) {
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue }
    if (ch === '{') { depth++; continue }
    if (ch === '}') { depth--; continue }
    if (ch === '>' && depth === 0) return { attrs: src.slice(start, i), end: i }
  }
  return null
}

/** 여는 태그부터 짝이 맞는 닫는 태그까지의 안쪽 내용. 같은 이름이 겹쳐 나와도 센다. */
function readChildren(src, tag, afterOpen) {
  const open = new RegExp(`<${tag}[\\s>]`, 'g')
  const close = new RegExp(`</${tag}>`, 'g')
  open.lastIndex = afterOpen
  close.lastIndex = afterOpen
  let depth = 1
  let cursor = afterOpen
  while (depth > 0) {
    open.lastIndex = cursor
    close.lastIndex = cursor
    const o = open.exec(src)
    const c = close.exec(src)
    if (!c) return src.slice(afterOpen)
    if (o && o.index < c.index) { depth++; cursor = o.index + 1 }
    else { depth--; cursor = c.index + 1; if (depth === 0) return src.slice(afterOpen, c.index) }
  }
  return ''
}

/**
 * 자식 안에 스크린리더가 읽을 글자가 있는지 본다. JSX 표현식 `{t('x')}` 은 런타임에
 * 글자가 되므로 이름이 있다고 본다. `<Icon />` 같은 태그만 있으면 없다고 본다.
 */
function hasVisibleText(children) {
  const stripped = children
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')   // JSX 주석
    .replace(/<[^>]*>/g, '\u0000')          // 태그는 자리표시자로
  // 중괄호 표현식은 값이 들어오므로 글자로 본다. 단 `{' '}` 같은 공백 채움은 제외.
  const exprs = [...stripped.matchAll(/\{([\s\S]*?)\}/g)]
    .map(m => m[1].trim())
    .filter(v => v && !/^['"`]\s*['"`]$/.test(v))
  if (exprs.length) return true
  const text = stripped.replace(/\{[\s\S]*?\}/g, '').replace(/\u0000/g, '').trim()
  // `✕` `→` 처럼 기호만 있는 버튼은 소리로 읽히지 않는다. 이름이 없는 것으로 본다.
  return /[\p{Letter}\p{Number}]/u.test(text)
}

/**
 * 입력칸을 감싼 <label> 이 글자를 갖고 있으면 그 글자가 이름이 된다(암묵적 연결).
 * `<label>…<input …/><span>사진 고르기</span></label>` 형태가 여기 해당한다.
 */
function wrappedByLabelWithText(src, index) {
  const open = src.lastIndexOf('<label', index)
  if (open === -1) return false
  const close = src.indexOf('</label>', open)
  if (close === -1 || close < index) return false
  const inner = src.slice(open, close)
  return hasVisibleText(inner.replace(/<input[\s\S]*?\/>/g, ''))
}

const findings = []

for (const file of walk('src')) {
  if (SKIP_PATHS.some(p => file.replace(/\\/g, '/').includes(p))) continue
  const src = readFileSync(file, 'utf8')
  const lineAt = (index) => src.slice(0, index).split('\n').length

  for (const tag of INTERACTIVE) {
    const re = new RegExp(`<${tag}(?=[\\s/>])`, 'g')
    let m
    while ((m = re.exec(src))) {
      const open = readOpenTag(src, m.index)
      if (!open) continue
      const { attrs, end } = open

      // 링크 겸 버튼 역할이 아닌 순수 앵커(스타일용)나 hidden 입력은 뺀다.
      if (/type=(['"])hidden\1/.test(attrs)) continue
      if (tag === 'input' && /type=(['"])(checkbox|radio)\1/.test(attrs) && /\bid=/.test(attrs)) continue

      if (NAME_ATTRS.some(a => new RegExp(`\\b${a}=`).test(attrs))) continue
      if (/\baria-hidden=(['"])true\1/.test(attrs)) continue
      if (tag !== 'button' && tag !== 'a' && wrappedByLabelWithText(src, m.index)) continue

      // 스스로 닫는 태그는 자식이 없다. 입력칸이 여기 해당한다.
      const selfClosing = attrs.trimEnd().endsWith('/')
      const children = selfClosing ? '' : readChildren(src, tag, end + 1)
      if (hasVisibleText(children)) continue

      findings.push({
        file: file.replace(/\\/g, '/'),
        line: lineAt(m.index),
        tag,
      })
    }
  }
}

for (const f of findings) console.log(`  ${f.file}:${f.line}  <${f.tag}> 이름 없음`)
console.log(findings.length === 0 ? '이름 없는 조작 요소 0건' : `이름 없는 조작 요소 ${findings.length}건`)
if (findings.length) process.exit(1)
