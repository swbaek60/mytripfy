-- ================================================================
-- schema-v15.sql  (2026-02-27)
-- 100 Fishing Spots 전면 교체
-- 세계에서 진짜 유명한 낚시 명소 100개 (강·호수·바다)
-- 최신 현황 기준, 현재 접근 가능한 스팟만 선정
-- ================================================================
-- 적용: Supabase Dashboard → SQL Editor → Run
-- ================================================================

DELETE FROM public.challenge_certifications
  WHERE challenge_id IN (
    SELECT id FROM public.challenges WHERE category = 'fishing'
  );
DELETE FROM public.challenges WHERE category = 'fishing';

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- ════════════════════════════════════════════════════════════════
-- 20pt — 세계 버킷리스트 낚시 성지 (25개)
-- ════════════════════════════════════════════════════════════════

-- ── NORTH AMERICA ────────────────────────────────────────────
('fishing','케나이 강 알래스카','Kenai River','US',
 'World record king salmon 44kg; July combat fishing elbow-to-elbow, Soldotna Alaska',20),
('fishing','스케나 강 스틸헤드','Skeena River','CA',
 'Holy grail of fly fishing; wild steelhead to 15kg, Terrace BC wilderness float trip',20),
('fishing','그랜드 캐스카페디아 강','Grand Cascapedia River','CA',
 'Atlantic salmon on private beats; Quebec legend 40lb+ fish, guided canoe traditional',20),

-- ── CENTRAL AMERICA / CARIBBEAN ─────────────────────────────
('fishing','플로리다 키스','Florida Keys','US',
 'Grand Slam: tarpon, permit, bonefish same day; flats fly fishing Mecca, year-round',20),
('fishing','코나 하와이','Kona, Hawaii','US',
 'Pacific blue marlin capital; Kona Coast 1000lb marlin, International Billfish Tournament',20),
('fishing','앤드로스 아일랜드 바하마','Andros Island, Bahamas','BS',
 'Bonefish Mecca; shallow sand flats tailing fish, 100-mile bonefishing paradise Nassau',20),
('fishing','하르디네스 데 라 레이나 쿠바','Jardines de la Reina, Cuba','CU',
 'Grand Slam paradise; pristine reef, permit tarpon bonefish in one day, live-aboard only',20),
('fishing','피나스 베이 파나마','Pinas Bay, Panama','PA',
 'World record black marlin & Pacific sailfish; Tropic Star Lodge, most famous Panama',20),
('fishing','이스타파 과테말라','Iztapa, Guatemala','GT',
 'World record Pacific sailfish releases; 50+ fish/day season, Sailfish Oasis Pacific',20),

-- ── SOUTH AMERICA ───────────────────────────────────────────
('fishing','리오 그란데 티에라 델 푸에고','Rio Grande, Tierra del Fuego','AR',
 'World record sea-run brown trout 36kg; wind-swept Patagonia rivers, January-March',20),
('fishing','팔레나 강 파타고니아','Palena River, Chile','CL',
 'Wild rainbow trout in remote Patagonia; helicopter access Aysen wilderness Chile',20),
('fishing','시나루코 강 베네수엘라','Cinaruco River, Venezuela','VE',
 'Payara vampire fish 4-inch fangs; Apure Llanos sabre-tooth predator 25lb+',20),
('fishing','이니리다 강 콜롬비아','Inirida River, Colombia','CO',
 'World record peacock bass habitat; Guainia river system remote Amazon Colombia',20),

-- ── EUROPE / RUSSIA ─────────────────────────────────────────
('fishing','알타 강 노르웨이','Alta River, Norway','NO',
 'World greatest Atlantic salmon river; Finnmark Norway king of rivers 50lb+ salmon',20),
('fishing','카나리아 제도 참치','Canary Islands, Spain','ES',
 '500kg Atlantic bluefin tuna migration; giant bluefin January-March, El Hierro waters',20),
('fishing','아조레스 포르투갈','Azores, Portugal','PT',
 'Bluefin tuna & blue marlin; mid-Atlantic volcanic islands, world class big game July',20),
('fishing','콜라 반도 러시아','Kola Peninsula, Russia','RU',
 'Atlantic salmon paradise; Varzuga Yokanga rivers, prolific salmon runs June-August',20),
