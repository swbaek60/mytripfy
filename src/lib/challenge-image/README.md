# 챌린지 이미지 로딩 (카테고리별 격리)

한 카테고리 이미지 수정이 다른 카테고리에 영향을 주지 않도록 설정을 카테고리별로 분리했습니다.

## 파일 역할

- **config.ts** – 16개 카테고리별 **로딩 전략** (캐시 방식, 조회 방식, 프록시 옵션 등).  
  - 직접 이미지 URL은 포함하지 않음.  
  - 한 카테고리만 바꿀 때는 `CONFIGS` 안의 해당 카테고리 객체만 수정하면 됨.

- **직접 이미지 데이터** – `src/components/ChallengeImage.tsx` 내 `*_DIRECT_IMAGES` 맵.  
  - 카테고리별로 맵이 나뉘어 있음 (예: `ATTRACTIONS_DIRECT_IMAGES`, `NATURE_DIRECT_IMAGES`).  
  - 특정 카테고리 이미지만 수정할 때는 해당 카테고리 맵만 수정하면 됨.

## config 필드

| 필드 | 설명 |
|------|------|
| cacheStrategy | `per_item`: 항목별 캐시 키. `category_versioned`: 카테고리 맵+버전(버전 올리면 무효화). `category_persistent`: 카테고리 맵(버전과 무관, purge 제외) |
| fetchStrategy | `none`: 직접만. `api`: /api/challenge-image. `findImage`: Wikipedia/Commons 클라이언트 검색 |
| useCanonicalProxy | Wikimedia 프록시 시 썸네일→캐노니컬 변환 여부 |
| eagerLoad | img loading="eager" 사용 여부 |
| maxConcurrent | findImage 동시 요청 수 |
| fetchTimeoutMs | findImage 타임아웃(ms). 0이면 미적용 |

## CACHE_VERSION

- `config.CACHE_VERSION`을 올리면 **per_item**, **category_versioned** 캐시만 무효화됩니다.  
- **category_persistent** (예: art_galleries) 캐시는 purge 대상에서 제외되므로, 다른 카테고리 수정을 위해 버전을 올려도 art_galleries 이미지는 깨지지 않습니다.
