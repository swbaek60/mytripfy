/**
 * 문자 체계로 원문 언어를 추정한다.
 *
 * Google Translation API 는 원문 언어를 알아서 판별하지만, 폴백으로 쓰는 MyMemory 는
 * `langpair=원문|대상` 을 반드시 요구하고 `auto` 를 거부한다. 그래서 폴백 경로에서만
 * 쓰는 최소한의 추정기를 둔다.
 *
 * 고유 문자를 쓰는 언어(한국어·일본어·중국어·러시아어 등)는 사실상 정확하고,
 * 라틴 문자는 구분이 불가능해 영어로 본다. 채팅 사용자 대부분이 공통어로 영어를
 * 쓰기 때문에 이 가정이 실패하는 경우에도 손해가 크지 않다.
 */

const SCRIPT_RANGES: ReadonlyArray<[RegExp, string]> = [
  [/[\uac00-\ud7af\u1100-\u11ff]/, 'ko'], // 한글
  [/[\u3040-\u309f\u30a0-\u30ff]/, 'ja'], // 히라가나·가타카나
  [/[\u4e00-\u9fff]/, 'zh'], // 한자 (가나가 없으면 중국어로 본다)
  [/[\u0e00-\u0e7f]/, 'th'], // 태국 문자
  [/[\u0600-\u06ff\u0750-\u077f]/, 'ar'], // 아랍 문자
  [/[\u0590-\u05ff]/, 'he'], // 히브리 문자
  [/[\u0400-\u04ff]/, 'ru'], // 키릴 문자
  [/[\u0900-\u097f]/, 'hi'], // 데바나가리
  [/[\u0980-\u09ff]/, 'bn'], // 벵골 문자
  [/[\u0370-\u03ff]/, 'el'], // 그리스 문자
]

/** 원문 언어 추정값(ISO 639-1). 판별이 불가능하면 'en'. */
export function guessSourceLang(text: string): string {
  for (const [pattern, lang] of SCRIPT_RANGES) {
    if (pattern.test(text)) return lang
  }
  return 'en'
}
