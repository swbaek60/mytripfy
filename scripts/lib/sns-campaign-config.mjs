/**
 * SNS 100 Countries 캠페인 공통 설정 (generate / publish 스크립트 공유)
 */
import { getDayOutfit, formatOutfitTxt } from './sns-ootd-catalog.mjs'
import {
  resolveCity,
  fetchCityWeather,
  applyWeatherToOutfit,
  formatWeatherTxt,
} from './sns-weather.mjs'
import { getItineraryVariant, pickVariantIndex } from './sns-day-itineraries.mjs'
import { getDayInCountryVisit } from './sns-daily-rotation.mjs'
import {
  getSubjectFramingBlock,
  getEthanPosePreset,
  getSuaPosePreset,
  stripUmbrellaFromPose,
} from './sns-body-framing.mjs'

export { getSubjectFramingBlock, SUBJECT_FRAMING, getEthanPosePreset, getSuaPosePreset, getEthanPosePresets, getSuaPosePresets, stripUmbrellaFromPose } from './sns-body-framing.mjs'

export {
  getDayOutfit,
  formatOutfitTxt,
  OOTD_SAME_DAY_RULE,
  getSuaOutfit,
  getEthanOutfit,
} from './sns-ootd-catalog.mjs'

export const SNS_100_COUNTRIES = [
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

export const COUNTRY_NAMES = {
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

export const COUNTRY_NAMES_KO = {
  KR: '한국', JP: '일본', CN: '중국', HK: '홍콩', TW: '대만',
  VN: '베트남', TH: '태국', SG: '싱가포르', MY: '말레이시아', ID: '인도네시아',
  PH: '필리핀', US: '미국', GB: '영국', FR: '프랑스', IT: '이탈리아',
  ES: '스페인', DE: '독일', AU: '호주', BR: '브라질', CA: '캐나다',
}

export const DAYS_PER_COUNTRY = 365 / SNS_100_COUNTRIES.length
export const SUA_START_INDEX = 0
export const ETHAN_START_INDEX = 90
export const TOTAL_COUNTRIES = 100

/**
 * 모든 SNS 이미지 프롬프트에 붙는 "실제 사진" 스타일 (AI 느낌 최소화)
 * Generate / DALL·E / Gemini / Pollinations 공통
 */
export const PHOTO_REALISM = {
  prefix:
    'Authentic candid travel photograph, real camera not AI art, shot on iPhone 15 Pro or Sony A7IV 35mm f/2.8, ',
  suffix:
    ', natural skin texture with visible pores and slight imperfections, real ambient light only, subtle sensor noise and film grain, imperfect casual framing like a real travel Instagram post, documentary street photography, NOT illustration NOT CGI NOT 3D render NOT beauty filter NOT plastic skin NOT oversaturated NOT airbrushed',
}

/** @param {string} scene - 인물·장소·동작 묘사 */
export function wrapTravelPhotoPrompt(scene) {
  return PHOTO_REALISM.prefix + scene + PHOTO_REALISM.suffix
}

export const BRAND = {
  siteUrl: 'https://www.mytripfy.com',
  /** 웹 랜딩 URL — 캐릭터명(수아/이든) 미포함 (인스타 전용 페르소나) */
  siteUrlUtm: 'https://www.mytripfy.com?utm_source=instagram&utm_medium=social&utm_campaign=100countries',
  /** @deprecated scripts 내부 호환 — 웹 노출 금지, siteUrlUtm 사용 */
  siteUrlUtmSua: 'https://www.mytripfy.com?utm_source=instagram&utm_medium=social&utm_campaign=100countries',
  siteUrlUtmEthan: 'https://www.mytripfy.com?utm_source=instagram&utm_medium=social&utm_campaign=100countries',
  hashtags: '#mytripfy #100CountriesChallenge',
}

/** Country code → challenge deep link (countries category). No character names in URL. */
export function buildChallengeDeepLink(countryCode) {
  const cc = (countryCode || '').toLowerCase()
  return `${BRAND.siteUrl}/en/challenges/countries?utm_source=instagram&utm_medium=social&utm_campaign=100countries&country=${cc}`
}

/** QR image URL for story/post (no extra dependency) */
export function buildChallengeQrUrl(deepLink) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(deepLink)}`
}

/** Standard story CTA block for Instagram (account label is operator-only, not on web) */
export function formatStoryCtaBlock(accountKey, country) {
  const deepLink = buildChallengeDeepLink(country.code)
  const qrUrl = buildChallengeQrUrl(deepLink)
  const countryTag = (country.nameKo || country.name).replace(/\s/g, '')
  if (accountKey === 'sua') {
    return (
      `[Story · 오늘의 퀘스트 CTA · ${accountKey}]\n` +
      `👉 ${deepLink}\n` +
      `QR 이미지: ${qrUrl}\n` +
      `스토리 텍스트: "오늘 ${country.nameKo || country.name} 퀘스트 — mytripfy에서 인증하고 포인트 받기 👇"\n` +
      `${BRAND.hashtags} #${countryTag}`
    )
  }
  return (
    `[Story · today's quest CTA · ${accountKey}]\n` +
    `👉 ${deepLink}\n` +
    `QR image: ${qrUrl}\n` +
    `Story text: "Today's quest in ${country.name} — stamp it on mytripfy 👇"\n` +
    `${BRAND.hashtags} #${countryTag}`
  )
}

