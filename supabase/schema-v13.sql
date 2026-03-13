-- ================================================================
-- schema-v13.sql  (2026-02-27)
-- 100 Restaurants 전면 교체 — 미슐렝 + 세계 50 베스트 2024 기준
-- 현재 영업 중인 식당만 포함, 폐업 식당 제외
-- ================================================================
-- 적용 방법: Supabase Dashboard → SQL Editor → 전체 붙여넣고 Run
-- ================================================================

DELETE FROM public.challenge_certifications
  WHERE challenge_id IN (
    SELECT id FROM public.challenges WHERE category = 'restaurants'
  );
DELETE FROM public.challenges WHERE category = 'restaurants';

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- ════════════════════════════════════════════════════════════════
-- ★★★ 20pt — 미슐렝 3성 + 세계 50 베스트 최상위 (32개)
-- ════════════════════════════════════════════════════════════════

-- ── SPAIN ──────────────────────────────────────────────────────
('restaurants','디스프루타르','Disfrutar','ES',
 'Oriol Castro & Eduard Xatruch ★★★; #1 World 50 Best 2024, avant-garde Barcelona',20),
('restaurants','엘 세예르 데 칸 로카','El Celler de Can Roca','ES',
 'Joan·Josep·Jordi Roca 3형제 ★★★; 前 #1 세계 최고, Girona 가스트로 성지',20),
('restaurants','다이버 XO','DiverXO','ES',
 'David Muñoz ★★★; #5 World 50 Best 2024, 천재적 전위 요리 Madrid',20),
('restaurants','아사도르 에차바리','Asador Etxebarri','ES',
 'Victor Arguinzoniz ★; #2 World 50 Best 2024, 장작불 그릴 Basque Country Axpe',20),
('restaurants','아르삭','Arzak','ES',
 'Elena Arzak ★★★; 뉴 바스크 퀴진 창시자 San Sebastián 1897년 전통 계승',20),
('restaurants','아수르멘디','Azurmendi','ES',
 'Eneko Atxa ★★★; 친환경 건축 온실 레스토랑 Bilbao, 세계 최지속가능 식당',20),

-- ── ITALY ──────────────────────────────────────────────────────
('restaurants','오스테리아 프란체스카나','Osteria Francescana','IT',
 'Massimo Bottura ★★★; #1 World 50 Best 2018, 현대 이탈리아 예술-요리 Modena',20),
('restaurants','라 페르골라','La Pergola','IT',
 'Heinz Beck ★★★; 로마 테라스 파노라마, Cavalieri Hotel 이탈리아 정통 고급 요리',20),
('restaurants','리알레','Reale','IT',
 'Niko Romito ★★★; #11 World 50 Best 2024, 미니멀리스트 아브루초 혁신 요리',20),
('restaurants','리도 84','Lido 84','IT',
 'Riccardo Camanini ★; #7 World 50 Best 2024, 가르다 호수 전망 Lake Garda',20),

-- ── USA ──────────────────────────────────────────────────────
('restaurants','더 프렌치 런드리','The French Laundry','US',
 'Thomas Keller ★★★; Napa Valley 최고 식당 1994년, 미국 파인다이닝 전설',20),
('restaurants','퍼 세','Per Se','US',
 'Thomas Keller ★★★; 허드슨강 뷰 Columbus Circle, French Laundry 자매 New York',20),
('restaurants','일레반 메디슨 파크','Eleven Madison Park','US',
 'Daniel Humm ★★★; 플랜트 베이스 럭셔리 파인다이닝 New York, 前 #1 세계',20),
('restaurants','르 베르나댕','Le Bernardin','US',
 'Eric Ripert ★★★; New York 최고의 해산물 신전 1986년, 불변의 세 번째 별',20),
('restaurants','알리니아','Alinea','US',
 'Grant Achatz ★★★; 분자 요리 예술 Chicago, 테이블리스 몰입형 다이닝',20),
