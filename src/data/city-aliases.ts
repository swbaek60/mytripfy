/**
 * 도시 다국어 alias → 영어 canonical 이름 매핑
 * 검색어를 영어로 변환한 뒤 destination_city ilike 검색에 활용
 */
export const CITY_ALIASES: Record<string, string> = {
  // ── 한국 KR ─────────────────────────────────────────
  '서울': 'Seoul',
  '부산': 'Busan',
  '제주': 'Jeju', '제주도': 'Jeju',
  '인천': 'Incheon',
  '대구': 'Daegu',
  '광주': 'Gwangju',
  '대전': 'Daejeon',
  '경주': 'Gyeongju',
  '수원': 'Suwon',
  '전주': 'Jeonju',
  '속초': 'Sokcho',
  '강릉': 'Gangneung',
  '여수': 'Yeosu',
  '춘천': 'Chuncheon',

  // ── 일본 JP ─────────────────────────────────────────
  '도쿄': 'Tokyo', '동경': 'Tokyo',
  '오사카': 'Osaka', '대판': 'Osaka',
  '교토': 'Kyoto',
  '삿포로': 'Sapporo',
  '후쿠오카': 'Fukuoka',
  '나라': 'Nara',
  '히로시마': 'Hiroshima',
  '고베': 'Kobe',
  '오키나와': 'Okinawa',
  '나고야': 'Nagoya',
  '가마쿠라': 'Kamakura',
  '하코네': 'Hakone',
  '도쿄都': 'Tokyo',
  // Japanese
  '東京': 'Tokyo', 'とうきょう': 'Tokyo',
  '大阪': 'Osaka', 'おおさか': 'Osaka',
  '京都': 'Kyoto', 'きょうと': 'Kyoto',
  '札幌': 'Sapporo', 'さっぽろ': 'Sapporo',
  '福岡': 'Fukuoka', 'ふくおか': 'Fukuoka',
  '奈良': 'Nara', 'なら': 'Nara',
  '広島': 'Hiroshima', 'ひろしま': 'Hiroshima',
  '神戸': 'Kobe', 'こうべ': 'Kobe',
  '沖縄': 'Okinawa', 'おきなわ': 'Okinawa',
  '名古屋': 'Nagoya', 'なごや': 'Nagoya',
  '鎌倉': 'Kamakura', 'かまくら': 'Kamakura',
  '箱根': 'Hakone', 'はこね': 'Hakone',
  '横浜': 'Yokohama', 'よこはま': 'Yokohama',
  '仙台': 'Sendai', 'せんだい': 'Sendai',
  '金沢': 'Kanazawa', 'かなざわ': 'Kanazawa',
  '長崎': 'Nagasaki', 'ながさき': 'Nagasaki',
  '九州': 'Fukuoka',
  // Chinese
  '大阪市': 'Osaka', '京都市': 'Kyoto',

  // ── 중국 CN ─────────────────────────────────────────
  '베이징': 'Beijing', '북경': 'Beijing',
  '상하이': 'Shanghai', '상해': 'Shanghai',
  '광저우': 'Guangzhou', '광주(중국)': 'Guangzhou',
  '청두': 'Chengdu',
  '시안': "Xi'an",
  '항저우': 'Hangzhou',
  '구이린': 'Guilin',
  '장가계': 'Zhangjiajie',
  // Chinese
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '成都': 'Chengdu',
  '西安': "Xi'an",
  '杭州': 'Hangzhou',
  '桂林': 'Guilin',
  '张家界': 'Zhangjiajie',
  '重庆': 'Chongqing',
  '昆明': 'Kunming',

  // ── 홍콩 HK ─────────────────────────────────────────
  '홍콩': 'Hong Kong',
  '香港': 'Hong Kong',

  // ── 대만 TW ─────────────────────────────────────────
  '타이페이': 'Taipei', '타이베이': 'Taipei',
  '가오슝': 'Kaohsiung',
  '화롄': 'Hualien',
  '타이난': 'Tainan',
  '지우펀': 'Jiufen', '구분': 'Jiufen',
  '台北': 'Taipei',
  '高雄': 'Kaohsiung',
  '花蓮': 'Hualien',
  '台南': 'Tainan',
  '九份': 'Jiufen',

  // ── 태국 TH ─────────────────────────────────────────
  '방콕': 'Bangkok',
  '치앙마이': 'Chiang Mai',
  '푸켓': 'Phuket',
  '파타야': 'Pattaya',
  '끄라비': 'Krabi',
  '코사무이': 'Koh Samui',
  '아유타야': 'Ayutthaya',
  '치앙라이': 'Chiang Rai',
  // Thai / Chinese
  '曼谷': 'Bangkok',
  '清迈': 'Chiang Mai',
  '普吉': 'Phuket',

  // ── 베트남 VN ────────────────────────────────────────
  '하노이': 'Hanoi',
  '호치민': 'Ho Chi Minh City', '사이공': 'Ho Chi Minh City',
  '다낭': 'Da Nang',
  '호이안': 'Hoi An',
  '나트랑': 'Nha Trang',
  '푸꾸옥': 'Phu Quoc',
  '하롱베이': 'Ha Long Bay',
  '사파': 'Sapa',
  '달랏': 'Da Lat',

  // ── 동남아 기타 ──────────────────────────────────────
  '발리': 'Bali',
  '자카르타': 'Jakarta',
  '욕야카르타': 'Yogyakarta',
  '마닐라': 'Manila',
  '세부': 'Cebu',
  '보라카이': 'Boracay',
  '쿠알라룸푸르': 'Kuala Lumpur',
  '페낭': 'Penang',
  '싱가포르시': 'Singapore',
  '양곤': 'Yangon',
  '시엠립': 'Siem Reap',

  // ── 인도 IN ──────────────────────────────────────────
  '뉴델리': 'Delhi', '델리': 'Delhi',
  '뭄바이': 'Mumbai',
  '자이푸르': 'Jaipur',
  '아그라': 'Agra',
  '고아': 'Goa',
  '바라나시': 'Varanasi',
  '케랄라': 'Kerala',

  // ── 중동 ──────────────────────────────────────────────
  '두바이': 'Dubai',
  '아부다비': 'Abu Dhabi',
  '이스탄불': 'Istanbul',
  '카파도키아': 'Cappadocia',

  // ── 유럽 ──────────────────────────────────────────────
  '파리': 'Paris', '빠리': 'Paris',
  '런던': 'London',
  '로마': 'Rome', '로마시': 'Rome',
  '바르셀로나': 'Barcelona',
  '마드리드': 'Madrid',
  '암스테르담': 'Amsterdam',
  '베를린': 'Berlin',
  '비엔나': 'Vienna', '빈': 'Vienna',
  '프라하': 'Prague',
  '부다페스트': 'Budapest',
  '스톡홀름': 'Stockholm',
  '코펜하겐': 'Copenhagen',
  '오슬로': 'Oslo',
  '헬싱키': 'Helsinki',
  '아테네': 'Athens',
  '리스본': 'Lisbon',
  '취리히': 'Zurich',
  '뮌헨': 'Munich',
  '피렌체': 'Florence',
  '베네치아': 'Venice', '베니스': 'Venice',
  '포르토': 'Porto',
  '산토리니': 'Santorini',
  '더블린': 'Dublin',
  '에든버러': 'Edinburgh',
  '브뤼셀': 'Brussels',
  '바르샤바': 'Warsaw',
  '크라쿠프': 'Krakow',
  // 日本語 ヨーロッパ
  'パリ': 'Paris',
  'ロンドン': 'London',
  'ローマ': 'Rome',
  'バルセロナ': 'Barcelona',
  'アムステルダム': 'Amsterdam',
  'ベルリン': 'Berlin',
  // 中文 欧洲
  '巴黎': 'Paris',
  '伦敦': 'London',
  '罗马': 'Rome',
  '巴塞罗那': 'Barcelona',
  '阿姆斯特丹': 'Amsterdam',
  '柏林': 'Berlin',

  // ── 미주 ──────────────────────────────────────────────
  '뉴욕': 'New York',
  '로스앤젤레스': 'Los Angeles', '엘에이': 'Los Angeles', 'LA': 'Los Angeles',
  '샌프란시스코': 'San Francisco',
  '라스베이거스': 'Las Vegas',
  '시카고': 'Chicago',
  '마이애미': 'Miami',
  '워싱턴': 'Washington',
  '보스턴': 'Boston',
  '시애틀': 'Seattle',
  '하와이': 'Honolulu',
  '토론토': 'Toronto',
  '밴쿠버': 'Vancouver',
  '몬트리올': 'Montreal',
  '멕시코시티': 'Mexico City',
  '칸쿤': 'Cancun',
  '리우데자네이루': 'Rio de Janeiro', '리오': 'Rio de Janeiro',
  '상파울루': 'São Paulo',
  '부에노스아이레스': 'Buenos Aires',
  '리마': 'Lima',
  '보고타': 'Bogota',
  // 日本語 アメリカ
  'ニューヨーク': 'New York',
  'ロサンゼルス': 'Los Angeles',
  'ラスベガス': 'Las Vegas',
  'シカゴ': 'Chicago',
  'マイアミ': 'Miami',
  'バンクーバー': 'Vancouver',
  // 中文 美洲
  '纽约': 'New York',
  '洛杉矶': 'Los Angeles',
  '拉斯维加斯': 'Las Vegas',
  '旧金山': 'San Francisco',
  '多伦多': 'Toronto',
  '温哥华': 'Vancouver',

  // ── 아프리카·오세아니아 ──────────────────────────────
  '케이프타운': 'Cape Town',
  '시드니': 'Sydney',
  '멜버른': 'Melbourne',
  '오클랜드': 'Auckland',
  '카이로': 'Cairo',
  '마라케시': 'Marrakech',
  // 中文
  '悉尼': 'Sydney',
  '墨尔本': 'Melbourne',
  '开罗': 'Cairo',
}

/**
 * 검색어를 영어 도시명으로 변환 (alias 매칭 우선, 없으면 원문 반환)
 * 대소문자·공백 무시 후 매칭
 */
export function resolveAliasToEnglish(query: string): string {
  const key = query.trim().toLowerCase()
  // 정확 매칭 먼저
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (alias.toLowerCase() === key) return canonical
  }
  // 부분 포함 매칭 (긴 alias 먼저 — 더 구체적인 것 우선)
  const sorted = Object.entries(CITY_ALIASES).sort((a, b) => b[0].length - a[0].length)
  for (const [alias, canonical] of sorted) {
    if (alias.toLowerCase().includes(key) || key.includes(alias.toLowerCase())) return canonical
  }
  return query
}
