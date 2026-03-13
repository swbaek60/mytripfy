const titles = ['Kenai River','Skeena River','Grand Cascapedia River','Florida Keys','Kona, Hawaii','Andros Island, Bahamas','Jardines de la Reina, Cuba','Pinas Bay, Panama','Iztapa, Guatemala','Rio Grande, Tierra del Fuego','Palena River, Chile','Cinaruco River, Venezuela','Inirida River, Colombia','Alta River, Norway','Canary Islands, Spain','Azores, Portugal','Kola Peninsula, Russia','Ponoi River, Russia','Congo River, DRC','Cosmoledo Atoll, Seychelles','Kamchatka Peninsula, Russia','Yarlung Tsangpo, Tibet','Eg-Uur River, Mongolia','Chiang Khong, Thailand','Mamberamo River, Papua','Madison River, Montana','Bighorn River, Montana','Deschutes River, Oregon','Green River, Wyoming','San Juan River, New Mexico','Naknek River, Alaska','Snake River, Idaho','Bow River, Alberta','Miramichi River, New Brunswick','Nipigon River, Ontario','Boca Grande Pass, Florida','Cape Cod, Massachusetts','Everglades, Florida','Cabo San Lucas, Mexico','Cozumel, Mexico','Puerto Vallarta, Mexico','Corrientes Province, Argentina','Amazon River, Brazil','Pantanal, Brazil','Guanacaste, Costa Rica','Madre de Dios River, Peru','Parana River, Argentina','Lofoten Islands, Norway','Ellidaár River, Iceland','Tungnaá River, Iceland','River Tay, Scotland','River Spey, Scotland','River Tweed, Scotland','Ebro River, Spain','Ramganga River, India','Cauvery River, India','Hokkaido, Japan','Sarawak, Borneo, Malaysia','Zambezi River, Zimbabwe','Lake Tanganyika, Tanzania','Bazaruto Archipelago, Mozambique','Watamu, Kenya','Zanzibar Channel, Tanzania','Malindi, Kenya','Lake Baikal, Russia','Amur River, Russia','Shiretoko Peninsula, Japan','Yasawa Islands, Fiji','Palau, Micronesia','Mauritius','Maldives','Musandam Fjords, Oman','Solomon Islands','Papua New Guinea','Lake Erie, USA','Boundary Waters, Minnesota','Chesapeake Bay, Maryland','Louisiana Bayou, USA','Bocas del Toro, Panama','Cape Verde Islands','River Moy, Ireland','Connemara, Ireland','Lake Inari, Finland','Lake Vänern, Sweden','Bug River, Poland','Po River, Italy','Volga River Delta, Russia','Cape Point, South Africa','Lake Victoria, Kenya','Lake Malawi, Malawi','Niassa Reserve, Mozambique','Walvis Bay, Namibia','Ningaloo Reef, Australia','Andaman Islands, India','Kerala Backwaters, India','Mekong Delta, Vietnam','Lake Biwa, Japan','Tonga, South Pacific','Christmas Island, Kiribati','New Caledonia']

const POOL = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Altafjorden_in_Alta%2C_Troms_og_Finnmark%2C_Norway%2C_2022_August.jpg/640px-Altafjorden_in_Alta%2C_Troms_og_Finnmark%2C_Norway%2C_2022_August.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Cape_of_Good_Hope_from_Cape_Point.jpg/640px-Cape_of_Good_Hope_from_Cape_Point.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/01_New_Zealand_Lake_Taupo.jpg/640px-01_New_Zealand_Lake_Taupo.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Map_of_Hokkaido.jpg/640px-Map_of_Hokkaido.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Everglades_National_Park%2C_Florida_LOC_83692553.jpg/640px-Everglades_National_Park%2C_Florida_LOC_83692553.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Bocas_del_Toro_Panama.jpg/640px-Bocas_del_Toro_Panama.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Reine_Lofoten.jpg/640px-Reine_Lofoten.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lake_Erie_Shoreline_%283371480628%29.jpg/640px-Lake_Erie_Shoreline_%283371480628%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Teide_Volcano%2C_Canary_Islands%2C_Spain.jpg/640px-Teide_Volcano%2C_Canary_Islands%2C_Spain.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg/640px-Le_Morne_Beach_in_Mauritius_%2853698123559%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lake_Furnas%2C_Sao_Miguel_Island%2C_Azores%2C_Portugal.jpg/640px-Lake_Furnas%2C_Sao_Miguel_Island%2C_Azores%2C_Portugal.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Amazon_River_ESA387332.jpg/640px-Amazon_River_ESA387332.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Florida_keys_from_space.jpg/640px-Florida_keys_from_space.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Ice-fishing_on_Baikal_5.jpg/640px-Ice-fishing_on_Baikal_5.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg/640px-ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Kenai_River_Alaska.jpg/640px-Kenai_River_Alaska.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Torres_del_Paine%2C_Chile_by_Karen_Chan_16.jpg/640px-Torres_del_Paine%2C_Chile_by_Karen_Chan_16.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Canyon_River_Tree_%28165872763%29.jpeg/640px-Canyon_River_Tree_%28165872763%29.jpeg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/3Falls_Niagara.jpg/640px-3Falls_Niagara.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg/640px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Serengeti-Landscape-2012.JPG/640px-Serengeti-Landscape-2012.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Bora_Bora_ISS006.jpg/640px-Bora_Bora_ISS006.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/River_Tay_at_Killiecrankie.jpg/640px-River_Tay_at_Killiecrankie.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Boundary_Waters_Canoe_Area_Wilderness_%2815440%29.jpg/640px-Boundary_Waters_Canoe_Area_Wilderness_%2815440%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/1_huanglong_pools_aerial_2011.jpg/640px-1_huanglong_pools_aerial_2011.jpg',
]

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  return h
}

const entries = titles.map((t) => [t, POOL[hash(t) % POOL.length]])
const obj = Object.fromEntries(entries)
console.log(JSON.stringify(obj, null, 2))
