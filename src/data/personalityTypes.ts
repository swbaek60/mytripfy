/**
 * Travel Personality Test result types — 공통 표시용 (프로필, 가이드 상세, 테스트 결과)
 */
export const PERSONALITY_TYPES: Record<string, { type: string; emoji: string; desc: string; color: string }> = {
  adventurer:      { type: 'The Adventurer',       emoji: '🧗', desc: 'Spontaneous, nature-loving, and always seeking thrills. You travel to feel alive!', color: '#f97316' },
  culture_seeker:  { type: 'The Culture Seeker',   emoji: '🏛️', desc: 'Thoughtful and curious. You travel to understand the world through its history and people.', color: '#8b5cf6' },
  social_nomad:    { type: 'The Social Nomad',     emoji: '🥳', desc: 'Everywhere you go, you make friends. You live for connections and shared memories.', color: '#ec4899' },
  luxury_traveler: { type: 'The Luxury Traveler',  emoji: '💎', desc: 'You believe travel should be comfortable. Quality experiences over quantity.', color: '#f59e0b' },
  backpacker:      { type: 'The Backpacker',        emoji: '🎒', desc: 'Resourceful and free. You can sleep anywhere and find joy in the simplest experiences.', color: '#10b981' },
  foodie_explorer: { type: 'The Foodie Explorer',  emoji: '🍜', desc: 'Your trips are planned around restaurants and local markets. Food is culture.', color: '#ef4444' },
}

export function getPersonalityDisplay(type: string | null) {
  if (!type) return null
  return PERSONALITY_TYPES[type] ?? { type, emoji: '🌍', desc: '', color: '#6b7280' }
}
