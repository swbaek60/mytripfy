-- ================================================================
-- schema-v17.sql  (2026-02-27)
-- 100 Dive Sites 전면 교체
-- 세계에서 진짜 유명한 다이빙 포인트 100개 (최신 정보 기준)
-- ================================================================
-- 적용: Supabase Dashboard → SQL Editor → Run
-- ================================================================

DELETE FROM public.challenge_certifications
  WHERE challenge_id IN (
    SELECT id FROM public.challenges WHERE category = 'scuba'
  );
DELETE FROM public.challenges WHERE category = 'scuba';

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- ════════════════════════════════════════════════════════════════
-- 20pt — 세계 버킷리스트 다이빙 성지 (25개)
-- ════════════════════════════════════════════════════════════════

-- ── SOUTHEAST ASIA / CORAL TRIANGLE ──────────────────────────
('scuba','라자 암팟','Raja Ampat','ID',
 'World #1 coral biodiversity; 75% world coral species, 1,500+ fish species, pygmy seahorses',20),
('scuba','투바타하 리프','Tubbataha Reef','PH',
 'UNESCO Philippines; remote Sulu Sea atoll, 600 fish species, whale sharks year-round',20),
('scuba','코모도 국립공원','Komodo National Park','ID',
 'UNESCO dive; Manta Point aggregations, pink beach reef, hammerhead channel drift dives',20),
('scuba','시파단 섬','Sipadan Island','MY',
 'Turtle capital of the world; barracuda tornado 1,000+, hammerheads, walls to 600m',20),
('scuba','밀네 베이 파푸아뉴기니','Milne Bay, Papua New Guinea','PG',
 'Critter paradise; world record pygmy seahorse density, nudibranch heaven, WW2 wrecks',20),
('scuba','메르귀 제도 미얀마','Mergui Archipelago, Myanmar','MM',
 '800-island pristine remote; Andaman Sea untouched reefs, live-aboard only access',20),

-- ── PACIFIC ──────────────────────────────────────────────────
('scuba','팔라우 블루 코너','Palau Blue Corner','PW',
 'Most famous dive; hook into reef, grey reef sharks current ride, manta wall parade',20),
('scuba','트루크 라군 마이크로네시아','Truk Lagoon, Micronesia','FM',
 'World #1 wreck dive; 50+ Japanese WW2 ships, Zero planes, tanks, coral-encrusted fleet',20),
('scuba','코코스 아일랜드 코스타리카','Cocos Island, Costa Rica','CR',
 'Pelagic paradise; 400 hammerheads, whale sharks, manta rays, UNESCO World Heritage',20),
('scuba','다윈 아치 갈라파고스','Darwin Arch, Galápagos','EC',
 'Whale shark mass aggregations 40+; hammerheads, schools tuna, Ecuador Pacific pinnacle',20),
('scuba','통가 혹등고래 다이브','Tonga Humpback Whale Dive','TO',
 'Swim with humpback mother-calf; largest animals in water, August-October season',20),
('scuba','팔라우 SS 야마구치 난파선','Palau Wrecks, Micronesia','PW',
 'Multiple Japanese WW2 wrecks; Iro tanker, Zero Fighters, Chuyo-Maru coral-encrusted',20),

-- ── INDIAN OCEAN / AFRICA ────────────────────────────────────
('scuba','알다브라 환초 세이셸','Aldabra Atoll, Seychelles','SC',
 'UNESCO most remote; nurse sharks, Napoleon wrasse, 100,000 giant tortoise island',20),
('scuba','소다와나 베이 남아공','Sodwana Bay, South Africa','ZA',
 'Coelacanth discovered nearby; whale sharks, humpbacks, iSimangaliso Wetland Park',20),
('scuba','페르난도 데 노로냐 브라질','Fernando de Noronha, Brazil','BR',
 'UNESCO Atlantic Marine Park; spinner dolphins, lemon sharks, crystal blue visibility',20),

-- ── RED SEA ──────────────────────────────────────────────────
('scuba','SS 시스틀레고름 홍해','SS Thistlegorm, Red Sea','EG',
 'World most famous WW2 wreck; motorcycles, trucks, BSA motorcycles 30m Red Sea Egypt',20),
('scuba','브라더스 아일랜드 수단','Brothers Islands, Sudan','SD',
 'Remote Red Sea; hammerhead & thresher sharks, oceanic whitetip, Cousteau territory',20),
