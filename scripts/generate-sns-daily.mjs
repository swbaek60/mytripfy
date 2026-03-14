#!/usr/bin/env node
/**
 * SNS 캠페인 "100 Countries in 1 Year" 일일 콘텐츠 생성 (반자동 권장)
 * 사용법:
 *   node scripts/generate-sns-daily.mjs              # 오늘 1일치
 *   node scripts/generate-sns-daily.mjs --days=7     # 오늘부터 7일치 → scripts/out/sns-YYYY-MM-DD.txt 저장
 *   node scripts/generate-sns-daily.mjs --date=2026-03-20 --days=7
 * --date: 기준일 (기본: 오늘)
 * --start: 캠페인 시작일 (기본: 오늘)
 * --days: N일치 연속 생성 (기본: 1). 2 이상이면 결과를 scripts/out 폴더에 저장
 * 수아: 한국(KR) 출발, 이든: 미국(US) 출발
 *
 * 이미지 생성: OPENAI_API_KEY 환경 변수가 있으면 DALL·E 3로 실제 이미지 생성 후
 * 해당 날짜 폴더에 sua-1.png~sua-4.png, ethan-1.png~ethan-4.png 저장
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DALL_E_SIZE = '1024x1024'
const IMAGE_DELAY_MS = 2000

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')
let outLines = []

function out (s) {
  console.log(s)
  outLines.push(s)
}

const SNS_100_COUNTRIES = [
  'KR', 'JP', 'CN', 'HK', 'TW', 'VN', 'TH', 'SG', 'MY', 'ID',
  'PH', 'KH', 'LA', 'MM', 'NP', 'IN', 'LK', 'AE', 'QA', 'OM',
  'JO', 'IL', 'TR', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'KG', 'TJ',
  'RU', 'MN', 'GB', 'IE', 'FR', 'BE', 'NL', 'DE', 'CH', 'AT',
  'IT', 'ES', 'PT', 'GR', 'HR', 'SI', 'HU', 'CZ', 'PL', 'SK',
  'RO', 'BG', 'RS', 'ME', 'AL', 'MK', 'LT', 'LV', 'EE', 'FI',
  'SE', 'NO', 'IS', 'DK', 'LU', 'MC', 'MT', 'CY', 'EG', 'MA',
  'TN', 'DZ', 'KE', 'TZ', 'ZA', 'BW', 'NA', 'ZW', 'ZM', 'UG',
  'RW', 'ET', 'GH', 'SN', 'CV', 'NG', 'CM', 'GA', 'MU', 'SC',
  'US', 'CA', 'MX', 'GT', 'CR', 'PA', 'CO', 'EC', 'PE', 'BR',
]

const COUNTRY_NAMES = {
  KR: 'South Korea', JP: 'Japan', CN: 'China', HK: 'Hong Kong', TW: 'Taiwan',
  VN: 'Vietnam', TH: 'Thailand', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia',
  PH: 'Philippines', KH: 'Cambodia', LA: 'Laos', MM: 'Myanmar', NP: 'Nepal',
  IN: 'India', LK: 'Sri Lanka', AE: 'UAE', QA: 'Qatar', OM: 'Oman',
  JO: 'Jordan', IL: 'Israel', TR: 'Turkey', GE: 'Georgia', AM: 'Armenia',
  AZ: 'Azerbaijan', KZ: 'Kazakhstan', UZ: 'Uzbekistan', KG: 'Kyrgyzstan', TJ: 'Tajikistan',
  RU: 'Russia', MN: 'Mongolia', GB: 'United Kingdom', IE: 'Ireland', FR: 'France',
  BE: 'Belgium', NL: 'Netherlands', DE: 'Germany', CH: 'Switzerland', AT: 'Austria',
  IT: 'Italy', ES: 'Spain', PT: 'Portugal', GR: 'Greece', HR: 'Croatia',
  SI: 'Slovenia', HU: 'Hungary', CZ: 'Czech Republic', PL: 'Poland', SK: 'Slovakia',
  RO: 'Romania', BG: 'Bulgaria', RS: 'Serbia', ME: 'Montenegro', AL: 'Albania',
  MK: 'North Macedonia', LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', FI: 'Finland',
  SE: 'Sweden', NO: 'Norway', IS: 'Iceland', DK: 'Denmark', LU: 'Luxembourg',
  MC: 'Monaco', MT: 'Malta', CY: 'Cyprus', EG: 'Egypt', MA: 'Morocco',
  TN: 'Tunisia', DZ: 'Algeria', KE: 'Kenya', TZ: 'Tanzania', ZA: 'South Africa',
  BW: 'Botswana', NA: 'Namibia', ZW: 'Zimbabwe', ZM: 'Zambia', UG: 'Uganda',
  RW: 'Rwanda', ET: 'Ethiopia', GH: 'Ghana', SN: 'Senegal', CV: 'Cabo Verde',
  NG: 'Nigeria', CM: 'Cameroon', GA: 'Gabon', MU: 'Mauritius', SC: 'Seychelles',
  US: 'United States', CA: 'Canada', MX: 'Mexico', GT: 'Guatemala', CR: 'Costa Rica',
  PA: 'Panama', CO: 'Colombia', EC: 'Ecuador', PE: 'Peru', BR: 'Brazil',
}

const DAYS_PER_COUNTRY = 365 / SNS_100_COUNTRIES.length
const SUA_START_INDEX = 0   // 수아: 한국(KR) 출발
const ETHAN_START_INDEX = 90 // 이든: 미국(US) 출발 (리스트에서 US=90번)

// 수아: 매일 다른 옷 (베이스 40종 × 컬러/소재 10 = 400가지, 365일 동안 반복 없이)
const SUA_OUTFIT_BASE = [
  'fitted cream blazer over black top and dark jeans',
  'flowing midi dress with thin straps',
  'oversized beige knit sweater and wide-leg trousers',
  'silk blouse and high-waist pencil skirt',
  'cropped cardigan and floral midi skirt',
  'turtleneck and tailored coat',
  'off-shoulder ruffled top and linen pants',
  'tweed jacket and ribbed knit dress',
  'linen shirt dress with belt',
  'cashmere crewneck and pleated skirt',
  'wrap top and high-waist jeans',
  'lace trim cami and blazer',
  'ribbed tank and maxi skirt',
  'structured white shirt and palazzo pants',
  'knit vest over collared shirt and skirt',
  'satin slip dress with cardigan',
  'chunky sweater and leather pants',
  'embroidered blouse and wide jeans',
  'camel coat over turtleneck and trousers',
  'puff-sleeve top and tailored shorts',
  'striped Breton top and denim skirt',
  'velvet blazer and silk cami',
  'crochet top and flowy pants',
  'button-front midi dress',
  'hooded blazer and graphic tee with jeans',
  'pleated blouse and cigarette pants',
  'corset top and high-waist trousers',
  'sheer overlay top and slip skirt',
  'denim jacket over slip dress',
  'mock neck top and paper-bag waist pants',
  'halter neck top and wide-leg trousers',
  'bow blouse and midi skirt',
  'quilted jacket and knit set',
  'smocked top and denim jeans',
  'trench coat over turtleneck dress',
  'crop top and cargo pants',
  'polo neck dress with belt',
  'layered necklace and blazer with jeans',
  'bustier top and tailored pants',
]
const SUA_OUTFIT_MOD = [
  'in soft pink', 'in ivory and gold', 'in black and white', 'in sage green',
  'in navy and cream', 'in burgundy', 'in camel and brown', 'in pastel blue',
  'in cream and pearl', 'in charcoal and silver',
]

// 이든: 약 50벌 로테이션 → 같은 옷이 가끔 반복 (day % 50)
const ETHAN_OUTFITS = [
  'navy bomber jacket over grey hoodie and olive chinos',
  'white linen shirt and dark jeans',
  'orange waterproof jacket over black tee and hiking pants',
  'charcoal wool coat and turtleneck with trousers',
  'denim jacket and white tee with khaki pants',
  'fitted black sweater and grey trousers',
  'olive field jacket and henley with cargo pants',
  'camel overcoat and crewneck with jeans',
  'grey blazer and navy tee with chinos',
  'brown leather jacket and striped shirt with jeans',
  'technical windbreaker and black base layer with joggers',
  'cream knit sweater and beige trousers',
  'navy peacoat and scarf with dark jeans',
  'flannel shirt over tee and jeans',
  'black leather jacket and white tee with black jeans',
  'green utility jacket and grey hoodie with olive pants',
  'sand-colored safari jacket and linen shirt with trousers',
  'dark green sweater and corduroy pants',
  'light wash denim jacket and black tee with black jeans',
  'burgundy sweater and navy chinos',
  'grey marl sweatshirt and olive joggers',
  'white oxford shirt sleeves rolled and chinos',
  'black puffer vest over hoodie and jeans',
  'tan suede jacket and brown knit with jeans',
  'navy polo and white trousers',
  'black longline coat and turtleneck with trousers',
  'olive military jacket and black tee with jeans',
  'heather grey hoodie and dark jeans',
  'striped breton sweater and navy trousers',
  'brown corduroy jacket and cream knit with jeans',
  'black merino sweater and grey wool trousers',
  'stone wash denim jacket and grey henley with chinos',
  'forest green jacket and black base with olive pants',
  'camel cardigan and white tee with dark jeans',
  'navy quarter-zip and chinos',
  'black denim jacket and white tee with grey jeans',
  'grey overcoat and black turtleneck with trousers',
  'olive harrington jacket and tee with cargo pants',
  'burgundy crewneck and navy trousers',
  'technical black jacket and grey tee with black pants',
  'cream cable knit and beige chinos',
  'navy blazer and light blue shirt with dark jeans',
  'brown leather bomber and henley with jeans',
  'charcoal pullover and olive trousers',
  'light grey hoodie and black joggers',
  'denim shirt over tee and khaki pants',
  'black turtleneck and grey coat with trousers',
  'green fleece and black pants',
  'sand bomber and white tee with olive chinos',
  'navy sweater and camel coat with jeans',
  'black hoodie and olive utility pants',
]

function getSuaOutfit(day1Based) {
  const i = (day1Based - 1) % SUA_OUTFIT_BASE.length
  const j = Math.floor((day1Based - 1) / SUA_OUTFIT_BASE.length) % SUA_OUTFIT_MOD.length
  return SUA_OUTFIT_BASE[i] + ', ' + SUA_OUTFIT_MOD[j]
}

function getEthanOutfit(day1Based) {
  return ETHAN_OUTFITS[(day1Based - 1) % ETHAN_OUTFITS.length]
}

function getCountryForDay(day1Based, startIndex = 0) {
  const rawIndex = startIndex + Math.floor((day1Based - 1) / DAYS_PER_COUNTRY)
  const index = ((rawIndex % SNS_100_COUNTRIES.length) + SNS_100_COUNTRIES.length) % SNS_100_COUNTRIES.length
  const code = SNS_100_COUNTRIES[index]
  return { code, number: index + 1, name: COUNTRY_NAMES[code] || code }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let date = new Date(today)
  let start = new Date(today)
  let days = 1
  for (const a of args) {
    if (a.startsWith('--date=')) date = new Date(a.slice(7))
    if (a.startsWith('--start=')) start = new Date(a.slice(8))
    if (a.startsWith('--days=')) days = Math.max(1, parseInt(a.slice(7), 10) || 1)
  }
  return { date, start, days }
}

function dayIndexFromStart(date, start) {
  const d = new Date(date)
  const s = new Date(start)
  d.setHours(0, 0, 0, 0)
  s.setHours(0, 0, 0, 0)
  return Math.floor((d - s) / (24 * 60 * 60 * 1000)) + 1
}

function stripPromptNumber(p) {
  return p.replace(/^\d+\.\s*/, '').trim()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateImageWithDalle(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: DALL_E_SIZE,
      response_format: 'b64_json',
      quality: 'standard',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('DALL·E API: ' + res.status + ' ' + err)
  }
  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('DALL·E API: no b64_json in response')
  return Buffer.from(b64, 'base64')
}

