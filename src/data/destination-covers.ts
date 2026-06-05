/** Unsplash destination cover images by ISO country code (no query params — next/image adds w/q) */
const COVERS: Record<string, string> = {
  JP: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
  TH: 'https://images.unsplash.com/photo-1528181304800-259b08848526',
  IT: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9',
  FR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
  US: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
  AU: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
  ES: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62',
  VN: 'https://images.unsplash.com/photo-1528127269322-539801943592',
  KR: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07',
  GB: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
  DE: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
  PT: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b',
  GR: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
  IS: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927',
  BR: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5',
  MX: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
  ID: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
  PH: 'https://images.unsplash.com/photo-1587330979470-3595ac045ab0',
  IN: 'https://images.unsplash.com/photo-1548013146-72479768bada',
  TR: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200',
  MA: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
  EG: 'https://images.unsplash.com/photo-1547102629-04734a2499ac',
  NZ: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  CA: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'

export function getDestinationCover(countryCode: string | null | undefined): string {
  if (!countryCode) return DEFAULT_COVER
  return COVERS[countryCode.toUpperCase()] ?? DEFAULT_COVER
}
