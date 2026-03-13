#!/usr/bin/env node
/**
 * 100 Art Galleries: Wikipedia REST API로 썸네일 URL 조회 → ART_GALLERIES_DIRECT_IMAGES 검증 URL
 * 실행: node scripts/fetch-art-gallery-images.mjs
 */
const TITLES = [
  'MoMA – Museum of Modern Art', 'Tate Modern, London', 'Guggenheim Museum, New York', 'Guggenheim Bilbao',
  'Tate Britain, London', 'Centre Pompidou, Paris', 'Musee National d Art Moderne, Paris', 'Palais de Tokyo, Paris',
  'Venice Arsenale & Giardini', 'CaixaForum Madrid', 'Triennale di Milano', 'Kunsthaus Zurich',
  'Van Gogh Museum, Amsterdam', 'Stedelijk Museum, Amsterdam', 'Alte/Neue/Moderne Pinakothek, Munich',
  'Alte Nationalgalerie, Berlin', 'Hamburger Bahnhof, Berlin', 'Gemaldegalerie Alte Meister, Dresden',
  'Albertina, Vienna', 'Belvedere, Vienna', 'Moderna Museet, Stockholm', 'National Museum, Oslo',
  'Ateneum Art Museum, Helsinki', 'Ny Carlsberg Glyptotek, Copenhagen', 'Louisiana Museum of Modern Art',
  'Berardo Collection Museum, Lisbon', 'Serralves Museum of Contemporary Art', 'Fundacio Joan Miro, Barcelona',
  'MNAC, Barcelona', 'Whitney Museum of American Art', 'SFMOMA, San Francisco', 'Art Institute of Chicago',
  'LACMA, Los Angeles', 'National Gallery of Art, Washington DC', 'Museum of Fine Arts, Boston',
  'National Gallery of Canada, Ottawa', 'Montreal Museum of Fine Arts', 'NGV International, Melbourne',
  'Museum of Contemporary Art, Sydney', 'Tokyo National Museum of Modern Art', 'Mori Art Museum, Tokyo',
  'Tokyo Opera City Art Gallery', 'Chichu Art Museum, Naoshima', 'MMCA National Museum of Modern Art',
  'Leeum Samsung Museum of Art', 'Power Station of Art, Shanghai', 'UCCA Center for Contemporary Art, Beijing',
  'M+ Museum, West Kowloon', 'National Gallery Singapore', 'Mucha Museum, Prague', 'Museum of Fine Arts, Budapest',
  'National Museum Warsaw (art)', 'National Gallery Prague', 'National Art Museum of Ukraine',
  'Russian Museum, St Petersburg', 'Museum of Modern Egyptian Art', 'Tehran Museum of Contemporary Art',
  'Istanbul Modern', 'Tel Aviv Museum of Art', 'Jameel Arts Centre, Dubai', 'Louvre Abu Dhabi',
  'Johannesburg Art Gallery', 'Nairobi National Museum (art)', 'MASP Sao Paulo',
  'Museo Nacional de Bellas Artes, Buenos Aires', 'Palacio de Bellas Artes, Mexico City',
  'Frida Kahlo Museum (Casa Azul), Mexico City', 'MALI (Museo de Arte de Lima)',
  'Banco de la Republica Art Collection, Bogota', 'MAC, Santiago de Chile', 'Museo Nacional de Bellas Artes, Havana',
  'Christchurch Art Gallery', 'Serpentine Galleries, London', 'New Museum, New York', 'Getty Villa, Malibu',
  'Seattle Art Museum', 'Denver Art Museum', 'High Museum of Art, Atlanta', 'Whitechapel Gallery, London',
  'Gagosian Gallery, New York', 'White Cube, London', 'Hara Museum of Contemporary Art, Tokyo',
  'National Museum of Art Osaka', 'National Museum of Modern Art Kyoto', 'Lee Jung-seob Museum, Jeju',
  'Asia Culture Center, Gwangju', 'Taipei Contemporary Art Center', 'Vietnam Museum of Fine Arts, Hanoi',
  'National Art Gallery of Sri Lanka', 'National Gallery of Modern Art, Mumbai', 'Moscow Museum of Modern Art',
  'National Museum of Art Romania', 'National Gallery, Athens', 'Latvian National Museum of Art',
]

const SEARCH_OVERRIDES = {
  'MoMA – Museum of Modern Art': ['Museum_of_Modern_Art', 'MoMA'],
  'Musee National d Art Moderne, Paris': ['Musée_national_d\'art_moderne', 'Centre_Pompidou'],
  'Venice Arsenale & Giardini': ['Venice_Biennale', 'Giardini_della_Biennale'],
  'Alte/Neue/Moderne Pinakothek, Munich': ['Alte_Pinakothek', 'Pinakothek'],
  'Gemaldegalerie Alte Meister, Dresden': ['Gemäldegalerie_Alte_Meister', 'Dresden_Old_Masters'],
  'Belvedere, Vienna': ['Belvedere,_Vienna', 'Belvedere_Palace'],
  'National Museum, Oslo': ['National_Museum_(Norway)', 'Nasjonalmuseet'],
  'Fundacio Joan Miro, Barcelona': ['Fundació_Joan_Miró', 'Joan_Miró_Foundation'],
  'MMCA National Museum of Modern Art': ['National_Museum_of_Modern_and_Contemporary_Art', 'MMCA_Korea'],
  'M+ Museum, West Kowloon': ['M%2B_(museum)', 'M_Plus'],
  'National Museum Warsaw (art)': ['National_Museum,_Warsaw', 'Muzeum_Narodowe_w_Warszawie'],
  'MAC, Santiago de Chile': ['Museo_de_Arte_Contemporáneo_de_Chile', 'MAC_Santiago'],
  'Lee Jung-seob Museum, Jeju': ['Lee_Jung-seob', 'Lee_Jung_Seob_Museum'],
  'Palacio de Bellas Artes, Mexico City': ['Palacio_de_Bellas_Artes', 'Palacio_Bellas_Artes'],
}

function titleToSlug(t) {
  return t.replace(/\s+/g, '_').replace(/[–—]/g, '-')
}

async function fetchThumbnail(titleEn) {
  const toTry = SEARCH_OVERRIDES[titleEn]
    ? SEARCH_OVERRIDES[titleEn]
    : [titleToSlug(titleEn), titleEn.replace(/,.*$/, '').trim().replace(/\s+/g, '_')]
  for (const query of toTry) {
    const slug = typeof query === 'string' ? query.replace(/\s+/g, '_') : query
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com)' },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const json = await res.json()
      const thumb = json?.thumbnail?.source
      if (thumb && (thumb.includes('upload.wikimedia.org') || thumb.includes('wikipedia.org'))) {
        return thumb.replace(/\/\d+px-/, '/640px-')
      }
    } catch (_) {}
  }
  return null
}

async function main() {
  const out = {}
  for (let i = 0; i < TITLES.length; i++) {
    const titleEn = TITLES[i]
    const url = await fetchThumbnail(titleEn)
    if (url) out[titleEn] = url
    process.stderr.write(`\r${i + 1}/${TITLES.length} ${titleEn.slice(0, 40)}...`)
    await new Promise(r => setTimeout(r, 220))
  }
  process.stderr.write('\n')
  const missing = TITLES.filter(t => !out[t])
  if (missing.length) process.stderr.write(`Missing: ${missing.length}\n`)
  console.log(JSON.stringify(out, null, 2))
}

main().catch(console.error)
