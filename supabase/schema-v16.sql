-- ================================================================
-- schema-v16.sql  (2026-02-27)
-- 100 Golf Courses 전면 교체
-- PGA·LPGA·US Open·The Open·라이더 컵 등 국제대회 개최 명문 골프장
-- ================================================================
-- 적용: Supabase Dashboard → SQL Editor → Run
-- ================================================================

DELETE FROM public.challenge_certifications
  WHERE challenge_id IN (
    SELECT id FROM public.challenges WHERE category = 'golf'
  );
DELETE FROM public.challenges WHERE category = 'golf';

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- ════════════════════════════════════════════════════════════════
-- 20pt — 메이저 챔피언십 개최 최정상 골프장 (30개)
-- ════════════════════════════════════════════════════════════════

-- ── USA — US Open / Masters / PGA Championship ────────────────
('golf','오거스타 내셔널','Augusta National Golf Club','US',
 'Masters Tournament since 1934; Amen Corner 11-12-13, Bobby Jones design, invite-only',20),
('golf','오크몬트 컨트리 클럽','Oakmont Country Club','US',
 'US Open record 9 times; 1927 church pew bunkers, fastest greens on tour, Oakmont PA',20),
('golf','윙드 풋 골프 클럽','Winged Foot Golf Club','US',
 'US Open 6 times (1929-2020); narrow fairways 7,477 yards, Mamaroneck NY, Tillinghast',20),
('golf','시네콕 힐스 골프 클럽','Shinnecock Hills Golf Club','US',
 'US Open 6 times (1896-2018); links-style coastal, Southampton NY, first US Open purpose-built',20),
('golf','파인허스트 2번 코스','Pinehurst No. 2','US',
 'US Open 5 times (1999-2024); Donald Ross 1907, sandhills NC, 2024 both men & women opens',20),
('golf','더 컨트리 클럽','The Country Club','US',
 'US Open 1913 Ouimet miracle, 1988, 1999, 2022; oldest US club Brookline MA, Francis Ouimet',20),
('golf','올림픽 클럽 레이크 코스','Olympic Club Lake Course','US',
 'US Open 5 times (1955-2012); Ben Hogan 1955 shock loss, uphill par-4s San Francisco CA',20),
('golf','베스페이지 블랙','Bethpage Black','US',
 'US Open 2002/2009; PGA 2019; public state park course NY, "Warning: Black is too difficult"',20),
('golf','토리 파인스 사우스','Torrey Pines South Course','US',
 'US Open 2008 Tiger Woods playoff win, 2021 Jon Rahm birdie; Pacific Ocean cliffs La Jolla CA',20),
('golf','페블 비치 골프 링크스','Pebble Beach Golf Links','US',
 'US Open 6 times; 18th cliff over Carmel Bay, public play, most scenic major course',20),
('golf','발할라 골프 클럽','Valhalla Golf Club','US',
 'PGA Championship 1996/2000/2014; Ryder Cup 2024; Jack Nicklaus design Louisville KY',20),
('golf','키아와 아일랜드 오션 코스','Kiawah Island Ocean Course','US',
 'Ryder Cup 1991 War on Shore; PGA Championship 2012/2021; 10 oceanside holes South Carolina',20),
('golf','휘슬링 스트레이츠','Whistling Straits','US',
 'PGA Championship 2004/2010/2020; Ryder Cup 2020; Pete Dye Lake Michigan shore Wisconsin',20),
('golf','TPC 소그래스 스타디움','TPC Sawgrass Stadium Course','US',
 'THE PLAYERS Championship annually; island green 17th par-3, Pete Dye 1982 Ponte Vedra FL',20),
('golf','메디나 컨트리 클럽','Medinah Country Club No.3','US',
 'US Open 3 times; PGA Championship 2 times; Ryder Cup 2012 miracle comeback; Medinah IL',20),
('golf','헤이즐틴 내셔널','Hazeltine National Golf Club','US',
 'US Open 1970; PGA Championship 4 times; Ryder Cup 2016; Robert Trent Jones Sr Chaska MN',20),
('golf','발투스롤 로워 코스','Baltusrol Golf Club Lower Course','US',
 'US Open 7 times (1903-2016); PGA Championship; Robert Trent Jones renovation Springfield NJ',20),
('golf','메리온 이스트 코스','Merion Golf Club East Course','US',
 'US Open 5 times (1934-2013); smallest major venue, red basket flagsticks, Ardmore PA',20),