/**
 * 수아·이든 계정 톤 분리 (같은 운영자 느낌 방지)
 * - 서로 모르는 별개 인물 · 크로스 멘션·짝 맞춘 문구 금지
 * - 캡션 구조·말투·해시태그 패턴을 의도적으로 다르게
 */
export const ACCOUNT_PERSONA = {
  relationship: 'strangers — Sua and Ethan have never met and do not reference each other',
  doNotMirror: [
    'numbered "오늘 한 일" / "What I did today" lists',
    'same opening line pattern (Day X/100 + emoji block)',
    'identical CTA wording (버킷리스트는 mytripfy / Tracking the challenge on mytripfy)',
    'Same outfit all day — four stops, four moods',
  ],
  sua: {
    language: 'Korean primary',
    captionFormat: 'diary_list',
    tone: 'polite-casual, travel diary, 📍 place list, OOTD mention',
    hashtagsExtra: '#OOTD #맛집 #여행패션',
  },
  ethan: {
    language: 'English casual US',
    captionFormat: 'story_or_dash', // never diary_list
    tone: 'relaxed guy, short paragraphs, lowercase ok, light humor, no 📍 header',
    hashtagsExtra: '#solotravel #wanderlust #travelgram',
    bannedPhrases: [
      'What I did today',
      'four stops, four moods',
      'Tracking the 100-country challenge',
      'Bucket list on mytripfy 👇',
    ],
  },
}

export const ACCOUNTS = {
  sua: {
    handle: 'sua.mytripfy',
    displayName: 'Sua | 100 Countries',
    instagramMention: '@sua.mytripfy',
    language: 'ko-en',
    faceBlock:
      'real young Korean woman in her late 20s named Sua, long wavy dark brown hair, natural face with subtle imperfections, same person in every photo, facial expression must match each shot description exactly',
  },
  ethan: {
    handle: 'ethan.mytripfy',
    displayName: 'Ethan | 100 Countries',
    instagramMention: '@ethan.mytripfy',
    language: 'en',
    faceBlock:
      'extremely handsome young American man named Ethan age 27, modern textured crop haircut with short sides and wavy dark brown top swept to the side, light groomed stubble, bright eyes, strong jaw, no earrings, same person in every photo, facial expression must match each shot description exactly',
  },
}

/** @param {'sua'|'ethan'} character */
export function getSubjectBlock(character) {
  const face = ACCOUNTS[character].faceBlock
  return `${face}, ${getSubjectFramingBlock(character)}`
}

