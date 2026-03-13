// 국가별 주요 도시/지역 목록
// GuideRegionPicker에서 자동완성 제안으로 사용

export interface CityData {
  country: string   // 국가 코드
  cities: string[]  // 도시/지역 목록
}

// 가이드 활동이 많은 국가 위주로 도시 목록 구성
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  JP: [
    'Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka',
    'Nara', 'Hiroshima', 'Kobe', 'Okinawa', 'Kamakura', 'Hakone', 'Nikko',
    'Sendai', 'Kanazawa', 'Nagasaki', 'Kumamoto', 'Beppu', 'Kagoshima',
  ],
  KR: [
    'Seoul', 'Busan', 'Jeju', 'Incheon', 'Daegu', 'Gwangju', 'Daejeon',
    'Gyeongju', 'Suwon', 'Jeonju', 'Sokcho', 'Gangneung', 'Ulsan', 'Andong',
    'Tongyeong', 'Yeosu', 'Chuncheon', 'Jinhae', 'Pocheon',
  ],
  CN: [
    'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Xi\'an',
    'Hangzhou', 'Nanjing', 'Wuhan', 'Chongqing', 'Guilin', 'Lijiang',
    'Zhangjiajie', 'Qingdao', 'Kunming', 'Harbin', 'Xiamen', 'Suzhou',
    'Tianjin', 'Sanya',
  ],
  TW: [
    'Taipei', 'Kaohsiung', 'Tainan', 'Taichung', 'Hualien', 'Taitung',
    'Keelung', 'Jiufen', 'Taroko Gorge', 'Sun Moon Lake', 'Alishan',
  ],
  TH: [
    'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Koh Samui',
    'Ayutthaya', 'Chiang Rai', 'Kanchanaburi', 'Hua Hin', 'Koh Phangan',
    'Sukhothai', 'Koh Chang', 'Pai', 'Udon Thani',
  ],
  VN: [
    'Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hoi An', 'Hue', 'Nha Trang',
    'Phu Quoc', 'Ha Long Bay', 'Sapa', 'Ninh Binh', 'Da Lat', 'Can Tho',
    'Quy Nhon', 'Mui Ne', 'Kon Tum',
  ],
  ID: [
    'Bali', 'Jakarta', 'Yogyakarta', 'Surabaya', 'Lombok', 'Komodo',
    'Medan', 'Makassar', 'Bandung', 'Borobudur', 'Raja Ampat', 'Gili Islands',
    'Lake Toba', 'Flores', 'Palembang',
  ],
  PH: [
    'Manila', 'Cebu', 'Davao', 'Palawan', 'Boracay', 'Bohol', 'Siargao',
    'Batangas', 'Iloilo', 'Cagayan de Oro', 'Bacolod', 'Tagaytay',
    'Coron', 'El Nido', 'Camiguin',
  ],
  SG: ['Singapore', 'Sentosa', 'Orchard Road', 'Marina Bay', 'Changi'],
  MY: [
    'Kuala Lumpur', 'Penang', 'Langkawi', 'Malacca', 'Kota Kinabalu',
    'Johor Bahru', 'Ipoh', 'Kuching', 'Cameron Highlands', 'Perhentian Islands',
    'George Town', 'Sepilok', 'Miri',
  ],
  IN: [
    'Delhi', 'Mumbai', 'Jaipur', 'Agra', 'Goa', 'Bangalore', 'Chennai',
    'Kolkata', 'Varanasi', 'Kerala', 'Udaipur', 'Jodhpur', 'Pushkar',
    'Rishikesh', 'Shimla', 'Manali', 'Leh Ladakh', 'Mysore', 'Hyderabad',
    'Darjeeling', 'Amritsar', 'Ranthambore', 'Coorg',
  ],
  NP: [
    'Kathmandu', 'Pokhara', 'Chitwan', 'Lumbini', 'Everest Base Camp',
    'Annapurna Circuit', 'Patan', 'Bhaktapur', 'Nagarkot',
  ],
  TR: [
    'Istanbul', 'Ankara', 'Antalya', 'Cappadocia', 'Pamukkale', 'Ephesus',
    'Izmir', 'Bodrum', 'Trabzon', 'Konya', 'Bursa', 'Gallipoli',
    'Alanya', 'Marmaris', 'Kusadasi',
  ],
  EG: [
    'Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Hurghada', 'Sharm El Sheikh',
    'Giza', 'Dahab', 'Siwa', 'Marsa Alam',
  ],
  MA: [
    'Marrakech', 'Casablanca', 'Fes', 'Rabat', 'Chefchaouen', 'Merzouga',
    'Essaouira', 'Tangier', 'Agadir', 'Meknes', 'Ouarzazate',
  ],
  ZA: [
    'Cape Town', 'Johannesburg', 'Durban', 'Kruger National Park', 'Garden Route',
    'Stellenbosch', 'Knysna', 'Pretoria', 'Port Elizabeth', 'George',
  ],
  FR: [
    'Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux', 'Toulouse', 'Strasbourg',
    'Versailles', 'Loire Valley', 'Normandy', 'French Riviera', 'Provence',
    'Chamonix', 'Cannes', 'Avignon', 'Lille',
  ],
  DE: [
    'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart',
    'Dresden', 'Heidelberg', 'Nuremberg', 'Rothenburg ob der Tauber',
    'Black Forest', 'Bavaria', 'Rhine Valley', 'Leipzig', 'Freiburg',
  ],
  IT: [
    'Rome', 'Milan', 'Venice', 'Florence', 'Naples', 'Turin', 'Bologna',
    'Amalfi Coast', 'Sicily', 'Cinque Terre', 'Tuscany', 'Pompeii',
    'Sardinia', 'Lake Como', 'Verona', 'Genoa',
  ],
  ES: [
    'Barcelona', 'Madrid', 'Seville', 'Granada', 'Valencia', 'Bilbao',
    'Ibiza', 'Mallorca', 'Toledo', 'Cordoba', 'San Sebastian', 'Salamanca',
    'Tenerife', 'Lanzarote', 'Segovia',
  ],
  PT: [
    'Lisbon', 'Porto', 'Algarve', 'Sintra', 'Madeira', 'Azores',
    'Faro', 'Coimbra', 'Braga', 'Evora', 'Cascais', 'Lagos',
  ],
  GB: [
    'London', 'Edinburgh', 'Manchester', 'Liverpool', 'Birmingham',
    'Oxford', 'Cambridge', 'Bath', 'York', 'Brighton', 'Stratford-upon-Avon',
    'Lake District', 'Cotswolds', 'Cardiff', 'Dublin',
  ],
  NL: [
    'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Delft', 'Haarlem',
    'Leiden', 'Eindhoven', 'Groningen', 'Kinderdijk', 'Keukenhof',
  ],
  GR: [
    'Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu',
    'Thessaloniki', 'Meteora', 'Delphi', 'Olympia', 'Zakynthos', 'Paros',
  ],
  US: [
    'New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Miami',
    'Chicago', 'Seattle', 'Washington D.C.', 'Boston', 'New Orleans',
    'Honolulu', 'Grand Canyon', 'Yellowstone', 'Yosemite', 'Orlando',
    'Nashville', 'Austin', 'Denver', 'Portland', 'Atlanta',
  ],
  CA: [
    'Toronto', 'Vancouver', 'Montreal', 'Quebec City', 'Calgary',
    'Banff', 'Ottawa', 'Whistler', 'Victoria', 'Jasper', 'Niagara Falls',
  ],
  MX: [
    'Mexico City', 'Cancun', 'Playa del Carmen', 'Tulum', 'Oaxaca',
    'Guadalajara', 'Merida', 'Puerto Vallarta', 'Los Cabos', 'Puebla',
    'Guanajuato', 'Chichen Itza', 'San Miguel de Allende',
  ],
  BR: [
    'Rio de Janeiro', 'São Paulo', 'Salvador', 'Florianópolis', 'Manaus',
    'Brasília', 'Fortaleza', 'Recife', 'Iguazu Falls', 'Pantanal',
    'Fernando de Noronha', 'Natal', 'Belo Horizonte',
  ],
  AR: [
    'Buenos Aires', 'Patagonia', 'Mendoza', 'Bariloche', 'Iguazu Falls',
    'Salta', 'Cordoba', 'Ushuaia', 'El Calafate', 'Cafayate',
  ],
  PE: [
    'Lima', 'Cusco', 'Machu Picchu', 'Arequipa', 'Lake Titicaca',
    'Paracas', 'Iquitos', 'Trujillo', 'Nazca Lines', 'Sacred Valley',
  ],
  AU: [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast',
    'Cairns', 'Hobart', 'Darwin', 'Great Barrier Reef', 'Uluru',
    'Blue Mountains', 'Kangaroo Island', 'Byron Bay',
  ],
  NZ: [
    'Auckland', 'Queenstown', 'Christchurch', 'Wellington', 'Rotorua',
    'Milford Sound', 'Hobbiton', 'Napier', 'Nelson', 'Dunedin', 'Franz Josef',
  ],
  AE: [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
    'Fujairah', 'Al Ain',
  ],
  JO: [
    'Amman', 'Petra', 'Wadi Rum', 'Aqaba', 'Dead Sea', 'Jerash', 'Madaba',
  ],
  IL: [
    'Jerusalem', 'Tel Aviv', 'Haifa', 'Nazareth', 'Dead Sea', 'Eilat',
    'Caesarea', 'Masada', 'Galilee',
  ],
}

export function getCitiesForCountry(countryCode: string): string[] {
  return CITIES_BY_COUNTRY[countryCode] || []
}

// 가이드 지역 정보 타입
export interface GuideRegion {
  country: string   // 국가 코드 (예: 'JP')
  cities: string[]  // 도시/지역 목록 (예: ['Tokyo', 'Osaka'])
}