('fishing','포노이 강 러시아','Ponoi River, Russia','RU',
 'Most prolific Atlantic salmon per rod; remote Kola wilderness, helicopter access lodge',20),

-- ── AFRICA ──────────────────────────────────────────────────
('fishing','콩고 강 민주공화국','Congo River, DRC','CD',
 'Goliath tigerfish 50kg; prehistoric predator razor teeth, Congo River rapids Malebo Pool',20),
('fishing','코스몰레도 환초 세이셸','Cosmoledo Atoll, Seychelles','SC',
 'Giant trevally on fly; 40kg GT hunting shallow flats, pristine Indian Ocean atoll',20),

-- ── ASIA ─────────────────────────────────────────────────────
('fishing','캄차카 반도 러시아','Kamchatka Peninsula, Russia','RU',
 'Pacific salmon paradise; 6 species untouched rivers, helicopter lodge, wild Kamchatka',20),
('fishing','얄룽창포 강 티베트','Yarlung Tsangpo, Tibet','CN',
 'World highest river fishing 4,000m; snow trout Himalayan mahseer, roof of the world',20),
('fishing','에그 우르 강 몽골','Eg-Uur River, Mongolia','MN',
 'World largest salmonid taimen 60kg+; horseback access Mongolia wilderness, catch-release',20),
('fishing','치앙콩 태국','Chiang Khong, Thailand','TH',
 'Mekong giant catfish 293kg world record; critically endangered, northern Thailand Mekong',20),
('fishing','마암베라모 강 파푸아','Mamberamo River, Papua','ID',
 'Black bass in untouched Papua rivers; fly-in-only remote Indonesia wilderness fishing',20),

-- ════════════════════════════════════════════════════════════════
-- 15pt — 세계 프리미어 낚시 명소 (49개)
-- ════════════════════════════════════════════════════════════════

-- ── NORTH AMERICA FRESHWATER ─────────────────────────────────
('fishing','매디슨 강 몬태나','Madison River, Montana','US',
 'Blue-ribbon trout stream; 3,000 trout/mile, Yellowstone gateway, nymph dry-fly classic',15),
('fishing','빅혼 강 몬태나','Bighorn River, Montana','US',
 'Trophy tailwater trout; Yellowtail Dam releases, 20-inch brown rainbow, Crow Agency',15),
('fishing','데슈츠 강 오리건','Deschutes River, Oregon','US',
 'Premier steelhead and trout; summer steelhead August-November, Maupin high desert canyon',15),
('fishing','그린 강 와이오밍','Green River, Wyoming','US',
 'Blue-ribbon tailwater; trophy rainbow brown below Flaming Gorge Dam, Seedskadee guide',15),
('fishing','샌 후안 강 뉴멕시코','San Juan River, New Mexico','US',
 'Trophy tailwater trout; Navajo Dam cold release, 20-inch plus rainbows Aztec NM',15),
('fishing','나크넥 강 알래스카','Naknek River, Alaska','US',
 'Sockeye salmon king salmon; Bristol Bay Alaska world largest sockeye run July',15),
('fishing','스네이크 강 아이다호','Snake River, Idaho','US',
 'Steelhead and chinook salmon; wild Snake steelhead September-January, Hell''s Canyon',15),
('fishing','보우 강 앨버타','Bow River, Alberta','CA',
 'World class brown trout; Calgary city river, drift boat brown rainbow, October prime',15),
('fishing','미라미치 강 뉴브런즈윅','Miramichi River, New Brunswick','CA',
 'Atlantic salmon heartland; New Brunswick Canada, crown jewel salmon, summer fall runs',15),
('fishing','니피곤 강 온타리오','Nipigon River, Ontario','CA',
 'World record brook trout 6.57lb 1915; remote fly-in Lake Nipigon system Ontario',15),

-- ── NORTH AMERICA SALTWATER ─────────────────────────────────
('fishing','보카 그란데 패스 플로리다','Boca Grande Pass, Florida','US',
 'Tarpon capital; June tarpon 200lb schooling pass, world famous snook cobia grouper',15),
('fishing','케이프 코드 매사추세츠','Cape Cod, Massachusetts','US',
 'Striped bass surfcasting classic; Montauk Point autumn blitz, bluefish, fall migration',15),
