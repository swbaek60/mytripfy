/**
 * 안 나오는 15개 축제만 Wikipedia API로 수집
 * node scripts/fetch-festival-missing.js
 */
const TITLES = [
  'Secret Solstice Iceland', 'Geilo Ice Music Festival', 'Colombian Coffee Festival', 'Elephant Festival',
  'Holi', 'Kyiv Street Music Festival', 'La Tomatina', 'Lake Retba Festival', 'Maya Winter Solstice',
  'Reykjavik Winter Lights', 'Rose Festival Dades Valley', 'San Fermin Bull Run', 'Sumo Grand Tournament Tokyo',
  'Wieliczka Salt Mine Concert', 'Yanagawa Lantern Boat',
];

const QUERY_VARIANTS = {
  'Secret Solstice Iceland': ['Secret Solstice', 'Secret Solstice (festival)'],
  'Geilo Ice Music Festival': ['Ice Music Festival Geilo', 'Geilo Ice Music'],
  'Colombian Coffee Festival': ['National Coffee Festival Colombia', 'Colombian coffee'],
  'Elephant Festival': ['Elephant Festival Thailand', 'Surin Elephant Round-Up'],
  'Holi': ['Holi', 'Holi (festival)'],
  'Kyiv Street Music Festival': ['Street Music Festival Kyiv', 'Kyiv music festival'],
  'La Tomatina': ['La Tomatina', 'Tomatina'],
  'Lake Retba Festival': ['Lake Retba', 'Lac Rose Senegal'],
  'Maya Winter Solstice': ['Chichen Itza', 'Winter solstice Chichen Itza'],
  'Reykjavik Winter Lights': ['Reykjavik Winter Lights Festival', 'Vetrarhatid'],
  'Rose Festival Dades Valley': ['Rose Festival Morocco', 'Kelaa M Gouna rose'],
  'San Fermin Bull Run': ['Running of the Bulls', 'San Fermin'],
  'Sumo Grand Tournament Tokyo': ['sumo wrestling', 'Grand Sumo Tournament'],
  'Wieliczka Salt Mine Concert': ['Wieliczka Salt Mine', 'Wieliczka salt mine chapel'],
  'Yanagawa Lantern Boat': ['Yanagawa', 'Yanagawa lantern festival'],
};

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
    if (!src) return null;
    const url = src.replace(/\/\d+px-/, '/640px-');
    if (!url.includes('/thumb/') || !url.includes('640px-')) return null;
    return url;
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

async function main() {
  const out = {};
  for (const title of TITLES) {
    const variants = [title, title.replace(/\s+/g, '_'), ...(QUERY_VARIANTS[title] || [])];
    let url = null;
    for (const v of variants) {
      url = await summaryThumb(v);
      if (url) break;
      await sleep(150);
    }
    if (!url) {
      const q = `${title} festival`;
      const first = await searchFirst(q);
      await sleep(150);
      if (first) url = await summaryThumb(first);
    }
    if (url) out[title] = url;
    await sleep(120);
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
