#!/usr/bin/env node
/**
 * 100 Attractions: Wikipedia REST API로 썸네일 URL 조회 → ATTRACTIONS_DIRECT_IMAGES용 검증된 URL 생성
 * 실행: node scripts/fetch-attraction-images.mjs
 * 출력: ChallengeImage.tsx에 붙여넣을 ATTRACTIONS_DIRECT_IMAGES 객체
 */
const ATTRACTIONS = [
  'Angkor Wat', 'Bagan Temples', 'Great Wall of China', 'Machu Picchu', 'Petra',
  'Pyramids of Giza', 'Sistine Chapel & Vatican', 'Zhangjiajie National Forest Park',
  'Abu Simbel Temples', 'Alhambra Palace', 'Arashiyama Bamboo Grove', 'Borobudur Temple',
  'Cappadocia', 'Chichen Itza', 'Great Barrier Reef', 'Ha Long Bay',
  'Hiroshima Peace Memorial (Genbaku Dome)', 'Jungfraujoch Top of Europe', 'Komodo National Park',
  'Maasai Mara National Reserve', 'Matterhorn', 'Meteora Monasteries', 'Sossusvlei & Namib Desert',
  'Torres del Paine Patagonia', 'Serengeti National Park', 'Sigiriya Rock Fortress',
  'Stone Forest Shilin', 'Tanah Lot Temple', 'Terracotta Army', 'Uluru (Ayers Rock)', 'Victoria Falls',
  'Amalfi Coast', 'Anne Frank House', 'Jatiluwih Rice Terraces Bali', 'Sultan Ahmed Mosque (Blue Mosque)',
  'Brandenburg Gate', 'Burj Khalifa', 'Chateau de Chambord', 'Christ the Redeemer',
  'Colosseum', 'Edinburgh Castle', 'Eiffel Tower', 'Ephesus Ancient City', 'Forbidden City',
  'Fushimi Inari Taisha', 'Golden Gate Bridge', 'Grand Canyon', 'Grand Palace Bangkok',
  'Hagia Sophia', 'Hoi An Ancient Town', 'Kinkaku-ji Golden Pavilion', 'Li River & Guilin',
  'Louvre Museum', 'Masada Fortress', 'Moai Statues Easter Island', 'Mont Saint-Michel',
  'Mount Fuji', 'Neuschwanstein Castle', 'Niagara Falls', 'Notre Dame Cathedral',
  'Pamukkale Cotton Castle', 'Park Guell', 'Parthenon & Acropolis', 'Piazza San Marco',
  'Pompeii', 'Prague Old Town Square', 'Sagrada Familia', 'Santorini Caldera', 'Senso-ji Temple',
  'Sheikh Zayed Grand Mosque', 'Shwedagon Pagoda', 'Great Sphinx of Giza', "St Basil's Cathedral",
  "St Peter's Basilica", 'Statue of Liberty', 'Stonehenge', 'Sydney Opera House', 'Taj Mahal',
  'Tanah Lot Sunset Tour', 'Temple of Heaven', 'Tokyo Skytree', 'Tower of London', 'Uffizi Gallery',
  'Palace of Versailles', 'Victoria Peak Hong Kong', 'Western Wall Jerusalem',
  'Wat Pho Temple of Reclining Buddha', 'Yellowstone National Park',
  'Iguazu Falls', 'Angkor Thom Bayon', 'Batu Caves', 'Cat Ba Island Halong Bay', 'Jeju Island',
  'Khajuraho Temples', 'Mesa Verde National Park', 'Mont Blanc', 'Skellig Michael', 'Salar de Uyuni',
  'Waitomo Glowworm Caves', 'Lascaux Cave Paintings',
]