('fishing','에버글레이즈 플로리다','Everglades, Florida','US',
 'Snook and redfish backcountry; Ten Thousand Islands kayak, Florida panhandle flats',15),
('fishing','카보 산 루카스 멕시코','Cabo San Lucas, Mexico','MX',
 'Striped marlin and dorado corridor; November-April billfish, Pisces Fleet Baja California',15),
('fishing','코수멜 멕시코','Cozumel, Mexico','MX',
 'Atlantic blue marlin; Caribbean deep blue Cozumel, 600-800lb marlin July-September',15),
('fishing','푸에르토 바야르타 멕시코','Puerto Vallarta, Mexico','MX',
 'Pacific sailfish season Nov-Jan; striped marlin dorado, El Morro Bank Mexico Pacific',15),

-- ── SOUTH AMERICA ───────────────────────────────────────────
('fishing','코리엔테스 아르헨티나','Corrientes Province, Argentina','AR',
 'Golden dorado acrobatic game fish; Rio Pirapo Corrientes, electric gold in fast water',15),
('fishing','아마존 강 브라질','Amazon River, Brazil','BR',
 'Peacock bass and pirarucu; jungle lodge fly fishing, world''s most prized freshwater',15),
('fishing','판타날 브라질','Pantanal, Brazil','BR',
 'Golden dorado piranha tucunare; world largest wetland fishing, Corumba accessibility',15),
('fishing','과나카스테 코스타리카','Guanacaste, Costa Rica','CR',
 'Roosterfish unique Pacific game fish; dramatic dorsal fin Nosara Samara Peninsula',15),
('fishing','마드레 데 디오스 강 페루','Madre de Dios River, Peru','PE',
 'Peacock bass remote jungle; Inkaterra lodge Amazon Peru, record tucunaré on fly',15),
('fishing','파라나 강 아르헨티나','Parana River, Argentina','AR',
 'Golden dorado and surubi catfish; second longest SA river, Entre Rios province',15),

-- ── EUROPE ──────────────────────────────────────────────────
('fishing','로포텐 제도 노르웨이','Lofoten Islands, Norway','NO',
 'Arctic cod and coalfish; traditional wooden boats Henningsvaer Svolvaer winter drama',15),
('fishing','엘리다 강 아이슬란드','Ellidaár River, Iceland','IS',
 'Wild Atlantic salmon through capital; Reykjavik urban river salmon, June-September',15),
('fishing','퉁나 강 아이슬란드','Tungnaá River, Iceland','IS',
 'Remote Iceland highland salmon; Tungnafjot system August prime run, wilderness camp',15),
('fishing','테이 강 스코틀랜드','River Tay, Scotland','GB',
 'Scotland premier salmon river; Kenmore Aberfeldy beats, spring salmon, historical record',15),
('fishing','스페이 강 스코틀랜드','River Spey, Scotland','GB',
 'Spey casting technique origin; Grantown-on-Spey Ballindalloch, whisky country salmon',15),
('fishing','트위드 강 스코틀랜드','River Tweed, Scotland','GB',
 'Atlantic salmon border river; Kelso Berwick beats, Scotland-England, autumn powerhouse',15),
('fishing','에브로 강 스페인','Ebro River, Spain','ES',
 'European wels catfish 100kg+; Mequinenza reservoir Spain, monster catfish capital',15),
('fishing','라마간가 강 인도','Ramganga River, India','IN',
 'Golden mahseer 50kg; Jim Corbett NP Uttarakhand, sacred fish India''s greatest game',15),
('fishing','카베리 강 인도','Cauvery River, India','IN',
 'Mahseer fly fishing; humpback mahseer Karnataka Tamil Nadu, Galibore camp classic',15),
('fishing','홋카이도 일본','Hokkaido, Japan','JP',
 'Itou (Japanese taimen) 1m+; Shiretoko UNESCO rivers, brown trout wild hokkaido',15),
('fishing','사라왁 보르네오 말레이시아','Sarawak, Borneo, Malaysia','MY',
 'Toman giant snakehead; Batang Ai jungle lakes, belida, sebarau Borneo Malaysia',15),

-- ── AFRICA ──────────────────────────────────────────────────
('fishing','잠베지 강 짐바브웨','Zambezi River, Zimbabwe','ZW',
 'Tigerfish below Victoria Falls; rapids and pools Zimbabwe Zambia border, September',15),
