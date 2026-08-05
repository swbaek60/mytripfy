/**
 * Supabase 임베드 관계(`select('a, profiles(...)')`)의 결과를 좁혀 주는 헬퍼.
 *
 * 생성된 DB 타입을 쓰지 않기 때문에 임베드 필드는 `any` 로 들어온다. 호출부마다
 * `as any` 를 쓰면 오타가 그대로 통과하므로, 여기서 기대하는 모양을 명시해서
 * 한 번만 좁힌다. 관계가 배열로 오는 경우(1:N)와 객체로 오는 경우를 모두 처리한다.
 */
export function relationOne<T>(value: unknown): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null
  return value as T
}

/** 1:N 임베드 관계를 배열로 정규화한다. */
export function relationMany<T>(value: unknown): T[] {
  if (value == null) return []
  return Array.isArray(value) ? (value as T[]) : [value as T]
}

/** 프로필 임베드에서 자주 쓰는 최소 필드. */
export interface ProfileRef {
  id?: string
  full_name: string | null
  avatar_url: string | null
}

/** 챌린지 임베드에서 자주 쓰는 필드. */
export interface ChallengeRef {
  id?: string
  title_en: string
  title_ko: string | null
  description_en?: string | null
  category: string
  points: number
  country_code: string | null
}
