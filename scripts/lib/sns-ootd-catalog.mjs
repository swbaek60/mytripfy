/**
 * 캐러셀 4장 — 같은 날 동일 옷·색상·악세서리 (Generate / API 공통)
 * 연속 날짜·인접 월 코디 중복 방지는 sns-daily-rotation.mjs + applyWeatherToOutfit(day1Based)
 *
 * @typedef {{ item: string, colors: string }} OutfitPiece
 */
import { attachDetailLockToOutfit, formatDetailLockTxt } from './sns-ootd-detail-lock.mjs'
import { buildExpandedSuaOutfits, buildExpandedEthanOutfits } from './sns-ootd-expanded.mjs'
import { ROTATION_POLICY } from './sns-rotation-policy.mjs'

/**
 * @typedef {{
 *   summaryKo: string,
 *   summaryEn: string,
 *   pieces: OutfitPiece[],
 *   accessories: OutfitPiece[],
 *   colorAccent?: string,
 *   promptLock: string,
 *   weatherTags?: string[],
 *   outfitIndex?: number,
 * }} DayOutfit
 */

export const OOTD_SAME_DAY_RULE =
  'CRITICAL same-day carousel lock: IDENTICAL outfit and accessories in all 4 photos — exact same garment colors, same jewelry, same bag, same shoes, no wardrobe change between slides'

/** @param {DayOutfit} o */
export function formatOutfitPromptLock(o) {
  attachDetailLockToOutfit(o)
  const clothes = o.pieces.map((p) => `${p.item} in ${p.colors}`).join(', ')
  const acc = o.accessories.map((a) => `${a.item} (${a.colors})`).join(', ')
  const accent = o.colorAccent ? ` Color accent only: ${o.colorAccent}.` : ''
  return `wearing EXACTLY: ${clothes}. Accessories (unchanged all day): ${acc}.${accent} ${OOTD_SAME_DAY_RULE}. ${o.detailLockEn}`
}

/** @param {'sua'|'ethan'} character @param {DayOutfit} o */
export function formatOutfitTxt(character, o) {
  const lines = []
  lines.push(character === 'sua' ? '[오늘의 OOTD · 캐러셀 4장 동일]' : '[Today OOTD · same in all 4 slides]')
  const label = (ko, en) => (character === 'sua' ? ko : en)
  for (const p of o.pieces) {
    lines.push(`- ${p.item}: ${p.colors}`)
  }
  lines.push(label('악세서리:', 'Accessories:'))
  for (const a of o.accessories) {
    lines.push(`  · ${a.item}: ${a.colors}`)
  }
  if (o.colorAccent) {
    lines.push(label(`포인트 컬러: ${o.colorAccent}`, `Accent: ${o.colorAccent}`))
  }
  lines.push(
    character === 'sua'
      ? '[고정] 위 옷·색·악세서리를 4장 모두 동일하게 (Generate 시 반드시 준수)'
      : '[LOCK] Same clothes, colors, accessories in every slide — do not change'
  )
  lines.push(character === 'sua' ? `요약: ${o.summaryKo}` : `Summary: ${o.summaryEn}`)
  lines.push('')
  lines.push(formatDetailLockTxt(character, o))
  return lines.join('\n')
}

