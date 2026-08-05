import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ROTATION_POLICY } from './sns-rotation-policy.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_OUT_DIR = path.join(__dirname, '..', 'out')

function getCampaignStartDate() {
  const env = process.env.SNS_CAMPAIGN_START
  const d = env ? new Date(env) : new Date('2026-05-22')
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStrForCampaignDay(day1Based) {
  const d = getCampaignStartDate()
  d.setDate(d.getDate() + day1Based - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @param {DayItineraryVariant[]} list @param {string} themeLine */
function variantIndexFromThemeLine(list, themeLine) {
  const t = themeLine.trim()
  return list.findIndex((v) => v.themeKo === t || v.themeEn === t)
}

/** @param {'sua'|'ethan'} character @param {string} dateStr */
function loadThemeFromTxt(character, dateStr) {
  const outDir = process.env.SNS_OUT_DIR || DEFAULT_OUT_DIR
  const txtPath = path.join(outDir, dateStr, `${character}.txt`)
  if (!fs.existsSync(txtPath)) return null
  try {
    const txt = fs.readFileSync(txtPath, 'utf8')
    const m = txt.match(/^(?:테마|Theme):\s*(.+)$/m)
    return m?.[1]?.trim() || null
  } catch {
    return null
  }
}

/**
 * scripts/out meta에 기록된 최근 테마(전날 우선) variant 인덱스
 * @param {'sua'|'ethan'} character
 * @param {string} countryCode
 * @param {number} day1Based
 */
export function loadPublishedVariantAvoid(character, countryCode, day1Based) {
  const avoid = new Set()
  const list = ITINERARY_VARIANTS[countryCode]?.[character]
  if (!list?.length) return avoid
  const outDir = process.env.SNS_OUT_DIR || DEFAULT_OUT_DIR
  for (let offset = 1; offset <= ROTATION_POLICY.ITINERARY_SHORT_TERM_AVOID_DAYS; offset++) {
    const prevDay = day1Based - offset
    if (prevDay < 1) break
    const metaPath = path.join(outDir, dateStrForCampaignDay(prevDay), 'meta.json')
    if (!fs.existsSync(metaPath)) continue
    let themeLine = null
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      const caption = meta[character]?.caption || ''
      const themeMatch = caption.match(/(?:테마|Theme):\s*(.+)/m)
      themeLine = themeMatch?.[1]?.trim() || null
    } catch {
      /* ignore */
    }
    if (!themeLine) themeLine = loadThemeFromTxt(character, dateStrForCampaignDay(prevDay))
    if (!themeLine) continue
    const idx = variantIndexFromThemeLine(list, themeLine)
    if (idx >= 0) avoid.add(idx)
  }
  return avoid
}

/**
 * 국가 체류 일차마다 다른 장소·테마 (같은 국가·연속 날짜도 반복 금지)
 * @typedef {import('./sns-campaign-config.mjs').DayStop} DayStop
 * @typedef {{ themeKo?: string, themeEn?: string, stops: DayStop[] }} DayItineraryVariant
 */

/** @type {Record<string, { sua?: DayItineraryVariant[], ethan?: DayItineraryVariant[] }>} */
export const ITINERARY_VARIANTS = {
  KR: {
    sua: [
      {
        themeKo: '궁궐·한옥 클래식',
        stops: [
          {
            place: 'Gyeongbokgung Palace',
            placeKo: '경복궁',
            activity: 'morning palace walk and photos',
            activityKo: '아침 경복궁 산책·사진',
            expression: 'soft curious smile looking up at architecture, not at camera',
            expressionKo: '궁궐 올려다보며 살짝 미소, 카메라 안 봄',
            promptScene: 'Gyeongbokgung Palace Seoul morning overcast tourists blur',
          },
          {
            place: 'Ikseon-dong hanok cafe',
            placeKo: '익선동 한옥 카페',
            activity: 'bibimbap lunch and coffee',
            activityKo: '비빔밥 점심·카페',
            expression: 'genuine open-mouth laugh mid-conversation with friend',
            expressionKo: '친구랑 수다 중 크게 웃음',
            promptScene: 'Seoul hanok cafe Korean food on table window light',
          },
          {
            place: 'Myeongdong',
            placeKo: '명동',
            activity: 'golden hour shopping street',
            activityKo: '명동 쇼핑·거리 구경',
            expression: 'thoughtful side glance at shop signs, neutral lips',
            expressionKo: '간판 보며 옆얼굴',
            promptScene: 'Myeongdong Seoul golden hour crowd motion blur',
          },
          {
            place: 'Han River park',
            placeKo: '한강 공원',
            activity: 'sunset river walk',
            activityKo: '한강 노을 산책',
            expression: 'relaxed closed-lip smile, tired happy end-of-day eyes',
            expressionKo: '노을 보며 편안한 미소',
            promptScene: 'Han River Seoul dusk wind in hair skyline',
          },
        ],
      },
      {
        themeKo: '전통시장·홍대 K-스트릿',
        stops: [
          {
            place: 'Bukchon Hanok Village',
            placeKo: '북촌 한옥마을',
            activity: 'morning alley walk between hanok roofs',
            activityKo: '북촌 골목 아침 산책',
            expression: 'gentle smile looking down the alley, off-camera',
            expressionKo: '골목 끝 보며 미소',
            promptScene: 'Bukchon Hanok Village Seoul morning narrow alley tourists distant',
          },
          {
            place: 'Gwangjang Market',
            placeKo: '광장시장',
            activity: 'bindaetteok and street food lunch',
            activityKo: '광장시장 빈대떡·길거리 음식 점심',
            expression: 'surprised delighted look at food, mouth slightly open',
            expressionKo: '음식 보고 놀란 듯한 표정',
            promptScene: 'Gwangjang Market Seoul food stalls bindaetteok on plate candid',
          },
          {
            place: 'Hongdae',
            placeKo: '홍대',
            activity: 'afternoon indie shops and busking street',
            activityKo: '홍대 인디샵·버스킹 거리',
            expression: 'amused half-smile watching street performer',
            expressionKo: '버스킹 보며 웃는 반쯤 미소',
            promptScene: 'Hongdae Seoul afternoon colorful shops street performer blur',
          },
          {
            place: 'DDP Dongdaemun Design Plaza',
            placeKo: '동대문 DDP',
            activity: 'night LED garden and futuristic plaza',
            activityKo: 'DDP 야경·LED 정원',
            expression: 'calm awe looking up at curved silver building',
            expressionKo: '건물 올려다보며 감탄',
            promptScene: 'Dongdaemun Design Plaza Seoul night LED lights futuristic architecture',
          },
        ],
      },
      {
        themeKo: '힙지구·한강 야경',
        stops: [
          {
            place: 'Seongsu-dong cafe street',
            placeKo: '성수동 카페거리',
            activity: 'specialty coffee and converted factory cafes',
            activityKo: '성수동 카페 투어',
            expression: 'focused look reading menu board sideways',
            expressionKo: '메뉴판 읽으며 옆얼굴',
            promptScene: 'Seongsu-dong Seoul industrial cafe exterior morning',
          },
          {
            place: 'Jogyesa Temple area lunch',
            placeKo: '조계사 근처 점심',
            activity: 'temple lunch vegan Korean set',
            activityKo: '사찰음식 스타일 점심',
            expression: 'peaceful small smile hands around bowl',
            expressionKo: '작은 미소로 식사',
            promptScene: 'near Jogyesa Seoul quiet restaurant Korean temple-style lunch',
          },
          {
            place: 'Itaewon world food street',
            placeKo: '이태원',
            activity: 'international dinner street explore',
            activityKo: '이태원 세계음식 거리 저녁',
            expression: 'confident walk looking ahead slight smirk',
            expressionKo: '앞보며 걷는 자신감',
            promptScene: 'Itaewon Seoul evening neon signs international restaurants',
          },
          {
            place: 'Banpo Bridge rainbow fountain',
            placeKo: '반포대교 무지개분수',
            activity: 'night river fountain show',
            activityKo: '반포 무지개분수 야경',
            expression: 'relaxed laugh watching water lights',
            expressionKo: '분수 보며 웃음',
            promptScene: 'Banpo Bridge Seoul night rainbow fountain Han River',
          },
        ],
      },
    ],
  },
  US: {
    ethan: [
      {
        themeEn: 'bridges · downtown · rooftop',
        stops: [
          {
            place: 'Brooklyn Bridge',
            activity: 'sunrise walk and first NYC photos',
            expression: 'soft curious smile at bridge cables, not at camera',
            pose: 'hands in jacket pockets looking at bridge cables, 3/4 side FULL BODY tall man long legs',
            promptScene: 'Brooklyn Bridge NYC morning overcast full-length framing',
          },
          {
            place: 'Greenwich Village diner',
            activity: 'burgers with a hostel friend',
            expression: 'open-mouth laugh mid-joke eyes squinting',
            pose: 'slouched in diner booth one arm on table other holding burger, medium-wide shot',
            promptScene: 'NYC diner booth burgers casual friend partial frame',
          },
          {
            place: 'SoHo',
            activity: 'golden hour boutique street',
            expression: 'thoughtful side glance at boutique window',
            pose: 'walking past storefront mid-step looking at window, full body street shot',
            promptScene: 'SoHo NYC golden hour street',
          },
          {
            place: 'Manhattan rooftop bar',
            activity: 'skyline at blue hour',
            expression: 'relaxed half-smile tired content',
            pose: 'leaning on rooftop railing back to camera looking at skyline, silhouette long legs',
            promptScene: 'Manhattan rooftop bar night skyline bokeh',
          },
        ],
      },
      {
        themeEn: 'parks · markets · Times Square',
        stops: [
          {
            place: 'Central Park',
            activity: 'morning jog path and Bethesda Terrace',
            expression: 'fresh awake soft smile looking at trees',
            pose: 'one foot on terrace step hand on hip holding water bottle, 3/4 front FULL BODY head to shoes showing long legs tall man',
            promptScene:
              'Central Park Bethesda Terrace NYC morning greenery, full-length framing not waist crop',
          },
          {
            place: 'Chelsea Market',
            activity: 'lobster roll and indoor food hall lunch',
            expression: 'happy bite mid-eat candid laugh',
            pose: 'seated on high stool leaning forward elbows on table eating, legs and boots visible under table NOT cropped at chest',
            promptScene: 'Chelsea Market NYC indoor food hall lobster roll, seated medium-wide shot',
          },
          {
            place: 'The High Line',
            activity: 'afternoon elevated park walk',
            expression: 'serious profile looking at Hudson River',
            pose: 'walking mid-stride away from camera one hand in pocket messenger bag, over-shoulder 3/4 back view TALL silhouette long legs',
            promptScene: 'The High Line NYC afternoon Hudson River, full body walking shot from behind',
          },
          {
            place: 'Times Square',
            activity: 'night neon and crowd energy',
            expression: 'overwhelmed amused smile at billboards',
            pose: 'leaning shoulder on building column arms crossed looking up at neon, LOW ANGLE camera from knees up emphasizing 6ft2 height',
            promptScene: 'Times Square NYC night neon billboards, hero low-angle full torso and legs',
          },
        ],
      },
      {
        themeEn: 'harbor · deli · street art',
        stops: [
          {
            place: 'Statue of Liberty ferry view',
            activity: 'morning harbor cruise photo',
            expression: 'wind-blown curious look at statue',
            promptScene: 'Statue of Liberty from ferry NYC morning harbor',
          },
          {
            place: 'Katz Delicatessen',
            activity: 'pastrami sandwich lunch',
            expression: 'big grin holding huge sandwich',
            promptScene: 'Katz Deli NYC pastrami sandwich table classic interior',
          },
          {
            place: 'Williamsburg street art',
            activity: 'afternoon mural hunting',
            expression: 'cool neutral face examining mural',
            promptScene: 'Williamsburg Brooklyn street art mural golden hour',
          },
          {
            place: 'Top of the Rock',
            activity: 'sunset Empire State view',
            expression: 'quiet impressed smile at skyline',
            promptScene: 'Top of the Rock observation deck NYC sunset Empire State Building',
          },
        ],
      },
    ],
  },
  JP: {
    sua: [
      {
        themeKo: '도쿄 첫날 · 신주쿠·시부야',
        stops: [
          {
            place: 'Senso-ji Asakusa',
            placeKo: '센소지 아사쿠사',
            activity: 'morning temple and nakamise street',
            activityKo: '아사쿠사 절·나카미세',
            expression: 'curious smile at temple lantern',
            expressionKo: '등 보고 미소',
            promptScene: 'Senso-ji Asakusa Tokyo morning temple lantern',
          },
          {
            place: 'Tsukiji Outer Market',
            placeKo: '츠키지 외곽 시장',
            activity: 'sushi breakfast bowl',
            activityKo: '스시·해산물 아침',
            expression: 'delighted look at fresh sushi',
            expressionKo: '스시 보고 만족',
            promptScene: 'Tsukiji Outer Market Tokyo sushi breakfast stall',
          },
          {
            place: 'Shibuya Crossing',
            placeKo: '시부야 스크램블',
            activity: 'afternoon scramble crossing',
            activityKo: '시부야 횡단보도',
            expression: 'focused mid-crossing glance upward',
            expressionKo: '건널 때 위 보는 표정',
            promptScene: 'Shibuya Crossing Tokyo afternoon crowds neon',
          },
          {
            place: 'Shinjuku Omoide Yokocho',
            placeKo: '신주쿠 골목 이자카야',
            activity: 'night yakitori alley',
            activityKo: '야키토리 골목 야식',
            expression: 'warm laugh with beer in hand',
            expressionKo: '맥주 들고 웃음',
            promptScene: 'Omoide Yokocho Shinjuku Tokyo night yakitori lanterns',
          },
        ],
      },
      {
        themeKo: '하라주쿠·메이지 · 오모테산도',
        stops: [
          {
            place: 'Meiji Shrine',
            placeKo: '메이지 신궁',
            activity: 'morning forest shrine walk',
            activityKo: '신궁 숲길 아침 산책',
            expression: 'peaceful soft smile under torii gate',
            expressionKo: '도리이 아래 고요한 미소',
            promptScene: 'Meiji Shrine Tokyo morning torii forest path overcast',
          },
          {
            place: 'Takeshita Street Harajuku',
            placeKo: '하라주쿠 다케시타',
            activity: 'crepes and colorful street fashion',
            activityKo: '크레페·거리 패션',
            expression: 'amused grin at quirky shop signs',
            expressionKo: '간판 보며 웃음',
            promptScene: 'Takeshita Street Harajuku Tokyo afternoon colorful signs',
          },
          {
            place: 'Omotesando',
            placeKo: '오모테산도',
            activity: 'designer boulevard afternoon walk',
            activityKo: '오후 명품 거리 산책',
            expression: 'thoughtful profile looking at architecture',
            expressionKo: '건축물 옆얼굴',
            promptScene: 'Omotesando Tokyo tree-lined boulevard afternoon',
          },
          {
            place: 'Tokyo Tower night view',
            placeKo: '도쿄 타워 야경',
            activity: 'classic tower night photo spot',
            activityKo: '도쿄 타워 야경 포인트',
            expression: 'calm awe looking up at lit tower',
            expressionKo: '타워 올려다보며 감탄',
            promptScene: 'Tokyo Tower night illuminated classic viewpoint Shiba',
          },
        ],
      },
      {
        themeKo: '팀랩·스카이트리 · 긴자',
        stops: [
          {
            place: 'teamLab Planets',
            placeKo: 'teamLab 플래닛',
            activity: 'immersive digital art morning',
            activityKo: '아침 몰입형 전시',
            expression: 'wide-eyed wonder at light installation',
            expressionKo: '빛 설치 보며 감탄',
            promptScene: 'teamLab Planets Tokyo immersive mirror room soft light',
          },
          {
            place: 'Tokyo Skytree',
            placeKo: '도쿄 스카이트리',
            activity: 'lunch view from Solamachi',
            activityKo: '솔라마치 점심·전망',
            expression: 'happy bite mid-meal candid',
            expressionKo: '식사 중 자연스러운 웃음',
            promptScene: 'Tokyo Skytree base Solamachi Tokyo lunch area daytime',
          },
          {
            place: 'Ueno Park',
            placeKo: '우에노 공원',
            activity: 'afternoon museum district stroll',
            activityKo: '박물관가 오후 산책',
            expression: 'gentle smile watching street musician',
            expressionKo: '거리 연주 들으며 미소',
            promptScene: 'Ueno Park Tokyo afternoon pond and museum district',
          },
          {
            place: 'Ginza night',
            placeKo: '긴자 야경',
            activity: 'neon luxury shopping street evening',
            activityKo: '긴자 네온·쇼핑 거리 저녁',
            expression: 'relaxed closed-lip smile end of day',
            expressionKo: '하루 마무리 편안한 미소',
            promptScene: 'Ginza Tokyo night neon luxury storefronts',
          },
        ],
      },
      {
        themeKo: '오다이바·아키하바라 · 롯폰기',
        stops: [
          {
            place: 'Odaiba Seaside Park',
            placeKo: '오다이바 해변공원',
            activity: 'morning Rainbow Bridge and bay walk',
            activityKo: '레인보우 브릿지·만 조망 산책',
            expression: 'wind-blown soft smile looking at bridge',
            expressionKo: '바람 맞으며 다리 바라보며 미소',
            promptScene:
              'Odaiba Seaside Park Tokyo morning Rainbow Bridge Statue of Liberty replica bay skyline',
          },
          {
            place: 'Akihabara Electric Town',
            placeKo: '아키하바라 전자상가',
            activity: 'afternoon neon arcade and gadget street',
            activityKo: '네온·전자상가 거리 구경',
            expression: 'amused grin at giant anime billboard',
            expressionKo: '간판 보며 웃는 표정',
            promptScene: 'Akihabara Tokyo afternoon neon signs electric town crowded street',
          },
          {
            place: 'Roppongi Hills Mori Art',
            placeKo: '롯폰기 힐즈',
            activity: 'sky deck city view golden hour',
            activityKo: '스카이 데크 도심 전망',
            expression: 'thoughtful profile at glass railing skyline',
            expressionKo: '전망대 유리 난간 옆얼굴',
            promptScene: 'Roppongi Hills Tokyo City View observation deck golden hour skyline',
          },
          {
            place: 'Shibuya Sky',
            placeKo: '시부야 스카이',
            activity: 'night open-air rooftop panorama',
            activityKo: '루프탑 야경 파노라마',
            expression: 'calm awe hands on railing at city lights',
            expressionKo: '야경 보며 감탄',
            promptScene: 'Shibuya Sky rooftop Tokyo night 360 city lights open air deck',
          },
        ],
      },
    ],
  },
  CA: {
    ethan: [
      {
        themeEn: 'CN Tower · market · islands',
        stops: [
          {
            place: 'CN Tower',
            activity: 'morning waterfront and tower base',
            expression: 'curious soft smile looking away at skyline',
            pose: 'standing one foot on step one hand in pocket other hand holding folded umbrella, looking at skyline, 3/4 front full body showing long legs, no coffee no drink',
            promptScene: 'CN Tower Toronto waterfront morning overcast full body',
          },
          {
            place: 'St Lawrence Market',
            activity: 'peameal bacon sandwich lunch',
            expression: 'open-mouth laugh mid-conversation',
            pose: 'seated on stool leaning forward elbows on table eating, legs visible under table not cropped at waist',
            promptScene: 'St Lawrence Market Toronto indoor lunch peameal sandwich',
          },
          {
            place: 'Distillery District',
            activity: 'afternoon brick lane walk',
            expression: 'serious focused look at street detail, no smile',
            pose: 'walking mid-stride away from camera one hand in pocket, over-shoulder shot tall silhouette',
            promptScene: 'Distillery District Toronto brick lanes golden hour',
          },
          {
            place: 'Toronto Islands ferry view',
            activity: 'evening skyline from ferry',
            expression: 'relaxed half-smile tired content',
            pose: 'leaning on ferry railing looking at skyline, low angle emphasizing height',
            promptScene: 'Toronto skyline from ferry evening overcast CN Tower silhouette',
          },
        ],
      },
      {
        themeEn: 'ROM · Kensington · High Park',
        stops: [
          {
            place: 'Royal Ontario Museum',
            activity: 'morning crystal museum entrance',
            expression: 'curious soft smile at architecture',
            pose: 'hands in jacket pockets looking up at building, 3/4 side FULL BODY',
            promptScene: 'Royal Ontario Museum Toronto morning crystal facade',
          },
          {
            place: 'Kensington Market',
            activity: 'multicultural street food lunch',
            expression: 'happy bite mid-eat candid laugh',
            pose: 'seated outdoor table leaning forward eating tacos, legs visible',
            promptScene: 'Kensington Market Toronto outdoor lunch colorful murals',
          },
          {
            place: 'High Park',
            activity: 'afternoon cherry blossom path walk',
            expression: 'serious profile looking at trees',
            pose: 'walking mid-stride away from camera messenger bag, over-shoulder tall silhouette',
            promptScene: 'High Park Toronto afternoon greenery walking path',
          },
          {
            place: 'Harbourfront Centre',
            activity: 'night lakefront lights',
            expression: 'overwhelmed amused smile at city lights',
            pose: 'leaning shoulder on railing arms crossed, LOW ANGLE knees up',
            promptScene: 'Harbourfront Centre Toronto night lakefront lights',
          },
        ],
      },
      {
        themeEn: 'Casa Loma · Graffiti Alley · Humber Bay',
        stops: [
          {
            place: 'Casa Loma',
            activity: 'morning castle gardens and turret view',
            expression: 'curious soft smile looking up at stone castle',
            pose: 'standing on garden steps one hand in pocket 3/4 full body tall man',
            promptScene: 'Casa Loma Toronto morning Gothic Revival castle gardens stone facade',
          },
          {
            place: 'Kensington Market (Chinatown edge)',
            activity: 'bubble tea and dumpling lunch street',
            expression: 'happy bite mid-eat candid laugh',
            pose: 'seated outdoor picnic table leaning forward eating dumplings legs visible',
            promptScene: 'Spadina Chinatown Toronto outdoor lunch dumplings bubble tea colorful signs',
          },
          {
            place: 'Graffiti Alley Rush Lane',
            activity: 'afternoon mural photo walk',
            expression: 'cool neutral face examining vibrant mural',
            pose: 'walking mid-stride away from camera one hand in pocket over-shoulder tall silhouette',
            promptScene: 'Graffiti Alley Rush Lane Toronto afternoon vibrant street art murals brick',
          },
          {
            place: 'Humber Bay Arch Bridge',
            activity: 'sunset waterfront arch and skyline',
            expression: 'relaxed half-smile tired content at pink sky',
            pose: 'leaning on bridge railing looking at water low angle emphasizing height',
            promptScene: 'Humber Bay Arch Bridge Toronto sunset pink sky lake reflection skyline distant',
          },
        ],
      },
    ],
  },
}

/**
 * 캠페인 일차(day1Based) 기준 variant — 연속 날짜가 같은 국가여도 다른 코스
 * (체류 N일차만 쓰면 26·27일이 같은 variant로 겹칠 수 있음)
 * @param {'sua'|'ethan'} character @param {string} countryCode @param {number} day1Based
 */
const variantPickMemo = new Map()

export function pickVariantIndex(character, countryCode, day1Based, memo = new Set()) {
  if (memo.has(day1Based)) return 0
  memo.add(day1Based)

  const cacheKey = `${character}:${countryCode}:${day1Based}`
  if (variantPickMemo.has(cacheKey)) return variantPickMemo.get(cacheKey)

  const list = ITINERARY_VARIANTS[countryCode]?.[character]
  if (!list?.length) return 0
  const avoid = loadPublishedVariantAvoid(character, countryCode, day1Based)
  for (let offset = 1; offset <= ROTATION_POLICY.ITINERARY_SHORT_TERM_AVOID_DAYS; offset++) {
    if (day1Based > offset) {
      avoid.add(pickVariantIndex(character, countryCode, day1Based - offset, memo))
    }
  }
  let idx = (day1Based - 1) % list.length
  if (avoid.has(idx)) {
    for (let i = 0; i < list.length; i++) {
      const tryIdx = ((day1Based - 1) + i) % list.length
      if (!avoid.has(tryIdx)) {
        idx = tryIdx
        break
      }
    }
  }
  if (avoid.has(idx)) {
    idx = day1Based % list.length
  }
  // 최근 사용을 피했는데도 겹치면 마지막(신규) variant 우선
  if (avoid.has(idx) && list.length > 1) {
    idx = list.length - 1
  }
  variantPickMemo.set(cacheKey, idx)
  return idx
}

export function clearVariantPickMemo() {
  variantPickMemo.clear()
}

/** @param {'sua'|'ethan'} character @param {string} countryCode @param {number} day1Based */
export function getItineraryVariant(character, countryCode, day1Based) {
  const list = ITINERARY_VARIANTS[countryCode]?.[character]
  if (!list?.length) return null
  return list[pickVariantIndex(character, countryCode, day1Based)]
}
