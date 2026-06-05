/**
 * SNS 일일 로테이션 정책 (단일 진실 공급원)
 *
 * 적용 지점:
 * - scripts/generate-sns-daily.mjs (txt·meta 생성)
 * - scripts/lib/sns-daily-rotation.mjs (의상·일정 선택)
 * - scripts/lib/sns-weather.mjs (방문 도시 날씨 → OOTD)
 * - Cursor Generate / API 이미지 (txt promptLock·[OOTD] 블록)
 */

/** @readonly */
export const ROTATION_POLICY = {
  /** 캐러셀 슬라이드 수 — 같은 날 모두 동일 OOTD */
  SAME_DAY_SLIDES: 4,

  /** 전날과 반드시 다른 의상 */
  ADJACENT_DAY_AVOID: 1,

  /**
   * 최근 N일(어제 포함) 동안 입었던 의상은 재착용 금지.
   * 10일째부터는 10일 전 코디 재착용 허용 → 연 365일 / ~50벌 ≈ 7일마다 1회 순환
   */
  OUTFIT_SHORT_TERM_AVOID_DAYS: 9,

  /** OUTFIT_SHORT_TERM_AVOID_DAYS + 1 — 이 일수 이후 재착용 가능 */
  OUTFIT_REUSE_AFTER_DAYS: 10,

  /** 캐릭터당 연간 순환 풀 크기 목표 */
  YEARLY_OUTFIT_POOL_SIZE: 50,

  /** 같은 국가 연속 체류 시 최근 N일 일정 variant 회피 */
  ITINERARY_SHORT_TERM_AVOID_DAYS: 4,
}

export const ROTATION_POLICY_KO = `
[SNS 로테이션 정책]
- 같은 날 캐러셀 4장: 동일 의상·악세서리 (promptLock 고정)
- 전날과 다른 의상 (인접 일자 중복 금지)
- 최근 9일간 입은 의상은 재착용 금지, 10일 이후 재착용 가능 (~50벌 연간 순환)
- 날짜마다 다른 관광 코스 (국가별 itinerary variant)
- 당일 방문 도시 Open-Meteo 날씨로 OOTD 후보 필터·조정
`.trim()
