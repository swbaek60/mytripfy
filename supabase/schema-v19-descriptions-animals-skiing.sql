-- ================================================================
-- schema-v19-descriptions-animals-skiing.sql
-- 챌린지 설명 확장: 500~1000자 (동물 9 + 스키 15)
-- Animals: 특정 구글 위치/장소 없이 어디서나 가능하도록 설명 (장소명 제거)
-- ================================================================

-- ── ANIMALS (9) ─────────────────────────────────────────────────
UPDATE challenges SET description_en = 'Chimpanzees represent one of the most profound wildlife experiences on Earth—the legacy of Jane Goodall''s 60-year study. Observing our closest relatives (98.7% shared DNA) in the wild reveals tool use, hunting parties, complex politics, and emotional bonds. Forested habitats in equatorial Africa offer opportunities to encounter habituated troops. Selected for our World 100 as the definitive primate encounter and a living link to our evolutionary past.' WHERE category = 'animals' AND title_en = 'Chimpanzee';

UPDATE challenges SET description_en = 'Great white shark cage diving lets you encounter the ocean''s 6-meter apex predator in its realm. These animals breach up to 4 meters, possess electroreceptive ampullae that detect prey, and represent 400 million years of evolution. The experience combines adrenaline with conservation education. Selected for our World 100 as the most accessible and responsible way to witness the planet''s most iconic shark.' WHERE category = 'animals' AND title_en = 'Great White Shark';

UPDATE challenges SET description_en = 'The Cape buffalo is one of Africa''s Big Five and among the most dangerous animals on the continent—unpredictable, social, and capable of charging at 57 km/h. Weighing up to 900 kg, these animals have killed more big-game hunters than any other African species. On savanna reserves they form herds of hundreds. Selected for our World 100 as the ultimate symbol of untamed African wilderness.' WHERE category = 'animals' AND title_en = 'Cape Buffalo';

UPDATE challenges SET description_en = 'The three-toed sloth embodies a unique way of life: sleeping 20 hours daily, moving so slowly that algae grows in its fur (providing camouflage), and spending its life upside down. This arboreal mammal has evolved to conserve energy in nutrient-poor rainforest canopies in the Neotropics. Selected for our World 100 as one of the most charismatic and emblematic species of the Americas.' WHERE category = 'animals' AND title_en = 'Three-toed Sloth';

UPDATE challenges SET description_en = 'Atlantic puffins—the "clown of the sea" with their colorful beaks and comical gait—number around 60 million globally. These birds dive 60 meters for fish and can carry 10 sand eels at once. Summer breeding colonies in the North Atlantic offer close encounters. Selected for our World 100 as one of the most accessible and photogenic seabird experiences on Earth.' WHERE category = 'animals' AND title_en = 'Atlantic Puffin';

UPDATE challenges SET description_en = 'The fennec fox is the world''s smallest fox (1.5 kg) and a master of Sahara survival. Its enormous 15 cm ears radiate heat and detect prey underground; it hunts at night when the desert cools. Desert encounters reveal an elusive, adorable predator. Selected for our World 100 as the most charismatic desert mammal and a symbol of adaptation to extreme environments.' WHERE category = 'animals' AND title_en = 'Fennec Fox';

UPDATE challenges SET description_en = 'The Amur tiger is the world''s largest cat—males reach 300 kg—and one of the most endangered, with only about 500 remaining in the wild. Cold temperate forests in Siberia and the Far East are their last stronghold. Selected for our World 100 as the rarest and most majestic big cat encounter on the planet.' WHERE category = 'animals' AND title_en = 'Amur Tiger';

UPDATE challenges SET description_en = 'Schools of hundreds of scalloped hammerhead sharks are one of the world''s most spectacular underwater phenomena. Their unique head shape provides 360° vision and electromagnetic prey detection. Drift dives through these aggregations are unforgettable in suitable Pacific and tropical waters. Selected for our World 100 as the definitive hammerhead encounter.' WHERE category = 'animals' AND title_en = 'Scalloped Hammerhead Shark';

UPDATE challenges SET description_en = 'The golden snub-nosed monkey is a blue-faced, golden-orange primate that lives in temperate mountain forests and survives -20°C winters at high altitude. These endangered monkeys live in troops of hundreds and are a conservation icon. Selected for our World 100 as one of Asia''s most striking and rarely seen primates.' WHERE category = 'animals' AND title_en = 'Golden Snub-nosed Monkey';

-- ── SKIING (15) ─────────────────────────────────────────────────
UPDATE challenges SET description_en = 'St. Moritz invented winter tourism and hosted the Winter Olympics in 1928 and 1948. The Engadine valley resort offers the legendary Cresta Run bobsled, world-class skiing, and a concentration of luxury hotels and Michelin stars unmatched in the Alps. Selected for our World 100 as the birthplace of Alpine winter luxury and the most prestigious ski destination on Earth.' WHERE category = 'skiing' AND title_en = 'St Moritz';