('golf','퀘일 할로우 클럽','Quail Hollow Club','US',
 'PGA Championship 2017; Ryder Cup 2028 host; Wells Fargo Championship annual Charlotte NC',20),

-- ── UK — The Open Championship ───────────────────────────────
('golf','세인트 앤드루스 올드 코스','St Andrews Old Course','GB',
 'Home of Golf 600 years; The Open most times, Swilcan Bridge, Road Hole 17th, Fife Scotland',20),
('golf','뮤어필드','Muirfield','GB',
 'The Open 16 times; oldest golf club 1744 Honourable Company, East Lothian Scotland',20),
('golf','카누스티 골프 링크스','Carnoustie Golf Links','GB',
 'The Open 8 times; most feared links course, Barry Burn 18th, windswept Angus Scotland',20),
('golf','로열 버크데일','Royal Birkdale Golf Club','GB',
 'The Open 10 times (last 2017); willow scrub rough, flat lies, Southport Lancashire England',20),
('golf','로열 트룬','Royal Troon Golf Club','GB',
 'The Open 9 times; Postage Stamp 8th tiny par-3 123 yards, South Ayrshire Scotland',20),
('golf','로열 리덤 앤 세인트 앤스','Royal Lytham & St Annes Golf Club','GB',
 'The Open 11 times; 206 bunkers, no sea views but classic links, Lancashire England',20),
('golf','로열 세인트 조지스','Royal St George''s Golf Club','GB',
 'The Open 15 times (2021); hidden dunes Sandwich Kent England, oldest English venue',20),
('golf','로열 포트러시','Royal Portrush Golf Club','GB',
 'The Open 2019/2025; Dunluce Links Northern Ireland, Calamity Corner 14th, Rory McIlroy',20),
('golf','로열 리버풀 (호레이크)','Royal Liverpool Golf Club','GB',
 'The Open 12 times (2006/2014/2023); Hoylake Wirral, Tiger 2006 no bunkers strategy',20),
('golf','턴베리 에일사 코스','Turnberry Ailsa Course','GB',
 'The Open 4 times; 1977 Duel in the Sun Watson/Nicklaus, Ailsa Craig lighthouse Ayrshire',20),

-- ════════════════════════════════════════════════════════════════
-- 15pt — PGA 투어·라이더 컵·프레지던츠 컵 개최 명문 (40개)
-- ════════════════════════════════════════════════════════════════

-- ── USA ──────────────────────────────────────────────────────
('golf','서던 힐스 컨트리 클럽','Southern Hills Country Club','US',
 'US Open 3 times; PGA Championship 2022 Rory McIlroy; Donald Ross/Gil Hanse Tulsa OK',15),
('golf','오크 힐 이스트 코스','Oak Hill Country Club East Course','US',
 'US Open 5 times; PGA Championship 2023 Brooks Koepka; Donald Ross Rochester NY',15),
('golf','오클랜드 힐스 사우스','Oakland Hills Country Club South','US',
 'US Open 7 times; Ryder Cup 1961; "Monster" nickname, Ben Hogan 1951, Bloomfield Hills MI',15),
('golf','리비에라 컨트리 클럽','Riviera Country Club','US',
 'PGA Championship 1983/1995; Genesis Invitational; Ben Hogan career tied, Pacific Palisades CA',15),
('golf','뮤어필드 빌리지 골프 클럽','Muirfield Village Golf Club','US',
 'Memorial Tournament annually; Presidents Cup 1987/2013; Jack Nicklaus design Dublin OH',15),
('golf','이스트 레이크 골프 클럽','East Lake Golf Club','US',
 'Tour Championship every year; Bobby Jones''s home course, historic Atlanta Georgia',15),
('golf','콩그레셔널 블루 코스','Congressional Country Club Blue Course','US',
 'US Open 1964/1997/2011; KPMG Women''s PGA; Bethesda Maryland, power hitter''s paradise',15),
('golf','아로니민크 골프 클럽','Aronimink Golf Club','US',
 'PGA Championship 1962; BMW Championship; Donald Ross design 1928 Newtown Square PA',15),
('golf','베이 힐 클럽 앤 로지','Bay Hill Club & Lodge','US',
 'Arnold Palmer Invitational annually; Arnold Palmer''s home course Orlando Florida',15),
('golf','하버 타운 골프 링크스','Harbour Town Golf Links','US',
 'RBC Heritage annually; Pete Dye/Jack Nicklaus 1969, lighthouse par-4 18th Hilton Head SC',15),