export const AI_DISCLOSURE = {
  profileKo: '✨ AI로 제작된 가상의 여행 스토리 · 1년 100개국 챌린지',
  profileEn: '🌍 AI-generated travel story · 100 countries in 1 year',
  pinnedCaptionKo:
    '안녕하세요, 수아예요 ✈️\n\n이 계정은 AI로 만든 가상의 여행 캐릭터 스토리입니다. 1년 동안 100개국 챌린지를 진행하며 버킷리스트는 mytripfy에서 관리해요.\n\n#mytripfy #100CountriesChallenge #AIgenerated',
  pinnedCaptionEn:
    'Hey, I\'m Ethan ✈️\n\nThis is an AI-generated fictional travel character. One year, 100 countries — bucket list on mytripfy.\n\n#mytripfy #100CountriesChallenge #AIgenerated',
}

/** 캠페인 N일차 진행 국가 수 (1~100) */
export function getVisitNumberForDay(day1Based) {
  return Math.min(TOTAL_COUNTRIES, Math.floor((day1Based - 1) / DAYS_PER_COUNTRY) + 1)
}

function getIndexForDay(day1Based, startIndex) {
  const raw = startIndex + Math.floor((day1Based - 1) / DAYS_PER_COUNTRY)
  return ((raw % SNS_100_COUNTRIES.length) + SNS_100_COUNTRIES.length) % SNS_100_COUNTRIES.length
}

export function getCountryForDay(day1Based, startIndex = SUA_START_INDEX) {
  const index = getIndexForDay(day1Based, startIndex)
  const code = SNS_100_COUNTRIES[index]
  return {
    code,
    name: COUNTRY_NAMES[code] || code,
    nameKo: COUNTRY_NAMES_KO[code] || COUNTRY_NAMES[code] || code,
    visitNumber: getVisitNumberForDay(day1Based),
  }
}

export function getSuaCountry(day1Based) {
  return getCountryForDay(day1Based, SUA_START_INDEX)
}

export function getEthanCountry(day1Based) {
  return getCountryForDay(day1Based, ETHAN_START_INDEX)
}

const CHALLENGE_CATEGORIES = [
  'country landmark',
  'local restaurant',
  'street food',
  'museum',
  'nature spot',
  'festival',
  'cafe culture',
  'night market',
  'beach or island',
  'local drink',
]

export function getChallengeHint(day1Based) {
  return CHALLENGE_CATEGORIES[(day1Based - 1) % CHALLENGE_CATEGORIES.length]
}

/**
 * 슬라이드별 장소·활동·표정 (캡션 일기 + 이미지 프롬프트 공유)
 * @typedef {{ place: string, placeKo?: string, activity: string, activityKo?: string, expression: string, promptScene: string }} DayStop
 */