('restaurants','아토믹스','Atomix','US',
 'Junghyun & Ellia Park ★★; #3 World 50 Best 2024, 한국 파인다이닝 New York',20),

-- ── FRANCE ──────────────────────────────────────────────────
('restaurants','미라주르','Mirazur','FR',
 'Mauro Colagreco ★★★; #1 World 50 Best 2019, 지중해 절벽 정원 요리 Menton',20),
('restaurants','아르페쥬','Arpège','FR',
 'Alain Passard ★★★; 채소 중심 요리 선구자 Paris, 자체 바이오다이나믹 농장',20),
('restaurants','기 사부아','Guy Savoy','FR',
 'Guy Savoy ★★★; Monnaie de Paris 세느강변 고전 프랑스 요리 최고봉',20),
('restaurants','에피퀴르 르 브리스톨','Epicure (Le Bristol)','FR',
 'Eric Frechon ★★★; 파리 팔라스 호텔 다이닝 정원 전망, 프렌치 럭셔리',20),
('restaurants','피에르 가니에르','Pierre Gagnaire','FR',
 'Pierre Gagnaire ★★★; 창의적 분자 요리 시인 Paris 1996년, 세계 기준 재정립',20),

-- ── UK ──────────────────────────────────────────────────────
('restaurants','더 팻 덕','The Fat Duck','GB',
 'Heston Blumenthal ★★★; 과학-요리 융합 Bray, 달팽이 죽과 에그앤베이컨 아이스크림',20),
('restaurants','더 워터사이드 인','The Waterside Inn','GB',
 'Roux 가문 ★★★; 템스강변 프랑스 요리 Bray 1972년, 영국 최장수 3성 레스토랑',20),

-- ── DENMARK ──────────────────────────────────────────────────
('restaurants','제라니움','Geranium','DK',
 'Rasmus Kofoed ★★★; #1 World 50 Best 2022, 스타디움 꼭대기 코펜하겐 Nordic',20),
('restaurants','알케미스트','Alchemist','DK',
 'Rasmus Munk ★★; #9 World 50 Best 2024, 50코스 홀리스틱 몰입형 코펜하겐',20),

-- ── JAPAN ──────────────────────────────────────────────────
('restaurants','스키야바시 지로 본텐','Sukiyabashi Jiro Honten','JP',
 '오노 지로 ★★★; 10석 스시 전설 Tokyo Ginza, 영화 Jiro Dreams of Sushi 주인공',20),
('restaurants','키치센','Kichisen','JP',
 '다니가와 요시미 ★★★; 교토 가이세키 최고봉, 전통 격식 최엄수 료칸 다이닝',20),
('restaurants','니혼료리 류긴','Nihonryori RyuGin','JP',
 '야마모토 세이지 ★★★; 계절 과학 가이세키 Tokyo, 자연 탐구 일본 요리',20),
('restaurants','덴','Den','JP',
 '하세가와 자이유 ★★; #10 World 50 Best 2024, 유쾌한 일본식 카이세키 Tokyo',20),

-- ── SINGAPORE ──────────────────────────────────────────────
('restaurants','오데트','Odette','SG',
 'Julien Royer ★★★; 아시아 최고 National Gallery Singapore, 프랑스-아시아 정수',20),

-- ── PERU (W50 Best — Michelin Guide 없음) ────────────────────
('restaurants','센트럴','Central','PE',
 'Virgilio Martínez; #1 World 50 Best 2023, 고도별 100 에코시스템 메뉴 Lima',20),
('restaurants','마이도','Maido','PE',
 'Mitsuharu Tsumura; #6 World 50 Best 2024, Nikkei 일본-페루 퓨전 Lima',20),

-- ════════════════════════════════════════════════════════════════
-- ★★★/★★ 15pt — 미슐렝 3·2성 명문 (45개)
-- ════════════════════════════════════════════════════════════════

