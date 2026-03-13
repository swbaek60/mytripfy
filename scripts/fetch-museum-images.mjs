#!/usr/bin/env node
/**
 * 100 Museums: Wikipedia REST API로 썸네일 URL 조회 → MUSEUMS_DIRECT_IMAGES용 검증된 URL 생성
 * 실행: node scripts/fetch-museum-images.mjs
 */
const MUSEUMS = [
  'Louvre Museum', 'British Museum', 'The Met (Metropolitan Museum of Art)', 'Smithsonian National Museum of Natural History',
  'State Hermitage Museum', 'Vatican Museums', 'National Palace Museum', 'Egyptian Museum, Cairo',
  'National Museum of India, New Delhi', 'National Archaeological Museum Athens', 'Pergamon Museum, Berlin', 'Prado Museum',
  'Uffizi Gallery', 'Natural History Museum, London', 'Victoria and Albert Museum', 'Tokyo National Museum',
  'National Museum of Korea', 'National Museum of China', 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya',
  'Istanbul Archaeological Museums', 'Grand Egyptian Museum (GEM)', 'Field Museum, Chicago',
  'American Museum of Natural History', 'Smithsonian Air & Space Museum', 'Royal Ontario Museum',
  'Australian Museum, Sydney', 'Melbourne Museum', 'de Young Museum, San Francisco', 'Rijksmuseum, Amsterdam',
  'Anne Frank House', 'Auschwitz-Birkenau State Museum', 'Warsaw Rising Museum', 'Reina Sofia Museum, Madrid',
  'Tate Modern, London', 'Centre Pompidou, Paris', 'Oceanographic Museum of Monaco', 'Natural History Museum Vienna',
  'Gold Museum (Museo del Oro), Bogota', 'Larco Museum, Lima', 'Museo Nacional de Antropologia, Mexico City',
  'Palenque Archaeological Museum', 'MASP (Sao Paulo Museum of Art)', 'MALBA, Buenos Aires', 'Sydney Jewish Museum',
  'Picasso Museum, Barcelona', 'Deutsches Museum, Munich', 'Leonardo da Vinci Museum of Science', 'Science Museum, London',
  'Museum of Science and Industry, Chicago', 'Getty Center, Los Angeles', 'Guggenheim Museum, New York',
  'Guggenheim Museum Bilbao', 'Vasa Museum, Stockholm', 'Viking Ship Museum, Oslo', 'National Museum of Denmark',
  'National Museum of Finland', 'Kunsthistorisches Museum Vienna', 'Dresden State Art Collections',
  'Thyssen-Bornemisza Museum, Madrid', 'Bargello Museum, Florence', 'National Archaeological Museum Naples',
  'Borghese Gallery, Rome', 'National Museum of Iran, Tehran', 'Topkapi Palace Museum', 'Coptic Museum, Cairo',
  'Bardo National Museum, Tunis', 'Museum of Black Civilizations, Dakar', 'National Museum of Ghana',
  'Iziko South African Museum', 'National Museum of Kenya', 'National Museum of Tanzania', 'National Museum Bangkok',
  'Vietnam National Museum of History', 'National Museum of Singapore', 'Islamic Arts Museum Malaysia',
  'National Museum of Indonesia', 'National Museum of the Philippines', 'Palace Museum (Forbidden City)',
  'Shanghai Museum', 'Hong Kong Museum of History', 'National Taiwan Museum', 'National Folk Museum of Korea',
  'Jewish Museum Berlin',   'Powerhouse Museum, Sydney', 'Te Papa Tongarewa, Wellington', 'Museo Soumaya, Mexico City',
  'Botero Museum, Bogota', 'Musee de la Civilisation, Quebec', 'Canadian War Museum, Ottawa',
  'US Holocaust Memorial Museum', '9/11 Memorial & Museum', 'Musee d Orsay, Paris', 'Wien Museum, Vienna',
  'Amsterdam Museum', 'Barcelona History Museum (MUHBA)', 'Nordic Museum, Stockholm', 'National Museum of Scotland',
  'NGMA New Delhi', 'Museum of Turkish and Islamic Arts', 'Abderrahman Slaoui Foundation Museum',
]