/** @returns {DayStop[]} */
function buildGenericStops(character, country, day1Based) {
  const dayOffset = getDayInCountryVisit(day1Based) % 3
  const loc = country.name
  const ko = country.nameKo || loc
  if (character === 'sua') {
    return [
      {
        place: `landmark in ${loc}`,
        placeKo: `${ko} 랜드마크`,
        activity: 'morning sightseeing',
        activityKo: '아침 명소 구경',
        expression: 'curious gentle smile looking at scenery, off-camera gaze',
        expressionKo: '풍경 보며 살짝 미소, 카메라 안 봄',
        promptScene: `candid at real landmark in ${loc} day${dayOffset + 1}, morning natural light`,
      },
      {
        place: `local cafe district ${dayOffset + 1} in ${loc}`,
        placeKo: `${ko} 맛집 카페`,
        activity: 'local lunch',
        activityKo: '현지 맛집 점심',
        expression: 'bright laugh while eating, candid unposed',
        expressionKo: '식사하다 크게 웃는 표정',
        promptScene: `real cafe in ${loc}, local food on table, window light`,
      },
      {
        place: `shopping street in ${loc}`,
        placeKo: `${ko} 거리`,
        activity: 'afternoon walk and photos',
        activityKo: '오후 거리 산책',
        expression: 'thoughtful side glance while walking, different from smile',
        expressionKo: '걸으며 옆을 보는 생각하는 표정',
        promptScene: `real shopping street in ${loc}, golden hour`,
      },
      {
        place: `night view in ${loc}`,
        placeKo: `${ko} 야경`,
        activity: 'evening viewpoint',
        activityKo: '저녁 야경 보기',
        expression: 'calm relaxed subtle smile, peaceful end of day',
        expressionKo: '야경 보며 편안한 미소',
        promptScene: `rooftop or river night view in ${loc}, ambient city lights`,
      },
    ]
  }
  const bases = [
    {
      place: `landmark in ${loc}`,
      activity: 'morning explore',
      expression: 'curious soft smile looking away from camera at scenery',
      promptScene: `candid at real landmark in ${loc}, morning natural light full body`,
    },
    {
      place: `restaurant in ${loc}`,
      activity: 'lunch with a new friend',
      expression: 'open-mouth laugh mid-conversation, different face muscles than photo 1',
      promptScene: `real restaurant in ${loc}, casual lunch seated medium-wide`,
    },
    {
      place: `street in ${loc}`,
      activity: 'afternoon exploring',
      expression: 'serious focused look at street detail, no smile',
      promptScene: `exploring real street in ${loc}, golden hour full body walking`,
    },
    {
      place: `night viewpoint in ${loc}`,
      activity: 'evening skyline',
      expression: 'relaxed half-smile, tired content expression, distinct from earlier shots',
      promptScene: `evening viewpoint in ${loc}, low angle hero shot tall silhouette`,
    },
  ]
  return bases
}

/** @returns {DayStop[]} */
export function getDayStops(character, country, day1Based = 1) {
  const variant = getItineraryVariant(character, country.code, day1Based)
  if (variant?.stops?.length) return variant.stops
  return buildGenericStops(character, country, day1Based)
}

/** @returns {string|null} */
export function getDayTheme(character, country, day1Based) {
  const variant = getItineraryVariant(character, country.code, day1Based)
  if (!variant) return null
  return character === 'sua' ? variant.themeKo || null : variant.themeEn || null
}

function formatSuaDiaryCaption(country, stops, day1Based) {
  const visit = country.visitNumber
  const theme = getDayTheme('sua', country, day1Based)
  const tags = `${BRAND.hashtags} ${ACCOUNT_PERSONA.sua.hashtagsExtra} #${country.name.replace(/\s/g, '')} ${visit}/100`
  const lines = stops.map((s, i) => {
    const where = s.placeKo || s.place
    const what = s.activityKo || s.activity
    return `${i + 1}. ${where} — ${what}`
  })
  const themeLine = theme ? `오늘 테마: ${theme}\n` : ''
  const deepLink = buildChallengeDeepLink(country.code)
  return (
    `오늘 ${country.nameKo}에서 ${visit}/100 일차 ✈️\n` +
    themeLine +
    `같은 OOTD로 하루 종일 돌았어요 — 사진마다 표정은 조금씩 달라요.\n\n` +
    `📍 오늘 한 일\n${lines.join('\n')}\n\n` +
    `👉 오늘의 퀘스트 인증하기\n${deepLink}\n\n` +
    `${tags}`
  )
}