// title_en → Wikipedia 검색어 (API가 title_en으로 못 찾을 때)
const SEARCH_OVERRIDES = {
  'Sistine Chapel & Vatican': ['Sistine Chapel'],
  'Zhangjiajie National Forest Park': ['Zhangjiajie National Forest Park', 'Wulingyuan'],
  'Hiroshima Peace Memorial (Genbaku Dome)': ['Hiroshima Peace Memorial'],
  'Sossusvlei & Namib Desert': ['Sossusvlei', 'Namib Desert'],
  'Torres del Paine Patagonia': ['Torres del Paine'],
  'Stone Forest Shilin': ['Stone Forest (China)', 'Shilin Stone Forest'],
  'Uluru (Ayers Rock)': ['Uluru'],
  'Jatiluwih Rice Terraces Bali': ['Jatiluwih Rice Terraces', 'Subak (irrigation)'],
  'Sultan Ahmed Mosque (Blue Mosque)': ['Sultan Ahmed Mosque', 'Blue Mosque Istanbul'],
  'Ephesus Ancient City': ['Ephesus'],
  'Fushimi Inari Taisha': ['Fushimi Inari Taisha'],
  'Kinkaku-ji Golden Pavilion': ['Kinkaku-ji'],
  'Li River & Guilin': ['Li River', 'Guilin'],
  'Moai Statues Easter Island': ['Moai', 'Rapa Nui National Park'],
  'Pamukkale Cotton Castle': ['Pamukkale'],
  'Park Guell': ['Park Güell'],
  'Parthenon & Acropolis': ['Acropolis of Athens', 'Parthenon'],
  'Prague Old Town Square': ['Old Town Square (Prague)'],
  'Great Sphinx of Giza': ['Great Sphinx of Giza'],
  'Tanah Lot Sunset Tour': ['Tanah Lot'],
  'Palace of Versailles': ['Palace of Versailles'],
  'Victoria Peak Hong Kong': ['Victoria Peak Hong Kong'],
  'Western Wall Jerusalem': ['Western Wall'],
  'Wat Pho Temple of Reclining Buddha': ['Wat Pho'],
  'Angkor Thom Bayon': ['Angkor Thom', 'Bayon'],
  'Cat Ba Island Halong Bay': ['Cat Ba Island', 'Ha Long Bay'],
  'Bagan Temples': ['Bagan', 'Bagan Myanmar'],
  'Abu Simbel Temples': ['Abu Simbel'],
  'Jungfraujoch Top of Europe': ['Jungfraujoch'],
  'Meteora Monasteries': ['Meteora'],
  'Christ the Redeemer': ['Christ the Redeemer (statue)'],
  'Grand Palace Bangkok': ['Grand Palace Bangkok', 'Grand Palace'],
  'Masada Fortress': ['Masada'],
  'Santorini Caldera': ['Santorini'],
  'Senso-ji Temple': ['Senso-ji'],
  'Khajuraho Temples': ['Khajuraho'],
  'Lascaux Cave Paintings': ['Lascaux'],
  'Stone Forest Shilin': ['Stone Forest (China)', 'Shilin County'],
  'Victoria Peak Hong Kong': ['Victoria Peak Hong Kong', 'Victoria Peak'],
}

async function fetchThumbnail(titleEn) {
  const toTry = SEARCH_OVERRIDES[titleEn] || [titleEn]
  for (const query of toTry) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com)' },
      })
      if (!res.ok) continue
      const json = await res.json()
      const thumb = json?.thumbnail?.source
      if (thumb && thumb.includes('upload.wikimedia.org')) {
        // 640px로 통일 (API 기본 320px → 더 선명하게)
        return thumb.replace(/\/\d+px-/, '/640px-')
      }
    } catch (_) {}
  }
  return null
}

async function main() {
  const out = {}
  let ok = 0
  for (const titleEn of ATTRACTIONS) {
    const url = await fetchThumbnail(titleEn)
    if (url) {
      out[titleEn] = url
      ok++
    }
    await new Promise(r => setTimeout(r, 200)) // rate limit
  }
  console.log(`// Fetched ${ok}/${ATTRACTIONS.length} thumbnails`)
  console.log('const ATTRACTIONS_DIRECT_IMAGES: Record<string, string> = {')
  for (const [k, v] of Object.entries(out)) {
    const key = k.includes("'") ? `  '${k.replace(/'/g, "\\'")}'` : `  '${k}'`
    console.log(`${key}: '${v}',`)
  }
  console.log('}')
  console.log(`\n// Missing: ${ATTRACTIONS.filter(t => !out[t]).join(', ')}`)
}

main().catch(console.error)
