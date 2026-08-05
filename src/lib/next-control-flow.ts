/**
 * Next.js 가 제어 흐름에 쓰는 예외를 판별한다.
 *
 * Next 는 정상 동작을 예외로 신호한다.
 *  - `headers()`/`cookies()`/`auth()` 를 정적 생성 중에 읽으면 digest 가
 *    `DYNAMIC_SERVER_USAGE` 인 에러를 던져 "이 라우트는 동적" 임을 알린다.
 *  - `redirect()` / `notFound()` 는 `NEXT_REDIRECT` / `NEXT_HTTP_ERROR_FALLBACK`
 *    digest 를 가진 에러를 던진다.
 *
 * 그래서 `try { await auth() } catch { return null }` 같은 코드는 위험하다.
 * 동적 신호를 삼키면 Next 가 그 페이지를 정적으로 판단해 "로그아웃 상태" HTML 을
 * 캐시할 수 있고, 리다이렉트를 삼키면 이동이 조용히 사라진다.
 * 넓은 catch 를 쓸 수밖에 없는 곳에서는 이 함수로 걸러 다시 던진다.
 */
export function isNextControlFlowError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const digest = (e as { digest?: unknown }).digest
  if (typeof digest !== 'string') return false
  return digest === 'DYNAMIC_SERVER_USAGE' || digest.startsWith('NEXT_')
}