-- ── SPAIN ──────────────────────────────────────────────────────
('restaurants','마르틴 베라사테기','Martín Berasategui','ES',
 'Martín Berasategui ★★★; 스페인 최다 미슐렝 스타 셰프, Lasarte-Oria Basque',15),
('restaurants','아켈라레','Akelarre','ES',
 'Pedro Subijana ★★★; 절벽 대서양 전망 San Sebastián Basque, 전위 요리 50년',15),
('restaurants','키케 다코스타','Quique Dacosta','ES',
 'Quique Dacosta ★★★; 지중해 아방가르드 Costa Blanca Denia, 스페인 혁신 선두',15),
('restaurants','무가리츠','Mugaritz','ES',
 'Andoni Luis Aduriz ★★; 경계 해체 실험 요리 San Sebastián, 20년 세계 10위권',15),
('restaurants','엘카노','Elkano','ES',
 'Aitor Arregi ★; 전설의 터봇 구이 Getaria 어항, Basque 최고의 숯불 생선',15),

-- ── ITALY ──────────────────────────────────────────────────────
('restaurants','르 칼란드레','Le Calandre','IT',
 'Massimiliano Alajmo ★★★; 역대 최연소 3성 셰프 28세 Rubano Veneto, 이탈리아 혁신',15),
('restaurants','피아차 두오모','Piazza Duomo','IT',
 'Enrico Crippa ★★★; 정원 영감 퀴진 Alba Piemonte, 화이트 트러플 성지',15),
('restaurants','달 페스카토레','Dal Pescatore','IT',
 'Santini 가문 ★★★; 3대 운영 호수 전망 Canneto sull''Oglio, 이탈리아 정통 40년',15),
('restaurants','에노테카 핀키오리','Enoteca Pinchiorri','IT',
 'Giorgio Pinchiorri ★★★; 45만병 와인 셀러 Florence, 이탈리아 최고 와인-다이닝',15),

-- ── USA ──────────────────────────────────────────────────────
('restaurants','아틀리에 크렌','Atelier Crenn','US',
 'Dominique Crenn ★★★; 미국 유일 여성 3성 셰프, 시적 퀴진 San Francisco',15),
('restaurants','퀸스 레스토랑','Quince','US',
 'Michael Tusk ★★★; 이탈리아 영감 캘리포니아 퀴진 San Francisco, 섬세한 럭셔리',15),
('restaurants','싱글스레드','SingleThread','US',
 'Kyle Connaughton ★★★; 농장-여관-레스토랑 일체 Healdsburg Sonoma, 일본 영향',15),
('restaurants','리틀 워싱턴 여관','The Inn at Little Washington','US',
 'Patrick O''Connell ★★★; 50년 버지니아 전원 성지, 미국 가장 오랜 3성 레스토랑',15),

-- ── UK ──────────────────────────────────────────────────────
('restaurants','알랭 뒤카스 더 도체스터','Alain Ducasse at The Dorchester','GB',
 'Alain Ducasse ★★★; Mayfair 팔라스 호텔 프랑스 고급 요리 런던 최고봉',15),
('restaurants','레스토랑 고든 램지','Restaurant Gordon Ramsay','GB',
 'Gordon Ramsay ★★★; Royal Hospital Road Chelsea 25년, 영국 클래식 프랑스',15),
('restaurants','코어 바이 클레어 스미스','Core by Clare Smyth','GB',
 'Clare Smyth ★★★; 영국 최초 여성 단독 3성 셰프, Notting Hill 영국 식재료 예찬',15),
('restaurants','렌클루메','L''Enclume','GB',
 'Simon Rogan ★★★; Cumbria 자연 농장 영감 가장 영국적인 파인다이닝',15),
('restaurants','더 레드버리','The Ledbury','GB',
 'Brett Graham ★★; Notting Hill 유러피언 프로듀스 중심 런던 최고 2성',15),

