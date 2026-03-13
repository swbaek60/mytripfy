/**
 * 100 Festivals: Wikipedia REST API만 사용해 썸네일 URL 수집 (API 반환값만 사용 → 깨진 이미지 없음).
 * node scripts/fetch-festival-images.js
 * 출력을 FESTIVALS_DIRECT_IMAGES에 붙여넣고, 나머지는 API findFestivalImage 폴백.
 */
const TITLES = [
  'Rio Carnival','Oktoberfest','La Tomatina','Diwali','Holi','Naadam Festival','Songkran','Guy Fawkes Night','Edinburgh Fringe','Venice Carnival','WOMAD','Día de los Muertos','Lantern Festival','Hanukkah','Hanami Cherry Blossom','Pushkar Camel Fair','Glastonbury Festival','Coachella','Burning Man','Oruro Carnival','Inti Raymi','Dakar Rally','Tour de France','Carnival of Trinidad','Bocelli Concert','Elephant Festival','Shanghai International Film Festival','Royal Edinburgh Military Tattoo','Nuremberg Christkindlesmarkt','Kumbh Mela','Tomorrowland','Basel Carnival','Harbin Ice Festival','Wieliczka Salt Mine Concert','Merrie Monarch Festival','Secret Solstice Iceland','Bermuda Day','Cinema Paradiso Festival','Full Moon Party','Colombian Coffee Festival','Sahara International Festival','Nikko Toshogu Festival','Battle of Flowers','Pride Amsterdam','Inti Raymi Cusco','Sydney New Year Fireworks','Bastille Day Paris','Sapporo Snow Festival','Whale Festival Baja','Celtic Connections Glasgow','Pirarucu Festival','Bun Bang Fai Rocket Festival','San Fermin Bull Run','Halloween Salem','Puri Sand Art Festival','Yanagawa Lantern Boat','Highland Games','Inti Raymi Bolivia','Festival in the Desert','Roskilde Festival','Nagasaki Kunchi Festival','Country Music CMA Fest','FESPAM','Fado Festival Lisbon','Cycle Festival Amsterdam','Giants of Mechelen','Keukenhof Tulip Festival','Prague Spring Music Festival','Maya Winter Solstice','Zurich Street Parade','Iditarod','Feria de Abril','Festival of the Nomads','Reindeer Racing Inari','Día de la Lluvia','Buenos Aires Tango Festival','Vesak Full Moon','Jinja Festival Uganda','Istanbul Jazz Festival','Kyiv Street Music Festival','Rose Festival Dades Valley','Vegetarian Festival Phuket','Sumo Grand Tournament Tokyo','Uluru Song Lines','Geilo Ice Music Festival','Esala Perahera','Carnaval de Oruro','Lake Retba Festival','Hogwarts Express Experience','Aurora Festival Tromso','Venice Opera Barge','Reykjavik Winter Lights','Rajasthan Desert Festival','Homowo Festival Ghana','Mardi Gras New Orleans','Notting Hill Carnival','Cannes Film Festival','Montreux Jazz Festival','Sziget Festival',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function summaryThumb(pageTitle) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      { headers: { 'User-Agent': 'MyTripfy/1.0' }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const src = data?.thumbnail?.source;
    return src ? src.replace(/\/\d+px-/, '/640px-') : null;
  } catch { return null; }
}

async function searchFirst(query) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`,
      { headers: { 'User-Agent': 'MyTripfy/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.query?.search?.[0]?.title ?? null;
  } catch { return null; }
}

async function getUrl(title) {
  const u = title.replace(/\s+/g, '_');
  let url = await summaryThumb(title);
  if (url) return url;
  await sleep(120);
  url = await summaryThumb(u);
  if (url) return url;
  await sleep(120);
  if (title.length <= 20 && !title.includes('(')) {
    url = await summaryThumb(`${title} (festival)`);
    if (url) return url;
    await sleep(120);
  }
  const first = await searchFirst(`${title} festival`);
  if (first) {
    url = await summaryThumb(first);
    if (url) return url;
    await sleep(120);
  }
  return null;
}

async function main() {
  const out = {};
  for (let i = 0; i < TITLES.length; i++) {
    const title = TITLES[i];
    const url = await getUrl(title);
    if (url) out[title] = url;
    if ((i + 1) % 25 === 0) console.error(`Fetched ${i + 1}/${TITLES.length}`);
    await sleep(100);
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