('golf','카팔루아 플랜테이션 코스','Kapalua Plantation Course','US',
 'The Sentry (Tournament of Champions) annually; Bill Coore/Ben Crenshaw 2007 Maui Hawaii',15),
('golf','파이어스톤 사우스 코스','Firestone Country Club South Course','US',
 'WGC-Bridgestone Invitational (14 years); Robert Trent Jones 1960 renovation Akron Ohio',15),
('golf','벨레리브 컨트리 클럽','Bellerive Country Club','US',
 'US Open 1965; PGA Championship 2018 Brooks Koepka; Robert Trent Jones Sr St. Louis MO',15),
('golf','리버티 내셔널 골프 클럽','Liberty National Golf Club','US',
 'Presidents Cup 2017; FedEx St. Jude Invitational; Manhattan skyline views Jersey City NJ',15),
('golf','챔버스 베이 골프 코스','Chambers Bay Golf Course','US',
 'US Open 2015 Jordan Spieth; Robert Trent Jones Jr design Pierce County Washington State',15),
('golf','에린 힐스 골프 코스','Erin Hills Golf Course','US',
 'US Open 2017 Brooks Koepka; Kettle Moraine moraines Wisconsin, wide fairways unique',15),
('golf','TPC 스코츠데일 스타디움','TPC Scottsdale Stadium Course','US',
 'Waste Management Phoenix Open annually; 16th hole 20,000 stadium atmosphere, Arizona',15),
('golf','프레리 듄스 컨트리 클럽','Prairie Dunes Country Club','US',
 'US Women''s Open 1995/2002; US Senior Open; Perry Maxwell 1937 Hutchinson Kansas',15),
('golf','파인 니들스 로지 앤 골프 클럽','Pine Needles Lodge & Golf Club','US',
 'US Women''s Open 1996/2001/2007/2022; Donald Ross design Southern Pines NC',15),
('golf','와이알라에 컨트리 클럽','Waialae Country Club','US',
 'Sony Open in Hawaii annually (since 1965); oceanside private Honolulu Hawaii PGA Tour',15),
('golf','콜로니얼 컨트리 클럽','Colonial Country Club','US',
 'Charles Schwab Challenge annually; Ben Hogan tribute "Hogan''s Alley" Fort Worth Texas',15),

-- ── UK / IRELAND / EUROPE ────────────────────────────────────
('golf','발데라마 레알 클럽','Real Club Valderrama','ES',
 'Ryder Cup 1997 first continental Europe; Seve legacy cork oak 17th water Andalucia Spain',15),
('golf','더 케이 클럽 라이더 컵','The K Club Palmer Course','IE',
 'Ryder Cup 2006 Europe 18.5-9.5 win; Arnold Palmer design Kildare County Ireland',15),
('golf','셀틱 매너 투엔티텐','Celtic Manor Twenty Ten Course','GB',
 'Ryder Cup 2010; specially built for match play Colin Montgomerie design Newport Wales',15),
('golf','글리니글스 PGA 센테너리','Gleneagles PGA Centenary Course','GB',
 'Ryder Cup 2014; Jack Nicklaus/James Braid design, Perthshire Scotland luxury hotel',15),
('golf','르 골프 내셔널','Le Golf National','FR',
 'Ryder Cup 2018 Europe 17.5-10.5 blowout; French Open annually, Albatros course Paris',15),
('golf','마르코 시모네 골프 클럽','Marco Simone Golf & Country Club','IT',
 'Ryder Cup 2023 Europe 16.5-11.5; Tom and Dana Weiskopf design Rome Italy',15),
('golf','더 벨프리 브라바존','The Belfry Brabazon Course','GB',
 'Ryder Cup 4 times (1985/1989/1993/2002); Europe rediscovered Ryder Cup glory here, Sutton Coldfield',15),
('golf','로열 카운티 다운','Royal County Down Golf Club','IE',
 'Consistently world #1-ranked links; Mourne Mountains backdrop Newcastle Northern Ireland',15),
('golf','로열 몬트리올 블루 코스','Royal Montreal Golf Club','CA',
 'First golf club in Americas 1873; Canadian Open (10 times); Blue Course Ile Bizard Quebec',15),
('golf','글렌 애비 골프 클럽','Glen Abbey Golf Club','CA',
 'Canadian Open most times hosted (25+); Jack Nicklaus design 1976 Oakville Ontario',15),

