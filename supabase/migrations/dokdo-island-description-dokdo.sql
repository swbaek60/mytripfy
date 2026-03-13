-- Dokdo Island: 설명에서 (다케시마) → (독도)로 변경 (nature, 영문 설명 + ko 번역)
UPDATE challenges
SET description_en = 'Dokdo Island (Dokdo) is a small volcanic island in the East Sea, administered by South Korea. It is known for pristine waters and seabird nesting. Access is restricted; boat tours from Ulleungdo are limited. The island is a symbol of national identity. It is one of East Asia''s most politically sensitive and naturally remote islands.'
WHERE category = 'nature' AND title_en = 'Dokdo Island';

UPDATE challenge_translations t
SET description = REPLACE(t.description, '다케시마', '독도')
FROM challenges c
WHERE t.challenge_id = c.id AND c.category = 'nature' AND c.title_en = 'Dokdo Island' AND t.lang = 'ko';