/** @type {DayOutfit[]} */
const SUA_DAY_OUTFITS = [
  {
    summaryKo: '크림 블레이저 · 블랙 티 · 다크 진 · 화이트 스니커즈 · 베이지 백',
    summaryEn: 'cream blazer, black tee, dark jeans, white sneakers, beige crossbody',
    pieces: [
      { item: 'fitted cream blazer', colors: 'cream / ivory' },
      { item: 'black crew-neck top', colors: 'solid black' },
      { item: 'high-waist dark jeans', colors: 'dark indigo denim' },
      { item: 'low-top sneakers', colors: 'clean white' },
    ],
    accessories: [
      { item: 'small gold hoop earrings', colors: '14k gold' },
      { item: 'thin gold chain necklace', colors: '14k gold' },
      { item: 'crossbody bag', colors: 'beige / tan leather' },
    ],
    colorAccent: 'soft pink lipstick and nails',
    promptLock: '',
  },
  {
    summaryKo: '아이보리 민소매 원피스 · 골드 샌들 · 라탄 백',
    summaryEn: 'ivory midi slip dress, gold sandals, rattan bag',
    pieces: [
      { item: 'flowing ivory midi dress thin straps', colors: 'ivory / off-white' },
      { item: 'strappy sandals', colors: 'gold metallic' },
    ],
    accessories: [
      { item: 'delicate layered necklaces', colors: 'gold' },
      { item: 'woven rattan shoulder bag', colors: 'natural tan' },
      { item: 'thin gold bracelet', colors: 'gold' },
    ],
    colorAccent: 'gold and ivory tones only',
    promptLock: '',
  },
  {
    summaryKo: '베이지 니트 · 와이드 슬랙 · 화이트 스니커즈',
    summaryEn: 'beige knit, wide taupe trousers, white sneakers',
    pieces: [
      { item: 'oversized beige knit sweater', colors: 'warm beige' },
      { item: 'wide-leg trousers', colors: 'taupe / light brown' },
      { item: 'white sneakers', colors: 'white' },
    ],
    accessories: [
      { item: 'leather tote bag', colors: 'cognac brown' },
      { item: 'silver stud earrings', colors: 'silver' },
      { item: 'simple watch', colors: 'silver case tan strap' },
    ],
    colorAccent: 'sage green nail accent optional',
    promptLock: '',
  },
  {
    summaryKo: '샴페인 블라우스 · 네이비 스커트 · 블랙 힐',
    summaryEn: 'champagne blouse, navy pencil skirt, black heels',
    pieces: [
      { item: 'silk champagne blouse', colors: 'champagne / light gold' },
      { item: 'high-waist pencil skirt', colors: 'navy blue' },
      { item: 'pointed pumps', colors: 'black' },
    ],
    accessories: [
      { item: 'pearl stud earrings', colors: 'white pearl' },
      { item: 'structured handbag', colors: 'black leather' },
      { item: 'thin belt', colors: 'black leather gold buckle' },
    ],
    colorAccent: 'navy and cream palette',
    promptLock: '',
  },
  {
    summaryKo: '크롭 가디건 · 플로럴 미디 스커트',
    summaryEn: 'cropped cardigan, floral midi skirt',
    pieces: [
      { item: 'cropped soft cardigan', colors: 'dusty rose pink' },
      { item: 'floral midi skirt', colors: 'navy base multicolor small flowers' },
      { item: 'nude block heels', colors: 'nude beige' },
    ],
    accessories: [
      { item: 'gold hoop earrings', colors: 'gold medium' },
      { item: 'small shoulder bag', colors: 'blush pink leather' },
      { item: 'hair claw clip', colors: 'tortoiseshell' },
    ],
    colorAccent: 'dusty rose and navy floral',
    promptLock: '',
  },
  {
    summaryKo: '터틀넥 · 차콜 코트 · 블랙 진',
    summaryEn: 'black turtleneck, charcoal coat, black jeans',
    pieces: [
      { item: 'black turtleneck', colors: 'black' },
      { item: 'tailored long coat', colors: 'charcoal grey' },
      { item: 'black skinny jeans', colors: 'black denim' },
      { item: 'black ankle boots', colors: 'black leather' },
    ],
    accessories: [
      { item: 'crossbody bag', colors: 'black leather' },
      { item: 'silver hoop earrings', colors: 'silver' },
    ],
    colorAccent: 'monochrome black charcoal',
    promptLock: '',
  },
  {
    summaryKo: '오프숄더 러플 탑 · 린넨 팬츠 · 샌들',
    summaryEn: 'off-shoulder ruffle top, linen pants, sandals',
    pieces: [
      { item: 'off-shoulder ruffle top', colors: 'white' },
      { item: 'high-waist linen pants', colors: 'sand / oatmeal' },
      { item: 'flat sandals', colors: 'tan leather' },
    ],
    accessories: [
      { item: 'straw sun hat', colors: 'natural beige' },
      { item: 'round sunglasses', colors: 'tortoise frame brown lens' },
      { item: 'canvas tote', colors: 'natural ecru' },
    ],
    colorAccent: 'white and sand neutral',
    promptLock: '',
  },
  {
    summaryKo: '린넨 셔츠 원피스 · 브라운 벨트',
    summaryEn: 'linen shirt dress, brown belt',
    pieces: [
      { item: 'linen shirt dress with belt', colors: 'light sage green' },
      { item: 'leather belt', colors: 'cognac brown' },
      { item: 'white sneakers', colors: 'white' },
    ],
    accessories: [
      { item: 'woven basket bag', colors: 'natural tan' },
      { item: 'gold stud earrings', colors: 'gold' },
    ],
    colorAccent: 'sage green linen',
    promptLock: '',
  },
  {
    summaryKo: '샴페인 슬립 · 베이지 가디건',
    summaryEn: 'champagne slip dress, beige cardigan',
    pieces: [
      { item: 'satin slip dress', colors: 'champagne' },
      { item: 'long open cardigan', colors: 'light beige' },
      { item: 'nude heels', colors: 'nude' },
    ],
    accessories: [
      { item: 'layered delicate necklaces', colors: 'gold' },
      { item: 'clutch bag', colors: 'gold metallic' },
    ],
    colorAccent: 'champagne gold evening',
    promptLock: '',
  },
  {
    summaryKo: '데님 재킷 · 슬립 원피스',
    summaryEn: 'denim jacket, slip dress',
    pieces: [
      { item: 'light wash denim jacket', colors: 'light blue denim' },
      { item: 'black slip mini dress', colors: 'black' },
      { item: 'white sneakers', colors: 'white' },
    ],
    accessories: [
      { item: 'black crossbody bag', colors: 'black nylon' },
      { item: 'silver chain necklace', colors: 'silver' },
    ],
    colorAccent: 'denim blue and black',
    promptLock: '',
  },
]