-- ── ASIA / PACIFIC ───────────────────────────────────────────
('golf','가스미가세키 이스트 코스','Kasumigaseki Country Club East Course','JP',
 'Tokyo 2020 Olympics both gold medals; historic 1929 design, Saitama Japan',15),
('golf','나라시노 컨트리 클럽','Narashino Country Club','JP',
 'ZOZO Championship (PGA Tour Japan); Tiger Woods won 2019; Inzai Chiba Japan',15),
('golf','잭 니클라우스 GC 코리아','Jack Nicklaus Golf Club Korea','KR',
 'Presidents Cup 2015 host; Jack Nicklaus design Songdo Incheon South Korea',15),
('golf','나인 브릿지스 골프 클럽','Nine Bridges Golf Club','KR',
 'KLPGA flagship; 9 traditional bridges water features; Jeju Island South Korea autumn',15),
('golf','로열 멜버른 컴포지트','Royal Melbourne Golf Club','AU',
 'Presidents Cup host (2011/2019); composite West+East; top ranked sandbelt Melbourne',15),
('golf','킹스턴 히스 골프 클럽','Kingston Heath Golf Club','AU',
 'Australian Open multiple times; Alister MacKenzie bunkers, sandbelt Melbourne Victoria',15),
('golf','게리 플레이어 컨트리 클럽','Gary Player Country Club','ZA',
 'Nedbank Golf Challenge annually; Sun City North West Province South Africa Lost City',15),
('golf','팬코트 링크스','Fancourt Links','ZA',
 'Presidents Cup 2003; Ernie Els design, Outeniqua Mountains George South Africa',15),
('golf','셰산 인터내셔널 골프 클럽','Sheshan International Golf Club','CN',
 'WGC-HSBC Champions annually (China''s major); Shanghai, first WGC in Asia Pacific',15),
('golf','에미리트 골프 클럽 마질리스','Emirates Golf Club Majlis Course','AE',
 'DP World Tour Championship; first floodlit tournament 1989 Dubai Desert Classic, UAE',15),
('golf','에비앙 리조트 골프 클럽','Evian Resort Golf Club','FR',
 'Evian Championship (5th women''s major) annually; Evian-les-Bains Lake Geneva Alps France',15),

-- ════════════════════════════════════════════════════════════════
-- 10pt — 투어 정기 개최 명문 & 국제 아마추어 개최 (30개)
-- ════════════════════════════════════════════════════════════════

-- ── UK / IRELAND ─────────────────────────────────────────────
('golf','웬트워스 웨스트 코스','Wentworth Club West Course','GB',
 'BMW PGA Championship annually (DP World Tour flagship); Harry Colt 1924 Surrey England',10),
('golf','서닝데일 올드 코스','Sunningdale Golf Club Old Course','GB',
 'Open Championship qualifying; Walker Cup 1987; Willie Park Jr 1900 Berkshire heathland',10),
('golf','로흐 로먼드 골프 클럽','Loch Lomond Golf Club','GB',
 'Scottish Open (multiple years); Tom Weiskopf design, Loch Lomond Highland Scotland',10),
('golf','킹스반스 골프 링크스','Kingsbarns Golf Links','GB',
 'Alfred Dunhill Links annually; Kyle Phillips 2000, sea views all 18 holes Fife Scotland',10),
('golf','로열 도노흐 골프 클럽','Royal Dornoch Golf Club','GB',
 'Scottish Amateur; European Ladies Amateur; Tom Watson''s favourite, Highlands Scotland',10),
('golf','포트마녹 골프 클럽','Portmarnock Golf Club','IE',
 'Irish Open (multiple); Walker Cup 1991; Dublin peninsula links all-round wind challenge',10),
('golf','라힌치 올드 코스','Lahinch Golf Club Old Course','IE',
 'Irish Open 2019; West of Ireland Championship; goats weather forecast, County Clare',10),
('golf','크랑 쉬르 시에르','Crans-sur-Sierre Golf Club','CH',
 'European Masters annually (DP World Tour); Swiss Alps 1,500m elevation Mont Blanc views',10),
('golf','엘 살레르 골프 클럽','El Saler Golf Club','ES',
 'Spanish Open (multiple); Javier Arana 1968, Mediterranean dunes Albufera park Valencia',10),

-- ── USA ──────────────────────────────────────────────────────
('golf','TPC 사우스윈드','TPC Southwind','US',
 'FedEx St Jude Championship annually; Ron Prichard 1989 design Memphis Tennessee',10),
