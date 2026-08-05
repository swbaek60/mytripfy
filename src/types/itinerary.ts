/**
 * 일정표(trip_days / trip_activities) 공통 타입.
 *
 * 에디터·뷰어·서버 페이지가 각자 같은 인터페이스를 복사해 두고 있었다.
 * 한쪽만 필드를 추가하면 조용히 어긋나므로 여기서만 정의한다.
 */

export type ActivityCategory = 'transport' | 'accommodation' | 'meal' | 'activity' | 'note'

export interface TripActivity {
  id: string
  sort_order: number
  time_label: string | null
  category: ActivityCategory
  title: string
  location: string | null
  notes: string | null
  cost: number | null
  currency: string
}

export interface TripDay {
  id: string
  day_number: number
  date: string | null
  title: string | null
  notes: string | null
  trip_activities: TripActivity[]
}

/** DB 에서 읽은 일정을 활동 정렬까지 맞춰 정규화한다. */
export function normalizeItineraryDays(raw: unknown): TripDay[] {
  if (!Array.isArray(raw)) return []
  return (raw as TripDay[]).map((day) => ({
    ...day,
    trip_activities: [...(day.trip_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }))
}
