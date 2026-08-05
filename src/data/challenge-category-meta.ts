export const CHALLENGE_CATEGORY_KEYS = [
  'countries',
  'restaurants',
  'foods',
  'drinks',
  'attractions',
  'museums',
  'art_galleries',
  'nature',
  'animals',
  'festivals',
  'islands',
  'fishing',
  'golf',
  'surfing',
  'skiing',
  'scuba',
] as const

export type ChallengeCategoryKey = (typeof CHALLENGE_CATEGORY_KEYS)[number]

export const CHALLENGE_CATEGORY_META: Record<
  ChallengeCategoryKey,
  { emoji: string; titleKey: string; descKey: string }
> = {
  countries: { emoji: '🌍', titleKey: 'catCountries', descKey: 'catCountriesDesc' },
  restaurants: { emoji: '🍽️', titleKey: 'catRestaurants', descKey: 'catRestaurantsDesc' },
  foods: { emoji: '🍜', titleKey: 'catFoods', descKey: 'catFoodsDesc' },
  drinks: { emoji: '🍶', titleKey: 'catDrinks', descKey: 'catDrinksDesc' },
  attractions: { emoji: '🏛️', titleKey: 'catAttractions', descKey: 'catAttractionsDesc' },
  museums: { emoji: '🏺', titleKey: 'catMuseums', descKey: 'catMuseumsDesc' },
  art_galleries: { emoji: '🖼️', titleKey: 'catArtGalleries', descKey: 'catArtGalleriesDesc' },
  nature: { emoji: '🏔️', titleKey: 'catNature', descKey: 'catNatureDesc' },
  animals: { emoji: '🦁', titleKey: 'catAnimals', descKey: 'catAnimalsDesc' },
  festivals: { emoji: '🎭', titleKey: 'catFestivals', descKey: 'catFestivalsDesc' },
  islands: { emoji: '🏝️', titleKey: 'catIslands', descKey: 'catIslandsDesc' },
  fishing: { emoji: '🎣', titleKey: 'catFishing', descKey: 'catFishingDesc' },
  golf: { emoji: '⛳', titleKey: 'catGolf', descKey: 'catGolfDesc' },
  surfing: { emoji: '🏄', titleKey: 'catSurfing', descKey: 'catSurfingDesc' },
  skiing: { emoji: '⛷️', titleKey: 'catSkiing', descKey: 'catSkiingDesc' },
  scuba: { emoji: '🤿', titleKey: 'catScuba', descKey: 'catScubaDesc' },
}

export function isChallengeCategoryKey(key: string): key is ChallengeCategoryKey {
  return key in CHALLENGE_CATEGORY_META
}
