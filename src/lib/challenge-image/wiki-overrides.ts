/**
 * 위키백과 문서명 오버라이드 (서버 전용).
 *
 * 제목만으로 검색하면 엉뚱한 문서가 잡히는 항목들의 후보 문서명을 지정한다.
 * 약 95KB 라서 클라이언트로 내려보내지 않고, 서버에서 해당 항목의 후보만 골라
 * prop 으로 전달한다.
 */
import { cleanTitle } from './title'

const WIKI_ARTICLE_OVERRIDES: Record<string, string[]> = {
  // ══════════════════════════════════════════════════════════════
  // 100 FOODS — Wikipedia 문서명/검색어 지정 → 요리 이미지 확실히 확보
  // ══════════════════════════════════════════════════════════════
  'A5 Wagyu Beef':                      ['Wagyu', 'Kobe beef', 'Japanese beef'],
  'Acai Bowl':                          ['Acai berry', 'Açaí na tigela', 'Acai bowl food'],
  'Alaskan King Crab':                  ['King crab', 'Red king crab', 'Alaskan king crab'],
  'Arancini':                           ['Arancini', 'Sicilian rice ball'],
  'Baklava':                            ['Baklava', 'Turkish baklava'],
  'Balut Duck Embryo':                  ['Balut (food)', 'Balut', 'Filipino balut'],
  'Beef Rendang':                       ['Rendang', 'Indonesian rendang'],
  'Beluga Caviar':                      ['Caviar', 'Beluga caviar', 'Sturgeon caviar'],
  'Bibimbap':                           ['Bibimbap', 'Korean bibimbap'],
  'Bird\'s Nest Soup':                  ['Bird\'s nest soup', 'Edible bird\'s nest', 'Swiftlet nest'],
  'Birria Tacos':                       ['Birria', 'Birria taco', 'Goat birria'],
  'Bouillabaisse':                       ['Bouillabaisse', 'Marseille bouillabaisse'],
  'Brazilian Churrasco':                ['Churrasco', 'Brazilian barbecue', 'Rodizio'],
  'Bunny Chow':                         ['Bunny chow', 'Durban bunny chow', 'South African bunny chow'],
  'Ceviche':                            ['Ceviche', 'Peruvian ceviche', 'Fish ceviche'],
  'Char Siu BBQ Pork':                  ['Char siu', 'Cantonese barbecue pork', 'BBQ pork'],
  'Chimichanga':                        ['Chimichanga', 'Fried burrito'],
  'Congee Jook':                        ['Congee', 'Rice congee', 'Jook'],
  'Coq au Vin':                         ['Coq au vin', 'French coq au vin'],
  'Currywurst':                         ['Currywurst', 'Berlin currywurst'],
  'Cuy Roasted Guinea Pig':             ['Cuy (food)', 'Guinea pig as food', 'Peruvian cuy'],
  'Dom Perignon Champagne':             ['Dom Perignon', 'Dom Pérignon (wine)', 'Champagne bottle'],
  'Doner Kebab':                        ['Doner kebab', 'Döner kebab', 'Doner meat'],
  'Durian King of Fruits':              ['Durian', 'Durian fruit'],
  'Eggs Benedict':                      ['Eggs Benedict', 'Eggs benedict breakfast'],
  'Empanada':                           ['Empanada', 'Argentine empanada'],
  'Escargot':                           ['Escargot', 'Snail as food', 'French escargot'],
  'Feijoada':                           ['Feijoada', 'Brazilian feijoada', 'Black bean stew'],
  'Fish and Chips':                     ['Fish and chips', 'British fish and chips'],
  'Foie Gras':                          ['Foie gras', 'Duck foie gras'],
  'Fresh Pacific Oysters':              ['Oyster', 'Pacific oyster', 'Raw oyster'],
  'French Croissant':                   ['Croissant', 'French croissant'],
  'Fugu Puffer Fish':                   ['Fugu', 'Fugu (fish)', 'Pufferfish'],
  'Fugu Shirako':                       ['Shirako', 'Fugu', 'Fish milt'],
  'Full Turkish Breakfast':             ['Turkish breakfast', 'Kahvaltı', 'Turkish kahvalti'],
  'Gelato':                             ['Gelato', 'Italian gelato', 'Gelato ice cream'],
  'Greek Mezze Spread':                 ['Meze', 'Greek meze', 'Mediterranean meze'],
  'Haggis':                             ['Haggis', 'Scottish haggis'],
  'Hakata Tonkotsu Ramen':              ['Ramen', 'Tonkotsu ramen', 'Japanese ramen'],
  'Hakarl Fermented Greenland Shark':   ['Hákarl', 'Fermented shark', 'Icelandic hakarl'],
  'Hu Tieu Nam Vang':                   ['Hu tieu', 'Hủ tiếu', 'Vietnamese noodle soup'],
  'Hungarian Goulash':                  ['Goulash', 'Hungarian goulash', 'Gulyas'],
  'Iberico Ham':                        ['Jamón ibérico', 'Iberian ham', 'Spanish ham'],
  'Injera with Wat':                    ['Injera', 'Ethiopian cuisine', 'Ethiopian injera'],
  'Indomie Mi Goreng':                  ['Indomie', 'Mi goreng', 'Indonesian instant noodle'],
  'Jerk Chicken':                       ['Jerk chicken', 'Jerk (cooking)', 'Jamaican jerk chicken'],
  'Jollof Rice':                        ['Jollof rice', 'West African jollof'],
  'Katsudon':                           ['Katsudon', 'Japanese katsudon', 'Pork cutlet rice'],
  'Khachapuri':                         ['Khachapuri', 'Adjarian khachapuri', 'Georgian khachapuri'],
  'Khao Niao Mamuang (Mango Sticky Rice)': ['Mango sticky rice', 'Khao niao mamuang', 'Thai mango rice'],
  'Khao Niao Mamuang':                  ['Mango sticky rice', 'Khao niao mamuang', 'Thai mango rice'],
  'Kimchi':                             ['Kimchi', 'Korean kimchi'],
  'Kopi Luwak Civet Coffee':            ['Kopi luwak', 'Civet coffee', 'Indonesian coffee'],
  'Laksa':                              ['Laksa', 'Curry mee', 'Singapore laksa'],
  'Lamington':                          ['Lamington', 'Australian lamington', 'Lamington cake'],
  'Lomo Saltado':                       ['Lomo saltado', 'Peruvian lomo saltado'],
  'Maine Lobster Roll':                 ['Lobster roll', 'New England lobster roll', 'Lobster sandwich'],
  'Masala Dosa':                        ['Masala dosa', 'Dosa', 'Indian dosa'],
  'Matsutake Mushroom':                  ['Matsutake', 'Matsutake mushroom', 'Japanese mushroom'],
  'Mole Negro':                         ['Mole (sauce)', 'Mole negro', 'Oaxacan mole'],
  'Momos':                              ['Momo (food)', 'Nepalese momo', 'Tibetan momo'],
  'Moroccan Tagine':                    ['Tajine', 'Moroccan tagine', 'Tagine dish'],
  'Moules Frites':                      ['Moules-frites', 'Mussels and fries', 'Belgian mussels'],
  'Nasi Goreng':                        ['Nasi goreng', 'Indonesian fried rice'],
  'Nasi Lemak':                         ['Nasi lemak', 'Malaysian nasi lemak'],
  'New England Clam Chowder':           ['Clam chowder', 'New England clam chowder', 'Clam soup'],
  'Pad Thai':                           ['Pad thai', 'Thai pad thai', 'Stir fried noodles'],
  'Paella Valenciana':                  ['Paella', 'Paella valenciana', 'Spanish paella'],
  'Pata Negra Jamon Bellota':           ['Jamón ibérico', 'Bellota ham', 'Iberian ham'],
  'Perigord Black Truffle':             ['Black truffle', 'Tuber melanosporum', 'French truffle'],
  'Peyote Cactus Ceremonial Meal':       ['Peyote', 'Lophophora williamsii', 'Peyote cactus'],
  'Pho Bo':                             ['Pho', 'Phở', 'Vietnamese pho', 'Beef noodle soup'],
  'Pierogi':                            ['Pierogi', 'Polish pierogi', 'Dumpling'],
  'Pizza Napoletana':                   ['Neapolitan pizza', 'Pizza napoletana', 'Margherita pizza'],
  'Poutine':                            ['Poutine', 'Canadian poutine', 'Poutine fries'],
  'Ramen':                              ['Ramen', 'Ramen noodle', 'Japanese ramen'],
  'Roti Canai':                         ['Roti canai', 'Roti prata', 'Malaysian roti'],
  'Saltimbocca alla Romana':            ['Saltimbocca', 'Saltimbocca romana', 'Veal saltimbocca'],
  'Saltimbocca':                        ['Saltimbocca', 'Saltimbocca romana', 'Veal saltimbocca'],
  'Samosa':                             ['Samosa', 'Indian samosa', 'Vegetable samosa'],
  'Satay':                              ['Satay', 'Indonesian satay', 'Chicken satay'],
  'Seafood Paella':                     ['Paella', 'Seafood paella', 'Spanish paella'],
  'Shark Fin Soup':                     ['Shark fin soup', 'Chinese shark fin'],
  'Som Tam Green Papaya Salad':         ['Som tam', 'Green papaya salad', 'Thai papaya salad'],
  'Som Tam':                            ['Som tam', 'Green papaya salad', 'Thai papaya salad'],
  'Swedish Smorgasbord':                ['Smörgåsbord', 'Smorgasbord', 'Swedish smorgasbord'],
  'Sushi Omakase':                      ['Sushi', 'Omakase', 'Nigiri sushi'],
  'Takoyaki':                           ['Takoyaki', 'Japanese takoyaki', 'Octopus ball'],
  'Tamal':                              ['Tamale', 'Tamal', 'Mexican tamale'],
  'Tandoori Chicken':                   ['Tandoori chicken', 'Indian tandoori', 'Tandoor chicken'],
  'Tom Yum Goong':                      ['Tom yum', 'Tom yum goong', 'Thai tom yum soup'],
  'Truffle Pasta Alba':                 ['Truffle', 'White truffle', 'Tajarin', 'Pasta with truffle'],
  'Tsukemen Dipping Ramen':             ['Tsukemen', 'Dipping ramen', 'Japanese tsukemen'],
  'Tsukemen':                           ['Tsukemen', 'Dipping ramen', 'Japanese tsukemen'],
  'Tzatziki':                           ['Tzatziki', 'Greek tzatziki', 'Yogurt sauce'],
  'Unagi Kabayaki':                     ['Unagi', 'Unagi no kabayaki', 'Grilled eel'],
  'Valrhona Chocolate':                 ['Chocolate', 'Valrhona', 'French chocolate'],
  'Wiener Schnitzel':                   ['Wiener schnitzel', 'Schnitzel', 'Viennese schnitzel'],
  'Witchetty Grub':                     ['Witchetty grub', 'Australian witchetty grub'],
  'Xiaolongbao Soup Dumplings':         ['Xiaolongbao', 'Soup dumpling', 'Chinese xiaolongbao'],
  'Xiaolongbao':                        ['Xiaolongbao', 'Soup dumpling', 'Chinese xiaolongbao'],
  'Yakitori':                           ['Yakitori', 'Japanese yakitori', 'Chicken skewer'],
  'Zaatar Manakish':                    ['Manakish', 'Za\'atar', 'Zaatar bread'],
  'Zongzi Dragon Boat Dumplings':       ['Zongzi', 'Sticky rice dumpling', 'Chinese zongzi'],
  'Zongzi':                             ['Zongzi', 'Sticky rice dumpling', 'Chinese zongzi'],

  // ══════════════════════════════════════════════════════════════
  // RESTAURANTS (schema-v13) — 대표 음식·내부·전경 우선 (건물만/국기 회피)
  // 검색어: dish food interior dining plating (국기·외관만 나오는 항목 보정)
  // ══════════════════════════════════════════════════════════════

  // ── SPAIN ────────────────────────────────────────────────────
  'Disfrutar':                          ['Disfrutar restaurant Barcelona', 'Disfrutar Barcelona dish food interior dining'],
  'El Celler de Can Roca':              ['El Celler de Can Roca', 'El Celler de Can Roca Girona dish dessert interior'],
  'DiverXO':                            ['DiverXO', 'DiverXO Madrid dish food interior avant-garde'],
  'Asador Etxebarri':                   ['Asador Etxebarri', 'Asador Etxebarri Axpe Basque grill dish food'],
  'Arzak':                              ['Arzak', 'Arzak (restaurant)', 'Arzak San Sebastián dish food interior Basque'],
  'Azurmendi':                          ['Azurmendi', 'Azurmendi (restaurant)', 'Azurmendi Bilbao dish food interior dining'],
  'Martín Berasategui':                 ['Martín Berasategui', 'Martín Berasategui (restaurant)', 'Martín Berasategui Lasarte dish food interior'],
  'Akelarre':                           ['Akelarre', 'Akelarre (restaurant)', 'Akelarre San Sebastián dish food interior dining'],
  'Quique Dacosta':                     ['Quique Dacosta', 'Quique Dacosta (restaurant)', 'Quique Dacosta Denia dish food interior'],
  'Mugaritz':                           ['Mugaritz', 'Mugaritz San Sebastián dish food interior dining'],
  'Elkano':                             ['Elkano', 'Elkano (restaurant)', 'Elkano Getaria turbot dish food interior'],
  'El Invernadero':                     ['El Invernadero', 'El Invernadero (restaurant)', 'El Invernadero Madrid plant-based dish interior'],

  // ── ITALY ────────────────────────────────────────────────────
  'Osteria Francescana':                ['Osteria Francescana', 'Osteria Francescana Modena dish food interior dining'],
  'La Pergola':                         ['La Pergola (restaurant)', 'La Pergola Rome dish food interior terrace'],
  'Reale':                              ['Reale (restaurant)', 'Italian cuisine', 'Reale Niko Romito dish food interior dining'],
  'Lido 84':                            ['Lake Garda', 'Lido 84 (restaurant)', 'Lido 84 Lake Garda dish food interior'],
  'Le Calandre':                        ['Le Calandre', 'Le Calandre Rubano dish food interior dining'],
  'Piazza Duomo':                       ['Piazza Duomo (restaurant)', 'Piazza Duomo Alba dish food interior truffle'],
  'Dal Pescatore':                      ['Dal Pescatore', 'Dal Pescatore Canneto dish food interior dining'],
  'Enoteca Pinchiorri':                 ['Enoteca Pinchiorri', 'Enoteca Pinchiorri Florence dish food wine dining'],

  // ── USA ──────────────────────────────────────────────────────
  'The French Laundry':                 ['The French Laundry', 'The French Laundry Yountville dish food interior dining'],
  'Per Se':                             ['Per Se', 'Per Se (restaurant)', 'Per Se New York dish food interior dining'],
  'Eleven Madison Park':                ['Eleven Madison Park', 'Eleven Madison Park New York dish food interior'],
  'Le Bernardin':                       ['Le Bernardin', 'Le Bernardin New York seafood dish food interior'],
  'Alinea':                             ['Alinea', 'Alinea (restaurant)', 'Alinea Chicago dish food interior molecular'],
  'Atomix':                             ['Atomix', 'Atomix (restaurant)', 'Atomix New York Korean dish food interior dining'],
  'Atelier Crenn':                     ['Atelier Crenn', 'Atelier Crenn San Francisco dish food interior dining'],
  'Quince':                             ['Quince', 'Quince (restaurant)', 'Quince San Francisco dish food interior'],
  'SingleThread':                      ['SingleThread', 'SingleThread (restaurant)', 'SingleThread Healdsburg dish food interior'],
  'The Inn at Little Washington':       ['The Inn at Little Washington', 'Inn Little Washington Virginia dish food interior'],

  // ── FRANCE ───────────────────────────────────────────────────
  'Mirazur':                            ['Mauro Colagreco', 'Mirazur', 'Mirazur Menton dish food interior garden view'],
  'Arpège':                             ['Arpège', 'Arpège (restaurant)', 'Arpège Paris vegetable dish food interior dining'],
  'Guy Savoy':                          ['Guy Savoy', 'Guy Savoy (restaurant)', 'Guy Savoy Paris dish food interior dining'],
  'Epicure (Le Bristol)':               ['Epicure (restaurant)', 'Epicure Paris Le Bristol dish food interior'],
  'Pierre Gagnaire':                    ['Pierre Gagnaire', 'Pierre Gagnaire (restaurant)', 'Pierre Gagnaire Paris dish food interior'],
  'Table by Bruno Verjus':              ['Table by Bruno Verjus', 'French cuisine', 'Table Bruno Verjus Paris dish food interior'],
  'Septime':                            ['Septime', 'Septime (restaurant)', 'Septime Paris dish food interior dining'],
  'Pavillon Ledoyen':                   ['Pavillon Ledoyen', 'Pavillon Ledoyen Paris dish food interior'],
  'Le Meurice':                         ['Le Meurice', 'Le Meurice (restaurant)', 'Le Meurice Paris dish food interior dining'],
  'Anne-Sophie Pic':                    ['Anne-Sophie Pic', 'Anne-Sophie Pic (restaurant)', 'Maison Pic Valence dish food interior'],
  'Maison Troisgros':                   ['Maison Troisgros', 'Maison Troisgros Ouches dish food interior dining'],
  'Le Pré Catelan':                     ['Le Pré Catelan', 'Le Pré Catelan Paris dish food interior'],
  'Régis et Jacques Marcon':            ['Régis et Jacques Marcon', 'Régis Marcon Saint-Bonnet dish food mushroom'],
  'La Bouitte':                         ['Savoie', 'La Bouitte', 'La Bouitte Savoie dish food interior dining'],

  // ── UK ───────────────────────────────────────────────────────
  'The Fat Duck':                       ['The Fat Duck', 'The Fat Duck Bray dish food interior dining'],
  'The Waterside Inn':                  ['The Waterside Inn', 'The Waterside Inn Bray dish food interior Thames'],
  'Alain Ducasse at The Dorchester':    ['Alain Ducasse at The Dorchester', 'Alain Ducasse Dorchester London dish food interior'],
  'Restaurant Gordon Ramsay':           ['Restaurant Gordon Ramsay', 'Gordon Ramsay Chelsea London dish food interior'],
  'Core by Clare Smyth':                ['Clare Smyth', 'Core by Clare Smyth', 'Core Clare Smyth London dish food interior'],
  'L\'Enclume':                         ['L\'Enclume', 'L\'Enclume Cartmel dish food interior dining'],
  'The Ledbury':                        ['The Ledbury', 'The Ledbury London dish food interior dining'],

  // ── DENMARK ──────────────────────────────────────────────────
  'Geranium':                           ['Geranium', 'Geranium (restaurant)', 'Geranium Copenhagen dish food interior Nordic'],
  'Alchemist':                          ['Alchemist', 'Alchemist (restaurant)', 'Alchemist Copenhagen dish food interior dining'],
  'Jordnær':                            ['Geranium (restaurant)', 'Rasmus Kofoed', 'Jordnær Copenhagen dish food interior Nordic'],
  'Kadeau Copenhagen':                  ['Noma (restaurant)', 'René Redzepi', 'Kadeau', 'Kadeau Copenhagen dish food interior Nordic'],

  // ── GERMANY ──────────────────────────────────────────────────
  'Aqua':                               ['Aqua', 'Aqua (restaurant)', 'Aqua Wolfsburg dish food interior dining'],
  'Vendôme':                            ['Vendôme', 'Vendôme (restaurant)', 'Vendôme Bergisch Gladbach dish food interior'],

  // ── BELGIUM ──────────────────────────────────────────────────
  'Hof van Cleve':                      ['Hof van Cleve', 'Hof van Cleve Kruishoutem dish food interior'],

  // ── NETHERLANDS ──────────────────────────────────────────────
  'De Librije':                         ['De Librije', 'De Librije Zwolle dish food interior dining'],
  'Bord\'Eau':                          ['Bord\'Eau', 'Bord\'Eau Amsterdam dish food interior dining'],

  // ── SWEDEN ───────────────────────────────────────────────────
  'Frantzén':                           ['Frantzén', 'Frantzén (restaurant)', 'Frantzén Stockholm dish food interior Nordic'],

  // ── JAPAN ────────────────────────────────────────────────────
  'Sukiyabashi Jiro Honten':            ['Sukiyabashi Jiro', 'Sukiyabashi Jiro sushi dish Tokyo Ginza'],
  'Kichisen':                           ['Kichisen', 'Kichisen Kyoto kaiseki dish food interior'],
  'Nihonryori RyuGin':                  ['Nihonryori RyuGin', 'RyuGin Tokyo kaiseki dish food interior'],
  'Den':                                ['Den', 'Den (restaurant)', 'Den Tokyo kaiseki dish food interior'],
  'Kikunoi Honten':                     ['Kikunoi', 'Kikunoi Kyoto kaiseki dish food interior'],
  'Arashiyama Kitcho':                  ['Kitcho', 'Kaiseki', 'Arashiyama Kitcho Kyoto dish food interior'],
  'Hyotei':                             ['Kaiseki', 'Hyotei Kyoto kaiseki dish food interior'],
  'Quintessence':                       ['Quintessence', 'Quintessence (restaurant)', 'Quintessence Tokyo dish food interior'],
  'Narisawa':                           ['Narisawa', 'Kaiseki', 'Narisawa Tokyo dish food interior satoyama'],
  'Florilège':                          ['Florilège', 'French cuisine', 'Florilège Tokyo dish food interior dining'],
  'Sushi Yoshitake':                    ['Sushi Yoshitake', 'Sushi Yoshitake Ginza dish sushi omakase'],
  'Saito':                              ['Sushi Saito', 'Saito sushi Tokyo dish food interior'],
  'Mizai':                              ['Kaiseki', 'Mizai Kyoto kaiseki dish food interior'],

  // ── SINGAPORE ────────────────────────────────────────────────
  'Odette':                             ['Julien Royer', 'Odette', 'Odette (restaurant)', 'Odette Singapore dish food interior dining'],
  'Jaan by Kirk Westaway':              ['Jaan', 'Jaan (restaurant)', 'Jaan Singapore dish food interior dining'],

  // ── HONG KONG ────────────────────────────────────────────────
  'Lung King Heen':                     ['Lung King Heen', 'Lung King Heen Hong Kong dim sum dish food interior'],
  '8½ Otto e Mezzo Bombana':            ['8½ Otto e Mezzo Bombana', 'Otto e Mezzo Bombana Hong Kong dish food interior'],
  'Amber':                              ['Amber', 'Amber (restaurant)', 'Amber Hong Kong dish food interior dining'],
  'L\'Atelier de Joël Robuchon Hong Kong': ['L\'Atelier de Joël Robuchon', 'L Atelier Joel Robuchon Hong Kong dish food interior'],

  // ── KOREA ────────────────────────────────────────────────────
  'La Yeon':                            ['La Yeon', 'La Yeon Seoul Korean dish food interior dining'],
  'Mingles':                            ['Mingles', 'Mingles (restaurant)', 'Korean cuisine', 'Mingles Seoul dish food interior Korean'],
  'Mosu Seoul':                         ['Mosu', 'Mosu (restaurant)', 'Sung_Anh', 'Mosu Seoul', 'Mosu Seoul dish food interior Korean'],

  // ── AUSTRIA ──────────────────────────────────────────────────
  'Steirereck':                         ['Steirereck', 'Austrian cuisine', 'Steirereck Vienna dish food interior dining'],

  // ── SWITZERLAND ──────────────────────────────────────────────
  'Restaurant de l\'Hôtel de Ville':    ['Crissier', 'Swiss cuisine', 'Restaurant de l\'Hôtel de Ville', 'Hotel de Ville Crissier dish food interior'],

  // ── PERU / LATIN AMERICA ─────────────────────────────────────
  'Central':                            ['Central', 'Central (restaurant)', 'Central Lima Peru dish food interior dining'],
  'Maido':                              ['Maido', 'Maido (restaurant)', 'Maido Lima dish food interior Nikkei'],
  'Kjolle':                             ['Kjolle', 'Central (restaurant)', 'Kjolle Lima dish food interior Peru'],

  // ── MEXICO ───────────────────────────────────────────────────
  'Quintonil':                          ['Quintonil', 'Quintonil Mexico City dish food interior dining'],
  'Pujol':                              ['Pujol', 'Pujol (restaurant)', 'Pujol Mexico City dish food mole interior'],

  // ── ARGENTINA / CHILE / BRAZIL ───────────────────────────────
  'Don Julio':                          ['Don Julio', 'Don Julio (restaurant)', 'Don Julio Buenos Aires parrilla dish food interior'],
  'Boragó':                             ['Boragó', 'Boragó Santiago dish food interior Chile'],
  'A Casa do Porco':                    ['A Casa do Porco', 'A Casa do Porco São Paulo dish food interior'],

  // ── THAILAND ─────────────────────────────────────────────────
  'Gaggan Anand':                       ['Gaggan Anand', 'Gaggan Anand Bangkok dish food interior Indian'],
  'Le Du':                              ['Thitid Tassanakajohn', 'Le Du', 'Le Du (restaurant)', 'Le Du Bangkok dish food interior Thai'],
  'Sorn':                               ['Tom yum', 'Pad thai', 'Sorn', 'Sorn (restaurant)', 'Sorn Bangkok dish food interior Thai'],

  // ── UAE ──────────────────────────────────────────────────────
  'Trèsind Studio':                     ['Tandoori chicken', 'Biryani', 'Trèsind Studio', 'Trèsind Studio Dubai dish food interior Indian'],
  'Ossiano':                            ['Ossiano', 'Ossiano Dubai dish food interior underwater'],

  // ── PORTUGAL ─────────────────────────────────────────────────
  'Belcanto':                           ['Belcanto', 'Belcanto (restaurant)', 'Portuguese cuisine', 'Belcanto Lisbon dish food interior Portuguese'],

  // ── SLOVENIA ─────────────────────────────────────────────────
  'Hiša Franko':                        ['Hiša Franko', 'Hisa Franko Kobarid dish food interior Slovenia'],

  // '21_21 Design Sight, Tokyo' 검색 개선
  '21_21 Design Sight, Tokyo':          ['21_21 Design Sight', 'Tadao Ando Tokyo'],

  // ══════════════════════════════════════════════════════════════
  // ANIMALS (schema-v14) — 9개 추가분 이미지 오버라이드
  // ══════════════════════════════════════════════════════════════
  'Chimpanzee':                         ['Chimpanzee', 'Pan troglodytes Gombe Tanzania Jane Goodall'],
  'Great White Shark':                  ['Great white shark', 'Carcharodon carcharias Gansbaai South Africa cage diving'],
  'Cape Buffalo':                       ['African buffalo', 'Cape buffalo Syncerus caffer Serengeti Tanzania Big Five'],
  'Three-toed Sloth':                   ['Three-toed sloth', 'Bradypus tridactylus Costa Rica rainforest hanging'],
  'Atlantic Puffin':                    ['Atlantic puffin', 'Fratercula arctica Iceland Westman Islands colony'],
  'Fennec Fox':                         ['Fennec fox', 'Vulpes zerda Sahara desert big ears Tunisia'],
  'Amur Tiger':                         ['Siberian tiger', 'Amur tiger Panthera tigris altaica Far East Russia'],
  'Scalloped Hammerhead Shark':         ['Scalloped hammerhead', 'Sphyrna lewini Galapagos Darwin Island schooling sharks'],
  'Golden Snub-nosed Monkey':           ['Golden snub-nosed monkey', 'Rhinopithecus roxellana Sichuan China blue face'],

  // ══════════════════════════════════════════════════════════════
  // GOLF COURSES (schema-v16) — 100개 전면 교체
  // 전략: 각 골프장 Wikipedia 정확 문서명 지정 → 골프장 전경 사진
  //        useFullTitle=true(golf) 이미 적용, 아래는 추가 정밀 보정
  // ══════════════════════════════════════════════════════════════

  // ── 20pt — 메이저 챔피언십 개최 ──────────────────────────────
  'Augusta National Golf Club':         ['Augusta National Golf Club', 'Augusta National Golf Club Masters Tournament aerial'],
  'Oakmont Country Club':               ['Oakmont Country Club', 'Oakmont Country Club golf course aerial Pennsylvania'],
  'Winged Foot Golf Club':              ['Winged Foot Golf Club', 'Winged Foot Golf Club West Course US Open'],
  'Shinnecock Hills Golf Club':         ['Shinnecock Hills Golf Club', 'Shinnecock Hills golf links aerial Southampton'],
  'Pinehurst No. 2':                    ['Pinehurst No. 2', 'Pinehurst Resort No.2 golf course aerial North Carolina'],
  'The Country Club':                   ['The Country Club (Brookline)', 'The Country Club Brookline Massachusetts golf aerial'],
  'Olympic Club Lake Course':           ['Olympic Club (San Francisco)', 'Olympic Club Lake Course US Open San Francisco'],
  'Bethpage Black':                     ['Bethpage Black', 'Bethpage Black Golf Course aerial New York public'],
  'Torrey Pines South Course':          ['Torrey Pines Golf Course', 'Torrey Pines South Course Pacific cliffs La Jolla aerial'],
  'Pebble Beach Golf Links':            ['Pebble Beach Golf Links', 'Pebble Beach Golf Links aerial Carmel Bay 18th hole'],
  'Valhalla Golf Club':                 ['Valhalla Golf Club', 'Valhalla Golf Club PGA Championship Louisville aerial'],
  'Kiawah Island Ocean Course':         ['Ocean Course, Kiawah Island', 'Kiawah Island Ocean Course aerial Pete Dye coastal'],
  'Whistling Straits':                  ['Whistling Straits', 'Whistling Straits golf course Lake Michigan aerial Kohler'],
  'TPC Sawgrass Stadium Course':        ['TPC Sawgrass', 'TPC Sawgrass island green 17th hole Players Championship'],
  'Medinah Country Club No.3':          ['Medinah Country Club', 'Medinah Country Club No.3 aerial Illinois golf'],
  'Hazeltine National Golf Club':       ['Hazeltine National Golf Club', 'Hazeltine National Golf Club aerial Minnesota'],
  'Baltusrol Golf Club Lower Course':   ['Baltusrol Golf Club', 'Baltusrol Golf Club Lower Course US Open aerial New Jersey'],
  'Merion Golf Club East Course':       ['Merion Golf Club', 'Merion Golf Club East Course aerial Ardmore Pennsylvania'],
  'Quail Hollow Club':                  ['Quail Hollow Club', 'Quail Hollow Club golf course aerial Charlotte North Carolina'],
  'St Andrews Old Course':              ['St Andrews Old Course', 'St Andrews Old Course Swilcan Bridge aerial Fife Scotland'],
  'Muirfield':                          ['Muirfield (golf)', 'Muirfield golf course aerial East Lothian Scotland links'],
  'Carnoustie Golf Links':              ['Carnoustie Golf Links', 'Carnoustie Golf Links aerial championship course Scotland'],
  'Royal Birkdale Golf Club':           ['Royal Birkdale Golf Club', 'Royal Birkdale Golf Club aerial links Southport England'],
  'Royal Troon Golf Club':              ['Royal Troon Golf Club', 'Royal Troon Golf Club aerial Postage Stamp Scotland'],
  'Royal Lytham & St Annes Golf Club':  ['Royal Lytham & St Annes Golf Club', 'Royal Lytham St Annes aerial Lancashire Open Championship'],
  'Royal St George\'s Golf Club':       ['Royal St George\'s Golf Club', 'Royal St Georges Golf Club aerial Sandwich Kent Open'],
  'Royal Portrush Golf Club':           ['Royal Portrush Golf Club', 'Royal Portrush Golf Club Dunluce Links aerial Northern Ireland'],
  'Royal Liverpool Golf Club':          ['Royal Liverpool Golf Club', 'Royal Liverpool Golf Club Hoylake aerial Open Championship'],
  'Turnberry Ailsa Course':             ['Trump Turnberry', 'Turnberry Ailsa Course lighthouse aerial Ayrshire Scotland'],

  // ── 15pt — PGA 투어·라이더컵·프레지던츠컵 ─────────────────────
  'Southern Hills Country Club':        ['Southern Hills Country Club', 'Southern Hills Country Club aerial Tulsa Oklahoma golf'],
  'Oak Hill Country Club East Course':  ['Oak Hill Country Club', 'Oak Hill Country Club East Course aerial Rochester New York'],
  'Oakland Hills Country Club South Course': ['Oakland Hills Country Club', 'Oakland Hills Country Club aerial Bloomfield Hills Michigan'],
  'Riviera Country Club':               ['Riviera Country Club', 'Riviera Country Club aerial Pacific Palisades California golf'],
  'Muirfield Village Golf Club':        ['Muirfield Village Golf Club', 'Muirfield Village Golf Club aerial Dublin Ohio Memorial'],
  'East Lake Golf Club':                ['East Lake Golf Club', 'East Lake Golf Club aerial Atlanta Georgia Tour Championship'],
  'Congressional Country Club Blue Course': ['Congressional Country Club', 'Congressional Country Club Blue Course aerial Maryland'],
  'Aronimink Golf Club':                ['Aronimink Golf Club', 'Aronimink Golf Club aerial Newtown Square Pennsylvania'],
  'Bay Hill Club & Lodge':              ['Bay Hill Club & Lodge', 'Bay Hill Club Lodge aerial Orlando Florida Arnold Palmer'],
  'Harbour Town Golf Links':            ['Harbour Town Golf Links', 'Harbour Town Golf Links lighthouse 18th aerial Hilton Head'],
  'Kapalua Plantation Course':          ['Kapalua Golf Club', 'Kapalua Plantation Course aerial Maui Hawaii ocean views'],
  'Firestone Country Club South Course': ['Firestone Country Club', 'Firestone Country Club South Course aerial Akron Ohio'],
  'Bellerive Country Club':             ['Bellerive Country Club', 'Bellerive Country Club aerial St Louis Missouri golf'],
  'Liberty National Golf Club':         ['Liberty National Golf Club', 'Liberty National Golf Club aerial Manhattan skyline New Jersey'],
  'Chambers Bay Golf Course':           ['Chambers Bay', 'Chambers Bay Golf Course aerial US Open Washington State'],
  'Erin Hills Golf Course':             ['Erin Hills', 'Erin Hills Golf Course aerial US Open Wisconsin moraines'],
  'TPC Scottsdale Stadium Course':      ['TPC Scottsdale', 'TPC Scottsdale Stadium Course aerial 16th hole crowd Arizona'],
  'Prairie Dunes Country Club':         ['Prairie Dunes Country Club', 'Prairie Dunes Country Club aerial Kansas golf links-style'],
  'Pine Needles Lodge & Golf Club':     ['Pine Needles Lodge and Golf Club', 'Pine Needles Lodge Golf Club aerial Southern Pines NC'],
  'Waialae Country Club':               ['Waialae Country Club', 'Waialae Country Club aerial Honolulu Hawaii Sony Open'],
  'Colonial Country Club':              ['Colonial Country Club (Fort Worth)', 'Colonial Country Club Fort Worth aerial Texas golf Hogan'],
  'Real Club Valderrama':               ['Real Club Valderrama', 'Valderrama golf course aerial Andalucia Spain cork oak Ryder Cup'],
  'The K Club Palmer Course':           ['The K Club', 'The K Club Palmer Course aerial Kildare Ireland Ryder Cup'],
  'Celtic Manor Twenty Ten Course':     ['Celtic Manor Resort', 'Celtic Manor Twenty Ten Course aerial Newport Wales Ryder Cup'],
  'Gleneagles PGA Centenary Course':    ['Gleneagles Hotel', 'Gleneagles PGA Centenary Course aerial Perthshire Scotland Ryder'],
  'Le Golf National':                   ['Le Golf National', 'Le Golf National Albatros Course aerial Paris Ryder Cup 2018'],
  'Marco Simone Golf & Country Club':   ['Marco Simone Golf and Country Club', 'Marco Simone Golf Club aerial Rome Italy Ryder Cup 2023'],
  'The Belfry Brabazon Course':         ['The Belfry', 'The Belfry Brabazon Course aerial Sutton Coldfield Ryder Cup'],
  'Royal County Down Golf Club':        ['Royal County Down Golf Club', 'Royal County Down Golf Club aerial Mourne Mountains Northern Ireland'],
  'Royal Montreal Golf Club':           ['Royal Montreal Golf Club', 'Royal Montreal Golf Club Blue Course aerial Quebec Canada'],
  'Glen Abbey Golf Club':               ['Glen Abbey Golf Club', 'Glen Abbey Golf Club aerial Oakville Ontario Canadian Open'],
  'Kasumigaseki Country Club East Course': ['Kasumigaseki Country Club', 'Kasumigaseki Country Club East Course Tokyo Olympics 2020'],
  'Narashino Country Club':             ['Narashino Country Club', 'Narashino Country Club aerial Inzai Chiba Japan ZOZO Championship'],
  'Jack Nicklaus Golf Club Korea':      ['Jack Nicklaus Golf Club Korea', 'Jack Nicklaus Golf Club Korea aerial Songdo Presidents Cup'],
  'Nine Bridges Golf Club':             ['Nine Bridges Golf Club', 'Nine Bridges Golf Club aerial Jeju Island Korea autumn'],
  'Royal Melbourne Golf Club':          ['Royal Melbourne Golf Club', 'Royal Melbourne Golf Club composite aerial sandbelt Australia'],
  'Kingston Heath Golf Club':           ['Kingston Heath Golf Club', 'Kingston Heath Golf Club aerial Melbourne sandbelt Australian Open'],
  'Gary Player Country Club':           ['Gary Player Country Club', 'Gary Player Country Club aerial Sun City South Africa Nedbank'],
  'Fancourt Links':                     ['Fancourt', 'Fancourt Links aerial George South Africa Presidents Cup Ernie Els'],
  'Sheshan International Golf Club':    ['Sheshan International Golf Club', 'Sheshan International Golf Club aerial Shanghai WGC HSBC Champions'],
  'Emirates Golf Club Majlis Course':   ['Emirates Golf Club', 'Emirates Golf Club Majlis Course aerial Dubai DP World Tour'],
  'Evian Resort Golf Club':             ['Evian Resort Golf Club', 'Evian Resort Golf Club aerial Lake Geneva Alps France Evian Championship'],

  // ── 10pt — 투어 정기 개최 ────────────────────────────────────
  'Wentworth Club West Course':         ['Wentworth Club', 'Wentworth Club West Course aerial Surrey England BMW PGA'],
  'Sunningdale Golf Club Old Course':   ['Sunningdale Golf Club', 'Sunningdale Golf Club Old Course aerial Berkshire heathland'],
  'Loch Lomond Golf Club':              ['Loch Lomond Golf Club', 'Loch Lomond Golf Club aerial Scottish Highlands Scottish Open'],
  'Kingsbarns Golf Links':              ['Kingsbarns Golf Links', 'Kingsbarns Golf Links aerial Fife Scotland sea views Dunhill'],
  'Royal Dornoch Golf Club':            ['Royal Dornoch Golf Club', 'Royal Dornoch Golf Club aerial Highland Scotland links'],
  'Portmarnock Golf Club':              ['Portmarnock Golf Club', 'Portmarnock Golf Club aerial Dublin peninsula Irish Open'],
  'Lahinch Golf Club Old Course':       ['Lahinch Golf Club', 'Lahinch Golf Club Old Course aerial County Clare Ireland links'],
  'Crans-sur-Sierre Golf Club':         ['Crans-sur-Sierre', 'Crans-sur-Sierre golf course aerial Swiss Alps European Masters'],
  'El Saler Golf Club':                 ['El Saler Golf Club', 'El Saler Golf Club aerial Valencia Spain Mediterranean dunes'],
  'TPC Southwind':                      ['TPC Southwind', 'TPC Southwind aerial Memphis Tennessee FedEx St Jude Championship'],
  'TPC Deere Run':                      ['TPC Deere Run', 'TPC Deere Run aerial Silvis Illinois John Deere Classic'],
  'Spyglass Hill Golf Course':          ['Spyglass Hill Golf Course', 'Spyglass Hill Golf Course aerial Pebble Beach California'],
  'Hirono Golf Club':                   ['Hirono Golf Club', 'Hirono Golf Club aerial Kobe Japan Charles Alison golf course'],
  'Yomiuri Country Club':               ['Yomiuri Country Club', 'Yomiuri Country Club aerial Tokyo Japan Open golf'],
  'Blue Canyon Country Club':           ['Blue Canyon Country Club', 'Blue Canyon Country Club aerial Phuket Thailand golf'],
  'Woo Jeong Hills Country Club':       ['Woo Jeong Hills Country Club', 'Woo Jeong Hills Country Club aerial Cheonan Korea CJ Cup'],
  'Mission Hills Golf Club Shenzhen':   ['Mission Hills Golf Club (China)', 'Mission Hills Golf Club Shenzhen aerial world largest golf facility'],
  'Royal Adelaide Golf Club':           ['Royal Adelaide Golf Club', 'Royal Adelaide Golf Club aerial South Australia MacKenzie'],
  'New South Wales Golf Club':          ['New South Wales Golf Club', 'New South Wales Golf Club aerial Botany Bay Sydney clifftop'],
  'Kauri Cliffs Golf Course':           ['Kauri Cliffs', 'Kauri Cliffs Golf Course aerial Bay of Islands New Zealand ocean'],
  'Abu Dhabi Golf Club':                ['Abu Dhabi Golf Club', 'Abu Dhabi Golf Club aerial UAE HSBC Championship'],
  'Leopard Creek Country Club':         ['Leopard Creek Country Club', 'Leopard Creek Country Club aerial Kruger Park South Africa'],
  'Durban Country Club':                ['Durban Country Club', 'Durban Country Club aerial KwaZulu-Natal South Africa Open'],
  'PGA Catalunya Stadium Course':       ['PGA Catalunya Resort', 'PGA Catalunya Stadium Course aerial Girona Spain Solheim Cup'],
  'Golf Club Gut Lärchenhof':           ['Golf Club Gut Lärchenhof', 'Golf Club Gut Lärchenhof aerial Cologne Germany BMW International'],
  'El Camaleón Golf Club':              ['El Camaleon Golf Course', 'El Camaleón Golf Club aerial Mayakoba Riviera Maya Mexico PGA Tour'],
  'Albany Golf Course, Bahamas':        ['Albany (resort)', 'Albany Golf Course aerial Nassau Bahamas Hero World Challenge Ernie Els'],
  'Mid Ocean Club':                     ['Mid Ocean Club', 'Mid Ocean Club golf aerial Tucker\'s Town Bermuda Atlantic Charles Macdonald'],
  'Port Royal Golf Course':             ['Port Royal Golf Course', 'Port Royal Golf Course aerial Bermuda Championship PGA Tour Southampton'],

  // ══════════════════════════════════════════════════════════════
  // FISHING SPOTS (schema-v15) — 100개 전면 교체
  // 전략: title_en = 지명 중심 → Wikipedia 지역 사진 (강·호수·풍경)
  //        어종명 아닌 지역 Wikipedia 문서로 직접 지정
  // ══════════════════════════════════════════════════════════════

  // ── NORTH AMERICA FRESHWATER ──────────────────────────────
  'Kenai River':                        ['Kenai River', 'Kenai River Alaska salmon fly fishing scenic'],
  'Skeena River':                       ['Skeena River', 'Skeena River British Columbia steelhead fly fishing'],
  'Grand Cascapedia River':             ['Grand Cascapedia River', 'Quebec Atlantic salmon river Cascapedia'],
  'Madison River, Montana':             ['Madison River (Montana)', 'Madison River Montana fly fishing trout canyon'],
  'Bighorn River, Montana':             ['Bighorn River', 'Bighorn River Montana tailwater trout fishing'],
  'Deschutes River, Oregon':            ['Deschutes River', 'Deschutes River Oregon steelhead canyon basalt'],
  'Green River, Wyoming':               ['Green River (Wyoming)', 'Green River Wyoming fly fishing tailwater Flaming Gorge'],
  'San Juan River, New Mexico':         ['San Juan River (New Mexico)', 'San Juan River New Mexico trout tailwater'],
  'Naknek River, Alaska':               ['Naknek River', 'Naknek River Alaska Bristol Bay sockeye salmon'],
  'Snake River, Idaho':                 ['Snake River', 'Snake River Idaho steelhead canyon Hells Canyon'],
  'Bow River, Alberta':                 ['Bow River', 'Bow River Calgary Alberta brown trout fly fishing'],
  'Miramichi River, New Brunswick':     ['Miramichi River', 'Miramichi River New Brunswick Atlantic salmon fishing'],
  'Nipigon River, Ontario':             ['Nipigon River', 'Nipigon River Ontario brook trout Lake Nipigon'],
  'Lake Erie, USA':                     ['Lake Erie', 'Lake Erie walleye fishing Great Lakes western basin'],
  'Boundary Waters, Minnesota':         ['Boundary Waters Canoe Area Wilderness', 'Boundary Waters Minnesota canoe fishing wilderness'],

  // ── NORTH AMERICA SALTWATER ──────────────────────────────
  'Florida Keys':                       ['Florida Keys', 'Florida Keys fishing tarpon permit bonefish flats'],
  'Kona, Hawaii':                       ['Kona, Hawaii', 'Kona Hawaii blue marlin sportfishing Pacific Ocean'],
  'Andros Island, Bahamas':             ['Andros, Bahamas', 'Andros Island Bahamas bonefish flats fishing tropical'],
  'Jardines de la Reina, Cuba':         ['Jardines de la Reina', 'Jardines de la Reina Cuba reef pristine fishing'],
  'Pinas Bay, Panama':                  ['Piñas Bay', 'Pinas Bay Panama Tropic Star Lodge black marlin'],
  'Iztapa, Guatemala':                  ['Iztapa', 'Iztapa Guatemala Pacific sailfish offshore fishing'],
  'Boca Grande Pass, Florida':          ['Boca Grande, Florida', 'Boca Grande Pass Florida tarpon fishing gulf'],
  'Cape Cod, Massachusetts':            ['Cape Cod', 'Cape Cod Massachusetts beach fishing striped bass surfcasting'],
  'Everglades, Florida':                ['Everglades', 'Everglades Florida backcountry fishing mangrove snook redfish'],
  'Cabo San Lucas, Mexico':             ['Cabo San Lucas', 'Cabo San Lucas Mexico marlin fishing Pacific sportfishing'],
  'Cozumel, Mexico':                    ['Cozumel', 'Cozumel Mexico Caribbean blue water fishing marlin'],
  'Puerto Vallarta, Mexico':            ['Puerto Vallarta', 'Puerto Vallarta Mexico Pacific sailfish fishing offshore'],

  // ── SOUTH AMERICA ────────────────────────────────────────
  'Rio Grande, Tierra del Fuego':       ['Río Grande, Tierra del Fuego', 'Rio Grande Tierra del Fuego river Patagonia sea trout'],
  'Palena River, Chile':                ['Palena River', 'Palena River Chile Patagonia river rainbow trout wilderness'],
  'Cinaruco River, Venezuela':          ['Cinaruco River', 'Cinaruco River Venezuela Llanos fishery peacock bass'],
  'Inirida River, Colombia':            ['Inírida River', 'Inirida River Colombia Amazon tributary peacock bass'],
  'Corrientes Province, Argentina':     ['Corrientes Province', 'Corrientes Province Argentina Paraná river dorado'],
  'Amazon River, Brazil':               ['Amazon River', 'Amazon River Brazil tropical rainforest river jungle'],
  'Pantanal, Brazil':                   ['Pantanal', 'Pantanal Brazil wetland river fishing landscape wildlife'],
  'Guanacaste, Costa Rica':             ['Guanacaste Province', 'Guanacaste Costa Rica Pacific coast fishing roosterfish'],
  'Madre de Dios River, Peru':          ['Madre de Dios River', 'Madre de Dios River Peru Amazon jungle fishing'],
  'Parana River, Argentina':            ['Paraná River', 'Paraná River Argentina Entre Rios fishing riverscape'],

  // ── EUROPE ───────────────────────────────────────────────
  'Alta River, Norway':                 ['Alta River', 'Alta River Norway Finnmark salmon fishing canyon landscape'],
  'Lofoten Islands, Norway':            ['Lofoten', 'Lofoten Islands Norway Arctic cod fishing scenic mountains'],
  'Ellidaár River, Iceland':            ['Elliðaár', 'Ellidaár River Reykjavik Iceland salmon urban river'],
  'Tungnaá River, Iceland':             ['Tungnaá', 'Tungnaá River Iceland highland wilderness salmon fishing'],
  'River Tay, Scotland':                ['River Tay', 'River Tay Scotland salmon fishing Perth Kenmore scenic'],
  'River Spey, Scotland':               ['River Spey', 'River Spey Scotland salmon fishing Speyside whisky country'],
  'River Tweed, Scotland':              ['River Tweed', 'River Tweed Scotland England border Atlantic salmon fishing'],
  'Ebro River, Spain':                  ['Ebro', 'Ebro River Spain Mequinenza reservoir wels catfish fishing'],
  'Canary Islands, Spain':              ['Canary Islands', 'Canary Islands Atlantic Ocean fishing bluefin tuna marlin'],
  'Azores, Portugal':                   ['Azores', 'Azores Portugal Atlantic islands big game fishing volcanic ocean'],
  'Kola Peninsula, Russia':             ['Kola Peninsula', 'Kola Peninsula Russia salmon river arctic wilderness fishing'],
  'Ponoi River, Russia':                ['Ponoi River', 'Ponoi River Kola Russia Atlantic salmon lodge wilderness'],
  'River Moy, Ireland':                 ['River Moy', 'River Moy Ireland Mayo Ballina salmon fishing'],
  'Connemara, Ireland':                 ['Connemara', 'Connemara Ireland lakes brown trout fly fishing landscape'],
  'Lake Inari, Finland':                ['Lake Inari', 'Lake Inari Finland Lapland Arctic fishing wilderness'],
  'Lake Vänern, Sweden':                ['Lake Vänern', 'Lake Vänern Sweden largest lake fishing pike perch'],
  'Bug River, Poland':                  ['Bug River', 'Bug River Poland Ukraine border pike perch fishing'],
  'Po River, Italy':                    ['Po River', 'Po River Italy Northern valley fishing landscape Cremona'],
  'Volga River Delta, Russia':          ['Volga River', 'Volga Delta Astrakhan Russia Caspian fishing landscape'],

  // ── AFRICA ───────────────────────────────────────────────
  'Congo River, DRC':                   ['Congo River', 'Congo River DRC rapids Malebo Pool Africa fishing'],
  'Cosmoledo Atoll, Seychelles':        ['Cosmoledo Atoll', 'Cosmoledo Atoll Seychelles Indian Ocean remote flats'],
  'Zambezi River, Zimbabwe':            ['Zambezi River', 'Zambezi River Zimbabwe Victoria Falls tigerfish fishing'],
  'Lake Tanganyika, Tanzania':          ['Lake Tanganyika', 'Lake Tanganyika Tanzania deepest lake Africa fishing'],
  'Bazaruto Archipelago, Mozambique':   ['Bazaruto Archipelago', 'Bazaruto Archipelago Mozambique Indian Ocean fishing'],
  'Watamu, Kenya':                      ['Watamu', 'Watamu Kenya coast marine park beach blue water fishing'],
  'Zanzibar Channel, Tanzania':         ['Zanzibar', 'Zanzibar Tanzania Indian Ocean fishing dhow channel'],
  'Malindi, Kenya':                     ['Malindi', 'Malindi Kenya Indian Ocean coast billfish reef fishing'],
  'Cape Point, South Africa':           ['Cape Point', 'Cape Point South Africa False Bay tuna fishing scenic'],
  'Lake Victoria, Kenya':               ['Lake Victoria', 'Lake Victoria Kenya Africa largest lake Nile perch fishing'],
  'Lake Malawi, Malawi':                ['Lake Malawi', 'Lake Malawi Africa clear water fishing landscape'],
  'Niassa Reserve, Mozambique':         ['Niassa National Reserve', 'Niassa Reserve Mozambique Lugenda River remote wilderness'],
  'Walvis Bay, Namibia':                ['Walvis Bay', 'Walvis Bay Namibia lagoon fishing Skeleton Coast Atlantic'],

  // ── RUSSIA / MONGOLIA ────────────────────────────────────
  'Kamchatka Peninsula, Russia':        ['Kamchatka Peninsula', 'Kamchatka Peninsula Russia salmon river landscape volcano'],
  'Lake Baikal, Russia':                ['Lake Baikal', 'Lake Baikal Russia deepest lake ice fishing winter landscape'],
  'Eg-Uur River, Mongolia':             ['Eg River (Mongolia)', 'Eg Uur River Mongolia taimen fishing steppe wilderness'],
  'Amur River, Russia':                 ['Amur River', 'Amur River Russia China border river fishing landscape'],

  // ── ASIA ─────────────────────────────────────────────────
  'Yarlung Tsangpo, Tibet':             ['Yarlung Tsangpo', 'Yarlung Tsangpo Tibet gorge river high altitude landscape'],
  'Ramganga River, India':              ['Ramganga River', 'Ramganga River India Jim Corbett National Park mahseer'],
  'Cauvery River, India':               ['Cauvery River', 'Cauvery River India Karnataka fishing mahseer landscape'],
  'Hokkaido, Japan':                    ['Hokkaidō', 'Hokkaido Japan nature river fishing wilderness northern island'],
  'Shiretoko Peninsula, Japan':         ['Shiretoko Peninsula', 'Shiretoko Peninsula Japan UNESCO wilderness river fishing'],
  'Sarawak, Borneo, Malaysia':          ['Sarawak', 'Sarawak Borneo Malaysia rainforest river jungle fishing'],
  'Mamberamo River, Papua':             ['Mamberamo River', 'Mamberamo River Papua Indonesia remote jungle river'],
  'Chiang Khong, Thailand':             ['Chiang Khong', 'Chiang Khong Thailand Mekong River border landscape'],
  'Kerala Backwaters, India':           ['Kerala backwaters', 'Kerala Backwaters India houseboat canal fishing landscape'],
  'Mekong Delta, Vietnam':              ['Mekong Delta', 'Mekong Delta Vietnam river fishing floating market landscape'],
  'Lake Biwa, Japan':                   ['Lake Biwa', 'Lake Biwa Japan largest lake fishing Shiga landscape'],

  // ── PACIFIC / OCEANIA ────────────────────────────────────
  'Lake Taupo, New Zealand':            ['Lake Taupo', 'Lake Taupo New Zealand largest lake trout fishing landscape'],
  'Tongariro River, New Zealand':       ['Tongariro River', 'Tongariro River New Zealand trout fly fishing scenic UNESCO'],
  'Cairns, Queensland':                 ['Cairns', 'Cairns Queensland Australia Great Barrier Reef marlin fishing'],
  'Ningaloo Reef, Australia':           ['Ningaloo Coast', 'Ningaloo Reef Western Australia coral fishing sailfish'],
  'Darwin, Northern Territory':         ['Darwin, Northern Territory', 'Darwin Northern Territory Australia barramundi fishing flats'],
  'Christmas Island, Kiribati':         ['Christmas Island, Kiribati', 'Christmas Island Kiribati Pacific atoll bonefish fishing'],
  'Yasawa Islands, Fiji':               ['Yasawa Islands', 'Yasawa Islands Fiji Pacific tropical fishing landscape coral'],
  'Palau, Micronesia':                  ['Palau', 'Palau Micronesia Pacific blue water fishing reef tropical'],
  'Solomon Islands':                    ['Solomon Islands', 'Solomon Islands Melanesia Pacific coral reef tropical landscape'],
  'Papua New Guinea':                   ['Papua New Guinea', 'Papua New Guinea coral coast reef fishing tropical'],
  'Tonga, South Pacific':               ['Tonga', 'Tonga South Pacific islands fishing tropical ocean landscape'],
  'New Caledonia':                      ['New Caledonia', 'New Caledonia lagoon UNESCO Pacific coral reef fishing'],

  // ── SALTWATER / OFFSHORE ─────────────────────────────────
  'Bocas del Toro, Panama':             ['Bocas del Toro', 'Bocas del Toro Panama Caribbean islands tropical fishing'],
  'Cape Verde Islands':                 ['Cape Verde', 'Cape Verde Atlantic islands ocean fishing marlin blue water'],
  'Mauritius':                          ['Mauritius', 'Mauritius Indian Ocean lagoon fishing marlin tropical island'],
  'Maldives':                           ['Maldives', 'Maldives Indian Ocean atoll tropical blue water fishing GT'],
  'Musandam Fjords, Oman':              ['Musandam Peninsula', 'Musandam Oman fjord Arabian Sea fishing landscape'],
  'Andaman Islands, India':             ['Andaman and Nicobar Islands', 'Andaman Islands India ocean fishing tropical reef'],
  'Chesapeake Bay, Maryland':           ['Chesapeake Bay', 'Chesapeake Bay Maryland estuary fishing striped bass blue crab'],
  'Louisiana Bayou, USA':               ['Atchafalaya Basin', 'Louisiana bayou swamp red drum fishing Cajun landscape'],

  // ══════════════════════════════════════════════════════════════
  // SURFING SPOTS
  // 쉼표 없는 항목 / 이름이 혼동될 수 있는 항목만 직접 지정.
  // 나머지는 위치 추출 로직(쉼표 뒤 지명)으로 처리됨.
  // ══════════════════════════════════════════════════════════════

  // ── 쉼표 없는 서핑 항목 ────────────────────────────────────────
  'Colorado River Bar':                 ['San Juan del Sur Nicaragua', 'Nicaragua Pacific right-hand surf point'],
  'Roderigas Reef':                     ['Rodrigues Island Mauritius', 'Indian Ocean reef surf Rodrigues'],
  'Aruba Surf':                         ['Aruba', 'Caribbean Aruba trade wind beach break surfing'],
  'Solomon Islands Surf':               ['Solomon Islands', 'Marovo Lagoon Melanesia surf boat trip'],
  'Palau Reef Pass':                    ['Palau', 'Palau Micronesia crystal reef surf diving'],

  // ── 이름 혼동 방지 ─────────────────────────────────────────────
  // "Java" → Java 프로그래밍 언어 방지
  'G-Land (Grajagan), Java':            ['G-Land surf Indonesia', 'Grajagan Bay East Java surf camp remote'],
  // "Pacific" → 너무 광범위
  'Niue Island, Pacific':               ['Niue', 'Niue South Pacific coral reef island surfing'],
  // "Kyrgyzstan" → Central Asia lake surfing (very unusual)
  'Balykchi, Kyrgyzstan':               ['Issyk-Kul', 'Lake Issyk-Kul Kyrgyzstan freshwater surfing'],
  // 빙하 지역 서핑
  'Grindavik, Iceland':                 ['Grindavík', 'Iceland black sand beach surf geothermal Reykjanes'],

  // ══════════════════════════════════════════════════════════════
  // SCUBA DIVE SITES (schema-v17) — 100개 전면 교체
  // 전략: 수중/다이빙 사진 Wikipedia 문서로 직접 지정
  //        국기·지도 이미지 방지, 해양생물·난파선·산호초 사진 유도
  // ══════════════════════════════════════════════════════════════

  // ── 20pt — 세계 버킷리스트 ──────────────────────────────────
  'Raja Ampat':                         ['Raja Ampat', 'Raja Ampat coral reef fish diversity Indonesia underwater'],
  'Tubbataha Reef':                     ['Tubbataha Reefs Natural Park', 'Tubbataha Reef Philippines coral UNESCO underwater'],
  'Komodo National Park':               ['Komodo National Park', 'Komodo diving manta ray reef Indonesia underwater'],
  'Sipadan Island':                     ['Sipadan Island', 'Sipadan Malaysia turtle coral reef underwater barracuda'],
  'Milne Bay, Papua New Guinea':        ['Milne Bay', 'Milne Bay Papua New Guinea coral reef nudibranch diving'],
  'Mergui Archipelago, Myanmar':        ['Mergui Archipelago', 'Mergui Archipelago Myanmar pristine coral reef diving'],
  'Palau Blue Corner':                  ['Blue Corner Wall', 'Palau Blue Corner reef sharks drift dive underwater'],
  'Truk Lagoon, Micronesia':            ['Chuuk Lagoon', 'Truk Lagoon Chuuk WW2 Japanese wreck ship underwater'],
  'Cocos Island, Costa Rica':           ['Cocos Island', 'Cocos Island Costa Rica hammerhead sharks underwater pelagic'],
  'Darwin Arch, Galápagos':             ['Darwin Island', 'Darwin Arch Galapagos whale sharks hammerheads underwater'],
  'Tonga Humpback Whale Dive':          ['Humpback whale', 'humpback whale underwater swimming mother calf Pacific'],
  'Palau Wrecks, Micronesia':           ['Palau', 'Palau Japanese WW2 ship wreck coral reef diving underwater'],
  'Aldabra Atoll, Seychelles':          ['Aldabra', 'Aldabra Atoll Seychelles coral reef shark UNESCO underwater'],
  'Sodwana Bay, South Africa':          ['Sodwana Bay', 'Sodwana Bay South Africa coral reef scuba diving whale shark'],
  'Fernando de Noronha, Brazil':        ['Fernando de Noronha', 'Fernando de Noronha Brazil clear water coral reef underwater'],
  'SS Thistlegorm, Red Sea':            ['SS Thistlegorm', 'SS Thistlegorm WW2 wreck diving Red Sea Egypt motorcycle'],
  'Brothers Islands, Sudan':            ['Brothers Islands, Egypt', 'Brothers Islands Red Sea shark diving hammerhead Sudan'],
  'Malpelo Island, Colombia':           ['Malpelo Island', 'Malpelo Island Colombia hammerhead shark school underwater'],
  'Great Blue Hole, Belize':            ['Great Blue Hole', 'Great Blue Hole Belize diving UNESCO sinkhole stalactites'],
  'Silfra Fissure, Iceland':            ['Silfra', 'Silfra fissure Iceland diving tectonic plates crystal clear'],
  'Scapa Flow, Scotland':               ['Scapa Flow', 'Scapa Flow WW1 German warship wreck Scotland diving'],
  'Tiger Beach, Bahamas':               ['Tiger shark', 'Tiger Beach Bahamas tiger shark diving clear water'],
  'SS President Coolidge, Vanuatu':     ['SS President Coolidge', 'SS President Coolidge Vanuatu wreck diving ship interior'],
  'HMHS Britannic Wreck, Aegean':       ['HMHS Britannic', 'HMHS Britannic wreck Aegean Greece underwater ship Titanic sister'],
  'Andavadoaka, Madagascar':            ['Andavadoaka', 'Madagascar coral reef diving pristine ocean underwater'],

  // ── 15pt — 프리미어 다이빙 포인트 ──────────────────────────────
  'Nusa Penida, Bali':                  ['Nusa Penida', 'Nusa Penida Bali mola-mola manta ray diving underwater'],
  'Richelieu Rock, Thailand':           ['Richelieu Rock', 'Richelieu Rock Thailand whale shark seahorse coral diving'],
  'Similan Islands, Thailand':          ['Similan Islands', 'Similan Islands Thailand coral reef fish scuba diving Andaman'],
  'Wakatobi, Indonesia':                ['Wakatobi National Park', 'Wakatobi Indonesia pristine coral reef wall diving'],
  'Bunaken, Indonesia':                 ['Bunaken National Marine Park', 'Bunaken Indonesia vertical wall diving coral reef turtle'],
  'Apo Island, Philippines':            ['Apo Island', 'Apo Island Philippines sea turtle coral reef underwater'],
  'Moalboal, Philippines':              ['Moalboal', 'Moalboal Philippines sardine run school fish underwater coral'],
  'Coron Bay, Philippines':             ['Coron, Palawan', 'Coron Bay Philippines Japanese WW2 wreck diving coral'],
  'Koh Tao, Thailand':                  ['Ko Tao', 'Koh Tao Thailand coral reef scuba diving school fish underwater'],
  'Malapascua Island, Philippines':     ['Malapascua Island', 'Malapascua thresher shark sunrise Monad Shoal Philippines'],
  'Pulau Weh, Indonesia':               ['Pulau Weh', 'Pulau Weh Sabang Indonesia coral reef diving nudibranch'],
  'Rangiroa, French Polynesia':         ['Rangiroa', 'Rangiroa French Polynesia atoll drift diving shark dolphin'],
  'Fakarava, French Polynesia':         ['Fakarava', 'Fakarava French Polynesia grey reef shark wall diving UNESCO'],
  'Pacific Harbor, Fiji':               ['Pacific Harbour', 'Pacific Harbor Fiji bull shark bait dive underwater Beqa'],
  'Yap Island, Micronesia':             ['Yap, Federated States of Micronesia', 'Yap Island manta ray resident diving coral reef'],
  'Kona Manta Ray Night Dive, Hawaii':  ['Manta ray', 'Kona Hawaii manta ray night dive plankton lights underwater ballet'],
  'Niue, South Pacific':                ['Niue', 'Niue Pacific ocean visibility coral reef sea snake diving'],
  'North Malé Atoll, Maldives':         ['North Malé Atoll', 'Maldives coral reef diving hammerhead shark manta ray'],
  'Mafia Island, Tanzania':             ['Mafia Island', 'Mafia Island Tanzania coral reef whale shark diving pristine'],
  'Tofo Beach, Mozambique':             ['Tofo', 'Tofo Beach Mozambique manta ray whale shark diving Indian Ocean'],
  'Mayotte, Indian Ocean':              ['Mayotte', 'Mayotte Indian Ocean hammerhead shark coral reef diving'],
  'Nosy Be, Madagascar':                ['Nosy Be', 'Nosy Be Madagascar whale shark diving coral reef tropical'],
  'Ras Mohammed, Egypt':                ['Ras Mohammed National Park', 'Ras Mohammed Egypt coral reef shark jackfish Red Sea'],
  'Blue Hole Dahab, Egypt':             ['Blue Hole, Dahab', 'Blue Hole Dahab Egypt freediving sinkhole Red Sea arch'],
  'Djibouti Whale Shark, Djibouti':     ['Gulf of Tadjoura', 'Djibouti whale shark diving Bay of Tadjoura aggregation'],
  'Eilat, Israel':                      ['Eilat', 'Eilat Israel Red Sea coral reef diving clear water Moses Rock'],
  'Aqaba, Jordan':                      ['Aqaba', 'Aqaba Jordan Red Sea Cedar Pride wreck coral reef diving'],
  'Aliwal Shoal, South Africa':         ['Aliwal Shoal', 'Aliwal Shoal South Africa ragged tooth shark reef diving'],
  'Watamu Marine Park, Kenya':          ['Watamu Marine National Park', 'Watamu Kenya coral reef marine park sea turtle diving'],
  'Mnemba Atoll, Zanzibar':             ['Mnemba Island', 'Mnemba Atoll Zanzibar turtle coral reef manta ray diving'],
  'Cenotes Yucatan, Mexico':            ['Cenote', 'Cenote Yucatan Mexico cave diving stalactites halocline freshwater'],
  'Roatan, Honduras':                   ['Roatán', 'Roatan Honduras barrier reef coral diving whale shark Caribbean'],
  'Belize Barrier Reef':                ['Belize Barrier Reef', 'Belize Barrier Reef coral reef nurse shark UNESCO diving'],
  'Bat Islands, Costa Rica':            ['Isla Murciélago', 'Bat Islands Costa Rica bull shark diving Guanacaste reef'],
  'Coiba Island, Panama':               ['Coiba Island', 'Coiba Island Panama UNESCO whale shark coral reef diving'],
  'El Hierro Marine Reserve, Spain':    ['El Hierro', 'El Hierro Canary Islands marine reserve angel shark lava diving'],
  'Norway Fjord Diving, Norway':        ['Fjord (Norway)', 'Norway fjord scuba diving cold water wolf fish anemone visibility'],
  'Kosterfjorden, Sweden':              ['Kosterfjord', 'Kosterfjorden Sweden deep fjord diving sea fan cold water'],
  'Easter Island, Chile':               ['Easter Island', 'Easter Island underwater Moai coral reef clear Pacific diving'],

  // ── 10pt — 주목 포인트 ─────────────────────────────────────
  'Great Barrier Reef, Australia':      ['Great Barrier Reef', 'Great Barrier Reef Australia coral reef fish UNESCO underwater'],
  'New Caledonia Shark Bay':            ['New Caledonia', 'New Caledonia lagoon UNESCO coral reef bull shark diving'],
  'Norfolk Island, Pacific':            ['Norfolk Island', 'Norfolk Island HMAS Sirius wreck coral reef Pacific diving'],
  'Saipan Blue Hole, Northern Marianas': ['Garapan', 'Saipan Northern Mariana Islands Blue Hole WWII Zero fighter diving'],
  'Jellyfish Lake, Palau':              ['Jellyfish Lake', 'Jellyfish Lake Palau stingless jellyfish snorkel UNESCO lake'],
  'Subic Bay Wrecks, Philippines':      ['Subic Bay', 'Subic Bay Philippines WW2 wreck diving coral reef octopus'],
  'Green Island, Taiwan':               ['Green Island, Taiwan', 'Green Island Taiwan coral reef diving hot spring underwater'],
  'Koh Lipe, Thailand':                 ['Ko Lipe', 'Koh Lipe Thailand coral reef leopard shark diving Andaman Sea'],
  'Comoro Islands':                     ['Comoro Islands', 'Comoro Islands coelacanth whale shark marine park coral reef'],
  'Lakshadweep Islands, India':         ['Lakshadweep', 'Lakshadweep India coral atoll manta ray pristine reef diving'],
  'Muscat Daymaniyat, Oman':            ['Daymaniyat Islands', 'Daymaniyat Islands Oman coral reef turtle spinner dolphin'],
  'NEOM Red Sea, Saudi Arabia':         ['NEOM', 'NEOM Saudi Arabia Red Sea pristine coral reef diving untouched'],
  'Tyre Marine Reserve, Lebanon':       ['Tyre, Lebanon', 'Tyre Lebanon Mediterranean Byzantine underwater archaeology diving'],
  'Zenobia, Cyprus':                    ['Zenobia (ferry)', 'Zenobia Cyprus ferry wreck Mediterranean scuba diving 1980'],
  'Lanzarote MUSA, Spain':              ['Museo Atlántico', 'Lanzarote MUSA underwater museum sculpture coral Canary Islands'],
  'Marseille Calanques, France':        ['Calanques National Park', 'Marseille Calanques diving gorgonian fan coral octopus Mediterranean'],
  'Hvar, Croatia':                      ['Hvar', 'Hvar Croatia Adriatic sea cave WW2 wreck diving clear water'],
  'Santorini Caldera, Greece':          ['Santorini', 'Santorini caldera volcanic fumaroles underwater Mediterranean diving'],
  'Bodrum Wrecks, Turkey':              ['Bodrum', 'Bodrum Turkey Aegean ancient Byzantine wreck amphora diving'],
  'Menorca Sea Caves, Spain':           ['Menorca', 'Menorca Spain sea cave Mediterranean diving posidonia reef'],
  'Florida Keys, USA':                  ['Florida Keys National Marine Sanctuary', 'Florida Keys coral reef Christ Abyss statue diving USA'],
  'Florida Springs, USA':               ['Florida Springs', 'Florida Springs crystal clear cave spring diving manatee USA'],
  'Baja California Sea of Cortez':      ['Gulf of California', 'Sea of Cortez Baja California mobula ray sea lion diving'],
  'RMS Rhone, British Virgin Islands':  ['RMS Rhone', 'RMS Rhone British Virgin Islands shipwreck 1867 coral covered'],
  'Campbell River, Canada':             ['Campbell River, British Columbia', 'Campbell River Canada giant Pacific octopus wolf eel diving'],
  'Bermuda':                            ['Bermuda', 'Bermuda Atlantic wrecks 300 ship wreck diving clear water reef'],
  'Stingray City, Cayman Islands':      ['Stingray City', 'Stingray City Grand Cayman friendly stingray shallow water'],

  // ══════════════════════════════════════════════════════════════
  // SKI RESORTS (schema-v6-fix + schema-v18)
  // 전략: 각 리조트 Wikipedia 정확 문서명 + 'ski resort winter snow'
  //        키워드 → 눈덮인 슬로프/리조트 전경 사진 유도
  // ══════════════════════════════════════════════════════════════

  // ── 프랑스 ────────────────────────────────────────────────────
  'Chamonix':                           ['Chamonix', 'Chamonix Mont Blanc ski resort winter snow slopes aerial'],
  'Val d\'Isere':                       ['Val d\'Isère', 'Val d\'Isere ski resort winter snow piste alpine France'],
  'Courchevel 1850':                    ['Courchevel', 'Courchevel 1850 ski resort winter snow Three Valleys luxury'],
  'Meribel':                            ['Méribel', 'Meribel ski resort winter snow Three Valleys France slope'],
  'La Plagne':                          ['La Plagne', 'La Plagne ski resort winter snow France bobsled slope'],
  'Les Gets Morzine':                   ['Les Gets', 'Les Gets Morzine ski resort Portes du Soleil winter snow'],
  'Avoriaz':                            ['Avoriaz', 'Avoriaz car-free ski resort winter snow horse sleigh France'],
  'Alpe d\'Huez':                       ['Alpe d\'Huez', 'Alpe d\'Huez ski resort winter snow 245km slopes France'],
  'Tignes':                             ['Tignes', 'Tignes ski resort Grande Motte glacier winter snow France'],
  'Megève':                             ['Megève', 'Megève ski resort elegant winter snow Haute-Savoie France village'],

  // ── 스위스 ────────────────────────────────────────────────────
  'Zermatt':                            ['Zermatt', 'Zermatt ski resort Matterhorn winter snow Switzerland slopes'],
  'Verbier':                            ['Verbier', 'Verbier ski resort winter snow 4 Vallees Switzerland slope'],
  'Davos Parsenn':                      ['Davos', 'Davos Parsenn ski resort winter snow Switzerland slope aerial'],
  'St Moritz':                          ['St. Moritz', 'St Moritz ski resort winter snow Switzerland luxury Engadine'],
  'Grindelwald Jungfrau':               ['Grindelwald', 'Grindelwald Jungfrau ski resort winter snow Eiger Switzerland'],
  'Andermatt-Sedrun':                   ['Andermatt', 'Andermatt Sedrun ski resort winter snow Switzerland Alps slope'],
  'Saas-Fee':                           ['Saas-Fee', 'Saas-Fee glacier ski resort winter snow car-free Switzerland'],
  'Flims Laax':                         ['Laax (ski resort)', 'Flims Laax ski resort snowboard Switzerland winter snow halfpipe'],
  'Arosa Lenzerheide':                  ['Arosa', 'Arosa Lenzerheide ski resort winter snow Switzerland slopes'],

  // ── 오스트리아 ───────────────────────────────────────────────
  'St Anton am Arlberg':                ['St. Anton am Arlberg', 'St Anton ski resort winter snow Arlberg Austria slopes'],
  'Ischgl':                             ['Ischgl', 'Ischgl ski resort winter snow Silvretta Arena Austria slope'],
  'Kitzbuehel':                         ['Kitzbühel', 'Kitzbuhel Hahnenkamm ski resort winter snow Austria slope'],
  'Mayrhofen':                          ['Mayrhofen', 'Mayrhofen Harakiri ski resort winter snow Austria Tyrol slopes'],
  'Bad Gastein':                        ['Bad Gastein', 'Bad Gastein ski resort winter snow Gasteinertal Austria thermal'],
  'Lech':                               ['Lech am Arlberg', 'Lech Arlberg ski resort winter snow Austria powder prestige'],
  'Söll Ski Welt':                      ['Söll', 'Soll Ski Welt ski resort winter snow Wilder Kaiser Austria slopes'],
  'Hintertux Glacier':                  ['Hintertux Glacier', 'Hintertux Glacier year-round ski resort winter snow Austria'],
  'Saalbach-Hinterglemm':               ['Saalbach-Hinterglemm', 'Saalbach Hinterglemm Ski Circus winter snow Austria slopes'],

  // ── 이탈리아 ─────────────────────────────────────────────────
  'Cortina d\'Ampezzo':                 ['Cortina d\'Ampezzo', 'Cortina d\'Ampezzo ski resort Dolomites winter snow Italy'],
  'Madonna di Campiglio':               ['Madonna di Campiglio', 'Madonna di Campiglio ski resort winter snow Italy Dolomites'],
  'Sestriere':                          ['Sestrière', 'Sestriere ski resort Milky Way winter snow Italy 1988 World Cup'],
  'Alta Badia':                         ['Alta Badia', 'Alta Badia Sella Ronda ski resort Dolomites winter snow Italy'],
  'Cervinia Breuil':                    ['Breuil-Cervinia', 'Cervinia Breuil ski resort Matterhorn winter snow Italy slopes'],
  'Kronplatz, South Tyrol':             ['Plan de Corones', 'Kronplatz Plan de Corones ski resort Dolomites winter snow Italy'],

  // ── 독일 ─────────────────────────────────────────────────────
  'Garmisch-Partenkirchen':             ['Garmisch-Partenkirchen', 'Garmisch-Partenkirchen ski resort Zugspitze winter snow Germany'],

  // ── 스칸디나비아 ──────────────────────────────────────────────
  'Levi':                               ['Levi, Finland', 'Levi Lapland ski resort winter snow northern lights Finland Arctic'],
  'Are':                                ['Åre', 'Are Åre ski resort Sweden winter snow World Championships slope'],
  'Oslo Holmenkollen':                  ['Holmenkollen ski arena', 'Holmenkollen ski jump Oslo winter snow Norway Nordic FIS'],
  'Geilo':                              ['Geilo', 'Geilo ski resort Norway winter snow Hardangervidda plateau slopes'],
  'Ruka':                               ['Ruka', 'Ruka ski resort Arctic Circle Finland winter snow slopes reindeer'],

  // ── 스페인 · 안도라 ───────────────────────────────────────────
  'Grandvalira':                        ['Grandvalira', 'Grandvalira ski resort Andorra Pyrenees winter snow slopes'],
  'Sierra Nevada Spain':                ['Sierra Nevada (Spain)', 'Sierra Nevada Spain ski resort winter snow Granada slopes Mediterranean'],
  'Formigal':                           ['Formigal', 'Formigal ski resort Spain Pyrenees winter snow slopes largest'],
  'Baqueira-Beret':                     ['Baqueira-Beret', 'Baqueira Beret ski resort Spain Pyrenees winter snow royal slopes'],

  // ── 동유럽 ───────────────────────────────────────────────────
  'Bansko':                             ['Bansko', 'Bansko ski resort Bulgaria Pirin Mountains winter snow slopes gondola'],
  'Poiana Brasov':                      ['Poiana Brasov', 'Poiana Brasov ski resort Romania Transylvania winter snow slopes'],
  'Zakopane':                           ['Zakopane', 'Zakopane ski resort Poland Tatra Mountains winter snow slopes Kasprowy'],
  'Jasna':                              ['Jasná', 'Jasna ski resort Slovakia High Tatras winter snow slopes World Cup'],
  'Kranjska Gora':                      ['Kranjska Gora', 'Kranjska Gora ski resort Slovenia Julian Alps winter snow slopes'],
  'Malbun':                             ['Malbun', 'Malbun Liechtenstein ski resort winter snow principality small slopes'],
  'Cimislia':                           ['Cimișlia', 'Moldova winter ski small ski slope Cimislia Balkan snow ski'],

  // ── 코카서스 / 중앙아시아 ────────────────────────────────────
  'Gudauri':                            ['Gudauri', 'Gudauri ski resort Georgia Caucasus winter snow heli-skiing slopes'],
  'Tsakhkadzor':                        ['Tsaghkadzor', 'Tsakhkadzor ski resort Armenia Caucasus winter snow slopes Ararat'],
  'Bakhmaro':                           ['Bakhmaro', 'Bakhmaro ski resort Georgia Caucasus winter snow untouched meadow'],
  'Shymbulak':                          ['Shymbulak Ski Resort', 'Shymbulak Almaty Kazakhstan ski resort winter snow slopes gondola'],
  'Karakol':                            ['Karakol (city)', 'Karakol Kyrgyzstan ski resort Tian Shan winter snow powder slopes'],
  'Fann Mountains':                     ['Fann Mountains', 'Fann Mountains Tajikistan backcountry ski winter snow yurt'],
  'Elbrus':                             ['Elbrus', 'Mount Elbrus ski resort Russia Europe highest peak winter snow slopes'],
  'Rosa Khutor':                        ['Rosa Khutor Alpine Resort', 'Rosa Khutor ski resort Sochi Russia 2014 Olympics winter snow'],
  'Naltar':                             ['Naltar', 'Naltar ski resort Pakistan Gilgit winter snow Karakoram slopes'],

  // ── 북미 ─────────────────────────────────────────────────────
  'Aspen Snowmass':                     ['Aspen/Snowmass', 'Aspen Snowmass ski resort Colorado winter snow four mountains'],
  'Vail':                               ['Vail Ski Resort', 'Vail ski resort Blue Sky Basin Colorado winter snow back bowls'],
  'Park City':                          ['Park City Mountain', 'Park City ski resort Utah winter snow 2002 Olympics slopes'],
  'Squaw Valley':                       ['Palisades Tahoe', 'Squaw Valley Palisades Tahoe ski resort Lake Tahoe winter snow'],
  'Jackson Hole':                       ['Jackson Hole Mountain Resort', 'Jackson Hole ski resort Wyoming winter snow Corbet Couloir tram'],
  'Steamboat Springs':                  ['Steamboat Ski Resort', 'Steamboat Springs ski resort Colorado champagne powder winter snow'],
  'Telluride':                          ['Telluride Ski Resort', 'Telluride ski resort Colorado box canyon winter snow village gondola'],
  'Sun Valley':                         ['Sun Valley Resort', 'Sun Valley Idaho ski resort Bald Mountain winter snow classic'],
  'Mammoth Mountain':                   ['Mammoth Mountain Ski Area', 'Mammoth Mountain ski resort California winter snow volcanic 3500 acres'],
  'Breckenridge':                       ['Breckenridge Ski Resort', 'Breckenridge ski resort Colorado winter snow five peaks historic town'],
  'Stowe':                              ['Stowe Mountain Resort', 'Stowe Vermont ski resort Mount Mansfield winter snow New England classic'],
  'Killington':                         ['Killington Resort', 'Killington ski resort Vermont winter snow East largest Beast slopes'],

  // ── 캐나다 ───────────────────────────────────────────────────
  'Whistler Blackcomb':                 ['Whistler Blackcomb', 'Whistler Blackcomb ski resort British Columbia winter snow PEAK 2 PEAK'],
  'Lake Louise':                        ['Lake Louise Ski Resort', 'Lake Louise ski resort Alberta winter snow turquoise lake Rocky Mountain'],
  'Banff Sunshine':                     ['Sunshine Village Ski Resort', 'Banff Sunshine Village ski resort Rocky Mountain winter snow Alberta'],
  'Big White':                          ['Big White Ski Resort', 'Big White ski resort British Columbia winter snow ghost trees village'],
  'Marmot Basin':                       ['Marmot Basin', 'Marmot Basin Jasper Alberta ski resort Rocky Mountain winter snow elk'],
  'Mont-Tremblant':                     ['Mont-Tremblant Ski Resort', 'Mont Tremblant ski resort Quebec winter snow French village Laurentians'],
  'Revelstoke':                         ['Revelstoke Mountain Resort', 'Revelstoke ski resort British Columbia world greatest vertical winter snow'],

  // ── 일본 · 한국 ──────────────────────────────────────────────
  'Niseko':                             ['Niseko', 'Niseko Hokkaido ski resort Japan powder snow Japow slopes winter'],
  'Hakuba':                             ['Hakuba, Nagano', 'Hakuba Japan ski resort Nagano 1998 Olympics winter snow Alps'],
  'Myoko Kogen':                        ['Myoko Kogen', 'Myoko Kogen ski resort Japan Niigata powder snow winter onsen'],
  'Alpensia Yongpyong':                 ['Yongpyong Resort', 'Yongpyong ski resort Korea 2018 Olympics winter snow Dragon Valley'],

  // ── 남미 ─────────────────────────────────────────────────────
  'Las Leñas':                          ['Las Leñas', 'Las Lenas ski resort Argentina Andes winter snow expert terrain'],
  'Valle Nevado':                       ['Valle Nevado', 'Valle Nevado ski resort Chile Andes winter snow Santiago slopes'],
  'Portillo':                           ['Portillo, Chile', 'Portillo ski resort Chile Andes winter snow yellow hotel Laguna'],
  'Cerro Catedral':                     ['Cerro Catedral', 'Cerro Catedral Bariloche Argentina ski resort Andes winter snow condor'],

  // ── 오세아니아 ───────────────────────────────────────────────
  'New Zealand Skiing':                 ['Treble Cone', 'New Zealand Treble Cone Cardrona ski resort Southern Alps winter snow'],
  'The Remarkables':                    ['The Remarkables', 'The Remarkables ski resort Queenstown New Zealand winter snow peaks'],
  'Mt Buller':                          ['Mount Buller', 'Mt Buller ski resort Victoria Australia winter snow slopes Melbourne'],

  // ── 중동 · 아프리카 · 희귀 ──────────────────────────────────
  'Mount Hermon':                       ['Mount Hermon', 'Mount Hermon ski resort Israel Golan Heights winter snow slopes'],
  'The Cedars':                         ['The Cedars (ski resort)', 'The Cedars Lebanon ski resort Cedar Reserve winter snow slopes'],
  'Dizin':                              ['Dizin ski resort', 'Dizin ski resort Iran Tehran winter snow slopes 3600m'],
  'Oukaimeden':                         ['Oukaimeden', 'Oukaimeden Morocco Atlas Mountains ski resort winter snow Africa'],
  'Afriski':                            ['Afriski Mountain Resort', 'Afriski Lesotho Southern Africa ski resort winter snow slopes Kingdom'],
  'Drakensberg Ski':                    ['Tiffindell ski resort', 'Tiffindell South Africa ski resort snow winter Eastern Cape slopes'],
  'Sky Resort Ulaanbaatar':             ['Sky Resort (Mongolia)', 'Sky Resort Ulaanbaatar Mongolia ski winter snow steppes city slopes'],
  'Masikryong':                         ['Masikryong', 'Masikryong ski resort North Korea winter snow Pyongyang slopes'],
  'Bamiyan':                            ['Bamyan', 'Bamiyan Afghanistan Hindu Kush ski Band-e-Amir winter snow slopes'],
  'Bhutan Skiing':                      ['Bhutan', 'Bhutan helicopter skiing Himalaya winter snow mountain backcountry'],

  // ══════════════════════════════════════════════════════════════
  // NATURE SPOTS
  // 문제 유형:
  //   A) cleanTitle() 이 "National Park" 제거 → 엉뚱한 인물 사진
  //   B) 브랜드/지명이 너무 광범위 → 국가지도·일반 풍경
  //   C) Wikipedia 특정 항목명과 불일치 → 잘못된 사진
  // ══════════════════════════════════════════════════════════════

  // ── [A] "National Park" 제거 시 인물·엉뚱한 항목 검색됨 ─────────
  // "Kruger National Park" → cleanTitle → "Kruger" → Paul Kruger 대통령 초상화
  'Kruger National Park':               ['Kruger National Park', 'Kruger National Park elephant South Africa Big Five safari savanna'],
  // "Kakadu National Park" → "Kakadu" → 대체로 OK 이나 명시적으로 지정
  'Kakadu National Park':               ['Kakadu National Park', 'Kakadu Aboriginal rock art saltwater crocodile wetlands Australia'],
  // "Urho Kekkonen NP" → "NP"는 제거 안되나 Wikipedia 정확 명칭 보장
  'Urho Kekkonen NP':                   ['Urho Kekkonen National Park', 'Finnish Lapland subarctic wilderness reindeer Sami golden eagle'],

  // ── [B] 지명·국가 수준 검색 → 지도·국기 사진 ──────────────────
  // "Sumatra Rainforest" → "Sumatra" Wikipedia → 지도/위성사진
  'Sumatra Rainforest':                 ['Gunung Leuser National Park', 'Sumatra rainforest Indonesia UNESCO orangutan elephant tiger coexist Leuser'],
  // "Sahara Desert" → "Sahara" Wikipedia → 지도 또는 위성사진
  'Sahara Desert':                      ['Sahara', 'Erg Chebbi sand dunes Morocco Sahara camel caravan orange sunset'],
  // "Northern Lights Iceland" → aurora photo OK 이나 Iceland 특정 경관 유도
  'Northern Lights Iceland':            ['Aurora borealis Iceland', 'Iceland Northern Lights aurora borealis glacier volcanic landscape green curtain Thingvellir'],

  // ── [C] Wikipedia 특정 항목 불일치 → 잘못된 사진 ────────────────
  // "Pulo Cinta Falls" → Wikipedia "Pulo Cinta" = 하트형 섬 (리조트) 항목 → 섬 사진
  // 실제 description: 민다나오 산 위 하트형 호수 → 호수 항목으로 유도
  'Pulo Cinta Falls':                   ['Pulo Cinta', 'Pulo Cinta heart-shaped lake Mindanao Philippines mountain aerial'],
  // "Waipoua Forest" → Wikipedia 에 항목 있으나 Tane Mahuta 더 명확
  'Waipoua Forest':                     ['Waipoua Forest', 'Tane Mahuta god of forest giant kauri tree New Zealand 2000 years ancient Northland'],
  // "Champagne Pool" → Wikipedia "Champagne" 와인 지역으로 잘못 검색될 수 있음
  'Champagne Pool':                     ['Champagne Pool', 'Wai-O-Tapu Champagne Pool geothermal Rotorua orange mineral New Zealand thermal park'],

  // ══════════════════════════════════════════════════════════════
  // ATTRACTIONS — 연관성 낮은 이미지 교체
  // 문제 유형:
  //   A) cleanTitle() 이 "Island/Cave" 제거 → 엉뚱한 항목
  //   B) 복합 명칭이 Wikipedia 정확 문서명과 불일치
  //   C) 검색 결과가 관련 없는 사진으로 유도
  // ══════════════════════════════════════════════════════════════

  // ── Jungfraujoch Top of Europe: 복합 명칭 → Wikipedia "Jungfraujoch" 직접 ─
  'Jungfraujoch Top of Europe':         ['Jungfraujoch', 'Jungfraujoch Top of Europe highest railway station Swiss Alps glacier panorama Bernese'],
  // ── Lascaux Cave Paintings: "Cave Paintings" 자체가 Wikipedia 문서명 아님 ──
  'Lascaux Cave Paintings':             ['Lascaux', 'Lascaux cave paintings Paleolithic prehistoric art bull horse bison Dordogne France 17000 years'],
  // ── Meteora Monasteries: "Monasteries" 단어 영향으로 검색 흔들림 ──────────
  'Meteora Monasteries':                ['Meteora', 'Meteora monasteries Byzantine Orthodox rock pinnacle UNESCO Greece dramatic sunset'],
  // ── Stone Forest Shilin: Wikipedia 정식 문서명 "Stone Forest (China)" ──────
  'Stone Forest Shilin':                ['Stone Forest (China)', 'Shilin Stone Forest karst limestone pillars Yunnan China 270 million years UNESCO Yi'],
  // ── Ephesus Ancient City: "Ancient City" 부분이 혼동 유발 ─────────────────
  'Ephesus Ancient City':               ['Ephesus', 'Ephesus Library of Celsus ancient city Turkey Greco-Roman ruins facade marble columns'],
  // ── Jeju Island: cleanTitle() 이 "Island" 제거 → "Jeju" → 지도·행정구역 사진
  'Jeju Island':                        ['Jeju Island', 'Seongsan Ilchulbong Jeju Island sunrise peak Hallasan UNESCO volcanic crater Korea'],
  // ── Shwedagon Pagoda: 황금 사리탑 → Wikipedia 정확 문서 직접 지정 ──────────
  'Shwedagon Pagoda':                   ['Shwedagon Pagoda', 'Shwedagon Pagoda golden gilded stupa Yangon Myanmar Buddhist 326m gold sunset night'],
  // ── Waitomo Glowworm Caves: 동굴 천장 발광 사진 → 정확한 Wikipedia 문서명 ─
  'Waitomo Glowworm Caves':             ['Waitomo Glowworm Caves', 'Waitomo cave bioluminescent glowworm ceiling blue starry underground boat New Zealand Arachnocampa'],

  // ══════════════════════════════════════════════════════════════
  // FOODS — 엉뚱한 이미지 또는 이미지 없는 음식 항목
  // 문제 유형:
  //   A) cleanTitle 결과가 음식 외 Wikipedia 항목과 충돌
  //   B) Wikipedia 정확 문서명과 불일치 → 이미지 없음
  // ══════════════════════════════════════════════════════════════

  // ── [A] [B] FOODS 중복 키는 위쪽 정의 사용. 주석만 유지 ─────────────

  // ══════════════════════════════════════════════════════════════
  // COUNTRIES — 특정 국가 이미지 직접 지정
  // ══════════════════════════════════════════════════════════════
  'Madagascar':                         ['Flag of Madagascar', 'Madagascar flag red white green baobab lemur island'],
  'Nepal':                              ['Flag of Nepal', 'Nepal flag pennant unique double triangle crimson blue'],

  // ── [신규 추가 5개] 새로운 nature 항목 이미지 직접 지정 ────────────
  'Waitomo Glowworm Caves, New Zealand':['Waitomo Glowworm Caves', 'Arachnocampa luminosa glowworm cave New Zealand bioluminescent ceiling boat'],
  'Mount Fuji, Japan':                  ['Mount Fuji', 'Mount Fuji Japan volcano snow cap reflection Lake Kawaguchi cherry blossom'],
  'Dead Sea, Jordan':                   ['Dead Sea', 'Dead Sea salt flat floating Israel Jordan lowest point Earth turquoise mineral'],
  'Trolltunga, Norway':                 ['Trolltunga', 'Trolltunga cliff hike Norway lake Ringedalsvatnet dramatic overhang fjord landscape'],
  'Havasu Falls, Arizona':              ['Havasu Falls', 'Havasu Falls turquoise waterfall Arizona Havasupai Grand Canyon blue pool'],

  'Sint Maarten/Saint Martin':          ['Sint Maarten', 'Maho Beach Sint Maarten airplane landing Caribbean beach'],

  'Bora Bora, French Polynesia':        ['Bora Bora', 'Bora Bora lagoon Mount Otemanu overwater bungalow French Polynesia'],
  'Palawan, Philippines':               ['Palawan', 'El Nido Palawan limestone karst lagoon Philippines'],
  'Komodo Island, Indonesia':           ['Komodo (island)', 'Komodo Island Indonesia Pink Beach Flores dragon'],
  'Santa Cruz, Galapagos':              ['Santa Cruz Island (Galápagos)', 'Santa Cruz Galapagos tortoise highland lava tunnel'],
  'Zanzibar, Tanzania':                 ['Zanzibar', 'Stone Town Zanzibar Tanzania spice island Indian Ocean'],
  'Tahiti, French Polynesia':           ['Tahiti', 'Tahiti island French Polynesia Papeete mountain coastline'],
  'Moorea, French Polynesia':           ['Moorea', 'Moorea French Polynesia Cook Bay mountain lagoon tropical'],
  'Big Island, Hawaii':                 ['Hawaii (island)', 'Hawaii Big Island Kona coast lava black sand volcano'],
  'Maui, Hawaii':                       ['Maui', 'Maui Hawaii Haleakala Road to Hana coastline beach'],
  'Kauai, Hawaii':                      ['Kauai', 'Na Pali Coast Kauai Hawaii cliff coastline green valley'],
  'Oahu, Hawaii':                       ['Oahu', 'Waikiki Beach Oahu Hawaii Diamond Head coastline'],
  'Cayo Coco, Cuba':                    ['Cayo Coco', 'Cayo Coco Cuba beach flamingo coral cay Caribbean'],
  'St Lucia':                           ['Saint Lucia', 'Pitons Saint Lucia Sulphur Springs volcano Caribbean'],
  'Dominica':                           ['Dominica', 'Dominica Boiling Lake Trafalgar Falls rainforest Caribbean'],
  'Antigua':                            ['Antigua', 'Antigua Caribbean beach English Harbour Nelson Dockyard'],
  'Sao Miguel, Azores':                ['São Miguel Island', 'Sete Cidades Lake Sao Miguel Azores twin crater'],
  'Madeira, Portugal':                  ['Madeira', 'Madeira island Portugal Funchal coastline cliff levada'],
  'La Gomera, Canary Islands':          ['La Gomera', 'Garajonay National Park La Gomera Canary Islands rainforest'],
  'El Hierro, Canary Islands':          ['El Hierro', 'El Hierro Canary Islands coastline Mar de las Calmas'],
  'Lanzarote, Canary Islands':          ['Lanzarote', 'Timanfaya National Park Lanzarote volcanic landscape Canary'],
  'Sardinia, Italy':                    ['Sardinia', 'Costa Smeralda Sardinia Italy emerald water coastline'],
  'Corsica, France':                    ['Corsica', 'Scandola Reserve Corsica France coastline cliff UNESCO'],
  'Sicily, Italy':                     ['Sicily', 'Taormina Sicily Italy coast Mount Etna Mediterranean'],
  'Ibiza, Spain':                       ['Ibiza', 'Ibiza Spain Es Vedra rock sunset beach Mediterranean'],
  'Mallorca, Spain':                    ['Mallorca', 'Mallorca Spain Serra de Tramuntana coastline cove Mediterranean'],
  'Formentera, Spain':                  ['Formentera', 'Ses Illetes Formentera Spain beach turquoise Balearic'],
  'Santorini, Greece':                  ['Santorini', 'Oia Santorini Greece caldera white church sunset'],
  'Mykonos, Greece':                   ['Mykonos', 'Mykonos Greece windmill Little Venice Cyclades beach'],
  'Crete, Greece':                      ['Crete', 'Balos Lagoon Crete Greece pink sand coastline Mediterranean'],
  'Corfu, Greece':                      ['Corfu', 'Paleokastritsa Corfu Greece coastline monastery Ionian'],
  'Vis, Croatia':                      ['Vis (island)', 'Vis Croatia Blue Grotto Bisevo coastline Dalmatian'],
  'Korcula, Croatia':                   ['Korčula', 'Korcula Croatia old town Marco Polo Adriatic coastline'],
  'Tasmania, Australia':                ['Tasmania', 'Cradle Mountain Tasmania Australia lake mountain wilderness'],
  'Upolu, Samoa':                       ['Upolu', 'Upolu Samoa To Sua trench coastline Pacific island'],
  'Providenciales, Turks and Caicos':   ['Providenciales', 'Grace Bay Providenciales Turks and Caicos beach turquoise'],
  'Eleuthera, Bahamas':                 ['Eleuthera', 'Glass Window Bridge Eleuthera Bahamas Atlantic Caribbean'],
  'Cayo Santa Maria, Cuba':             ['Cayo Santa María', 'Cayo Santa Maria Cuba beach coral cay Caribbean'],
  'Marie-Galante, Guadeloupe':          ['Marie-Galante', 'Marie-Galante Guadeloupe beach sugar plantation Caribbean'],
  'Guadeloupe, France':                 ['Guadeloupe', 'Guadeloupe Carbet Falls Soufriere volcano Caribbean coastline'],
  'San Andres, Colombia':               ['San Andrés Island', 'San Andres Colombia Caribbean Sea of Seven Colors beach'],
  'Ilha Grande, Brazil':                ['Ilha Grande', 'Ilha Grande Brazil Lopes Mendes beach Atlantic rainforest'],
  'Reunion Island, France':             ['Réunion', 'Piton de la Fournaise Reunion volcano lava Indian Ocean'],

  'Faroe Islands, Denmark':             ['Gásadalur', 'Gasadalur Faroe Islands waterfall cliff coastline scenic'],
  'Svalbard, Norway':                   ['Longyearbyen', 'Longyearbyen Svalbard fjord mountain Arctic landscape scenic'],
  'Ilulissat, Greenland':               ['Ilulissat Icefjord', 'Ilulissat icefjord Greenland giant iceberg UNESCO sunset'],
  'Heimaey, Westman Islands':           ['Heimaey', 'Westman Islands Iceland puffin volcano eruption 1973'],
  'Iceland (island nation)':            ['Iceland', 'Iceland landscape aurora waterfall Seljalandsfoss volcanic island'],

  'Anguilla':                           ['Shoal Bay East', 'Shoal Bay Anguilla Caribbean white sand turquoise coastline scenic'],
  'Saba, Dutch Caribbean':              ['Mount Scenery', 'Saba island volcanic peak Caribbean coastline lush scenic'],
  'Nauru':                              ['Anibare Bay', 'Nauru coastline Pacific lagoon cliff scenic landscape'],
  'Funafuti, Tuvalu':                   ['Funafuti Conservation Area', 'Funafuti atoll Tuvalu lagoon coral reef scenic'],
  'Tarawa, Kiribati':                   ['Bairiki', 'Tarawa atoll Kiribati lagoon Pacific coral reef scenic'],
  'Majuro, Marshall Islands':           ['Laura Beach, Majuro', 'Majuro Marshall Islands atoll lagoon beach Pacific scenic'],
  'Yap, Micronesia':                    ['Yap island', 'Yap Micronesia stone money manta ray traditional'],
  'Malaita, Solomon Islands':           ['Malaita', 'Malaita Solomon Islands artificial island lagoon Melanesia traditional'],
  'Tristan da Cunha':                   ['Edinburgh of the Seven Seas', 'Tristan da Cunha volcanic island coastline South Atlantic scenic'],
  'Ascension Island':                   ['Long Beach, Ascension Island', 'Ascension Island coastline beach turtle nesting South Atlantic scenic'],
  'St Helena, British territory':       ['Jamestown, Saint Helena', 'Saint Helena James Bay coastline volcanic South Atlantic scenic'],
  'Niue Island':                        ['Matapa Chasm', 'Niue South Pacific chasm coral arch coastline scenic'],
  'Christmas Island':                   ['Dolly Beach', 'Christmas Island red crab beach Indian Ocean coastline scenic'],

  'Rock Islands, Palau':                ['Rock Islands', 'Palau Rock Islands limestone mushroom UNESCO Jellyfish Lake'],
  'Ha apai, Tonga':                     ['Haʻapai', 'Haapai Tonga humpback whale pristine atoll pink sand beach'],
  'Aitutaki, Cook Islands':             ['Aitutaki', 'Aitutaki lagoon Cook Islands One Foot Island gin-clear turquoise'],
  'Our Lady of the Rocks, Montenegro':  ['Our Lady of the Rocks', 'Gospa od Skrpjela Montenegro Bay of Kotor island church'],
  'Praslin, Seychelles':                ['Praslin', 'Anse Lazio Praslin Seychelles palm beach UNESCO coco de mer'],
  'Stewart Island (Rakiura), New Zealand':['Rakiura National Park', 'Stewart Island New Zealand kiwi pristine remote southern'],
  'Lord Howe Island, Australia':        ['Lord Howe Island', 'Lord Howe Island Australia Balls Pyramid UNESCO lagoon coral'],
  'Fraser Island (K gari), Australia':  ['Fraser Island', 'K gari Fraser Island Australia sand dune freshwater lake dingo'],
  'Tanna, Vanuatu':                     ['Tanna', 'Yasur volcano Tanna Vanuatu active lava night custom village'],
  'Lifou, New Caledonia':               ['Lifou', 'Lifou New Caledonia lagoon coral reef pink sand tropical Pacific'],
  'British Virgin Islands':             ['The Baths, Virgin Gorda', 'British Virgin Islands Tortola beach turquoise coastline scenic'],
  'Falkland Islands':                   ['Sea Lion Island', 'Falkland Islands coastline penguin beach landscape South Atlantic scenic'],
  'South Georgia':                      ['St Andrews Bay, South Georgia', 'South Georgia king penguin beach glacier coastline scenic'],

  // ── 국가/섬 나라 — 국기 대신 대표 해변·경치 ───────────────────────
  'Malta Island':                       ['Blue Lagoon, Malta', 'Malta Blue Lagoon Comino coastline Mediterranean scenic'],
  'Gozo, Malta':                        ['Ramla Bay', 'Ramla Bay Gozo Malta red sand beach Mediterranean scenic'],
  'Cyprus':                             ['Cape Greco', 'Cape Greco Cyprus coastline sea caves Mediterranean scenic'],
  'Jamaica':                            ['Seven Mile Beach', 'Seven Mile Beach Jamaica Negril turquoise Caribbean scenic'],
  'Barbados':                           ['Crane Beach, Barbados', 'Crane Beach Barbados cliff pink sand Caribbean scenic'],
}

/** 100 Countries 전용: 국가명이 위키에서 다른 항목(미국 주 Georgia 등)으로 오인될 때 시도할 문서 목록 */
const COUNTRY_ARTICLE_OVERRIDES: Record<string, string[]> = {
  Georgia: ['Georgia (country)', 'Country of Georgia'],
}

/** 이 항목에 지정된 위키 문서 후보. 없으면 undefined. */
export function getWikiArticleCandidates(
  category: string,
  titleEn: string
): string[] | undefined {
  return (
    WIKI_ARTICLE_OVERRIDES[titleEn] ??
    (category === 'foods' ? WIKI_ARTICLE_OVERRIDES[cleanTitle(titleEn)] : undefined)
  )
}

/** 100 Countries 전용 문서 후보 (미국 조지아주 vs 조지아 국가 같은 혼동 방지). */
export function getCountryArticleCandidates(titleEn: string): string[] | undefined {
  return COUNTRY_ARTICLE_OVERRIDES[titleEn]
}
