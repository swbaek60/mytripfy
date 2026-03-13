/**
 * Wikipedia REST summary API로 100 Animals 썸네일 URL 수집 → ANIMALS_DIRECT_IMAGES용
 * 실행: node scripts/fetch-animal-images.js
 */

const ANIMALS = [
  'African Lion', 'African Elephant', 'Leopard', 'Cheetah', 'White Rhino', 'Hippopotamus', 'Giraffe',
  'Mountain Gorilla', 'Bornean Orangutan', 'Giant Panda', 'Snow Leopard', 'Bengal Tiger', 'Komodo Dragon',
  'Greater Flamingo', 'Humpback Whale', 'Sperm Whale', 'Orca', 'Blue Whale', 'Manta Ray', 'Whale Shark',
  'Nile Crocodile', 'Seahorse', 'Mobula Ray', 'Adelie Penguin', 'Emperor Penguin', 'Albatross', 'Marine Iguana',
  'Galapagos Tortoise', 'Harpy Eagle', 'Resplendent Quetzal', 'Green Anaconda', 'Pygmy Hippo', 'African Wild Dog',
  'Stingray', 'Blue-Ringed Octopus', 'Galapagos Sea Lion', 'Beavers', 'Grizzly Bear', 'Polar Bear', 'Narwhal',
  'Sea Otter', 'Reindeer', 'Wolverine', 'Superb Lyrebird', 'Cassowary', 'Black Cockatoo', 'Andean Condor',
  'Jaguar', 'Tapir', 'Capybara', 'Giant Armadillo', 'Tokay Gecko', 'Impala', 'Wildebeest', 'Plains Zebra',
  'Gemsbok Oryx', 'Wombat', 'Quokka', 'Tasmanian Devil', 'Koala', 'Red Kangaroo', 'Platypus', 'Emu',
  'Clownfish', 'Pygmy Slow Loris', 'Long-snouted Spinner Dolphin', 'Blue Morpho Butterfly', 'Golden Poison Frog',
  'African Crowned Eagle', 'Wallaby', "Darwin's Finch", 'Rhinoceros Hornbill', 'Mandrill', 'Snowy Owl',
  "Lion's Mane Jellyfish", 'Okapi', 'Black Jaguar', 'Aldabra Tortoise', 'Japanese Macaque', 'Asiatic Black Bear',
  'Indian One-horned Rhino', 'Saiga Antelope', 'Eurasian Lynx', 'Iberian Lynx', 'Gray Wolf', 'Brown Bear',
  'Shortfin Mako Shark', 'Common Dolphin', 'Sea Krait', 'American Bison', 'Black-tailed Prairie Dog',
  'Chimpanzee', 'Great White Shark', 'Cape Buffalo', 'Three-toed Sloth', 'Atlantic Puffin', 'Fennec Fox',
  'Amur Tiger', 'Scalloped Hammerhead Shark', 'Golden Snub-nosed Monkey',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getThumbUrl(title) {
  const enc = encodeURIComponent(title.replace(/\s+/g, '_'));
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`,
      { headers: { 'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com)' }, signal: AbortSignal.timeout(10000) }
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
  for (let i = 0; i < ANIMALS.length; i++) {
    const title = ANIMALS[i];
    const url = await getThumbUrl(title);
    if (url) out[title] = url;
    if ((i + 1) % 10 === 0) console.error(`Fetched ${i + 1}/${ANIMALS.length}`);
    await sleep(150);
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