/** @type {DayOutfit[]} */
const ETHAN_DAY_OUTFITS = [
  {
    summaryKo: '네이비 봄버 · 블랙 티 · 올리브 치노 · 화이트 스니커즈',
    summaryEn: 'navy bomber open, black crew tee, olive chinos, white sneakers',
    pieces: [
      { item: 'navy blue bomber jacket unzipped open', colors: 'solid navy blue' },
      { item: 'plain black crew-neck t-shirt', colors: 'solid black' },
      { item: 'olive chino pants', colors: 'olive green' },
      { item: 'white low-top sneakers', colors: 'clean white' },
    ],
    accessories: [
      { item: 'brown leather watch', colors: 'brown strap silver dial' },
      { item: 'black nylon backpack', colors: 'matte black' },
    ],
    colorAccent: 'no jewelry except watch',
    promptLock: '',
  },
  {
    summaryKo: '화이트 린넨 셔츠 · 다크 진',
    summaryEn: 'white linen shirt, dark jeans',
    pieces: [
      { item: 'white linen button-down shirt sleeves rolled', colors: 'white' },
      { item: 'dark indigo jeans', colors: 'dark blue denim' },
      { item: 'brown suede desert boots', colors: 'tan brown' },
    ],
    accessories: [
      { item: 'leather belt', colors: 'brown leather' },
      { item: 'aviator sunglasses', colors: 'gold frame green lens' },
      { item: 'canvas messenger bag', colors: 'olive green' },
    ],
    colorAccent: 'white shirt tan boots',
    promptLock: '',
  },
  {
    summaryKo: '올리브 필드 재킷 · 헨리 · 카고 팬츠',
    summaryEn: 'olive field jacket, henley, cargo pants',
    pieces: [
      { item: 'olive field jacket', colors: 'olive drab' },
      { item: 'grey henley shirt', colors: 'grey' },
      { item: 'khaki cargo pants', colors: 'khaki tan' },
      { item: 'hiking sneakers', colors: 'grey and orange accent' },
    ],
    accessories: [
      { item: 'baseball cap', colors: 'navy cotton' },
      { item: 'sport watch', colors: 'black rubber strap' },
    ],
    colorAccent: 'earth tones olive khaki',
    promptLock: '',
  },
  {
    summaryKo: '데님 재킷 · 화이트 티 · 카키 팬츠',
    summaryEn: 'denim jacket, white tee, khaki pants',
    pieces: [
      { item: 'medium wash denim jacket', colors: 'medium blue denim' },
      { item: 'plain white crew tee', colors: 'white' },
      { item: 'khaki chinos', colors: 'khaki' },
      { item: 'white sneakers', colors: 'white' },
    ],
    accessories: [
      { item: 'leather bracelet', colors: 'dark brown braided' },
      { item: 'black wayfarer sunglasses', colors: 'black frame' },
    ],
    colorAccent: 'denim white khaki',
    promptLock: '',
  },
  {
    summaryKo: '카멜 오버코트 · 크루넥 · 진',
    summaryEn: 'camel overcoat, crewneck, jeans',
    pieces: [
      { item: 'camel wool overcoat', colors: 'camel' },
      { item: 'navy crewneck sweater', colors: 'navy' },
      { item: 'medium blue jeans', colors: 'medium wash denim' },
      { item: 'brown leather boots', colors: 'cognac brown' },
    ],
    accessories: [
      { item: 'wool scarf', colors: 'navy and grey plaid' },
      { item: 'leather gloves', colors: 'dark brown' },
    ],
    colorAccent: 'camel navy winter',
    promptLock: '',
  },
  {
    summaryKo: '블랙 레더 재킷 · 화이트 티 · 블랙 진',
    summaryEn: 'black leather jacket, white tee, black jeans',
    pieces: [
      { item: 'black leather moto jacket', colors: 'black leather' },
      { item: 'white t-shirt', colors: 'white' },
      { item: 'black slim jeans', colors: 'black' },
      { item: 'black Chelsea boots', colors: 'black' },
    ],
    accessories: [
      { item: 'silver chain necklace', colors: 'silver thin' },
      { item: 'black leather watch', colors: 'black strap' },
    ],
    colorAccent: 'all black and white',
    promptLock: '',
  },
  {
    summaryKo: '윈드브레이커 · 블랙 베이스 · 조거',
    summaryEn: 'windbreaker, black base layer, joggers',
    pieces: [
      { item: 'technical windbreaker', colors: 'black with white zip' },
      { item: 'black compression long sleeve', colors: 'black' },
      { item: 'tapered joggers', colors: 'charcoal grey' },
      { item: 'running shoes', colors: 'black white sole' },
    ],
    accessories: [
      { item: 'sport cap', colors: 'black' },
      { item: 'fitness watch', colors: 'black' },
    ],
    colorAccent: 'athletic black grey',
    promptLock: '',
  },
  {
    summaryKo: '그레이 블레이저 · 네이비 티 · 치노',
    summaryEn: 'grey blazer, navy tee, chinos',
    pieces: [
      { item: 'grey casual blazer', colors: 'medium grey' },
      { item: 'navy t-shirt', colors: 'navy' },
      { item: 'stone chinos', colors: 'stone beige' },
      { item: 'brown loafers', colors: 'dark brown leather' },
    ],
    accessories: [
      { item: 'leather brief', colors: 'dark brown' },
      { item: 'dress watch', colors: 'silver' },
    ],
    colorAccent: 'smart casual grey navy',
    promptLock: '',
  },
  {
    summaryKo: '크림 니트 · 베이지 슬랙',
    summaryEn: 'cream knit sweater, beige trousers',
    pieces: [
      { item: 'cream cable knit sweater', colors: 'cream' },
      { item: 'pleated trousers', colors: 'light beige' },
      { item: 'white leather sneakers', colors: 'white' },
    ],
    accessories: [
      { item: 'tote bag', colors: 'tan canvas' },
      { item: 'round glasses', colors: 'tortoise frame' },
    ],
    colorAccent: 'cream beige soft',
    promptLock: '',
  },
  {
    summaryKo: '포레스트 그린 재킷 · 블랙 티 · 올리브 팬츠',
    summaryEn: 'forest green jacket, black tee, olive pants',
    pieces: [
      { item: 'forest green utility jacket', colors: 'forest green' },
      { item: 'black t-shirt', colors: 'black' },
      { item: 'olive cargo pants', colors: 'olive' },
      { item: 'tan work boots', colors: 'tan brown' },
    ],
    accessories: [
      { item: 'canvas backpack', colors: 'army green' },
      { item: 'beanie', colors: 'charcoal grey' },
    ],
    colorAccent: 'green olive earth',
    promptLock: '',
  },
]