/** 이든 전용 — 수아와 다른 캡션 스타일 (day1Based 로 로테이션) */
function formatEthanCaption(day1Based, country, stops) {
  const visit = country.visitNumber
  const loc = country.name
  const locTag = loc.replace(/\s/g, '')
  const tags = `${BRAND.hashtags} ${ACCOUNT_PERSONA.ethan.hashtagsExtra} #${locTag} ${visit}/100`
  const theme = getDayTheme('ethan', country, day1Based)
  const themeBit = theme ? ` (${theme})` : ''

  /** @type {((visit: number, loc: string, stops: DayStop[], tags: string, themeBit: string) => string)[]} */
  const styles = [
    // 0 — 내러티브 단락 (Day 1 US 등)
    (v, l, st, t, th) => {
      const [a, b, c, d] = st
      return (
        `okay so country ${v}/100 is ${l}${th} and I’m not gonna lie — today was a lot.\n\n` +
        `Caught ${a.place} before the crowds (slide 1 is the “I’m awake but not ready” face). ` +
        `${b.place} turned into a two-hour burger debate with a hostel guy I literally met yesterday — slide 2 is me losing that argument on purpose.\n\n` +
        `Golden hour in ${c.place} hit different. Finished at ${d.place} watching the skyline go dark — same outfit all day because I pack like a goblin.\n\n` +
        `I’m logging the list in bio if you want your own map. no idea what country 2 is yet.\n\n${t}`
      )
    },
    // 1 — 대시 불릿 (번호 없음)
    (v, l, st, t, th) => {
      const bullets = st.map((s) => `→ ${s.place} — ${s.activity}`).join('\n')
      return (
        `Notes from ${l}${th} · stop ${v} of 100\n\n` +
        `${bullets}\n\n` +
        `One fit. Four spots. Zero plan.\n` +
        `Link in bio if you’re building a list too.\n\n${t}`
      )
    },
    // 2 — 짧은 훅 + 한 줄씩
    (v, l, st, t, th) => {
      const lines = st.map((s) => `${s.place}: ${s.activity}.`).join(' ')
      return (
        `Stop ${v}/100: ${l}${th} ✈️\n\n` +
        `${lines}\n\n` +
        `Still wearing the same jacket in every photo. Not sorry.\n` +
        `mytripfy in bio — your list, your rules.\n\n${t}`
      )
    },
    // 3 — 대화체 Q&A 느낌
    (v, l, st, t, th) => {
      const [a, b, c, d] = st
      return (
        `“Where were you today?”${th}\n` +
        `${a.place}. Then ${b.place}. Then ${c.place}. Then ${d.place}.\n\n` +
        `“Same outfit?”\nYeah. ${v}/100 doesn’t leave time for wardrobe changes.\n\n` +
        `Bio has the app I’m using for the country list.\n\n${t}`
      )
    },
    // 4 — 미니 블로그
    (v, l, st, t, th) => {
      return (
        `${l}${th} — day ${v} of the year-long sprint.\n\n` +
        `Morning: ${st[0].place}. Lunch: ${st[1].place}. Afternoon: ${st[2].place}. Night: ${st[3].place}.\n` +
        `Swipe for four faces — same clothes, different energy.\n\n` +
        `If you want a running list of countries, check the link. I’m not your tour guide, just documenting.\n\n${t}`
      )
    },
    // 5 — 한 줄 훅 + 불릿 •
    (v, l, st, t, th) => {
      const bullets = st.map((s) => `• ${s.place} (${s.activity})`).join('\n')
      return (
        `${l}${th} in four frames.\n\n${bullets}\n\n` +
        `Outfit repeat offender. Challenge count: ${v}/100.\n` +
        `App in bio for list nerds.\n\n${t}`
      )
    },
    // 6 — 편지/저널
    (v, l, st, t, th) => {
      const [a, b, c, d] = st
      return (
        `Dear future me — ${l}${th} was country number ${v}.\n\n` +
        `You started at ${a.place}, ate at ${b.place}, got lost in ${c.place}, and ended on ${d.place}.\n` +
        `You looked tired in photo 4. Worth it.\n\n` +
        `P.S. mytripfy link in bio if you forget why we’re doing this.\n\n${t}`
      )
    },
    // 7 — 캡션 짧게 (인스타 짧은 캡션 유저)
    (v, l, st, t, th) => {
      const places = st.map((s) => s.place.split(' ')[0]).join(' → ')
      return (
        `${places}.\n${v}/100 · ${l}${th}\n\n` +
        `same jacket. four moods. link in bio.\n\n${t}`
      )
    },
    // 8 — 리스트 없이 흐름
    (v, l, st, t, th) => {
      const [a, b, c, d] = st
      return (
        `Spent all day in ${l}${th} — ${a.place} at sunrise, burgers at ${b.place}, ` +
        `${c.place} when the light went gold, ${d.place} after dark. ` +
        `${v} down, 99 to go. List lives in bio.\n\n${t}`
      )
    },
    // 9 — 유머 각
    (v, l, st, t, th) => {
      const [a, b, c, d] = st
      return (
        `Rating ${l}${th} (${v}/100):\n` +
        `${a.place} 9/10\n${b.place} 10/10 (burger bias)\n${c.place} 8/10\n${d.place} 11/10 (skyline cheat code)\n\n` +
        `Wardrobe: unchanged. Regrets: none.\nmytripfy — bio.\n\n${t}`
      )
    },
  ]

  /** 일정 변형마다 다른 캡션 형식 (22일·23일 동일 문구 방지) */
  const CAPTION_STYLE_BY_VARIANT = [0, 3, 9, 6]
  const variantIdx = pickVariantIndex('ethan', country.code, day1Based)
  const idx = CAPTION_STYLE_BY_VARIANT[variantIdx % CAPTION_STYLE_BY_VARIANT.length]
  const body = styles[idx](visit, loc, stops, tags, themeBit)
  const deepLink = buildChallengeDeepLink(country.code)
  return `${body.replace(/\n\n${tags}$/, '')}\n\n👉 Stamp today's quest\n${deepLink}\n\n${tags}`
}