('golf','TPC 디어런','TPC Deere Run','US',
 'John Deere Classic annually; D.A. Weibring 1987 design, Silvis Illinois quad cities',10),
('golf','스파이글래스 힐','Spyglass Hill Golf Course','US',
 'AT&T Pebble Beach Pro-Am; Robert Trent Jones 1966, forest meets ocean Pebble Beach CA',10),

-- ── ASIA ─────────────────────────────────────────────────────
('golf','히로노 골프 클럽','Hirono Golf Club','JP',
 'Japan Open (multiple); Japan Amateur; Charles Alison 1932 masterpiece Kobe, world top 50',10),
('golf','요미우리 컨트리 클럽','Yomiuri Country Club','JP',
 'Japan Open Golf Championship; Japan''s most prestigious open championship Tokyo area',10),
('golf','블루 캐년 컨트리 클럽','Blue Canyon Country Club','TH',
 'Johnnie Walker Classic (European Tour 2000-2002); Canyon Course Phuket Thailand',10),
('golf','우정힐스 컨트리 클럽','Woo Jeong Hills Country Club','KR',
 'CJ Cup at Korea (PGA Tour); Portrush-inspired bentgrass, Cheonan South Korea',10),
('golf','미션 힐스 선전 올드 코스','Mission Hills Golf Club Shenzhen','CN',
 'WGC-HSBC World Match Play; world largest golf facility Guanlan Shenzhen China',10),

-- ── PACIFIC / OCEANIA ────────────────────────────────────────
('golf','로열 애들레이드 골프 클럽','Royal Adelaide Golf Club','AU',
 'Australian Open (multiple); Alister MacKenzie 1926, sand belt South Australia',10),
('golf','뉴사우스웨일스 골프 클럽','New South Wales Golf Club','AU',
 'Australian Open; Alister MacKenzie clifftop, Botany Bay views Sydney wind factor',10),
('golf','카우리 클리프스 골프 코스','Kauri Cliffs Golf Course','NZ',
 'New Zealand Open; Golf Digest top courses; 15 holes ocean views Bay of Islands NZ',10),

-- ── MIDDLE EAST / AFRICA ─────────────────────────────────────
('golf','아부다비 골프 클럽','Abu Dhabi Golf Club','AE',
 'Abu Dhabi HSBC Championship annually; Championship Course Peter Harradine 1997 UAE',10),
('golf','레오파드 크릭 컨트리 클럽','Leopard Creek Country Club','ZA',
 'Alfred Dunhill Championship; Kruger Park border crocodiles hippos holes 3-5, Malelane',10),
('golf','더반 컨트리 클럽','Durban Country Club','ZA',
 'South African Open (multiple); George Waterman 1920 Indian Ocean views Natal',10),

-- ── EUROPE (other) ────────────────────────────────────────────
('golf','PGA 카탈루냐 스타디움','PGA Catalunya Stadium Course','ES',
 'Solheim Cup 2023; Spanish Open; Stadium Course water features Girona Catalonia Spain',10),
('golf','골프 클럽 구트 라르헨호프','Golf Club Gut Lärchenhof','DE',
 'BMW International Open (European Tour); Bernhard Langer design Cologne Germany',10),

-- ── AMERICAS (other) ─────────────────────────────────────────
('golf','엘 카말레온 골프 클럽','El Camaleón Golf Club','MX',
 'World Wide Technology Championship (PGA Tour); Greg Norman design Mayakoba Riviera Maya',10),
('golf','알바니 골프 코스 바하마','Albany Golf Course, Bahamas','BS',
 'Hero World Challenge (Tiger Woods''s event); Ernie Els design New Providence Bahamas',10),
('golf','미드 오션 클럽 버뮤다','Mid Ocean Club','BM',
 'Bermuda Championship qualifying; Charles Blair Macdonald 1921, Tucker''s Town Atlantic',10),
('golf','포트 로열 골프 코스','Port Royal Golf Course','BM',
 'Bermuda Championship PGA Tour host; Robert Trent Jones Sr 1970 Southampton Bermuda',10);

-- ================================================================
-- 완료: 100개 명문 골프장 (국제대회 개최)
-- 20pt 30개 (메이저 챔피언십 개최)
-- 15pt 40개 (PGA 투어·라이더컵·프레지던츠컵)
-- 10pt 30개 (투어 정기 개최·국제 아마추어)
-- 수록 대회: Masters · US Open · The Open · PGA Championship
--           Ryder Cup · Presidents Cup · LPGA Majors · DP World Tour
-- ================================================================