('fishing','탕가니카 호수 탄자니아','Lake Tanganyika, Tanzania','TZ',
 'World''s longest deepest lake; nile perch tigerfish, Mahale Mountains Kigoma Tanzania',15),
('fishing','바자루토 제도 모잠비크','Bazaruto Archipelago, Mozambique','MZ',
 'Sailfish, blue marlin; Indian Ocean offshore Inhambane, giant trevally reef fishing',15),
('fishing','와타무 케냐','Watamu, Kenya','KE',
 'Billfish capital Kenya coast; Watamu Marine Park March-April striped marlin, grouper',15),
('fishing','잔지바르 해협 탄자니아','Zanzibar Channel, Tanzania','TZ',
 'Blue marlin, yellowfin tuna; Indo-Pacific meeting point, Pemba Island offshore trophy',15),
('fishing','말린디 케냐','Malindi, Kenya','KE',
 'Striped marlin and sailfish; Malindi Marine Reserve, March-April prime season Kenya',15),
('fishing','바이칼 호수 러시아','Lake Baikal, Russia','RU',
 'Baikal omul ice fishing; world''s deepest lake, taimen giant grayling, Listvyanka winter',15),
('fishing','아무르 강 러시아','Amur River, Russia','RU',
 'Itou salmon 100kg+ and taimen; Russian-Chinese border Amur system, extreme remote',15),

-- ── ASIA ─────────────────────────────────────────────────────
('fishing','홋카이도 시레토코','Shiretoko Peninsula, Japan','JP',
 'Wild itou salmon UNESCO wilderness; Shiretoko rivers permit fishing, bear-watching',15),
('fishing','야스와 제도 피지','Yasawa Islands, Fiji','FJ',
 'Giant trevally popping; Fiji remote islands, coral popping bluewater, reef variety',15),
('fishing','팔라우 미크로네시아','Palau, Micronesia','PW',
 'Dogtooth tuna jigging and GT; Ngemelis wall and blue corners, Pacific bluewater',15),
('fishing','모리셔스','Mauritius','MU',
 'Blue marlin and yellowfin tuna; Le Morne peninsula Indian Ocean IGFA records',15),
('fishing','몰디브','Maldives','MV',
 'Giant trevally and wahoo; pristine atolls, popping jigging, bonefish flats Maldives',15),
('fishing','무산담 피요르드 오만','Musandam Fjords, Oman','OM',
 'Dogtooth tuna and GT jigging; Arabian Sea Musandam peninsula, grouper amberjack',15),
('fishing','솔로몬 제도','Solomon Islands','SB',
 'Remote Melanesian GT popping; Munda Ghizo Marovo lagoon, untouched Pacific islands',15),
('fishing','파푸아 뉴기니','Papua New Guinea','PG',
 'Black bass and giant trevally; Cape Vogel Madang, remote PNG pristine reefs',15),

-- ════════════════════════════════════════════════════════════════
-- 10pt — 주목할 낚시 명소 (26개)
-- ════════════════════════════════════════════════════════════════

-- ── NORTH AMERICA ───────────────────────────────────────────
('fishing','레이크 에리','Lake Erie, USA','US',
 'Walleye capital of the world; Great Lakes trophy walleye, perch smallmouth bass Ohio',10),
('fishing','바운더리 워터스 미네소타','Boundary Waters, Minnesota','US',
 'Wilderness canoe fishing; northwoods walleye muskie northern pike, BWCA permit Canada',10),
('fishing','체사피크 만 메릴랜드','Chesapeake Bay, Maryland','US',
 'Striped bass blue crab; Chesapeake Bay largest estuary USA, rockfish surfcasting classic',10),
('fishing','루이지애나 바유','Louisiana Bayou, USA','US',
 'Red drum and speckled trout; Cajun fishing bayou marshes, Atchafalaya Basin Louisiana',10),
('fishing','보카스 델 토로 파나마','Bocas del Toro, Panama','PA',
 'Atlantic tarpon in Caribbean lagoons; snook, jack, Bocas del Toro archipelago Panama',10),

-- ── SOUTH AMERICA / CARIBBEAN ───────────────────────────────
('fishing','케이프 버드 아일랜드','Cape Verde Islands','CV',
 'Atlantic blue marlin migration; mid-ocean archipelago November-February, wahoo dorado',10),