export function getSuaCaption(day1Based, country) {
  return formatSuaDiaryCaption(country, getDayStops('sua', country, day1Based), day1Based)
}

export function getEthanCaption(day1Based, country) {
  return formatEthanCaption(day1Based, country, getDayStops('ethan', country, day1Based))
}

function outfitWeatherSuffix(outfit) {
  return typeof outfit === 'object' && outfit.weatherContextEn ? `, ${outfit.weatherContextEn}` : ''
}

export function buildSuaImagePrompts(day1Based, country, outfit) {
  const subject = getSubjectBlock('sua')
  const lock = typeof outfit === 'string' ? outfit : outfit.promptLock
  const weather = outfitWeatherSuffix(outfit)
  const carryUmbrella = outfit?.weather?.carryUmbrella === true
  const umbrellaNote = carryUmbrella
    ? ''
    : ', CRITICAL no umbrella in photo — empty hands, no rain accessory visible'
  const stops = getDayStops('sua', country, day1Based)
  return stops.map((stop, i) => {
    let pose = stop.pose || getSuaPosePreset(i, carryUmbrella)
    if (!carryUmbrella) pose = stripUmbrellaFromPose(pose)
    return wrapTravelPhotoPrompt(
      `${subject}, ${lock}, distinct facial expression: ${stop.expression}, body pose (unique this slide): ${pose}, ${stop.promptScene}${weather}${umbrellaNote}`
    )
  })
}

export function buildEthanImagePrompts(day1Based, country, outfit) {
  const subject = getSubjectBlock('ethan')
  const lock = typeof outfit === 'string' ? outfit : outfit.promptLock
  const weather = outfitWeatherSuffix(outfit)
  const carryUmbrella = outfit?.weather?.carryUmbrella === true
  const umbrellaNote = carryUmbrella
    ? ''
    : ', CRITICAL no umbrella in photo — empty hands, no rain accessory visible'
  const stops = getDayStops('ethan', country, day1Based)
  return stops.map((stop, i) => {
    let pose = stop.pose || getEthanPosePreset(i, carryUmbrella)
    if (!carryUmbrella) pose = stripUmbrellaFromPose(pose)
    return wrapTravelPhotoPrompt(
      `${subject}, ${lock}, distinct facial expression: ${stop.expression}, body pose (unique this slide): ${pose}, ${stop.promptScene}${weather}${umbrellaNote}`
    )
  })
}

