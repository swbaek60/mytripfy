# Amazon SES 이메일 발송 (mytripfy)

## 현재 상태

- **도메인**: mytripfy.com → SES에서 Verified
- **발신 주소**: `noreply@mytripfy.com` (도메인 인증으로 사용 가능)
- **리전**: `.env`의 `AWS_REGION` (도메인을 인증한 리전과 동일하게 설정, 예: `us-east-1`)

## 환경 변수 (.env.local)

| 변수 | 설명 |
|------|------|
| `AWS_ACCESS_KEY_ID` | IAM 사용자 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | IAM 시크릿 키 |
| `AWS_REGION` | SES 리전 (예: us-east-1) |
| `SES_FROM_EMAIL` | 발신 주소 (예: noreply@mytripfy.com) |
| `SES_FROM_NAME` | 발신 표시 이름 (예: mytripfy) |

## 사용처

- 동행찾기 신청/수락·거절 알림
- 가이드 신청/수락·거절 알림
- 가이드 요청 알림
- 가이드에게 문의 메일 (Reply-To: 문의자 이메일)

## 샌드박스 vs 프로덕션

- **샌드박스**: 수신자도 SES에서 **Verified**된 이메일만 발송 가능. 테스트용.
- **프로덕션**: 아무 수신자에게나 발송 가능.  
  AWS SES 콘솔 → **Account dashboard** → **Request production access** 로 신청.

## 테스트

1. 동행찾기 글에 신청하거나, 가이드 문의 보내기 등으로 실제 발송 흐름 확인.
2. 발송 실패 시 서버 로그 `[SES] 이메일 발송 실패:` 로 원인 확인.