async function generateAndSaveImages(dateDir, suaPrompts, ethanPrompts) {
  if (!OPENAI_API_KEY) {
    console.log('  (이미지 생략: OPENAI_API_KEY 미설정)')
    return
  }
  for (let i = 0; i < 4; i++) {
    const prompt = stripPromptNumber(suaPrompts[i])
    process.stdout.write('  수아 이미지 ' + (i + 1) + '/4 생성 중... ')
    try {
      const buf = await generateImageWithDalle(prompt)
      fs.writeFileSync(path.join(dateDir, `sua-${i + 1}.png`), buf)
      console.log('저장됨')
    } catch (e) {
      console.log('실패:', e.message)
    }
    await sleep(IMAGE_DELAY_MS)
  }
  for (let i = 0; i < 4; i++) {
    const prompt = stripPromptNumber(ethanPrompts[i])
    process.stdout.write('  이든 이미지 ' + (i + 1) + '/4 생성 중... ')
    try {
      const buf = await generateImageWithDalle(prompt)
      fs.writeFileSync(path.join(dateDir, `ethan-${i + 1}.png`), buf)
      console.log('저장됨')
    } catch (e) {
      console.log('실패:', e.message)
    }
    await sleep(IMAGE_DELAY_MS)
  }
}

function buildOneDay(day1Based, date, total) {
  const sua = getCountryForDay(day1Based, SUA_START_INDEX)
  const ethan = getCountryForDay(day1Based, ETHAN_START_INDEX)
  const dateStr = date.toISOString().slice(0, 10)
  const { name: suaName, number: suaNum } = sua
  const { name: ethanName, number: ethanNum } = ethan
  const suaOutfit = getSuaOutfit(day1Based)
  const ethanOutfit = getEthanOutfit(day1Based)

  const suaCaption = `${suaName} 하루 ✈️ 도착 → 맛집 → OOTD & 쇼핑 → 저녁 뷰까지. 챌린지 ${suaNum}/${total} 완료! 나만의 버킷리스트는 mytripfy에서 시작해요 👇\n#mytripfy #100CountriesChallenge #OOTD #맛집 #여행패션 #${suaName.replace(/\s/g, '')} ${suaNum}/${total}`
  const suaPrompts = [
    '1. Photorealistic photo of a beautiful late-20s Korean woman (Sua) with long wavy hair, wearing ' + suaOutfit + ', standing in front of a typical hotel or landmark in ' + suaName + '. Morning light, 85mm, 8k, no CGI.',
    '2. Photorealistic photo of a pretty late-20s Korean woman (Sua) wearing ' + suaOutfit + ', in a trendy cafe or restaurant in ' + suaName + ', local dish or coffee on table, smiling. Natural light, 85mm, 8k, no CGI.',
    '3. Photorealistic photo of an attractive late-20s Korean woman (Sua) wearing ' + suaOutfit + ', on a shopping street or local market in ' + suaName + '. Golden hour, 85mm, 8k, no CGI.',
    '4. Photorealistic photo of a charming late-20s Korean woman (Sua) wearing ' + suaOutfit + ', at a rooftop or scenic viewpoint in ' + suaName + ' at dusk, relaxed smile. 85mm, 8k, no CGI.',
  ]
  const suaContent = '[오늘의 OOTD] ' + suaOutfit + '\n\n[캡션 · 한 포스트에 그대로 사용]\n' + suaCaption + '\n\n[이미지 4장 순서대로 생성 → 캐러셀 1번째~4번째]\n' + suaPrompts.join('\n')

  const ethanCaption = ethanName + ' day 🏔️ Morning spot → lunch with a new friend → exploring → night views. ' + ethanNum + '/100. Start your bucket list on mytripfy 👇\n#mytripfy #100CountriesChallenge #Adventure #GlobalFriends #' + ethanName.replace(/\s/g, '') + ' ' + ethanNum + '/' + total
  const ethanPrompts = [
    '1. Photorealistic photo of a handsome late-20s American man (Ethan), fashion model look, wearing ' + ethanOutfit + ', at a famous spot in ' + ethanName + '. Morning light, 85mm, 8k, no CGI.',
    '2. Photorealistic photo of a charismatic late-20s American man (Ethan) wearing ' + ethanOutfit + ', having lunch or coffee with a local friend in ' + ethanName + ', casual and friendly. Natural light, 85mm, 8k, no CGI.',
    '3. Photorealistic photo of a fit late-20s American man (Ethan) wearing ' + ethanOutfit + ', doing an adventure activity or exploring a landmark in ' + ethanName + '. Action or dramatic pose. Golden hour, 85mm, 8k, no CGI.',
    '4. Photorealistic photo of a handsome late-20s American man (Ethan) wearing ' + ethanOutfit + ', at a bar or viewpoint in ' + ethanName + ' at night, relaxed. 85mm, 8k, no CGI.',
  ]
  const ethanContent = '[오늘 옷 (50벌 중)] ' + ethanOutfit + '\n\n[Caption · use as single post]\n' + ethanCaption + '\n\n[Image 1–4 for carousel]\n' + ethanPrompts.join('\n')

  return { dateStr, suaContent, ethanContent, suaPrompts, ethanPrompts, day1Based, sua, ethan }
}

