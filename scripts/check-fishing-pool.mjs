#!/usr/bin/env node
/** fishing 풀 16개 URL만 검증 (요청 간 400ms 간격으로 429 방지) */
const POOL = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Altafjorden_in_Alta%2C_Troms_og_Finnmark%2C_Norway%2C_2022_August.jpg/640px-Altafjorden_in_Alta%2C_Troms_og_Finnmark%2C_Norway%2C_2022_August.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Cape_of_Good_Hope_from_Cape_Point.jpg/640px-Cape_of_Good_Hope_from_Cape_Point.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/01_New_Zealand_Lake_Taupo.jpg/640px-01_New_Zealand_Lake_Taupo.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Map_of_Hokkaido.jpg/640px-Map_of_Hokkaido.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Everglades_National_Park%2C_Florida_LOC_83692553.jpg/640px-Everglades_National_Park%2C_Florida_LOC_83692553.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Cabo_San_Lucas_Rocks.jpg/640px-Cabo_San_Lucas_Rocks.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Reine_Lofoten.jpg/640px-Reine_Lofoten.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lake_Erie_Shoreline_%283371480628%29.jpg/640px-Lake_Erie_Shoreline_%283371480628%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Teide_Volcano%2C_Canary_Islands%2C_Spain.jpg/640px-Teide_Volcano%2C_Canary_Islands%2C_Spain.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg/640px-Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Bocas_del_Toro_Panama.jpg/640px-Bocas_del_Toro_Panama.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lake_Furnas%2C_Sao_Miguel_Island%2C_Azores%2C_Portugal.jpg/640px-Lake_Furnas%2C_Sao_Miguel_Island%2C_Azores%2C_Portugal.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Amazon_River_ESA387332.jpg/640px-Amazon_River_ESA387332.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Florida_keys_from_space.jpg/640px-Florida_keys_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Ice-fishing_on_Baikal_5.jpg/640px-Ice-fishing_on_Baikal_5.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg/640px-ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg',
]
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
async function check(url, i) {
  await delay(400 * i)
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return { i: i + 1, status: res.status, ok: res.ok }
  } catch (e) {
    return { i: i + 1, status: 0, ok: false, err: e.message }
  }
}
const results = await Promise.all(POOL.map((url, i) => check(url, i)))
const failed = results.filter((r) => !r.ok || r.status === 404)
if (failed.length) {
  console.log('FAILED:', failed)
  process.exit(1)
}
console.log('OK: all 16 fishing pool URLs return 200')
process.exit(0)