('scuba','말로엘 아일랜드 콜롬비아','Malpelo Island, Colombia','CO',
 'UNESCO shark sanctuary; 1,000+ hammerheads, silky sharks, whale sharks, deepest walls',20),

-- ── ATLANTIC / EUROPE ────────────────────────────────────────
('scuba','그레이트 블루 홀 벨리즈','Great Blue Hole, Belize','BZ',
 'UNESCO giant marine sinkhole 300m wide; stalactites 40m, bull sharks, Jacques Cousteau',20),
('scuba','실프라 열곡 아이슬란드','Silfra Fissure, Iceland','IS',
 'Dive between tectonic plates; 100m+ visibility, 2°C glacial meltwater, crystal clarity',20),
('scuba','스카파 플로 스코틀랜드','Scapa Flow, Scotland','GB',
 'WW1 German Imperial Fleet scuttled 1919; 7 warships intact, best wreck UK diving',20),
('scuba','타이거 비치 바하마','Tiger Beach, Bahamas','BS',
 'Tiger shark capital; reliable 3-5m encounters, lemon sharks, great hammerhead season',20),

-- ── SS President Coolidge / South Pacific ─────────────────────
('scuba','SS 프레지던트 쿨리지 바누아투','SS President Coolidge, Vanuatu','VU',
 'Largest diveable luxury liner wreck; 22,000 tonne, 180m long, Art Deco interiors, 30m',20),
('scuba','HMHS 브리타닉 난파선 그리스','HMHS Britannic Wreck, Aegean','GR',
 'Titanic''s sister ship; 48,000 tonne largest diveable wreck 120m, Kea Island Greece',20),
('scuba','안다바다오카 마다가스카르','Andavadoaka, Madagascar','MG',
 'Pristine remote SW Madagascar; whale shark season June, octopus fishery, untouched reef',20),

-- ════════════════════════════════════════════════════════════════
-- 15pt — 세계 프리미어 다이빙 포인트 (45개)
-- ════════════════════════════════════════════════════════════════

-- ── SOUTHEAST ASIA ───────────────────────────────────────────
('scuba','누사 페니다 발리','Nusa Penida, Bali','ID',
 'Mola-mola (ocean sunfish) encounters July-Nov; Manta Point cleaning station Bali',15),
('scuba','리슐리외 록 태국','Richelieu Rock, Thailand','TH',
 'Thailand best site; whale shark station, seahorses, mantis shrimp, barracuda schools',15),
('scuba','시밀란 제도 태국','Similan Islands, Thailand','TH',
 'Andaman granite boulder dives; leopard sharks, seasonal Nov-April, UNESCO proposed',15),
('scuba','와카토비 인도네시아','Wakatobi, Indonesia','ID',
 'Remote Sulawesi; pristine house reef, wall diving, pigmy seahorse, tidal channel magic',15),
('scuba','부나켄 인도네시아','Bunaken, Indonesia','ID',
 'Wall diving capital; 90-degree vertical walls 40m, green turtle, barracuda, Napoleon',15),
('scuba','아포 아일랜드 필리핀','Apo Island, Philippines','PH',
 'Community-managed turtle sanctuary; green sea turtles feeding coral, reef recovery model',15),
('scuba','모알보알 필리핀','Moalboal, Philippines','PH',
 'Sardine tornado million fish; thresher sharks nearby, turtle reef, Cebu Visayas',15),
('scuba','코론 베이 필리핀','Coron Bay, Philippines','PH',
 'WW2 Japanese ghost fleet; 24 wrecks, Irako provisioning ship, lotus-covered Akitsushima',15),
('scuba','코타이 태국','Koh Tao, Thailand','TH',
 'World''s 3rd busiest dive certification; whale shark encounters Gulf of Thailand accessible',15),
('scuba','말라파스쿠아 섬 필리핀','Malapascua Island, Philippines','PH',
 'Thresher sharks sunrise; Monad Shoal cleaning station 25m, Cebu Philippines must-dive',15),
('scuba','풀라우 웨 인도네시아','Pulau Weh, Indonesia','ID',
 'Sabang Aceh; Blue Sapphire pinnacle, nudibranch, whaleshark year-round visibility 30m',15),

-- ── PACIFIC ──────────────────────────────────────────────────
('scuba','솔로몬 제도','Solomon Islands','SB',
 'WW2 Iron Bottom Sound; 30+ wrecks, USS Aaron Ward, pristine undisturbed reefs Tulagi',15),
('scuba','랑기로아 프랑스령 폴리네시아','Rangiroa, French Polynesia','PF',
 'World''s second largest atoll; Tiputa Pass drift, dolphin school, grey reef shark parade',15),