-- ── FRANCE ──────────────────────────────────────────────────
('restaurants','테이블 바이 브루노 베르쥐','Table by Bruno Verjus','FR',
 'Bruno Verjus ★★; #8 World 50 Best 2024, 최상 식재료 집착 파리 소규모',15),
('restaurants','세프팀','Septime','FR',
 'Bertrand Grébaut ★; 파리 최고 자연파 비스트로노미 11구, W50B 단골',15),
('restaurants','파비용 르두아앙','Pavillon Ledoyen','FR',
 'Yannick Alléno ★★★; 샹젤리제 정원 역사적 파빌리온 파리, 소스의 마법사',15),
('restaurants','르 뫼리스','Le Meurice','FR',
 'Alain Ducasse ★★; 베르사유 식당실 같은 Rue de Rivoli 파리 왕실급 다이닝',15),
('restaurants','안 소피 픽','Anne-Sophie Pic','FR',
 'Anne-Sophie Pic ★★★; 여성 셰프 세계 최다 3성 Valence, 향기-맛 인터플레이',15),
('restaurants','메종 트루아그로','Maison Troisgros','FR',
 'Michel Troisgros ★★★; 3대 프랑스 왕조 Ouches Loire, 누벨 퀴진 발원지',15),
('restaurants','르 프레 카틀랑','Le Pré Catelan','FR',
 'Frédéric Anton ★★★; 불로뉴 숲 고성 다이닝 파리, 우아한 클래식 프랑스',15),
('restaurants','레지 에 자크 마르콩','Régis et Jacques Marcon','FR',
 'Régis Marcon ★★★; 버섯 전문 셰프 Auvergne 고원, 프랑스 대자연 숨결',15),
('restaurants','라 부이트','La Bouitte','FR',
 'René & Maxime Meilleur ★★★; 사부아 산악 전통 Saint-Martin-de-Belleville 프랑스',15),

-- ── DENMARK ──────────────────────────────────────────────────
('restaurants','요르드나어','Jordnær','DK',
 'Eric Vildgaard ★★★; 코펜하겐 항구 전망 해산물 Nordic, 前 범죄자 셰프 스토리',15),

-- ── GERMANY ──────────────────────────────────────────────────
('restaurants','아쿠아 볼프스부르크','Aqua','DE',
 'Sven Elverfeld ★★★; 폭스바겐 공장 도시 Wolfsburg 의외의 3성, 독일 최고',15),
('restaurants','방돔','Vendôme','DE',
 'Joachim Wissler ★★★; Bergisch Gladbach 독일 그랑 퀴진 최고봉, 라인강 근처',15),

-- ── BELGIUM ──────────────────────────────────────────────────
('restaurants','호프 반 클레버','Hof van Cleve','BE',
 'Peter Goossens ★★★; 벨기에 가스트로노미 정점 Kruishoutem, 플랑드르 농장 음식',15),

-- ── NETHERLANDS ──────────────────────────────────────────────
('restaurants','더 리브레야','De Librije','NL',
 'Jonnie Boer ★★★; 옛 감옥 개조 레스토랑 Zwolle, 혁신적 네덜란드 퀴진',15),

-- ── SWEDEN ──────────────────────────────────────────────────
('restaurants','프란첸','Frantzén','SE',
 'Björn Frantzén ★★★; 스톡홀름 타운하우스 일본-Nordic 퓨전 다이닝 최고',15),

-- ── JAPAN ──────────────────────────────────────────────────
('restaurants','키쿠노이 혼텐','Kikunoi Honten','JP',
 '오쿠도 마사유키 ★★★; 계절 가이세키 교토 Higashiyama, 전통 분위기 최정점',15),
('restaurants','아라시야마 킷쵸','Arashiyama Kitcho','JP',
 '도쿠오카 쿠니오 ★★★; 대나무 숲 교토 강변 가이세키, 일본 최고 경치 식당',15),
('restaurants','효테이','Hyotei','JP',
 '에가와 타카시 ★★★; 450년 15대 교토 가이세키, 아침 죽이 시작하는 전통',15),
