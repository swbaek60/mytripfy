# 챌린지 설명 확장 (500~1000자) — 적용 순서

## 한 번에 실행 (권장)

- **schema-v19-descriptions-ALL.sql** — 위 모든 카테고리를 하나로 합친 파일 (약 1,260개 UPDATE)
- **Supabase Dashboard → SQL Editor**에서 파일을 열어 **전체 복사** 후 **Run** 한 번으로 적용 가능

---

아래는 카테고리별 개별 파일입니다. 순서대로 실행해도 됩니다.

## 1. 레스토랑 (100개) — 완료
- **schema-v19-descriptions.sql** — 100 Restaurants

## 2. 동물 + 스키 (24개) — 완료
- **schema-v19-descriptions-animals-skiing.sql** — Animals 9, Skiing 15

## 3. 낚시 (100개) — 완료
- **schema-v19-descriptions-fishing.sql** — 100 Fishing Spots

## 4. 골프 (100개) — 완료
- **schema-v19-descriptions-golf.sql** — 100 Golf Courses

## 5. 스쿠버 (100개) — 완료
- **schema-v19-descriptions-scuba.sql** — 100 Dive Sites

## 6. 섬 (90개) — 완료
- **schema-v19-descriptions-islands.sql** — 90 Islands

## 7. 박물관 (100개) — 완료
- **schema-v19-descriptions-museums.sql** — 100 Museums

## 8. 국가 (100개) — 완료
- **schema-v19-descriptions-countries.sql** — 100 Countries

## 9. 명소 (85개) — 완료
- **schema-v19-descriptions-attractions.sql** — 85 Attractions (schema-v8 기준)

## 10. 음식·음료·자연·축제·서핑·미술관 — 완료
- **schema-v19-descriptions-foods.sql** — 100 Foods
- **schema-v19-descriptions-drinks.sql** — 91 Drinks
- **schema-v19-descriptions-nature.sql** — 100 Nature
- **schema-v19-descriptions-festivals.sql** — 100 Festivals
- **schema-v19-descriptions-surfing.sql** — 100 Surfing
- **schema-v19-descriptions-art_galleries.sql** — 94 Art galleries

## 참고
- 각 설명은 **500~1000자** (영문) 권장.
- 내용: 왜 세계 100에 선정되었는지, 특색·장점·특이점.
- SQL 문자열 내 작은따옴표는 `''` 로 이스케이프.
