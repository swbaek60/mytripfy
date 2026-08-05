/**
 * Beachhead-first SEO blog topic queue
 */
export const BLOG_TOPICS = [
  {
    slug: 'find-companion-seoul',
    cityId: 'seoul',
    cityEn: 'Seoul',
    cityKo: '서울',
    intent: 'companion',
    priority: 1,
  },
  {
    slug: 'find-companion-tokyo',
    cityId: 'tokyo',
    cityEn: 'Tokyo',
    cityKo: '도쿄',
    intent: 'companion',
    priority: 2,
  },
  {
    slug: 'find-companion-bangkok',
    cityId: 'bangkok',
    cityEn: 'Bangkok',
    cityKo: '방콕',
    intent: 'companion',
    priority: 3,
  },
  {
    slug: 'find-companion-osaka',
    cityId: 'osaka',
    cityEn: 'Osaka',
    cityKo: '오사카',
    intent: 'companion',
    priority: 4,
  },
  {
    slug: 'find-companion-danang',
    cityId: 'danang',
    cityEn: 'Da Nang',
    cityKo: '다낭',
    intent: 'companion',
    priority: 5,
  },
  {
    slug: 'solo-travel-challenges-guide',
    cityId: null,
    cityEn: null,
    cityKo: null,
    intent: 'challenge',
    priority: 6,
  },
  {
    slug: 'trip-matcher-quiz-guide',
    cityId: null,
    cityEn: null,
    cityKo: null,
    intent: 'product',
    priority: 7,
  },
  {
    slug: 'local-guide-tokyo',
    cityId: 'tokyo',
    cityEn: 'Tokyo',
    cityKo: '도쿄',
    intent: 'guide',
    priority: 8,
  },
]

export function nextUnpublishedTopics(existingSlugs, limit = 1) {
  const set = new Set(existingSlugs)
  return BLOG_TOPICS.filter((t) => !set.has(t.slug))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit)
}