('restaurants','퀀테슨스','Quintessence','JP',
 '기시다 슈조 ★★★; 프랑스 기법×일본 식재료 Tokyo, 개념적 파인다이닝',15),
('restaurants','나리사와','Narisawa','JP',
 '나리사와 요시히로 ★★; 사토야마 자연 요리 Tokyo, 생태계 메뉴 세계 주목',15),
('restaurants','플로릴레쥬','Florilège','JP',
 '가와테 히로야스 ★★; 오픈 카운터 프렌치-재패니즈 Tokyo, 주방 중심 드라마',15),
('restaurants','스시 요시타케','Sushi Yoshitake','JP',
 '요시타케 마사히로 ★★★; 긴자 카운터 스시 오마카세 Tokyo, 계절 절정 니기리',15),

-- ── HONG KONG ──────────────────────────────────────────────
('restaurants','렁 킹 힌','Lung King Heen','HK',
 'Felix Chong ★★★; 세계 최초 중식 3성 레스토랑 Four Seasons HK, 딤섬의 神',15),
('restaurants','오토 에 메조 봄바나','8½ Otto e Mezzo Bombana','HK',
 'Umberto Bombana ★★★; 이탈리아 화이트 트러플 마에스트로 홍콩 진출, 최고 이탈리아',15),

-- ── KOREA ──────────────────────────────────────────────────
('restaurants','라 연','La Yeon','KR',
 '호텔신라 ★★★; 한국 최고 권위 한식 파인다이닝 서울, 5천년 궁중 요리 재현',15),
('restaurants','밍글스','Mingles','KR',
 '강민구 ★★; 한국 현대 가스트로노미 Gangnam Seoul, W50 Best 아시아 최상위',15),

-- ── AUSTRIA ──────────────────────────────────────────────────
('restaurants','슈타이러에크','Steirereck','AT',
 'Heinz Reitbauer ★★; 빈 Stadtpark 강변, 오스트리아 바이오다이나믹 최고봉',15),

-- ════════════════════════════════════════════════════════════════
-- ★/W50B 10pt — 주목 신성 & 지역 거장 (23개)
-- ════════════════════════════════════════════════════════════════

-- ── MEXICO (Michelin Mexico City 2024) ───────────────────────
('restaurants','킨토닐','Quintonil','MX',
 'Jorge Vallejo ★; #4 World 50 Best 2024 멕시코 테루아, Mexico City 채소 요리',10),
('restaurants','푸홀','Pujol','MX',
 'Enrique Olvera ★; 멕시코 현대 요리 아이콘 Mexico City, 몰레 마드레 7년 숙성',10),

-- ── LATIN AMERICA ──────────────────────────────────────────
('restaurants','돈 훌리오','Don Julio','AR',
 'Pablo Rivero; W50B 아르헨티나 파리야 성지 Buenos Aires, 건식숙성 소고기 신화',10),
('restaurants','보라고','Boragó','CL',
 'Rodolfo Guzmán; W50B 칠레 자생 식재료 탐구 Santiago, 남미 포레이징 선구자',10),
('restaurants','킬레','Kjolle','PE',
 'Pía León; W50B 50 Best Best Female Chef 2021, Central 자매 Lima 독립 브랜드',10),
('restaurants','아 카사 두 포르쿠','A Casa do Porco','BR',
 'Jefferson Rueda ★; W50B #16 2024, 돼지 전체 활용 창의 요리 São Paulo',10),

-- ── THAILAND ──────────────────────────────────────────────
('restaurants','가간 아난드','Gaggan Anand','TH',
 'Gaggan Anand ★★; 이모지 메뉴 인도 요리 재해석 Bangkok, 아시아 최전위',10),
('restaurants','르 두','Le Du','TH',
 'Thitid Tassanakajohn ★; #12 World 50 Best 2024 태국 파인다이닝 Bangkok',10),