('scuba','파카라바 프랑스령 폴리네시아','Fakarava, French Polynesia','PF',
 'UNESCO biosphere; grey reef shark wall 700+, grouper spawning, South Pass drift dive',15),
('scuba','퍼시픽 하버 피지','Pacific Harbor, Fiji','FJ',
 'Bull shark dive with 80+; bait feeding ritual, reef sharks, Beqa Lagoon Fiji landmark',15),
('scuba','야프 섬 미크로네시아','Yap Island, Micronesia','FM',
 'Resident manta ray sanctuary; year-round mantas, grey reef sharks, mandarin fish',15),
('scuba','코나 만타 나이트 다이브 하와이','Kona Manta Ray Night Dive, Hawaii','US',
 'Most famous night dive; 20+ mantas feed on plankton in light beam, magical ballet',15),
('scuba','뉴어 태평양','Niue, South Pacific','NU',
 'Clearest ocean visibility 80m+; sea snakes, humpback, spinner dolphins, limestone caves',15),

-- ── MALDIVES / INDIAN OCEAN ──────────────────────────────────
('scuba','북말레 환초 몰디브','North Malé Atoll, Maldives','MV',
 'Hammerhead pinnacle; tiger sharks, whale sharks, napoleon, Rasdhoo Atoll kandu dive',15),
('scuba','바 환초 몰디브','Baa Atoll, Maldives','MV',
 'Hanifaru Bay UNESCO; manta ray aggregation 200+, whale shark, May-November season',15),
('scuba','안다만 제도 인도','Andaman Islands, India','IN',
 'Barracuda City; Pilot Whale Rock, pristine Bay of Bengal reef, 12 endemic species',15),
('scuba','마피아 아일랜드 탄자니아','Mafia Island, Tanzania','TZ',
 'East Africa whale shark Oct-Mar; Chole Bay marine park pristine, very few visitors',15),
('scuba','토포 비치 모잠비크','Tofo Beach, Mozambique','MZ',
 'Manta reef aggregations; whale shark daily, dugong grassbeds, 30m wall dives Inhambane',15),
('scuba','마요트 인도양','Mayotte, Indian Ocean','YT',
 'French territory Indian Ocean; hammerhead schools, whale shark, dugong turtle nesting',15),
('scuba','노시 베 마다가스카르','Nosy Be, Madagascar','MG',
 'Whale shark aggregation Oct; pristine reefs, whale shark swim, lemur island topside',15),

-- ── RED SEA / MIDDLE EAST ────────────────────────────────────
('scuba','라스 모하메드 이집트','Ras Mohammed, Egypt','EG',
 'Red Sea flagship; Shark & Yolanda Reef wall 60m, glassfish tunnels, jackfish tornado',15),
('scuba','블루 홀 다합 이집트','Blue Hole Dahab, Egypt','EG',
 'Famous sinkhole 130m; 52m arch freedive temptation, canyon entry Dahab Sinai classic',15),
('scuba','지부티 고래상어','Djibouti Whale Shark, Djibouti','DJ',
 'Bay of Tadjoura aggregation; Nov-Jan whale shark school snorkel-dive, warmest sea',15),
('scuba','에일라트 이스라엘','Eilat, Israel','IL',
 'Moses Rock undercut reef; Japanese Gardens, year-round 21°C, accessible Red Sea',15),
('scuba','아카바 요르단','Aqaba, Jordan','JO',
 'Cedar Pride wreck 30m; tank wreck 10m, Rainbow Reef walls, Red Sea affordable gateway',15),

-- ── AFRICA ───────────────────────────────────────────────────
('scuba','알리왈 쇼올 남아공','Aliwal Shoal, South Africa','ZA',
 'Ragged-tooth shark sanctuary; oceanic blacktip, tiger sharks, 3 wrecks offshore KwaZulu',15),
('scuba','와타무 해양 공원 케냐','Watamu Marine Park, Kenya','KE',
 'East Africa coral garden; whale shark season, sea turtles, Turtle Bay protected marine',15),
('scuba','음냄바 환초 잔지바르','Mnemba Atoll, Zanzibar','TZ',
 'East Africa turtle cleaning; spinner dolphin, manta ray, pristine lagoon Tanzania',15),

-- ── CARIBBEAN / CENTRAL AMERICA ─────────────────────────────
('scuba','유카탄 세노테 멕시코','Cenotes Yucatan, Mexico','MX',
 'Underwater cave system; crystal freshwater stalactites, halocline curtain, Riviera Maya',15),
