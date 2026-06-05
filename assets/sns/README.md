# SNS 캐릭터 에셋

## 레퍼런스 이미지 생성

```bash
node scripts/generate-sns-reference.mjs
```

`OPENAI_API_KEY` 필요. 생성 파일:

| 파일 | 용도 |
|------|------|
| `sua-ref-front.png` | 인스타 프로필 (생성 완료) |
| `sua-ref-full.png` | 전신·프롬프트 일관성 (생성 완료) |
| `sua-ref-source.png` | 사용자 제공 원본 백업 |
| `ethan-ref-front.png` | 인스타 프로필 (차콜 니트 스웨터) |
| `ethan-ref-full.png` | 전신 (차콜 니트+진+화이트 스니커, 프로필과 통일) |
| `ethan-ref-source.png` | 사용자 제공 원본 백업 |

예전 `sua_captivating_sexy.png` / `ethan_late20s_model.png` 는 저장소에 없음 — 위 스크립트로 새로 만드세요.
