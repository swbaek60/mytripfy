-- 100 Drinks: 91개 → 100개 (9종 추가)
-- 실행: Supabase SQL Editor에서 실행
INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES
('drinks','존니 워커 블루 라벨','Johnnie Walker Blue Label','GB','Blended Scotch whisky; no age statement, rare casks, luxury blend Diageo',20),
('drinks','샤토 마르고','Chateau Margaux','FR','First growth Bordeaux Medoc; Cabernet Sauvignon dominant, Margaux appellation',20),
('drinks','브베 클리코 브뤼','Veuve Clicquot Brut','FR','Yellow label iconic champagne; Reims since 1772, second fermentation cellar',15),
('drinks','돈 줄리오 1942','Don Julio 1942','MX','Ultra-premium anejo tequila; hand-selected agave, Jalisco small batch',20),
('drinks','그레이 구스 보드카','Grey Goose Vodka','FR','French wheat vodka; Cognac region, world luxury vodka benchmark',15),
('drinks','글렌리벳 18년','The Glenlivet 18 Year','GB','Speyside single malt; aged in American and European oak, George Smith legacy',15),
('drinks','탱커레이 넘버 텐','Tanqueray No. Ten Gin','GB','Four-pot still gin; fresh citrus botanicals, small batch London dry',10),
('drinks','벨베데레 보드카','Belvedere Vodka','PL','Polish rye vodka; Polmos Zyrardow, luxury unfiltered expression',15),
('drinks','카사미고스 레포사도','Casamigos Reposado Tequila','MX','George Clooney co-founded; Jalisco Highlands agave, 7-month barrel rest',15);

-- 설명 보강 (선택)
UPDATE challenges SET description_en = 'Johnnie Walker Blue Label is a blended Scotch whisky with no age statement, blending rare casks from the Diageo reserves. A luxury icon in travel retail and bars worldwide. Selected for our World 100 as the most recognizable premium blended Scotch.' WHERE category = 'drinks' AND title_en = 'Johnnie Walker Blue Label';
UPDATE challenges SET description_en = 'Château Margaux is a first growth from the Médoc, producing Cabernet-dominant wines of elegance and longevity. The estate and cellars are among the most visited in Bordeaux. Selected for our World 100 as the pinnacle of Left Bank claret.' WHERE category = 'drinks' AND title_en = 'Chateau Margaux';
UPDATE challenges SET description_en = 'Veuve Clicquot Brut Yellow Label is the iconic non-vintage from Reims, with distinctive yellow branding and deep cellars. A symbol of celebration worldwide. Selected for our World 100 as one of the most recognized champagne houses.' WHERE category = 'drinks' AND title_en = 'Veuve Clicquot Brut';
UPDATE challenges SET description_en = 'Don Julio 1942 is an ultra-premium añejo tequila from Jalisco, aged in American white oak. A top-shelf staple in bars and a gift of choice. Selected for our World 100 as the definitive luxury tequila.' WHERE category = 'drinks' AND title_en = 'Don Julio 1942';
UPDATE challenges SET description_en = 'Grey Goose is French wheat vodka from the Cognac region, defining the super-premium vodka category. Smooth and versatile in cocktails. Selected for our World 100 as the benchmark luxury vodka.' WHERE category = 'drinks' AND title_en = 'Grey Goose Vodka';
UPDATE challenges SET description_en = 'The Glenlivet 18 Year is a Speyside single malt matured in American and European oak. Fruity, balanced, and widely available. Selected for our World 100 as an accessible icon of Scotch.' WHERE category = 'drinks' AND title_en = 'The Glenlivet 18 Year';
UPDATE challenges SET description_en = 'Tanqueray No. Ten is a small-batch London dry gin with fresh citrus and chamomile. The bottle and liquid are bar staples. Selected for our World 100 as the premium gin of choice for martinis.' WHERE category = 'drinks' AND title_en = 'Tanqueray No. Ten Gin';
UPDATE challenges SET description_en = 'Belvedere is Polish rye vodka from the Polmos Żyrardów distillery, unfiltered and luxury-positioned. A leader in the premium vodka segment. Selected for our World 100 as the definitive Polish vodka.' WHERE category = 'drinks' AND title_en = 'Belvedere Vodka';
UPDATE challenges SET description_en = 'Casamigos Reposado was co-founded by George Clooney; blue weber agave from Jalisco Highlands, rested 7 months in American oak. Smooth and mixable. Selected for our World 100 as the celebrity tequila that delivers.' WHERE category = 'drinks' AND title_en = 'Casamigos Reposado Tequila';