function printOneDay(day1Based, date, total) {
  const { dateStr, suaContent, ethanContent, suaPrompts, ethanPrompts, sua, ethan } = buildOneDay(day1Based, date, total)

  out('')
  out('═══════════════════════════════════════════════════════════')
  out(`  SNS 일일 콘텐츠 · ${dateStr}  ·  Day ${day1Based}`)
  out(`  수아: ${sua.name} (${sua.code}) ${sua.number}/${total}  |  이든: ${ethan.name} (${ethan.code}) ${ethan.number}/${total}`)
  out('═══════════════════════════════════════════════════════════')
  out('')
  out('─── 수아 (Sua) · 1포스트에 이미지 4장 (캐러셀) ───')
  out('')
  suaContent.split('\n').forEach(line => out(line))
  out('')
  out('─── 이든 (Ethan) · 1포스트에 이미지 4장 (캐러셀) ───')
  out('')
  ethanContent.split('\n').forEach(line => out(line))
  out('')
  out('═══════════════════════════════════════════════════════════')

  return { dateStr, suaContent, ethanContent, suaPrompts, ethanPrompts }
}

async function main() {
  const { date, start, days } = parseArgs()
  const total = 100
  const startDay = Math.max(1, dayIndexFromStart(date, start))
  outLines = []
  const savedDirs = []
  const dayResults = []

  for (let i = 0; i < days; i++) {
    const day1Based = startDay + i
    const d = new Date(date)
    d.setDate(d.getDate() + i)
    const result = printOneDay(day1Based, d, total)

    if (days >= 1 && result) {
      const dateDir = path.join(OUT_DIR, result.dateStr)
      if (!fs.existsSync(dateDir)) fs.mkdirSync(dateDir, { recursive: true })
      fs.writeFileSync(path.join(dateDir, 'sua.txt'), result.suaContent, 'utf8')
      fs.writeFileSync(path.join(dateDir, 'ethan.txt'), result.ethanContent, 'utf8')
      savedDirs.push(result.dateStr)
      dayResults.push({ dateDir, suaPrompts: result.suaPrompts, ethanPrompts: result.ethanPrompts, dateStr: result.dateStr })
    }
  }

  if (savedDirs.length > 0) {
    out('')
    out('저장됨 (날짜별 폴더, 수아/이든 구분):')
    savedDirs.forEach(d => out('  ' + path.join(OUT_DIR, d)))
  }

  if (dayResults.length > 0) {
    out('')
    out('이미지 생성 (DALL·E 3):')
    for (const { dateDir, suaPrompts, ethanPrompts, dateStr } of dayResults) {
      out('  ' + dateStr + ':')
      await generateAndSaveImages(dateDir, suaPrompts, ethanPrompts)
    }
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