('scuba','코수멜 멕시코','Cozumel, Mexico','MX',
 'Caribbean drift classic; Palancar Reef wall, Santa Rosa Canyon, turtle cleaning station',15),
('scuba','하르디네스 데 라 레이나 쿠바','Jardines de la Reina, Cuba','CU',
 'Pristine Caribbean coral; permit, tarpon, silky sharks, grouper density, live-aboard only',15),
('scuba','로아탄 온두라스','Roatan, Honduras','HN',
 'Bay Islands barrier reef; whale shark encounters, Mesoamerican reef second largest',15),
('scuba','벨리즈 배리어 리프','Belize Barrier Reef','BZ',
 'UNESCO second largest reef; nurse sharks sleeping, manatees, 500 fish species coastal',15),
('scuba','배트 아일랜드 코스타리카','Bat Islands, Costa Rica','CR',
 'Bull shark congregation; strong current Guanacaste 50+ bulls July-December season',15),
('scuba','코이바 섬 파나마','Coiba Island, Panama','PA',
 'UNESCO Pacific Panama; whale sharks, humpback whales, endemic species, pristine isolated',15),

-- ── EUROPE / ATLANTIC ────────────────────────────────────────
('scuba','아조레스 포르투갈','Azores, Portugal','PT',
 'Blue shark cage dive; sperm whale snorkel, 6 shark species, mid-Atlantic volcanic',15),
('scuba','엘 이에로 해양보호구역 스페인','El Hierro Marine Reserve, Spain','ES',
 'Europe first biosphere reserve dive; angel sharks, barracuda, endemic lava tube fish',15),
('scuba','노르웨이 피요르드','Norway Fjord Diving, Norway','NO',
 'Cold water clarity 30m+; Atlantic halibut, wolf fish, plumose anemone walls fjord',15),
('scuba','코스테르피오르덴 스웨덴','Kosterfjorden, Sweden','SE',
 'Sweden deepest point; sea fan meadows, nudibranchs September, cold Nordic fjord',15),
('scuba','이스터 아일랜드 칠레','Easter Island, Chile','CL',
 'Clearest Pacific; underwater Moai sculpture garden, endemic fish, 100 fish species',15),

-- ════════════════════════════════════════════════════════════════
-- 10pt — 주목할 다이빙 포인트 (30개)
-- ════════════════════════════════════════════════════════════════

-- ── PACIFIC / AUSTRALIA ──────────────────────────────────────
('scuba','그레이트 배리어 리프 호주','Great Barrier Reef, Australia','AU',
 'World largest reef system; 2,300km UNESCO, Cod Hole potato grouper, Minke whale winter',10),
('scuba','닝갈루 리프 호주','Ningaloo Reef, Australia','AU',
 'Western Australia reef; whale shark snorkel March-July, manta ray cleaning stations',10),
('scuba','로드 하우 아일랜드 호주','Lord Howe Island, Australia','AU',
 'World southernmost coral reef; ball''s pyramid, garibaldi, clear subtropical UNESCO',10),
('scuba','뉴칼레도니아 상어만','New Caledonia Shark Bay','NC',
 'Pacific largest lagoon UNESCO; bull shark feeding Boulari Pass, Napoleon wrasse',10),
('scuba','노퍽 아일랜드 태평양','Norfolk Island, Pacific','NF',
 'HMAS Sirius wreck 1790; big fish aggregations, coral covered, remote Pacific clarity',10),
('scuba','사이판 블루 홀 북마리아나','Saipan Blue Hole, Northern Marianas','MP',
 'Vertical sinkhole 27m; WWII Japanese Zero fighter 30m, Grotto formations crystal clear',10),
('scuba','팔라우 젤리피시 레이크','Jellyfish Lake, Palau','PW',
 'Snorkel among million stingless jellyfish; UNESCO, unique lake ecosystem Eil Malk Island',10),

-- ── SOUTHEAST ASIA ───────────────────────────────────────────
('scuba','수빅 베이 필리핀','Subic Bay Wrecks, Philippines','PH',
 'WW2 US Navy wrecks; El Capitan, Oryoku Maru, octopus colonies, easy dive training',10),
('scuba','그린 아일랜드 타이완','Green Island, Taiwan','TW',
 'Taiwan best diving; rare underwater hot spring, 230 coral species, manta cleaning',10),
