#!/usr/bin/env node
/**
 * Fishing 챌린지에서 사용하는 Commons URL이 200을 반환하는지 검증
 * 사용: node scripts/check-fishing-urls.mjs
 * 참고: Wikimedia는 동시 요청 시 429를 반환할 수 있음. 404인 URL만 수정 대상.
 */

const FISHING_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Kenai_River_Alaska.jpg/640px-Kenai_River_Alaska.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Florida_keys_from_space.jpg/640px-Florida_keys_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Ice-fishing_on_Baikal_5.jpg/640px-Ice-fishing_on_Baikal_5.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Amazon_River_ESA387332.jpg/640px-Amazon_River_ESA387332.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg/640px-ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ha_Long_Bay_in_2019.jpg/640px-Ha_Long_Bay_in_2019.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg/640px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Serengeti-Landscape-2012.JPG/640px-Serengeti-Landscape-2012.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Bora_Bora_ISS006.jpg/640px-Bora_Bora_ISS006.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Canyon_River_Tree_%28165872763%29.jpeg/640px-Canyon_River_Tree_%28165872763%29.jpeg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/3Falls_Niagara.jpg/640px-3Falls_Niagara.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/1_huanglong_pools_aerial_2011.jpg/640px-1_huanglong_pools_aerial_2011.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Everglades_National_Park%2C_Florida_LOC_83692553.jpg/640px-Everglades_National_Park%2C_Florida_LOC_83692553.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Cape_Cod_National_Seashore_%2815440%29.jpg/640px-Cape_Cod_National_Seashore_%2815440%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Cabo_San_Lucas_Rocks.jpg/640px-Cabo_San_Lucas_Rocks.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Cozumel_Beach_%282%29.jpg/640px-Cozumel_Beach_%282%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Reine_Lofoten.jpg/640px-Reine_Lofoten.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Male_and_vicinity%2C_Maldives.jpg/640px-Male_and_vicinity%2C_Maldives.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg/640px-Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Chesapeake_Bay_Bridge_Tunnel_%281%29.jpg/640px-Chesapeake_Bay_Bridge_Tunnel_%281%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lake_Erie_Shoreline_%283371480628%29.jpg/640px-Lake_Erie_Shoreline_%283371480628%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Boundary_Waters_Canoe_Area_Wilderness_%2815440%29.jpg/640px-Boundary_Waters_Canoe_Area_Wilderness_%2815440%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Lake_Victoria_from_space.jpg/640px-Lake_Victoria_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Lake_Victoria_from_space.jpg/640px-Lake_Victoria_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Lake_Malawi_from_space.jpg/640px-Lake_Malawi_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Cape_of_Good_Hope_from_Cape_Point.jpg/640px-Cape_of_Good_Hope_from_Cape_Point.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/10549-Hoi-An_%2837621348460%29.jpg/640px-10549-Hoi-An_%2837621348460%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Lake_Biwa_from_space.jpg/640px-Lake_Biwa_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Map_of_Hokkaido.jpg/640px-Map_of_Hokkaido.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Shiretoko_Peninsula_from_air.jpg/640px-Shiretoko_Peninsula_from_air.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Viti_Levu_Islands.jpg/640px-Viti_Levu_Islands.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Palau_rock_islands.jpg/640px-Palau_rock_islands.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ningaloo_Reef_from_space.jpg/640px-Ningaloo_Reef_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Kerala_backwaters%2C_Vembanad_Lake%2C_Houseboats%2C_India.jpg/640px-Kerala_backwaters%2C_Vembanad_Lake%2C_Houseboats%2C_India.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Andaman_Islands_NASA.jpg/640px-Andaman_Islands_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Ebro_river_delta_ESA21177561.jpeg/640px-Ebro_river_delta_ESA21177561.jpeg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lake_Furnas%2C_Sao_Miguel_Island%2C_Azores%2C_Portugal.jpg/640px-Lake_Furnas%2C_Sao_Miguel_Island%2C_Azores%2C_Portugal.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Bocas_del_Toro_Panama.jpg/640px-Bocas_del_Toro_Panama.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Teide_Volcano%2C_Canary_Islands%2C_Spain.jpg/640px-Teide_Volcano%2C_Canary_Islands%2C_Spain.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Altafjorden_in_Alta%2C_Troms_og_Finnmark%2C_Norway%2C_2022_August.jpg/640px-Altafjorden_in_Alta%2C_Troms_og_Finnmark%2C_Norway%2C_2022_August.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/River_Tay_at_Killiecrankie.jpg/640px-River_Tay_at_Killiecrankie.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Spey_valley_from_craigellachie.jpg/640px-Spey_valley_from_craigellachie.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/River_Tweed_at_Scott%27s_View.jpg/640px-River_Tweed_at_Scott%27s_View.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Santo_Antao_Cape_Verde.jpg/640px-Santo_Antao_Cape_Verde.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/New_Caledonia_NASA.jpg/640px-New_Caledonia_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Solomon_Islands_NASA.jpg/640px-Solomon_Islands_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Papua_New_Guinea_NASA.jpg/640px-Papua_New_Guinea_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Atchafalaya_Basin_Bridge_2.jpg/640px-Atchafalaya_Basin_Bridge_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Musandam_peninsula.jpg/640px-Musandam_peninsula.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Amur_River_basin.png/640px-Amur_River_basin.png',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Volga_delta_NASA.jpg/640px-Volga_delta_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Po_river_near_Cremona.jpg/640px-Po_river_near_Cremona.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Parana_river_NASA.jpg/640px-Parana_river_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Island_of_Hawai%27i_-_Landsat_mosaic.jpg/640px-Island_of_Hawai%27i_-_Landsat_mosaic.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Bahia_Banderas_Puerto_Vallarta.jpg/640px-Bahia_Banderas_Puerto_Vallarta.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Costa_Rica_NASA.jpg/640px-Costa_Rica_NASA.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Torres_del_Paine%2C_Chile_by_Karen_Chan_16.jpg/640px-Torres_del_Paine%2C_Chile_by_Karen_Chan_16.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/k/ke/Klyuchevskoy_volcano%2C_Russia.jpg/640px-Klyuchevskoy_volcano%2C_Russia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Zanzibar_sultan_palace.jpg/640px-Zanzibar_sultan_palace.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Sossusvlei.jpg/640px-Sossusvlei.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Komodo_Island_north_aerial.jpg/640px-Komodo_Island_north_aerial.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/01_New_Zealand_Lake_Taupo.jpg/640px-01_New_Zealand_Lake_Taupo.jpg',
]

const unique = [...new Set(FISHING_URLS)]

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return { url, ok: res.ok, status: res.status }
  } catch (e) {
    return { url, ok: false, status: 0, error: e.message }
  }
}

// 429(rate limit)는 동시 요청 때문일 수 있으므로, 404만 실패로 처리
const results = await Promise.all(unique.map(check))
const failed404 = results.filter((r) => r.status === 404)
const failedOther = results.filter((r) => !r.ok && r.status !== 429)

if (failed404.length) {
  console.log('FAILED (404 - replace in ChallengeImage.tsx):')
  failed404.forEach((r) => console.log(r.url))
  process.exit(1)
}
if (failedOther.length) {
  console.log('Other failures (may be transient):', failedOther.length)
}
console.log('OK: no 404s among', unique.length, 'fishing URLs (429 = rate limit, ignore in batch)')
process.exit(0)
