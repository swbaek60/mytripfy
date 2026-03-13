/**
 * 깨진 19종만 재조회. 제목 변형으로 summary 썸네일 수집
 * node scripts/fetch-animal-images-fix.js
 */
const TARGETS = [
  { key: 'Mobula Ray', try: ['Mobula_ray', 'Mobula', 'Manta_ray'] },
  { key: 'Blue Morpho Butterfly', try: ['Blue_morpho', 'Morpho_menelaus', 'Blue_Morpho_Butterfly'] },
  { key: 'Gemsbok Oryx', try: ['Gemsbok', 'Oryx_gazella', 'Gemsbok_Oryx'] },
  { key: 'Greater Flamingo', try: ['Greater_flamingo', 'Greater_Flamingo', 'Phoenicopterus_roseus'] },
  { key: 'Hippopotamus', try: ['Hippopotamus', 'Hippo'] },
  { key: 'Indian One-horned Rhino', try: ['Indian_rhinoceros', 'Rhinoceros_unicornis', 'Indian_one-horned_rhinoceros'] },
  { key: 'Japanese Macaque', try: ['Japanese_macaque', 'Snow_monkey', 'Macaca_fuscata'] },
  { key: 'Long-snouted Spinner Dolphin', try: ['Spinner_dolphin', 'Stenella_longirostris', 'Long-snouted_spinner_dolphin'] },
  { key: 'Nile Crocodile', try: ['Nile_crocodile', 'Crocodylus_niloticus'] },
  { key: 'Quokka', try: ['Quokka', 'Setonix_brachyurus'] },
  { key: 'Red Kangaroo', try: ['Red_kangaroo', 'Macropus_rufus'] },
  { key: 'Sea Krait', try: ['Sea_krait', 'Laticauda', 'Banded_sea_krait'] },
  { key: 'Sea Otter', try: ['Sea_otter', 'Enhydra_lutris'] },
  { key: 'Seahorse', try: ['Seahorse', 'Hippocampus'] },
  { key: 'Snowy Owl', try: ['Snowy_owl', 'Bubo_scandiacus'] },
  { key: 'Stingray', try: ['Stingray', 'Myliobatoidei', 'Dasyatidae'] },
  { key: 'Three-toed Sloth', try: ['Three-toed_sloth', 'Bradypus', 'Brown-throated_sloth'] },
  { key: 'Wallaby', try: ['Wallaby', 'Macropodidae'] },
  { key: 'White Rhino', try: ['White_rhinoceros', 'Ceratotherium_simum', 'Square-lipped_rhinoceros'] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getThumbUrl(title) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'User-Agent': 'MyTripfy/1.0' }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const src = data?.thumbnail?.source;
    if (!src) return null;
    return src.replace(/\/\d+px-/, '/640px-');
  } catch {
    return null;
  }
}

async function main() {
  const out = {};
  for (const { key, try: titles } of TARGETS) {
    let url = null;
    for (const t of titles) {
      url = await getThumbUrl(t);
      if (url) break;
      await sleep(200);
    }
    if (url) out[key] = url;
    else console.error('MISS:', key);
    await sleep(150);
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