/** @type {string[][]} */
const BASE_SUA_WEATHER_TAGS = [
  ['mild', 'warm', 'cool'],
  ['hot', 'warm'],
  ['mild', 'cool'],
  ['mild', 'cool'],
  ['warm', 'mild', 'rainy'],
  ['cool', 'cold'],
  ['hot', 'warm'],
  ['warm', 'mild'],
  ['warm', 'mild'],
  ['warm', 'mild', 'rainy'],
]

/** @type {string[][]} */
const BASE_ETHAN_WEATHER_TAGS = [
  ['mild', 'warm'],
  ['hot', 'warm'],
  ['mild', 'warm', 'rainy'],
  ['mild', 'warm'],
  ['cool', 'cold'],
  ['cool', 'mild'],
  ['mild', 'cool', 'rainy'],
  ['mild', 'warm'],
  ['mild', 'cool'],
  ['mild', 'cool', 'rainy'],
]

SUA_DAY_OUTFITS.forEach((o, i) => {
  o.weatherTags = BASE_SUA_WEATHER_TAGS[i] || ['mild']
})
ETHAN_DAY_OUTFITS.forEach((o, i) => {
  o.weatherTags = BASE_ETHAN_WEATHER_TAGS[i] || ['mild']
})

/** @type {DayOutfit[]} */
export const SUA_OUTFITS = buildExpandedSuaOutfits(SUA_DAY_OUTFITS)
/** @type {DayOutfit[]} */
export const ETHAN_OUTFITS = buildExpandedEthanOutfits(ETHAN_DAY_OUTFITS)

