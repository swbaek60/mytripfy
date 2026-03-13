#!/usr/bin/env node
/**
 * One-off: fetch Wikipedia thumbnail (640px) for each of 100 scuba dive site titles.
 * Outputs JSON array of URLs for pasting into ChallengeImage.tsx SCUBA_VERIFIED_URLS.
 */

const TITLES = [
  'Raja Ampat', 'Tubbataha Reef', 'Komodo National Park', 'Sipadan Island', 'Milne Bay, Papua New Guinea',
  'Mergui Archipelago, Myanmar', 'Palau Blue Corner', 'Truk Lagoon, Micronesia', 'Cocos Island, Costa Rica', 'Darwin Arch, Galápagos',
  'Tonga Humpback Whale Dive', 'Palau Wrecks, Micronesia', 'Aldabra Atoll, Seychelles', 'Sodwana Bay, South Africa', 'Fernando de Noronha, Brazil',
  'SS Thistlegorm, Red Sea', 'Brothers Islands, Sudan', 'Malpelo Island, Colombia', 'Great Blue Hole, Belize', 'Silfra Fissure, Iceland',
  'Scapa Flow, Scotland', 'Tiger Beach, Bahamas', 'SS President Coolidge, Vanuatu', 'HMHS Britannic Wreck, Aegean', 'Andavadoaka, Madagascar',
  'Nusa Penida, Bali', 'Richelieu Rock, Thailand', 'Similan Islands, Thailand', 'Wakatobi, Indonesia', 'Bunaken, Indonesia',
  'Apo Island, Philippines', 'Moalboal, Philippines', 'Coron Bay, Philippines', 'Koh Tao, Thailand', 'Malapascua Island, Philippines',
  'Pulau Weh, Indonesia', 'Solomon Islands', 'Rangiroa, French Polynesia', 'Fakarava, French Polynesia', 'Pacific Harbor, Fiji',
  'Yap Island, Micronesia', 'Kona Manta Ray Night Dive, Hawaii', 'Niue, South Pacific', 'North Malé Atoll, Maldives', 'Baa Atoll, Maldives',
  'Andaman Islands, India', 'Mafia Island, Tanzania', 'Tofo Beach, Mozambique', 'Mayotte, Indian Ocean', 'Nosy Be, Madagascar',
  'Ras Mohammed, Egypt', 'Blue Hole Dahab, Egypt', 'Djibouti Whale Shark, Djibouti', 'Eilat, Israel', 'Aqaba, Jordan',
  'Aliwal Shoal, South Africa', 'Watamu Marine Park, Kenya', 'Mnemba Atoll, Zanzibar', 'Cenotes Yucatan, Mexico', 'Cozumel, Mexico',
  'Jardines de la Reina, Cuba', 'Roatan, Honduras', 'Belize Barrier Reef', 'Bat Islands, Costa Rica', 'Coiba Island, Panama',
  'Azores, Portugal', 'El Hierro Marine Reserve, Spain', 'Norway Fjord Diving, Norway', 'Kosterfjorden, Sweden', 'Easter Island, Chile',
  'Great Barrier Reef, Australia', 'Ningaloo Reef, Australia', 'Lord Howe Island, Australia', 'New Caledonia Shark Bay', 'Norfolk Island, Pacific',
  'Saipan Blue Hole, Northern Marianas', 'Jellyfish Lake, Palau', 'Subic Bay Wrecks, Philippines', 'Green Island, Taiwan', 'Koh Lipe, Thailand',
  'Mauritius', 'Comoro Islands', 'Lakshadweep Islands, India', 'Muscat Daymaniyat, Oman', 'NEOM Red Sea, Saudi Arabia', 'Tyre Marine Reserve, Lebanon',
  'Zenobia, Cyprus', 'Lanzarote MUSA, Spain', 'Marseille Calanques, France', 'Hvar, Croatia', 'Santorini Caldera, Greece', 'Bodrum Wrecks, Turkey', 'Menorca Sea Caves, Spain',
  'Florida Keys, USA', 'Florida Springs, USA', 'Baja California Sea of Cortez', 'RMS Rhone, British Virgin Islands', 'Campbell River, Canada', 'Bermuda', 'Stingray City, Cayman Islands',
];