('restaurants','쏜 방콕','Sorn','TH',
 'Supaksorn Jongsiri ★★; 태국 남부 왕실 요리 재현 Bangkok, 희귀 식재료 집착',10),

-- ── KOREA ──────────────────────────────────────────────────
('restaurants','모수 서울','Mosu Seoul','KR',
 '안성재 ★★; 한국 현대적 해석 Seoul, 재료 연구 극한 추구 창의 요리',10),

-- ── HONG KONG ──────────────────────────────────────────────
('restaurants','앰버 홍콩','Amber','HK',
 'Richard Ekkebus ★★; Landmark Mandarin Oriental HK 프렌치-아시아 조화',10),
('restaurants','라뚤리에 드 조엘 로부숑','L''Atelier de Joël Robuchon Hong Kong','HK',
 'Robuchon 유산 ★★★; 오픈 카운터 다이닝 컨셉 HK Central, 프랑스 테크닉',10),

-- ── UAE ──────────────────────────────────────────────────
('restaurants','트레신드 스튜디오','Trèsind Studio','AE',
 'Himanshu Saini ★★; #28 World 50 Best 2024 인도 현대 요리 Dubai 最前衛',10),
('restaurants','오시아노','Ossiano','AE',
 'Grégoire Berger ★; Atlantis Dubai 수중 수족관 레스토랑, 프랑스 해산물',10),

-- ── PORTUGAL ──────────────────────────────────────────────
('restaurants','벨칸토','Belcanto','PT',
 'José Avillez ★★; W50B 포르투갈 요리 재발견 Lisbon Chiado, 최고 포르투갈',10),

-- ── SLOVENIA ──────────────────────────────────────────────
('restaurants','히샤 프란코','Hiša Franko','SI',
 'Ana Roš ★; W50B 세계 최고 여성 셰프 2017, 슬로베니아 숲 포레이징 Kobarid',10),

-- ── SPAIN (additional) ───────────────────────────────────────
('restaurants','엘 인베르나데로','El Invernadero','ES',
 'Rodrigo de la Calle ★★; 식물 기반 파인다이닝 선구자 Madrid, 채소의 재발견',10),

-- ── NETHERLANDS ──────────────────────────────────────────
('restaurants','보르도','Bord''Eau','NL',
 'Richard van Oosterhout ★★; De l''Europe Hotel Amsterdam 프랑스 그랑 퀴진',10),

-- ── DENMARK ──────────────────────────────────────────────
('restaurants','카도','Kadeau Copenhagen','DK',
 '★★; 보른홀름 섬 식재료 코펜하겐 상륙, Nordic 섬 요리 아름다운 사계절',10),

-- ── JAPAN (additional) ───────────────────────────────────────
('restaurants','사이토','Saito','JP',
 '사이토 타카시 ★★★; Tokyo Minato 초극 비밀 스시 카운터, 입장 자체가 전설',10),
('restaurants','미자이','Mizai','JP',
 '카케가와 사토시 ★★★; 교토 가이세키 혁신 Higashiyama, 전통×창의 융합',10),

-- ── SINGAPORE ──────────────────────────────────────────────
('restaurants','잔 바이 커크 웨스터웨이','Jaan by Kirk Westaway','SG',
 'Kirk Westaway ★; Swissôtel 최상층 영국 영감 파인다이닝 Singapore 스카이뷰',10),

-- ── SWITZERLAND ──────────────────────────────────────────
('restaurants','레스토랑 드 로텔 드 빌','Restaurant de l''Hôtel de Ville','CH',
 'Franck Giovannini ★★★; Crissier Lausanne 스위스 최고 프랑스 전통 요리',10);

-- ================================================================
-- 완료: 100개 미슐렝 레스토랑 교체
-- 20pt 32개 | 15pt 45개 | 10pt 23개 = 100개
-- 주요 제외 (폐업): Noma, El Bulli, Fäviken, Restaurant André
-- ================================================================