('scuba','코 리페 태국','Koh Lipe, Thailand','TH',
 'Andaman Sea clarity; leopard sharks, giant clam, soft coral, Adang Island archipelago',10),

-- ── INDIAN OCEAN ─────────────────────────────────────────────
('scuba','모리셔스','Mauritius','MU',
 'Underwater sand waterfall illusion; whale shark season, 25m Cathedral dive wall',10),
('scuba','코모로 제도','Comoro Islands','KM',
 'Coelacanth sanctuary; living fossil 400M years, Mohéli Marine Park whale shark',10),
('scuba','라카디브 제도 인도','Lakshadweep Islands, India','IN',
 'Pristine Indian Ocean atoll; manta rays, barracuda, 36 atolls untouched reef system',10),

-- ── RED SEA / MIDDLE EAST ────────────────────────────────────
('scuba','무스카트 다이야니야트 오만','Muscat Daymaniyat, Oman','OM',
 'Oman marine reserve; green turtle nesting, spinner dolphin, dugong seasonal sighting',10),
('scuba','사우디아라비아 홍해 네옴','NEOM Red Sea, Saudi Arabia','SA',
 'Untouched Saudi Red Sea; pristine reef opening, endemic species, pristine visibility',10),
('scuba','레바논 티레 해양보호구역','Tyre Marine Reserve, Lebanon','LB',
 'Byzantine columns 10m deep; Phoenician anchors, amphora fields Tyre Mediterranean',10),

-- ── EUROPE / MEDITERRANEAN ───────────────────────────────────
('scuba','제노비아 키프로스','Zenobia, Cyprus','CY',
 'Best Mediterranean wreck; 178m Swedish ferry sank 1980 maiden voyage, 40m depth',10),
('scuba','란사로테 MUSA 스페인','Lanzarote MUSA, Spain','ES',
 'Underwater sculpture museum; 300 artworks colonized by sea life, Canary Islands',10),
('scuba','마르세유 칼랑크 프랑스','Marseille Calanques, France','FR',
 'Marine park; fan corals, octopus, gorgonian, WW2 landing craft wreck, rare moray',10),
('scuba','흐바르 크로아티아','Hvar, Croatia','HR',
 'Adriatic sea caves; Vis Island WW2 wrecks, blue cave bioluminescence, clear Adriatic',10),
('scuba','산토리니 칼데라 그리스','Santorini Caldera, Greece','GR',
 'Volcanic dive; fumaroles bubbles, Roman amphora fields, unique Mediterranean geology',10),
('scuba','보드룸 터키','Bodrum Wrecks, Turkey','TR',
 'Aegean ancient wrecks; Byzantine 7th century ships, amphora trails, Castle St Peter',10),
('scuba','메노르카 동굴 스페인','Menorca Sea Caves, Spain','ES',
 'Mediterranean sea caves; 7th century Byzantine wreck San Nicolau, posidonia meadows',10),

-- ── CARIBBEAN / AMERICAS ────────────────────────────────────
('scuba','플로리다 키스 미국','Florida Keys, USA','US',
 'John Pennekamp Coral Reef first underwater park; Christ of the Abyss statue 25m',10),
('scuba','플로리다 스프링스 미국','Florida Springs, USA','US',
 'Crystal River cave springs; 22°C year-round, manatee winter sanctuary, 30m clarity',10),
('scuba','바하 칼리포르니아 멕시코','Baja California Sea of Cortez','MX',
 'Cabo Pulmo Marine Park; mobula ray tornado, playful sea lions, whale shark season',10),
('scuba','RMS 론 영국령 버진 아일랜드','RMS Rhone, British Virgin Islands','VG',
 'Classic Caribbean wreck; 1867 HMS Rhone, 120 years coral growth, bow 8m stern 24m',10),
('scuba','캠벨 강 캐나다','Campbell River, Canada','CA',
 'Giant Pacific octopus; wolf eels, plumose anemones, nudibranchs cold Pacific dive',10),
('scuba','버뮤다','Bermuda','BM',
 'Atlantic wrecks 300+; Bermuda Triangle mystique, moray eel, clear water wreck diving',10),
('scuba','스팅레이 시티 케이만','Stingray City, Cayman Islands','KY',
 'Grand Cayman sandbar; hundreds friendly southern stingrays, snorkel, first-dive spot',10);

-- ================================================================
-- 완료: 100개 다이빙 포인트 교체
-- 20pt 25개 | 15pt 45개 | 10pt 30개 = 100개
-- 모든 title_en = 구체적 포인트/지역명 (국기 사진 방지)
-- ================================================================