// Wikipedia page title variants for titles that don't match exact article name
const TITLE_TO_WIKI = {
  'Palau Blue Corner': 'Blue Corner',
  'Truk Lagoon, Micronesia': 'Chuuk Lagoon',
  'Cocos Island, Costa Rica': 'Cocos Island',
  'Darwin Arch, Galápagos': 'Darwin Island',
  'Tonga Humpback Whale Dive': 'Humpback whale',
  'Palau Wrecks, Micronesia': 'Palau',
  'SS Thistlegorm, Red Sea': 'SS Thistlegorm',
  'Brothers Islands, Sudan': 'Brothers Islands',
  'Great Blue Hole, Belize': 'Great Blue Hole',
  'Silfra Fissure, Iceland': 'Silfra',
  'Scapa Flow, Scotland': 'Scapa Flow',
  'Tiger Beach, Bahamas': 'Tiger Beach',
  'SS President Coolidge, Vanuatu': 'SS President Coolidge',
  'HMHS Britannic Wreck, Aegean': 'HMHS Britannic',
  'Kona Manta Ray Night Dive, Hawaii': 'Manta ray',
  'North Malé Atoll, Maldives': 'Malé',
  'Blue Hole Dahab, Egypt': 'Blue Hole (Dahab)',
  'Djibouti Whale Shark, Djibouti': 'Djibouti',
  'Cenotes Yucatan, Mexico': 'Cenote',
  'Jardines de la Reina, Cuba': 'Jardines de la Reina',
  'New Caledonia Shark Bay': 'New Caledonia',
  'Saipan Blue Hole, Northern Marianas': 'Saipan',
  'Jellyfish Lake, Palau': 'Jellyfish Lake',
  'Subic Bay Wrecks, Philippines': 'Subic Bay',
  'Green Island, Taiwan': 'Green Island (Taiwan)',
  'NEOM Red Sea, Saudi Arabia': 'NEOM',
  'Tyre Marine Reserve, Lebanon': 'Tyre Lebanon',
  'Zenobia, Cyprus': 'MV Zenobia',
  'Lanzarote MUSA, Spain': 'Museo Atlántico',
  'Marseille Calanques, France': 'Calanques',
  'Florida Springs, USA': 'Florida',
  'Baja California Sea of Cortez': 'Gulf of California',
  'RMS Rhone, British Virgin Islands': 'RMS Rhone',
  'Campbell River, Canada': 'Campbell River',
  'Stingray City, Cayman Islands': 'Stingray City',
};

const FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colorful_underwater_landscape_of_a_coral_reef.jpg/640px-Colorful_underwater_landscape_of_a_coral_reef.jpg';

async function summaryImage(wikiTitle) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(String(wikiTitle).replace(/ /g, '_'))}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MyTripfy/1.0' } });
  if (!res.ok) return null;
  const data = await res.json();
  const src = data?.thumbnail?.source;
  return src ? src.replace(/\/\d+px-/, '/640px-') : null;
}

async function searchFirstImage(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MyTripfy/1.0' } });
  if (!res.ok) return null;
  const data = await res.json();
  const title = data?.query?.search?.[0]?.title;
  if (!title) return null;
  return summaryImage(title);
}

async function main() {
  const out = [];
  for (let i = 0; i < TITLES.length; i++) {
    const title = TITLES[i];
    const wikiTitle = TITLE_TO_WIKI[title] || title;
    let url = await summaryImage(wikiTitle);
    if (!url && wikiTitle === title) url = await searchFirstImage(title + ' diving');
    if (!url) url = await searchFirstImage(title);
    out.push(url || FALLBACK);
    if ((i + 1) % 10 === 0) console.error(`Fetched ${i + 1}/${TITLES.length}`);
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
