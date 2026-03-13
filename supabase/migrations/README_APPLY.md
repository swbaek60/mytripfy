# 마이그레이션 적용 방법

보안 경고 해결 마이그레이션(`20250311200000_fix_advisor_warnings.sql`)을 적용하는 방법입니다.

---

## 방법 A: Supabase CLI로 리모트 DB에 적용 (권장)

이미 Supabase 프로젝트를 CLI로 연결해 두었다면, 리모트 DB에 한 번에 적용할 수 있습니다.

### 1. 사전 확인

- [Supabase CLI](https://supabase.com/docs/guides/cli) 설치
- 터미널에서 프로젝트 루트(`mytripfy`)로 이동

### 2. 리모트 프로젝트 연결 (한 번만 하면 됨)

```bash
cd c:\Users\swbae\Documents\mytripfy
supabase login
supabase link --project-ref <프로젝트_참조_ID>
```

`<프로젝트_참조_ID>`는 Supabase 대시보드 → **Project Settings** → **General** → **Reference ID**에서 확인합니다.

### 3. 마이그레이션 적용

```bash
supabase db push
```

- 아직 적용되지 않은 마이그레이션만 순서대로 실행됩니다.
- `20250311200000_fix_advisor_warnings.sql`이 그중 하나라면 이때 함께 적용됩니다.

### 4. 적용 여부 확인

```bash
supabase migration list
```

- 적용된 마이그레이션은 `Applied` 등으로 표시됩니다.

---

## 방법 B: Supabase 대시보드 SQL Editor로 직접 실행

CLI를 쓰지 않을 때는 대시보드에서 SQL을 직접 실행할 수 있습니다.

### 1. SQL 파일 열기

- 로컬에서 `supabase/migrations/20250311200000_fix_advisor_warnings.sql` 파일을 엽니다.
- **전체 내용**을 복사합니다.

### 2. 대시보드에서 실행

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속 후 프로젝트 선택
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 선택
4. 복사한 SQL 전체를 붙여넣기
5. **Run** (또는 Ctrl+Enter) 실행

### 3. 주의사항

- 이미 적용된 정책/함수가 있으면 `DROP POLICY IF EXISTS` 등은 안전하게 동작합니다.
- `ALTER FUNCTION`은 해당 함수가 이미 있어야 합니다. 이전 마이그레이션들이 이미 적용된 상태라면 그대로 실행해도 됩니다.
- 오류가 나면 메시지에 나온 객체(함수명, 정책명)를 확인한 뒤, 해당 부분만 주석 처리하고 나머지만 실행하는 방식으로 나눠 적용할 수 있습니다.

---

## 방법 C: 로컬 Supabase 사용 중인 경우

로컬에서 `supabase start`로 DB를 띄워 쓰는 경우:

```bash
cd c:\Users\swbae\Documents\mytripfy
supabase start
supabase db reset
```

- `db reset`은 로컬 DB를 초기화하고 **supabase/migrations** 안의 모든 마이그레이션을 순서대로 다시 적용합니다.
- 이미 로컬에 마이그레이션을 반영해 두었다면 `supabase db push`만 해도 됩니다 (리모트와 동일).

---

## Leaked Password Protection 설정 (경고 1개 해소)

이 항목은 **코드/마이그레이션으로 적용되지 않고**, 대시보드에서만 켤 수 있습니다.

1. Supabase 대시보드 → 프로젝트 선택
2. 왼쪽 **Authentication** 클릭
3. **Settings** 탭 선택
4. 아래로 내려 **Security and Auth** 또는 **Password** 섹션 찾기
5. **Leaked password protection** (또는 **HaveIBeenPwned** 관련) 옵션을 **Enable** 처리

이렇게 하면 유출된 비밀번호 사용을 막는 경고가 해소됩니다.

---

## 적용 후 확인

- **Supabase Advisor**: 대시보드에서 해당 프로젝트의 Advisor/보안 경고를 다시 확인해 보안 경고가 줄었는지 봅니다.
- **알림 동작**: 동행 신청, 가이드 신청, 메시지 등 알림이 생성되는 플로우를 앱에서 한 번씩 테스트해 보면 좋습니다.
