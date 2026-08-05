/**
 * messages/*.json 에 키를 일괄 추가한다.
 *
 * 새 UI 문구를 넣을 때 25개 로케일 파일을 손으로 고치면 반드시 몇 개가 빠진다.
 * 이 스크립트는 네임스페이스 안의 지정한 위치(anchor 뒤)에 키를 끼워 넣고,
 * 이미 있는 키는 건드리지 않는다.
 *
 * 사용법: node scripts/add-message-keys.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const MESSAGES_DIR = path.join(process.cwd(), 'messages')

/** namespace -> { key: { locale: text } } */
const ADDITIONS = {
  Messages: {
    translate: {
      en: 'Translate', ko: '번역', ja: '翻訳', zh: '翻译', 'zh-TW': '翻譯',
      es: 'Traducir', pt: 'Traduzir', 'pt-BR': 'Traduzir', fr: 'Traduire',
      de: 'Übersetzen', it: 'Tradurre', nl: 'Vertalen', pl: 'Przetłumacz',
      sv: 'Översätt', ru: 'Перевести', uk: 'Перекласти', tr: 'Çevir',
      ar: 'ترجمة', fa: 'ترجمه', hi: 'अनुवाद करें', bn: 'অনুবাদ করুন',
      id: 'Terjemahkan', ms: 'Terjemah', vi: 'Dịch', th: 'แปล',
    },
    showOriginal: {
      en: 'Show original', ko: '원문 보기', ja: '原文を表示', zh: '显示原文',
      'zh-TW': '顯示原文', es: 'Ver original', pt: 'Ver original',
      'pt-BR': 'Ver original', fr: 'Voir l’original', de: 'Original anzeigen',
      it: 'Mostra originale', nl: 'Origineel weergeven', pl: 'Pokaż oryginał',
      sv: 'Visa original', ru: 'Показать оригинал', uk: 'Показати оригінал',
      tr: 'Orijinali göster', ar: 'إظهار الأصل', fa: 'نمایش متن اصلی',
      hi: 'मूल दिखाएँ', bn: 'মূল দেখান', id: 'Tampilkan asli',
      ms: 'Tunjuk asal', vi: 'Xem bản gốc', th: 'ดูต้นฉบับ',
    },
  },
}

let changed = 0
const missing = []

for (const file of fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith('.json'))) {
  const locale = file.replace(/\.json$/, '')
  const filePath = path.join(MESSAGES_DIR, file)
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  let touched = false

  for (const [ns, keys] of Object.entries(ADDITIONS)) {
    json[ns] ??= {}
    for (const [key, byLocale] of Object.entries(keys)) {
      if (json[ns][key] !== undefined) continue
      const value = byLocale[locale]
      if (value === undefined) {
        missing.push(`${locale}.${ns}.${key}`)
        continue
      }
      json[ns][key] = value
      touched = true
    }
  }

  if (touched) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8')
    changed++
  }
}

console.log(`updated ${changed} locale file(s)`)
if (missing.length) console.warn('missing translations:', missing.join(', '))
