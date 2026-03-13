-- ================================================================
-- schema-v18.sql  (2026-02-27)
-- 100 Ski Resorts — 15개 추가 (85 → 100개)
-- ================================================================
-- 적용: Supabase Dashboard → SQL Editor → Run
-- ================================================================

INSERT INTO public.challenges (category, title_ko, title_en, country_code, description_en, points) VALUES

-- ── 15pt ─────────────────────────────────────────────────────
('skiing','생모리츠','St Moritz','CH',
 'Luxury Alps pioneer; 1928 & 1948 Winter Olympics, bobsled Cresta Run, Engadine valley',15),

-- ── 10pt ────────────────────────────────────────────────────
('skiing','알프 디에즈 프랑스','Alpe d''Huez','FR',
 'France 245km pistes; 21 hairpin Tour de France descent, Sarenne glacier run 16km',10),
('skiing','티뉴','Tignes','FR',
 'High altitude guaranteed snow 3456m; linked with Val d''Isere Grande Motte glacier',10),
('skiing','메제브','Megève','FR',
 'Elegant Haute-Savoie village; Rothschild family resort, horse-drawn sleigh, 445km linked',10),
('skiing','자스-페','Saas-Fee','CH',
 'Car-free glacier village; year-round skiing 3500m, Alpin Express underground funicular',10),
('skiing','플림스 라악스','Flims Laax','CH',
 'Swiss snowboard capital; biggest halfpipe Europe, Crap Sogn Gion, Disentis linked',10),
('skiing','잘바흐 힌터글렘','Saalbach-Hinterglemm','AT',
 'Ski Circus loop; 270km connected Leogang Fieberbrunn, après-ski Hinterhagalm famous',10),
('skiing','크로플라츠','Kronplatz, South Tyrol','IT',
 'Dolomites Plan de Corones; WC super-G venue, 32 lifts, 119km runs, mountain top panorama',10),
('skiing','바케이라 베레','Baqueira-Beret','ES',
 'Spanish Royal family resort Pyrenees; largest Spain ski area 166km, Val d''Aran village',10),
('skiing','게일로','Geilo','NO',
 'Norway most popular resort; Hardangervidda plateau, husky sledding, cabin culture',10),
('skiing','브레켄릿지','Breckenridge','US',
 'Colorado highest ski resort 12,998ft; historic gold mine town, 187 runs five peaks',10),
('skiing','스토우 버몬트','Stowe','US',
 'Vermont oldest prestige resort; Mt Mansfield 1,339m, classic New England village',10),
('skiing','레벨스톡','Revelstoke','CA',
 'World''s greatest vertical 1,713m; cat-skiing, heli-ski capital British Columbia',10),
('skiing','마운트 불러 호주','Mt Buller','AU',
 'Victoria largest ski area; Melbourne 3hrs, 180km runs, Australian Alpine championship',10),
('skiing','킬링턴 버몬트','Killington','US',
 'East USA largest; 155 runs, longest North American season, K1 Express gondola beast',10);

-- ================================================================
-- 완료: 85 + 15 = 100개 스키 리조트
-- ================================================================
