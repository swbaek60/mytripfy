/** Unsplash destination cover images by ISO country code (no query params — next/image adds w/q) */
const COVERS: Record<string, string> = {
  JP: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e', // Kyoto temple
  TH: 'https://images.unsplash.com/photo-1528181304800-259b08848526', // Wat Arun, Bangkok
  IT: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5', // Colosseum, Rome
  FR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', // Eiffel Tower, Paris
  US: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29', // Golden Gate Bridge, San Francisco
  AU: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a', // Sydney Opera House
  ES: 'https://images.unsplash.com/photo-1745186487192-09eccb385169', // Sagrada Família, Barcelona
  VN: 'https://images.unsplash.com/photo-1528127269322-539801943592', // Hoi An Ancient Town
  KR: 'https://images.unsplash.com/photo-1768006378015-2cb810dbeb90', // Gyeongbokgung Palace, Seoul
  GB: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad', // London skyline
  DE: 'https://images.unsplash.com/photo-1444838639505-f9042c5d2386', // Brandenburg Gate, Berlin
  PT: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b', // Lisbon tram
  GR: 'https://images.unsplash.com/photo-1571406252241-db0280bd36cd', // Santorini
  IS: 'https://images.unsplash.com/photo-1576090674370-842ccf3cd8d8', // Blue Lagoon
  BR: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e', // Christ the Redeemer, Rio
  MX: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd', // Chichen Itza
  ID: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', // Bali temple
  PH: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0', // Palawan
  IN: 'https://images.unsplash.com/photo-1548013146-72479768bada', // Taj Mahal
  TR: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200', // Hagia Sophia, Istanbul
  MA: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', // Marrakech medina
  EG: 'https://images.unsplash.com/photo-1547102629-04734a2499ac', // Pyramids of Giza
  NZ: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', // Milford Sound mountains
  CA: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', // Moraine Lake, Banff
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'

export function getDestinationCover(countryCode: string | null | undefined): string {
  if (!countryCode) return DEFAULT_COVER
  return COVERS[countryCode.toUpperCase()] ?? DEFAULT_COVER
}
