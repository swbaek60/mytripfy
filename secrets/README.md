# SNS 비밀 키 (Git 제외)

한 줄씩만 저장하세요. 저장 후:

```bash
node scripts/setup-sns-from-local.mjs
npm run sns:auto:publish
```

| 파일 | 내용 |
|------|------|
| `gemini.txt` | `AIza...` (Google AI Studio — **Nano Banana, 무료 한도 권장**) |
| `openai.txt` | `sk-...` (OpenAI API 키, 유료) |
| `meta-token.txt` | Meta long-lived access token |
| `instagram-sua-id.txt` | 수아 IG Business User ID |
| `instagram-ethan-id.txt` | 이든 IG Business User ID |

발급 방법: [docs/sns-meta-api-setup.md](../docs/sns-meta-api-setup.md)