export function buildReelsScript(character, day1Based, country) {
  const visit = country.visitNumber
  const isSua = character === 'sua'
  const name = isSua ? country.nameKo : country.name
  return {
    hook: isSua
      ? `Day ${visit} — ${name}에서의 하루 🇰🇷`
      : `Day ${visit} — Life in ${name} 🌍`,
    voiceover: isSua
      ? `오늘은 ${name}, ${visit}번째 나라예요. ${getDayStops('sua', country, day1Based)
          .map((s) => s.placeKo || s.place)
          .join(', ')} 돌았어요. 100개국 챌린지는 mytripfy에서 같이해요.`
      : `Alright — stop ${visit}: ${name}. ${getDayStops('ethan', country, day1Based)[0].place} to ${getDayStops('ethan', country, day1Based)[3].place}. I'm keeping score in the app — link in bio.`,
    onScreenText: isSua
      ? `${visit}/100 · ${name}\n#mytripfy`
      : `${visit}/100 · ${name}\n#100CountriesChallenge`,
    suggestPostDays: [1, 4], // Mon=1, Thu=4 in JS getDay: use day1Based % 7
    isReelsDay: day1Based % 7 === 1 || day1Based % 7 === 4,
    isStoryDay: day1Based % 7 === 3,
  }
}

export function getStoryPrompts(character, day1Based, country) {
  const isSua = character === 'sua'
  const name = isSua ? country.nameKo : country.name
  const face = isSua ? ACCOUNTS.sua.faceBlock : ACCOUNTS.ethan.faceBlock
  return [
    wrapTravelPhotoPrompt(`${face}, vertical story crop, real ${name} street background, casual selfie vibe`),
    wrapTravelPhotoPrompt(`real close-up of local food on table in ${name}, hands only, travel blogger photo`),
    wrapTravelPhotoPrompt(`real street scene in ${name}, empty space for text overlay, natural daylight`),
  ]
}

export function parseContentArgs(argv) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let date = new Date(today)
  let start = new Date(today)
  let days = 1
  let skipImages = false
  const envStart = process.env.SNS_CAMPAIGN_START
  if (envStart) {
    start = new Date(envStart)
    start.setHours(0, 0, 0, 0)
  }
  for (const a of argv) {
    if (a.startsWith('--date=')) date = new Date(a.slice(7))
    if (a.startsWith('--start=')) start = new Date(a.slice(8))
    if (a.startsWith('--days=')) days = Math.max(1, parseInt(a.slice(7), 10) || 1)
    if (a === '--no-images') skipImages = true
  }
  date.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  return { date, start, days, skipImages }
}

export function dayIndexFromStart(date, start) {
  const d = new Date(date)
  const s = new Date(start)
  d.setHours(0, 0, 0, 0)
  s.setHours(0, 0, 0, 0)
  return Math.floor((d - s) / (24 * 60 * 60 * 1000)) + 1
}

function toLocalDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function formatDayBundle(day1Based, date) {
  const { clearOutfitPickMemo } = await import('./sns-daily-rotation.mjs')
  const { clearVariantPickMemo } = await import('./sns-day-itineraries.mjs')
  clearOutfitPickMemo()
  clearVariantPickMemo()
  const dateStr = toLocalDateStr(date)
  const suaCountry = getSuaCountry(day1Based)
  const ethanCountry = getEthanCountry(day1Based)
  const suaStops = getDayStops('sua', suaCountry, day1Based)
  const ethanStops = getDayStops('ethan', ethanCountry, day1Based)
  const suaCity = resolveCity('sua', suaCountry.code, suaStops)
  const ethanCity = resolveCity('ethan', ethanCountry.code, ethanStops)
  const [suaWeather, ethanWeather] = await Promise.all([
    fetchCityWeather(suaCity, dateStr),
    fetchCityWeather(ethanCity, dateStr),
  ])
  const suaOutfit = applyWeatherToOutfit('sua', getDayOutfit('sua', day1Based), suaWeather, day1Based)
  const ethanOutfit = applyWeatherToOutfit('ethan', getDayOutfit('ethan', day1Based), ethanWeather, day1Based)
  const suaCaption = getSuaCaption(day1Based, suaCountry)
  const ethanCaption = getEthanCaption(day1Based, ethanCountry)
  const suaPrompts = buildSuaImagePrompts(day1Based, suaCountry, suaOutfit)
  const ethanPrompts = buildEthanImagePrompts(day1Based, ethanCountry, ethanOutfit)
  const suaReels = buildReelsScript('sua', day1Based, suaCountry)
  const ethanReels = buildReelsScript('ethan', day1Based, ethanCountry)

  const suaTxt = formatCharacterTxt('sua', day1Based, suaCountry, suaOutfit, suaCaption, suaPrompts, suaReels, suaStops, suaWeather)
  const ethanTxt = formatCharacterTxt('ethan', day1Based, ethanCountry, ethanOutfit, ethanCaption, ethanPrompts, ethanReels, ethanStops, ethanWeather)

  return {
    dateStr,
    day1Based,
    suaCountry,
    ethanCountry,
    suaWeather,
    ethanWeather,
    suaCaption,
    ethanCaption,
    suaPrompts,
    ethanPrompts,
    suaStops,
    ethanStops,
    suaOutfit,
    ethanOutfit,
    suaTxt,
    ethanTxt,
    meta: {
      sua: { country: suaCountry, reels: suaReels, stops: suaStops, outfit: suaOutfit, weather: suaWeather },
      ethan: { country: ethanCountry, reels: ethanReels, stops: ethanStops, outfit: ethanOutfit, weather: ethanWeather },
    },
  }
}

function formatCharacterTxt(character, day1Based, country, outfit, caption, prompts, reels, stops, weather) {
  const lines = []
  const o = typeof outfit === 'object' && outfit.promptLock ? outfit : getDayOutfit(character, day1Based)
  if (weather) {
    lines.push(formatWeatherTxt(character, weather))
    lines.push('')
  }
  lines.push(formatOutfitTxt(character, o))
  lines.push('')
  const theme = getDayTheme(character, country, day1Based)
  lines.push(
    character === 'sua' ? '[오늘 한 일 · 사진 4장과 매칭]' : '[Slide map · photo 1→4, not the post caption]'
  )
  if (theme) {
    lines.push(character === 'sua' ? `테마: ${theme}` : `Theme: ${theme}`)
  }
  stops.forEach((s, i) => {
    const where = character === 'sua' ? s.placeKo || s.place : s.place
    const what = character === 'sua' ? s.activityKo || s.activity : s.activity
    const expr =
      character === 'sua'
        ? `표정: ${s.expressionKo || s.expression}`
        : `Expression: ${s.expression}`
    lines.push(`${i + 1}. ${where} — ${what}`)
    lines.push(`   ${expr}`)
    if (s.pose) {
      lines.push(character === 'sua' ? `   포즈: ${s.poseKo || s.pose}` : `   Pose: ${s.pose}`)
    }
  })
  lines.push('')
  lines.push(character === 'sua' ? '[캡션 · 한 포스트에 그대로 사용]' : '[Caption · use as single post]')
  lines.push(caption)
  lines.push('')
  lines.push('[이미지 4장 순서대로 → 캐러셀]')
  prompts.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
  lines.push('')
  lines.push('[Reels · 월/목 권장]')
  lines.push('hook: ' + reels.hook)
  lines.push('voiceover: ' + reels.voiceover)
  lines.push('on-screen-text: ' + reels.onScreenText)
  if (reels.isStoryDay) {
    lines.push('')
    lines.push('[Story · 수요일 권장]')
    getStoryPrompts(character, day1Based, country).forEach((p, i) => lines.push(`${i + 1}. ${p}`))
  }
  lines.push('')
  lines.push(formatStoryCtaBlock(character, country))
  return lines.join('\n')
}
