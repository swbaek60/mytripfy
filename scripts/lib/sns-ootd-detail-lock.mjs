/**
 * 캐러셀 4장 — 단추·벨트·가방·옷 실루엣 동일 고정 (Generate / API)
 */

export const OOTD_HARDWARE_DETAIL_RULE =
  'CRITICAL hardware and accessory detail lock across all 4 carousel slides: identical button color count and placement on garments, identical belt color width and buckle shape, identical bag exact shape size and color, identical jewelry style and metal tone — NEVER vary small details between slides'

export const OOTD_GARMENT_SILHOUETTE_RULE =
  'CRITICAL garment silhouette lock across all 4 slides: same dress or outfit cut length collar sleeve hem and fit — NEVER change dress style between slides (no switching shirt dress to wrap dress or different skirt shape), same wrinkles and fabric drape family'

export const OOTD_BAG_SHAPE_RULE =
  'CRITICAL bag identity lock: exact same bag model in every slide — same roundness handle length weave pattern hardware — never swap tote for crossbody or clutch or different basket size'

/** Generate 시 슬라이드 2~4: slide-1 png를 outfit+bag 레퍼런스로 추가 권장 */
export const CAROUSEL_OUTFIT_REFERENCE_NOTE =
  'When generating slide 2 3 or 4, include slide-1 image as outfit and bag reference — match garment silhouette and bag design exactly to slide 1'

/**
 * @param {import('./sns-ootd-catalog.mjs').DayOutfit} o
 * @returns {{ en: string, ko: string }}
 */
export function buildOutfitDetailLock(o) {
  const sig = [
    ...o.pieces.map((p) => p.item),
    ...o.accessories.map((a) => a.item),
  ].join('|')

  /** @type {Record<string, { en: string, ko: string }>} */
  const PRESETS = {
    'linen shirt dress with belt|leather belt|white sneakers|woven basket bag|gold stud earrings': {
      en:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. HARDWARE DETAIL LOCK (identical all 4 slides): ` +
        'ONE fixed outfit only — knee-length A-line linen shirt dress with soft collar and cuffed short sleeves, light sage green, fitted waist with thin cognac-brown leather belt and small brass rectangular buckle, exactly 7 matte off-white cream shirt buttons down center placket (NOT gold NOT brown NOT black NOT pearl), white low-top sneakers. ' +
        'Bag (same exact prop every slide): round medium natural-tan rattan basket tote approximately 28cm diameter, open top, tight round cylinder silhouette, double short tan leather handles attached at top center only, NO shoulder strap NO crossbody NO clutch NO leather tote alternative, same weave density. ' +
        'Jewelry: small round 6mm gold stud earrings only. NEVER change dress cut or bag type between photos.',
      ko:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. ` +
        '디테일 고정(4장 동일): 무릎 기장 A라인 린넨 셔츠 원피스(소프트 칼라·짧은 커프 소매)·연 sage green·허리 코냅 벨트·황동 사각 버클, 앞단 7개 매트 오프화이트 크림 단추(금·갈·검정 금지), 화이트 로우 스니커즈. ' +
        '가방(모든 컷 동일 소품): 지름 약 28cm 라운드 라탄 바스켓 토트·원통 실루엣·상단 중앙 짧은 탄 가죽 핸들 2개만·숄더끈·크로스바디·클러치 금지. 6mm 골드 스터드. 원피스 핏·가방 모델 슬라이드마다 변경 금지.',
    },
    'cropped soft cardigan|floral midi skirt|nude block heels|gold hoop earrings|small shoulder bag|hair claw clip': {
      en:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. HARDWARE DETAIL LOCK: cropped dusty-rose cardigan open front no buttons, navy floral midi A-line skirt same length, nude block heels same height, 2cm gold hoops, blush-pink structured rectangular shoulder bag same clasp and strap length, tortoiseshell claw clip — identical all 4 slides.`,
      ko:
        '디테일 고정: 더스티로즈 크롭 가디건(단추 없음)·네이비 플로럴 A라인 미디 동일 기장·블러시 핑크 직사각 숄더백(끈·클로저 동일)·토터스 클립 형태 동일. 실루엣·가방 모델 변경 금지.',
    },
    'silk champagne blouse|high-waist pencil skirt|pointed pumps|pearl stud earrings|structured handbag|thin belt': {
      en:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. HARDWARE DETAIL LOCK: champagne silk blouse 5 pearl-white buttons, navy pencil skirt same hem, black pointed pumps, black trapezoid top-handle bag same handles, pearl studs — identical all slides.`,
      ko:
        '디테일 고정: 샴페인 블라우스 단추 5개·네이비 펜슬 동일·블랙 탑핸들 백 형태 동일. 실루엣 변경 금지.',
    },
    'oversized beige knit sweater|wide-leg trousers|white sneakers|leather tote bag|silver stud earrings|simple watch': {
      en:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. HARDWARE DETAIL LOCK: oversized beige knit no buttons, taupe wide-leg trousers same cut, cognac soft rectangular leather tote same handle drop, silver studs, watch unchanged all slides.`,
      ko:
        '디테일 고정: 베이지 니트·와이드 슬랙 핏·코냑 소프트 토트 형태 동일. 변경 금지.',
    },
    'medium wash denim jacket|plain white crew tee|khaki chinos|white sneakers|leather bracelet|black wayfarer sunglasses': {
      en:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. HARDWARE DETAIL LOCK: medium denim trucker jacket 6 antique brass buttons same tone, white crew tee, khaki straight chinos, wayfarer sunglasses same frame, braided bracelet — identical all 4 slides.`,
      ko:
        '디테일 고정: 데님 재킷 황동 단추 6개·웨이페어·브레이슬릿 동일. 실루엣 변경 금지.',
    },
    'camel wool overcoat|navy crewneck sweater|medium blue jeans|brown leather boots|wool scarf|leather gloves': {
      en:
        `${OOTD_GARMENT_SILHOUETTE_RULE}. HARDWARE DETAIL LOCK: camel wool overcoat 3 dark horn buttons, navy plaid scarf same fold, brown gloves — identical all slides.`,
      ko:
        '디테일 고정: 오버코트 혼 단추 3개·머플러·장갑 동일.',
    },
  }

  if (PRESETS[sig]) return PRESETS[sig]

  const acc = o.accessories.map((a) => `${a.item} (${a.colors})`).join(', ')
  return {
    en: `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. ${OOTD_HARDWARE_DETAIL_RULE}. Keep every visible button, buckle, bag shape, and garment cut identical to: ${acc}.`,
    ko: `${OOTD_GARMENT_SILHOUETTE_RULE}. ${OOTD_BAG_SHAPE_RULE}. 단추·버클·가방 형태·옷 실루엣 동일: ${acc}.`,
  }
}

/** @param {import('./sns-ootd-catalog.mjs').DayOutfit} o */
export function attachDetailLockToOutfit(o) {
  const detail = buildOutfitDetailLock(o)
  o.detailLockEn = detail.en
  o.detailLockKo = detail.ko
  return o
}

/** @param {'sua'|'ethan'} character @param {import('./sns-ootd-catalog.mjs').DayOutfit} o */
export function formatDetailLockTxt(character, o) {
  if (!o.detailLockKo && !o.detailLockEn) attachDetailLockToOutfit(o)
  const body = character === 'sua' ? o.detailLockKo : o.detailLockEn
  const title =
    character === 'sua'
      ? '[디테일 고정 · 실루엣·단추·벨트·가방 4장 동일]'
      : '[Detail lock · silhouette buttons belt bag identical all 4 slides]'
  return `${title}\n${body}`
}
