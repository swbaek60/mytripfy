export type ChallengeCategory =
  | 'adventure'
  | 'culture'
  | 'food'
  | 'nature'
  | 'social'
  | 'milestone'
  | 'transport'
  | 'accommodation'

export interface Challenge {
  id: number
  title: string
  description: string
  category: ChallengeCategory
  emoji: string
  points: number   // 10=easy, 20=medium, 30=hard, 50=legendary
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
}

export const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  adventure:     '🏔️ Adventure',
  culture:       '🎭 Culture',
  food:          '🍜 Food',
  nature:        '🌿 Nature',
  social:        '🤝 Social',
  milestone:     '🏆 Milestone',
  transport:     '🚀 Transport',
  accommodation: '🏠 Stay',
}

export const DIFFICULTY_LABELS = {
  easy:      { label: 'Easy',      color: 'bg-green-100 text-green-700',   stars: 1 },
  medium:    { label: 'Medium',    color: 'bg-yellow-100 text-yellow-700', stars: 2 },
  hard:      { label: 'Hard',      color: 'bg-orange-100 text-orange-700', stars: 3 },
  legendary: { label: 'Legendary', color: 'bg-purple-100 text-purple-700', stars: 4 },
}

export const CHALLENGES: Challenge[] = [
  // ─── ADVENTURE (20) ────────────────────────────────────────
  { id: 1,  emoji: '🏔️', category: 'adventure', difficulty: 'hard',      points: 30, title: 'Summit a Mountain',         description: 'Reach the summit of any mountain above 2,000m.' },
  { id: 2,  emoji: '🪂', category: 'adventure', difficulty: 'hard',      points: 30, title: 'Go Skydiving',               description: 'Jump out of a plane and freefall through the sky.' },
  { id: 3,  emoji: '🤿', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Scuba Dive',                 description: 'Explore the underwater world with scuba gear.' },
  { id: 4,  emoji: '🏄', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Surf a Wave',                description: 'Ride a real ocean wave on a surfboard.' },
  { id: 5,  emoji: '🧗', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Rock Climbing Outdoors',     description: 'Climb a natural rock face, not an indoor wall.' },
  { id: 6,  emoji: '🪂', category: 'adventure', difficulty: 'hard',      points: 30, title: 'Paraglide Over a Valley',    description: 'Paraglide and see stunning aerial views.' },
  { id: 7,  emoji: '🛶', category: 'adventure', difficulty: 'easy',      points: 10, title: 'White-Water Rafting',        description: 'Navigate rapids on a raft.' },
  { id: 8,  emoji: '🚵', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Mountain Bike a Trail',      description: 'Ride an off-road trail on a mountain bike.' },
  { id: 9,  emoji: '🏕️', category: 'adventure', difficulty: 'easy',      points: 10, title: 'Camp Under the Stars',       description: 'Sleep outdoors with no roof but the night sky.' },
  { id: 10, emoji: '🌋', category: 'adventure', difficulty: 'hard',      points: 30, title: 'Visit an Active Volcano',    description: 'Stand near an active volcanic site.' },
  { id: 11, emoji: '🎿', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Ski or Snowboard',           description: 'Hit the slopes on skis or a snowboard.' },
  { id: 12, emoji: '🏊', category: 'adventure', difficulty: 'easy',      points: 10, title: 'Swim in the Ocean',          description: 'Swim freely in open ocean water.' },
  { id: 13, emoji: '🦈', category: 'adventure', difficulty: 'legendary', points: 50, title: 'Shark Cage Dive',            description: 'Come face-to-face with sharks in a cage.' },
  { id: 14, emoji: '🧊', category: 'adventure', difficulty: 'hard',      points: 30, title: 'Ice Cave Exploration',       description: 'Enter and explore a natural glacier ice cave.' },
  { id: 15, emoji: '🪁', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Bungee Jump',                description: 'Take the plunge with a bungee cord attached.' },
  { id: 16, emoji: '🏇', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Horseback Riding Trail',     description: 'Ride a horse through scenic countryside.' },
  { id: 17, emoji: '🌊', category: 'adventure', difficulty: 'hard',      points: 30, title: 'Cliff Jump into Water',      description: 'Jump off a cliff of 10m+ into natural water.' },
  { id: 18, emoji: '🎯', category: 'adventure', difficulty: 'easy',      points: 10, title: 'Archery in the Wild',        description: 'Practice archery in an outdoor setting.' },
  { id: 19, emoji: '🛸', category: 'adventure', difficulty: 'legendary', points: 50, title: 'Zero-Gravity Flight',        description: 'Experience weightlessness on a parabolic flight.' },
  { id: 20, emoji: '🐘', category: 'adventure', difficulty: 'medium',    points: 20, title: 'Elephant Sanctuary Visit',   description: 'Spend time with elephants at an ethical sanctuary.' },

  // ─── CULTURE (20) ──────────────────────────────────────────
  { id: 21, emoji: '🗺️', category: 'culture', difficulty: 'easy',      points: 10, title: 'Visit 10 Countries',           description: 'Set foot in at least 10 different countries.' },
  { id: 22, emoji: '🏛️', category: 'culture', difficulty: 'easy',      points: 10, title: 'UNESCO World Heritage Site',   description: 'Visit any officially listed UNESCO site.' },
  { id: 23, emoji: '🎭', category: 'culture', difficulty: 'easy',      points: 10, title: 'Attend a Local Festival',      description: 'Join a traditional local festival or celebration.' },
  { id: 24, emoji: '🕌', category: 'culture', difficulty: 'easy',      points: 10, title: 'Visit 5 Religious Sites',      description: 'Visit temples, mosques, churches, or shrines.' },
  { id: 25, emoji: '🎨', category: 'culture', difficulty: 'easy',      points: 10, title: 'World-Class Museum',           description: 'Visit a world-famous art or history museum.' },
  { id: 26, emoji: '📜', category: 'culture', difficulty: 'medium',    points: 20, title: 'Learn a Local Phrase',         description: 'Hold a basic conversation using the local language.' },
  { id: 27, emoji: '👘', category: 'culture', difficulty: 'easy',      points: 10, title: 'Wear Traditional Dress',       description: 'Try on and wear traditional clothing of a culture.' },
  { id: 28, emoji: '🎪', category: 'culture', difficulty: 'medium',    points: 20, title: 'Watch a Traditional Show',     description: 'See a live traditional dance, opera, or theater.' },
  { id: 29, emoji: '🏟️', category: 'culture', difficulty: 'easy',      points: 10, title: 'Attend a Live Sports Game',   description: 'Watch a professional sports match live.' },
  { id: 30, emoji: '🎠', category: 'culture', difficulty: 'easy',      points: 10, title: 'Explore a Street Market',     description: 'Browse and shop at a vibrant local street market.' },
  { id: 31, emoji: '🌐', category: 'culture', difficulty: 'hard',      points: 30, title: 'Visit 30 Countries',           description: 'Reach 30 countries in your travel passport.' },
  { id: 32, emoji: '🎎', category: 'culture', difficulty: 'medium',    points: 20, title: 'Homestay with a Local Family', description: 'Stay at least one night with a local host family.' },
  { id: 33, emoji: '🗿', category: 'culture', difficulty: 'medium',    points: 20, title: 'Ancient Ruins Explorer',       description: 'Walk through ruins older than 1,000 years.' },
  { id: 34, emoji: '🎑', category: 'culture', difficulty: 'medium',    points: 20, title: 'Witness a Seasonal Tradition', description: 'Experience Cherry Blossoms, Carnival, Diwali, etc.' },
  { id: 35, emoji: '📸', category: 'culture', difficulty: 'easy',      points: 10, title: 'Iconic Landmark Photo',        description: 'Take a photo at a world-famous landmark.' },
  { id: 36, emoji: '🎶', category: 'culture', difficulty: 'medium',    points: 20, title: 'Open-Air Music Concert',       description: 'Attend an outdoor music concert or festival abroad.' },
  { id: 37, emoji: '🖼️', category: 'culture', difficulty: 'easy',      points: 10, title: 'Street Art Tour',             description: 'Explore a city famous for its street art scene.' },
  { id: 38, emoji: '🌍', category: 'culture', difficulty: 'legendary', points: 50, title: 'Visit All 7 Continents',      description: 'Travel to every continent including Antarctica.' },
  { id: 39, emoji: '🏰', category: 'culture', difficulty: 'easy',      points: 10, title: 'Sleep in a Historic Castle',  description: 'Spend a night inside a real historical castle.' },
  { id: 40, emoji: '🎏', category: 'culture', difficulty: 'hard',      points: 30, title: 'Learn a Traditional Craft',   description: 'Take a class in pottery, weaving, calligraphy, etc.' },

  // ─── FOOD (15) ─────────────────────────────────────────────
  { id: 41, emoji: '🍜', category: 'food', difficulty: 'easy',      points: 10, title: 'Street Food Tour',             description: 'Eat 5+ different street foods in one country.' },
  { id: 42, emoji: '🍣', category: 'food', difficulty: 'medium',    points: 20, title: 'Michelin-Star Dining',         description: 'Eat at a Michelin-starred restaurant.' },
  { id: 43, emoji: '🌶️', category: 'food', difficulty: 'easy',      points: 10, title: 'Eat Something Unfamiliar',    description: 'Try a local dish you\'ve never heard of before.' },
  { id: 44, emoji: '🍷', category: 'food', difficulty: 'easy',      points: 10, title: 'Winery or Brewery Tour',      description: 'Visit and taste at a local winery or brewery.' },
  { id: 45, emoji: '🧑‍🍳', category: 'food', difficulty: 'medium',   points: 20, title: 'Cooking Class Abroad',        description: 'Learn to cook a traditional dish in a foreign country.' },
  { id: 46, emoji: '🥢', category: 'food', difficulty: 'easy',      points: 10, title: 'Eat at a Night Market',       description: 'Dine at a bustling night market overseas.' },
  { id: 47, emoji: '🎂', category: 'food', difficulty: 'easy',      points: 10, title: 'Birthday Cake in 5 Countries', description: 'Celebrate your birthday in 5 different countries.' },
  { id: 48, emoji: '🦞', category: 'food', difficulty: 'medium',    points: 20, title: 'Seafood at the Source',        description: 'Eat freshly caught seafood at a harbor or beach.' },
  { id: 49, emoji: '🫖', category: 'food', difficulty: 'easy',      points: 10, title: 'Traditional Tea Ceremony',    description: 'Participate in a formal tea ceremony.' },
  { id: 50, emoji: '🍦', category: 'food', difficulty: 'easy',      points: 10, title: 'Gelato in Italy',             description: 'Eat authentic gelato from a gelateria in Italy.' },
  { id: 51, emoji: '🫕', category: 'food', difficulty: 'medium',    points: 20, title: 'Farm-to-Table Experience',    description: 'Eat a meal using ingredients you picked yourself.' },
  { id: 52, emoji: '🍻', category: 'food', difficulty: 'easy',      points: 10, title: 'Oktoberfest in Munich',       description: 'Attend Oktoberfest in Munich, Germany.' },
  { id: 53, emoji: '🌮', category: 'food', difficulty: 'easy',      points: 10, title: 'Taco Tour in Mexico',         description: 'Eat 10 different tacos in Mexico.' },
  { id: 54, emoji: '🍱', category: 'food', difficulty: 'medium',    points: 20, title: 'Bento-Making Workshop',       description: 'Make your own Japanese bento box.' },
  { id: 55, emoji: '🥘', category: 'food', difficulty: 'easy',      points: 10, title: 'Spice Market Visit',          description: 'Explore and shop a famous spice market.' },

  // ─── NATURE (15) ───────────────────────────────────────────
  { id: 56, emoji: '🌅', category: 'nature', difficulty: 'easy',      points: 10, title: 'Watch a Sunrise',             description: 'Wake up early and witness a sunrise from a scenic spot.' },
  { id: 57, emoji: '🌌', category: 'nature', difficulty: 'medium',    points: 20, title: 'See the Northern Lights',     description: 'Witness the Aurora Borealis in the night sky.' },
  { id: 58, emoji: '🌊', category: 'nature', difficulty: 'easy',      points: 10, title: 'Stand at the Ocean Edge',     description: 'Visit an ocean coast in a new country.' },
  { id: 59, emoji: '🦁', category: 'nature', difficulty: 'hard',      points: 30, title: 'African Safari',              description: 'See the Big Five animals in the wild.' },
  { id: 60, emoji: '🌴', category: 'nature', difficulty: 'medium',    points: 20, title: 'Rainforest Hike',             description: 'Trek through a tropical rainforest.' },
  { id: 61, emoji: '🐋', category: 'nature', difficulty: 'hard',      points: 30, title: 'Whale Watching',              description: 'See whales in the wild from a boat.' },
  { id: 62, emoji: '🏜️', category: 'nature', difficulty: 'medium',    points: 20, title: 'Desert Night Camp',           description: 'Camp overnight in a real desert.' },
  { id: 63, emoji: '🌺', category: 'nature', difficulty: 'easy',      points: 10, title: 'Botanical Garden Visit',      description: 'Explore a famous botanical garden.' },
  { id: 64, emoji: '🦋', category: 'nature', difficulty: 'easy',      points: 10, title: 'Butterfly Sanctuary',         description: 'Walk through a butterfly garden or sanctuary.' },
  { id: 65, emoji: '🌿', category: 'nature', difficulty: 'medium',    points: 20, title: 'Hike a National Park',        description: 'Complete a trail in a UNESCO or national park.' },
  { id: 66, emoji: '🫧', category: 'nature', difficulty: 'hard',      points: 30, title: 'Swim in a Natural Cave Pool', description: 'Swim inside a sea cave or cenote.' },
  { id: 67, emoji: '❄️', category: 'nature', difficulty: 'medium',    points: 20, title: 'Walk on a Glacier',           description: 'Trek across a glacier in Iceland, NZ, or similar.' },
  { id: 68, emoji: '🌸', category: 'nature', difficulty: 'easy',      points: 10, title: 'Cherry Blossom Season',       description: 'See sakura in bloom in Japan.' },
  { id: 69, emoji: '🦜', category: 'nature', difficulty: 'medium',    points: 20, title: 'Bird-Watching Expedition',    description: 'Spot 10+ exotic bird species in the wild.' },
  { id: 70, emoji: '🐠', category: 'nature', difficulty: 'medium',    points: 20, title: 'Coral Reef Snorkeling',       description: 'Snorkel over a living coral reef ecosystem.' },

  // ─── SOCIAL (10) ───────────────────────────────────────────
  { id: 71, emoji: '🤝', category: 'social', difficulty: 'easy',      points: 10, title: 'Travel with a Stranger',      description: 'Complete a trip with someone you met through mytripfy.' },
  { id: 72, emoji: '🌐', category: 'social', difficulty: 'medium',    points: 20, title: 'Travel Solo to 5 Countries',  description: 'Visit 5 countries completely alone.' },
  { id: 73, emoji: '🗣️', category: 'social', difficulty: 'medium',    points: 20, title: 'Local Guide Experience',      description: 'Hire a local guide and learn the city their way.' },
  { id: 74, emoji: '💌', category: 'social', difficulty: 'easy',      points: 10, title: 'Send a Postcard',             description: 'Mail a physical postcard from a foreign country.' },
  { id: 75, emoji: '📖', category: 'social', difficulty: 'easy',      points: 10, title: 'Read in a Foreign Café',      description: 'Spend an afternoon reading in a café overseas.' },
  { id: 76, emoji: '🫂', category: 'social', difficulty: 'medium',    points: 20, title: 'Volunteer Abroad',            description: 'Volunteer for a project in a foreign country.' },
  { id: 77, emoji: '🏠', category: 'social', difficulty: 'medium',    points: 20, title: 'Host a Traveler',             description: 'Welcome a traveler from mytripfy into your home.' },
  { id: 78, emoji: '🌉', category: 'social', difficulty: 'easy',      points: 10, title: 'Midnight City Walk',          description: 'Explore a foreign city after midnight.' },
  { id: 79, emoji: '🎁', category: 'social', difficulty: 'easy',      points: 10, title: 'Gift Exchange Abroad',        description: 'Exchange a meaningful gift with a local.' },
  { id: 80, emoji: '🥂', category: 'social', difficulty: 'medium',    points: 20, title: 'New Year\'s Eve Abroad',      description: 'Celebrate New Year\'s Eve in a foreign country.' },

  // ─── TRANSPORT (10) ────────────────────────────────────────
  { id: 81, emoji: '🚢', category: 'transport', difficulty: 'medium',    points: 20, title: 'Cruise Ship Voyage',         description: 'Take a multi-day ocean cruise.' },
  { id: 82, emoji: '🚄', category: 'transport', difficulty: 'easy',      points: 10, title: 'High-Speed Rail Journey',    description: 'Ride a high-speed train (Shinkansen, TGV, etc.).' },
  { id: 83, emoji: '🛺', category: 'transport', difficulty: 'easy',      points: 10, title: 'Iconic Local Transport',     description: 'Ride a tuk-tuk, rickshaw, gondola, or similar.' },
  { id: 84, emoji: '🐪', category: 'transport', difficulty: 'medium',    points: 20, title: 'Camel Ride in the Desert',   description: 'Ride a camel through sand dunes.' },
  { id: 85, emoji: '🚁', category: 'transport', difficulty: 'hard',      points: 30, title: 'Helicopter Tour',             description: 'See a landscape from a helicopter.' },
  { id: 86, emoji: '⛵', category: 'transport', difficulty: 'medium',    points: 20, title: 'Sail Between Islands',        description: 'Travel between two islands by sailboat.' },
  { id: 87, emoji: '🚂', category: 'transport', difficulty: 'medium',    points: 20, title: 'Scenic Railway Journey',      description: 'Take a famous scenic train route (Orient Express, etc.).' },
  { id: 88, emoji: '🛵', category: 'transport', difficulty: 'easy',      points: 10, title: 'Motorbike a Country Road',    description: 'Ride a motorbike or scooter in a foreign country.' },
  { id: 89, emoji: '🚣', category: 'transport', difficulty: 'easy',      points: 10, title: 'Rowboat on a Lake',           description: 'Row a traditional boat across a scenic lake.' },
  { id: 90, emoji: '🎈', category: 'transport', difficulty: 'legendary', points: 50, title: 'Hot Air Balloon Ride',        description: 'Float above the world in a hot air balloon.' },

  // ─── ACCOMMODATION (5) ─────────────────────────────────────
  { id: 91, emoji: '🏚️', category: 'accommodation', difficulty: 'medium', points: 20, title: 'Stay in a Treehouse',         description: 'Sleep in an elevated treehouse accommodation.' },
  { id: 92, emoji: '🛖', category: 'accommodation', difficulty: 'medium', points: 20, title: 'Overwater Bungalow',          description: 'Stay in a bungalow built above the ocean.' },
  { id: 93, emoji: '🏔️', category: 'accommodation', difficulty: 'hard',   points: 30, title: 'Mountain Hut Overnight',      description: 'Sleep in a remote alpine hut during a trek.' },
  { id: 94, emoji: '🌌', category: 'accommodation', difficulty: 'hard',   points: 30, title: 'Sleep Under Glass Ceiling',   description: 'Stay in a glass igloo or transparent cabin.' },
  { id: 95, emoji: '🏖️', category: 'accommodation', difficulty: 'easy',   points: 10, title: 'Beach Hut Stay',              description: 'Spend a night in a beachside hut or bungalow.' },

  // ─── MILESTONE (5) ─────────────────────────────────────────
  { id: 96,  emoji: '✈️', category: 'milestone', difficulty: 'easy',      points: 10, title: 'First Solo Trip',             description: 'Complete your very first solo international trip.' },
  { id: 97,  emoji: '🌍', category: 'milestone', difficulty: 'hard',      points: 30, title: 'Visit 50 Countries',          description: 'Stamp your passport in 50 different nations.' },
  { id: 98,  emoji: '🗓️', category: 'milestone', difficulty: 'medium',    points: 20, title: 'Year of Travel',              description: 'Travel to a new country every month for a full year.' },
  { id: 99,  emoji: '💼', category: 'milestone', difficulty: 'medium',    points: 20, title: 'Digital Nomad Month',         description: 'Work remotely from a foreign country for 30+ days.' },
  { id: 100, emoji: '🏆', category: 'milestone', difficulty: 'legendary', points: 50, title: 'Complete 50 Challenges',      description: 'Finish 50 challenges on the Bucket List. Legend status!' },
]

export const TOTAL_POINTS = CHALLENGES.reduce((sum, c) => sum + c.points, 0)

export function getBadgeForCount(completed: number): { emoji: string; label: string; color: string } {
  if (completed >= 100) return { emoji: '👑', label: 'Bucket List Legend',  color: '#7c3aed' }
  if (completed >= 75)  return { emoji: '💎', label: 'Diamond Traveler',    color: '#0ea5e9' }
  if (completed >= 50)  return { emoji: '🥇', label: 'Gold Explorer',       color: '#d97706' }
  if (completed >= 25)  return { emoji: '🥈', label: 'Silver Adventurer',   color: '#64748b' }
  if (completed >= 10)  return { emoji: '🥉', label: 'Bronze Wanderer',     color: '#92400e' }
  if (completed >= 1)   return { emoji: '🌱', label: 'Beginner Traveler',   color: '#16a34a' }
  return                       { emoji: '🗺️', label: 'Not Started',         color: '#9ca3af' }
}