const SEARCH_OVERRIDES = {
  'The Met (Metropolitan Museum of Art)': ['Metropolitan Museum of Art'],
  'Smithsonian National Museum of Natural History': ['National Museum of Natural History'],
  'Smithsonian Air & Space Museum': ['National Air and Space Museum'],
  'Musee d Orsay': ['Musée d\'Orsay', 'Musee dOrsay'],
  'NGMA New Delhi': ['National Gallery of Modern Art'],
  'National Museum of India, New Delhi': ['National Museum of India'],
  'Field Museum, Chicago': ['Field Museum'],
  'Australian Museum, Sydney': ['Australian Museum'],
  'Melbourne Museum': ['Melbourne Museum'],
  'de Young Museum, San Francisco': ['de Young Museum'],
  'Reina Sofia Museum, Madrid': ['Museo Nacional Centro de Arte Reina Sofía'],
  'Tate Modern, London': ['Tate Modern'],
  'Gold Museum (Museo del Oro), Bogota': ['Museo del Oro', 'Gold Museum Bogota'],
  'Larco Museum, Lima': ['Museo Larco'],
  'Museo Nacional de Antropologia, Mexico City': ['National Museum of Anthropology (Mexico)'],
  'Palenque Archaeological Museum': ['Palenque'],
  'MASP (Sao Paulo Museum of Art)': ['São Paulo Museum of Art'],
  'MALBA, Buenos Aires': ['MALBA'],
  'Deutsches Museum, Munich': ['Deutsches Museum'],
  'Leonardo da Vinci Museum of Science': ['Leonardo da Vinci National Museum of Science and Technology'],
  'Getty Center, Los Angeles': ['Getty Center'],
  'Vasa Museum, Stockholm': ['Vasa Museum'],
  'Viking Ship Museum, Oslo': ['Viking Ship Museum (Oslo)'],
  'Thyssen-Bornemisza Museum, Madrid': ['Museo Nacional Thyssen-Bornemisza'],
  'Bargello Museum, Florence': ['Bargello National Museum'],
  'National Archaeological Museum Naples': ['National Archaeological Museum Naples'],
  'Borghese Gallery, Rome': ['Galleria Borghese'],
  'National Museum of Iran, Tehran': ['National Museum of Iran'],
  'Coptic Museum, Cairo': ['Coptic Museum'],
  'Bardo National Museum, Tunis': ['Bardo National Museum (Tunis)'],
  'Museum of Black Civilizations, Dakar': ['Museum of Black Civilizations'],
  'Palace Museum (Forbidden City)': ['Forbidden City', 'Palace Museum'],
  'Powerhouse Museum, Sydney': ['Powerhouse Museum'],
  'Te Papa Tongarewa, Wellington': ['Museum of New Zealand Te Papa Tongarewa'],
  'Museo Soumaya, Mexico City': ['Museo Soumaya'],
  'Botero Museum, Bogota': ['Museo Botero'],
  'Musee de la Civilisation, Quebec': ['Musée de la civilisation'],
  'Canadian War Museum, Ottawa': ['Canadian War Museum'],
  '9/11 Memorial & Museum': ['National September 11 Memorial & Museum'],
  'Wien Museum, Vienna': ['Wien Museum'],
  'Barcelona History Museum (MUHBA)': ['Museum of the History of Barcelona'],
  'Nordic Museum, Stockholm': ['Nordiska museet'],
  'Abderrahman Slaoui Foundation Museum': ['Abderrahman Slaoui Museum'],
}

async function fetchThumbnail(titleEn) {
  const toTry = SEARCH_OVERRIDES[titleEn] || [titleEn]
  for (const query of toTry) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com)' } })
      if (!res.ok) continue
      const json = await res.json()
      const thumb = json?.thumbnail?.source
      if (thumb && thumb.includes('upload.wikimedia.org')) {
        return thumb.replace(/\/\d+px-/, '/640px-')
      }
    } catch (_) {}
  }
  return null
}

async function main() {
  const out = {}
  for (const titleEn of MUSEUMS) {
    const url = await fetchThumbnail(titleEn)
    if (url) out[titleEn] = url
    await new Promise(r => setTimeout(r, 200))
  }
  console.log(`// Fetched ${Object.keys(out).length}/${MUSEUMS.length}`)
  console.log('const MUSEUMS_DIRECT_IMAGES: Record<string, string> = {')
  for (const [k, v] of Object.entries(out)) {
    const key = k.includes("'") ? `  '${k.replace(/'/g, "\\'")}'` : `  '${k}'`
    console.log(`${key}: '${v}',`)
  }
  console.log('}')
  console.log(`\n// Missing: ${MUSEUMS.filter(t => !out[t]).join(', ')}`)
}

main().catch(console.error)