-- ── EUROPE ──────────────────────────────────────────────────
('fishing','모이 강 아일랜드','River Moy, Ireland','IE',
 'Highest rod-catch river Ireland; Ballina County Mayo, prolific salmon July-September',10),
('fishing','코네마라 아일랜드','Connemara, Ireland','IE',
 'Wild brown trout on limestone loughs; Galway Connemara fly fishing, mayfly season May',10),
('fishing','이나리 호수 핀란드','Lake Inari, Finland','FI',
 'Arctic grayling and perch; Lapland Inari August-September, ice fishing winter brown',10),
('fishing','발틱 해 스웨덴','Lake Vänern, Sweden','SE',
 'Swedish record sea trout and pike; world''s third largest freshwater lake, Gothenburg',10),
('fishing','폴란드 부그 강','Bug River, Poland','PL',
 'Trophy pike in lowland rivers; Bug River Polish-Belarusian border, pike perch bream',10),
('fishing','이탈리아 포 강','Po River, Italy','IT',
 'Monster wels catfish; Po Valley Northern Italy Cremona Mantua, 250kg catfish record',10),
('fishing','볼가 강 삼각주 러시아','Volga River Delta, Russia','RU',
 'Giant zander and asp; Astrakhan Caspian mouth, beluga sturgeon once greatest fishery',10),

-- ── AFRICA ──────────────────────────────────────────────────
('fishing','케이프 포인트 남아프리카','Cape Point, South Africa','ZA',
 'Yellowfin tuna and snoek; Cape Point False Bay, cold Benguela Current upwelling rich',10),
('fishing','빅토리아 호수 케냐','Lake Victoria, Kenya','KE',
 'Nile perch 100kg+; Africa''s largest lake, Kisumu Kenya, endemic cichlids crisis habitat',10),
('fishing','말라위 호수','Lake Malawi, Malawi','MW',
 'Tiger fish and endemic cichlids; Nkhata Bay Malawi, crystal clear freshwater lake Africa',10),
('fishing','니아사 보호구역 모잠비크','Niassa Reserve, Mozambique','MZ',
 'Vundu catfish and tiger fish; Lugenda River remote wilderness, fly camp only access',10),
('fishing','왈비스 베이 나미비아','Walvis Bay, Namibia','NA',
 'Offshore tuna and kabeljou; cold Benguela upwelling Namibia, Skeleton Coast richness',10),

-- ── ASIA / PACIFIC ──────────────────────────────────────────
('fishing','닝갈루 리프 호주','Ningaloo Reef, Australia','AU',
 'Sailfish and queenfish; World Heritage coral reef Western Australia, April-June peak',10),
('fishing','안다만 제도 인도','Andaman Islands, India','IN',
 'Offshore big game fishing; dogtooth tuna GT, remote Bay of Bengal India, Port Blair',10),
('fishing','케랄라 뒤뜰','Kerala Backwaters, India','IN',
 'Traditional cast-net fishing; Vembanad Lake houseboat, Alappuzha Kerala backwater life',10),
('fishing','메콩 삼각주 베트남','Mekong Delta, Vietnam','VN',
 'River monster fishing; snakehead catfish barb, Can Tho floating market river culture',10),
('fishing','비와 호수 일본','Lake Biwa, Japan','JP',
 'Japan''s largest lake; largemouth bass record, black bass tournament Shiga Prefecture',10),
('fishing','통가','Tonga, South Pacific','TO',
 'Yellowfin tuna and wahoo; Ha''apai remote bluewater, deep drop bottom fishing Pacific',10),
('fishing','크리스마스 아일랜드 키리바시','Christmas Island, Kiribati','KI',
 'Bonefish and giant trevally paradise; Indo-Pacific remote flats, 10kg GT on fly rod',10),
('fishing','뉴칼레도니아','New Caledonia','NC',
 'Coral trout and GT; Pacific largest lagoon UNESCO, Noumea offshore New Caledonia',10);

-- ================================================================
-- 완료: 100개 낚시 명소 교체
-- 20pt 25개 | 15pt 49개 | 10pt 26개 = 100개
-- 모든 title_en = 지명 중심 (어종 제거 → 지역 사진 출력)
-- ================================================================
