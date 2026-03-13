# Golf / Fishing / Surfing / Skiing / Scuba 직접 이미지

- **데이터**: `src/data/directImagesActivityCategories.ts` (golf, fishing, surfing, skiing, scuba용 직접 이미지 URL)
- **채우기**: 직접 URL이 있으면 즉시 표시, 없으면 기존처럼 `/api/challenge-image`로 조회 후 캐시

## URL 추가/갱신

1. **제목 목록 추출**  
   `node scripts/extract-titles.js`  
   → `scripts/category-titles.json` 생성 (스키마에서 title_en 추출)

2. **Wikipedia/Commons에서 이미지 URL 수집**  
   `node scripts/fetch-wiki-direct.mjs`  
   → `scripts/fetched-direct-images.json` 생성  
   - 전체: 그대로 실행  
   - 일부만: `MAX_PER_CAT=20 node scripts/fetch-wiki-direct.mjs`

3. **TS 상수 파일 생성**  
   `node scripts/json-to-ts-direct.mjs`  
   → `src/data/directImagesActivityCategories.ts` 갱신

4. **캐시 버전**  
   `ChallengeImage.tsx`에서 `CACHE_VERSION`을 올려 새 이미지가 반영되도록 함.