// promptLock 채우기
for (const o of SUA_OUTFITS) o.promptLock = formatOutfitPromptLock(o)
for (const o of ETHAN_OUTFITS) o.promptLock = formatOutfitPromptLock(o)

/** @param {'sua'|'ethan'} character */
export function getCatalogList(character) {
  return character === 'sua' ? SUA_OUTFITS : ETHAN_OUTFITS
}

/** @param {'sua'|'ethan'} character */
export function getCatalogLength(character) {
  return getCatalogList(character).length
}

export const YEARLY_OUTFIT_POOL_SIZE = ROTATION_POLICY.YEARLY_OUTFIT_POOL_SIZE

/** @returns {DayOutfit} */
export function getDayOutfit(character, day1Based) {
  const list = getCatalogList(character)
  return list[(day1Based - 1) % list.length]
}

/** @param {DayOutfit} o */
export function cloneOutfit(o) {
  return {
    summaryKo: o.summaryKo,
    summaryEn: o.summaryEn,
    pieces: o.pieces.map((p) => ({ ...p })),
    accessories: o.accessories.map((a) => ({ ...a })),
    colorAccent: o.colorAccent,
    promptLock: o.promptLock,
    weatherTags: o.weatherTags,
    weather: o.weather,
    weatherContextEn: o.weatherContextEn,
    outfitIndex: o.outfitIndex,
  }
}

/** @param {'sua'|'ethan'} character @param {number} index */
export function getOutfitByIndex(character, index) {
  const list = getCatalogList(character)
  const o = list[((index % list.length) + list.length) % list.length]
  const cloned = cloneOutfit(o)
  cloned.outfitIndex = ((index % list.length) + list.length) % list.length
  return cloned
}

/** @param {'sua'|'ethan'} character @param {string} [summaryKo] @param {string} [summaryEn] */
export function findOutfitIndexBySummary(character, summaryKo, summaryEn) {
  const list = getCatalogList(character)
  const ko = summaryKo?.trim()
  const en = summaryEn?.trim()
  return list.findIndex((o) => (ko && o.summaryKo === ko) || (en && o.summaryEn === en))
}

/** @deprecated 문자열만 필요할 때 — promptLock 사용 권장 */
export function getSuaOutfit(day1Based) {
  return getDayOutfit('sua', day1Based).summaryEn
}

/** @deprecated */
export function getEthanOutfit(day1Based) {
  return getDayOutfit('ethan', day1Based).summaryEn
}