UPDATE challenges SET description_en = 'Alpe d''Huez in the French Alps offers 245 km of pistes and the famous 21 hairpin bends of the Tour de France. The Sarenne run is one of the world''s longest glacier descents at 16 km. Sunny exposure and varied terrain make it a favorite for intermediate and advanced skiers. Selected for our World 100 as the quintessential French mega-resort with cycling and skiing heritage.' WHERE category = 'skiing' AND title_en = 'Alpe d''Huez';

UPDATE challenges SET description_en = 'Tignes guarantees snow from 3,456 m altitude and links with Val d''Isère to form the vast Espace Killy. The Grande Motte glacier enables summer skiing. Modern infrastructure and high-altitude villages make Tignes a reliable choice for early and late season. Selected for our World 100 as France''s highest major resort and the gateway to endless Alpine terrain.' WHERE category = 'skiing' AND title_en = 'Tignes';

UPDATE challenges SET description_en = 'Megève was developed by the Rothschild family as an elegant alternative to St. Moritz—a Haute-Savoie village with horse-drawn sleighs, gourmet restaurants, and 445 km of linked skiing via the Evasion Mont-Blanc area. Selected for our World 100 as the most refined French Alpine village and a gastronomic ski destination.' WHERE category = 'skiing' AND title_en = 'Megève';

UPDATE challenges SET description_en = 'Saas-Fee is a car-free Swiss village surrounded by 4,000 m peaks, with year-round skiing on the Mittelallalin glacier at 3,500 m. The Alpin Express underground funicular accesses the highest ski area in the Alps. Selected for our World 100 as the most magical glacier village and a summer skiing paradise.' WHERE category = 'skiing' AND title_en = 'Saas-Fee';

UPDATE challenges SET description_en = 'Flims Laax is Switzerland''s snowboard capital, home to Europe''s largest halfpipe and the Crap Sogn Gion summit. The area links with Disentis for 224 km of varied terrain. Selected for our World 100 as the premier freestyle and park skiing destination in the Alps.' WHERE category = 'skiing' AND title_en = 'Flims Laax';

UPDATE challenges SET description_en = 'Saalbach-Hinterglemm forms the "Ski Circus"—270 km of connected pistes with Leogang and Fieberbrunn. The après-ski at Hinterhagalm is legendary. Selected for our World 100 as Austria''s most complete ski circuit and the ultimate Alpine party-and-piste combination.' WHERE category = 'skiing' AND title_en = 'Saalbach-Hinterglemm';

UPDATE challenges SET description_en = 'Kronplatz (Plan de Corones) in South Tyrol is a World Cup super-G venue with 32 lifts and 119 km of runs. The summit offers 360° views of the Dolomites. Selected for our World 100 as the most dramatic single-mountain ski experience in the Dolomites.' WHERE category = 'skiing' AND title_en = 'Kronplatz, South Tyrol';

UPDATE challenges SET description_en = 'Baqueira-Beret in the Spanish Pyrenees is the Spanish Royal family''s resort and the largest ski area in Spain (166 km). The Val d''Aran villages preserve Catalan culture. Selected for our World 100 as Spain''s premier ski destination and a gateway to Pyrenean charm.' WHERE category = 'skiing' AND title_en = 'Baqueira-Beret';

UPDATE challenges SET description_en = 'Geilo is Norway''s most popular ski resort, set on the Hardangervidda plateau between Oslo and Bergen. Husky sledding, cabin culture, and reliable snow define the experience. Selected for our World 100 as the quintessential Norwegian winter destination.' WHERE category = 'skiing' AND title_en = 'Geilo';

UPDATE challenges SET description_en = 'Breckenridge rises to 3,903 m (12,998 ft)—one of Colorado''s highest ski resorts. The historic gold-mining town offers 187 runs across five peaks and a vibrant Main Street. Selected for our World 100 as the perfect blend of American ski terrain and Old West character.' WHERE category = 'skiing' AND title_en = 'Breckenridge';

UPDATE challenges SET description_en = 'Stowe is Vermont''s oldest and most prestigious resort, with Mt. Mansfield (1,339 m) offering classic New England skiing and a charming village. Selected for our World 100 as the soul of East Coast skiing and the birthplace of American ski culture.' WHERE category = 'skiing' AND title_en = 'Stowe';

UPDATE challenges SET description_en = 'Revelstoke in British Columbia boasts the greatest vertical drop of any ski resort in North America (1,713 m). It is the heli-ski and cat-skiing capital of the world. Selected for our World 100 as the ultimate destination for deep powder and extreme terrain.' WHERE category = 'skiing' AND title_en = 'Revelstoke';

UPDATE challenges SET description_en = 'Mt. Buller is Victoria''s largest ski area, three hours from Melbourne, with 180 km of runs and host to Australian Alpine championships. Selected for our World 100 as the most accessible major Australian ski resort and the heart of Victorian snow culture.' WHERE category = 'skiing' AND title_en = 'Mt Buller';

UPDATE challenges SET description_en = 'Killington is the largest ski resort in the eastern United States—155 runs, the longest season in North America, and the beastly K1 Express gondola. Selected for our World 100 as the East Coast''s most ambitious resort and a snowmaking pioneer.' WHERE category = 'skiing' AND title_en = 'Killington';

-- ================================================================
-- 완료: Animals 9 + Skiing 15 = 24개
-- ================================================================
