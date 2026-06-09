import Link from 'next/link'

const CATEGORY_META: Record<
  string,
  { emoji: string; titleKey: string; descKey: string }
> = {
  countries: { emoji: '🌍', titleKey: 'catCountries', descKey: 'catCountriesDesc' },
  attractions: { emoji: '🏛️', titleKey: 'catAttractions', descKey: 'catAttractionsDesc' },
  foods: { emoji: '🍜', titleKey: 'catFoods', descKey: 'catFoodsDesc' },
  restaurants: { emoji: '🍽️', titleKey: 'catRestaurants', descKey: 'catRestaurantsDesc' },
  nature: { emoji: '🏔️', titleKey: 'catNature', descKey: 'catNatureDesc' },
  islands: { emoji: '🏝️', titleKey: 'catIslands', descKey: 'catIslandsDesc' },
  museums: { emoji: '🏺', titleKey: 'catMuseums', descKey: 'catMuseumsDesc' },
  scuba: { emoji: '🤿', titleKey: 'catScuba', descKey: 'catScubaDesc' },
}

const FEATURED_KEYS = [
  'countries',
  'attractions',
  'foods',
  'restaurants',
  'nature',
  'islands',
  'museums',
  'scuba',
] as const

type Labels = Record<string, string>

interface Props {
  locale: string
  title: string
  subtitle: string
  viewAllLabel: string
  startLabel: string
  labels: Labels
}

export default function ChallengeCategoriesGrid({
  locale,
  title,
  subtitle,
  viewAllLabel,
  startLabel,
  labels,
}: Props) {
  const keys = FEATURED_KEYS

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-challenge-light text-challenge text-xs font-bold mb-3">
            🏆 1,600+ Challenges
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heading">{title}</h2>
          <p className="text-subtle mt-2 text-sm max-w-xl">{subtitle}</p>
        </div>
        <Link
          href={`/${locale}/challenges`}
          className="text-sm font-semibold text-challenge hover:underline shrink-0"
        >
          {viewAllLabel} →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {keys.map((key) => {
          const meta = CATEGORY_META[key]
          return (
            <Link
              key={key}
              href={`/${locale}/challenges/${key}`}
              className="group rounded-2xl border border-edge/60 bg-surface p-4 hover:border-challenge/40 hover:shadow-md transition-all"
            >
              <span className="text-2xl mb-2 block">{meta.emoji}</span>
              <p className="font-bold text-heading text-sm group-hover:text-challenge transition-colors">
                {labels[meta.titleKey]}
              </p>
              <p className="text-xs text-subtle mt-1 line-clamp-2">{labels[meta.descKey]}</p>
            </Link>
          )
        })}
      </div>
      <div className="mt-8 text-center">
        <Link
          href={`/${locale}/challenges/countries`}
          className="inline-flex items-center justify-center rounded-full bg-challenge text-white px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          {startLabel}
        </Link>
      </div>
    </div>
  )
}
