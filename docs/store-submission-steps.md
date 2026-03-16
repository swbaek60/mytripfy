# Play Store / App Store 등록 — 단계별 가이드

mytripfy 웹사이트를 **Capacitor**로 감싸 Android·iOS 앱을 만들고, 각 스토어에 제출하는 과정을 단계별로 진행합니다.

---

## 전체 단계 요약

| 단계 | 내용 | 진행 |
|------|------|------|
| **1** | 웹 배포 확인 + Capacitor 앱 프로젝트 생성 | ✅ 완료 |
| **2** | Android 앱 아이콘/이름 설정, Android Studio에서 빌드·AAB 생성 | ✅ 완료 |
| **3** | iOS 앱 아이콘/이름 설정, Xcode에서 빌드 (Mac 필요) | |
| **4** | Play Store 제출 (개발자 계정, AAB 업로드, 스토어 등록) | ← 다음 단계 |
| **5** | App Store 제출 (Apple 개발자 계정, IPA 업로드, 스토어 등록) | |

---

## 1단계: 웹 배포 확인 + Capacitor 앱 프로젝트 생성

### 1-1. 웹 사이트 배포 확인

앱은 **배포된 웹 사이트 URL**을 웹뷰로 불러옵니다. 먼저 다음을 확인하세요.

- [ ] mytripfy 웹이 **항상 접속 가능한 URL**에서 동작하는가?  
  (예: `https://mytripfy.com` 또는 Vercel 등에 배포된 URL)
- [ ] 해당 URL에서 로그인·기능이 정상 동작하는가?

→ **아직 배포가 안 되어 있다면** Vercel/Netlify 등에 Next.js를 먼저 배포한 뒤, 아래 URL을 정해 두세요.  
→ **이미 배포되어 있다면** 그 URL을 메모해 두고 다음 단계로 갑니다. (예: `https://mytripfy.com`)

### 1-2. Capacitor 프로젝트가 있는 위치

이 가이드에서는 **같은 저장소 안**에 `mobile-app/` 폴더를 두고, 그 안에 Capacitor 앱을 만듭니다.

- 웹(Next.js): 프로젝트 루트
- 모바일 앱(Capactor): `mobile-app/`  
→ 웹 코드는 건드리지 않고, 앱만 별도로 빌드·배포할 수 있습니다.

### 1-3. 필요한 도구 (단계별)

- **1단계**: Node.js, npm
- **2단계**: Android Studio (Windows/Mac/Linux)
- **3단계**: Mac, Xcode (iOS 빌드는 Mac에서만 가능)
- **4·5단계**: Google Play Console 계정, Apple Developer Program 계정

---

## 1단계 완료 체크리스트

- [x] `mobile-app/` 폴더에 Capacitor 프로젝트 생성
- [x] `capacitor.config.ts`에 `server.url: 'https://mytripfy.com'` 설정
- [x] `npm install` 후 `npx cap add android`, `npx cap add ios` 실행
- [ ] **직접 확인**: 웹이 https://mytripfy.com (또는 사용 중인 URL)에서 정상 동작하는지 확인

**URL을 바꾸려면**: `mobile-app/capacitor.config.ts`에서 `server.url`을 수정한 뒤 `mobile-app` 폴더에서 `npx cap sync` 실행.

---

## 2단계: Android 앱 아이콘·이름 설정 및 빌드

(1단계에서 Android 플랫폼은 이미 추가된 상태입니다. 이제 빌드 가능한 앱으로 만듭니다.)

### 2-1. Android Studio 설치

1. https://developer.android.com/studio 에서 **Android Studio** 다운로드 후 설치.
2. 설치 후 실행 → SDK 설치 안내가 나오면 따라 설치 (Android SDK, SDK Platform 등).

### 2-2. 앱 아이콘 넣기 (선택, 권장)

- **Android**: `mobile-app/android/app/src/main/res/` 아래에 다음 해상도별 아이콘을 넣습니다.
  - `mipmap-mdpi/ic_launcher.png` (48x48)
  - `mipmap-hdpi/ic_launcher.png` (72x72)
  - `mipmap-xhdpi/ic_launcher.png` (96x96)
  - `mipmap-xxhdpi/ic_launcher.png` (144x144)
  - `mipmap-xxxhdpi/ic_launcher.png` (192x192)
- 또는 Android Studio에서 **File → New → Image Asset**으로 아이콘을 생성할 수 있습니다.
- 아이콘을 넣은 뒤 `mobile-app`에서 `npx cap sync` 한 번 실행.

### 2-3. 앱 이름 확인

- 표시 이름은 `capacitor.config.ts`의 `appName: 'mytripfy'` 입니다. 바꾸려면 수정 후 `npx cap sync`.

### 2-4. Android 앱 빌드 및 AAB 생성

1. 터미널에서:
   ```bash
   cd mobile-app
   npm run cap:sync
   npm run android
   ```
2. Android Studio가 열리면:
   - **Build → Generate Signed Bundle / APK** 선택.
   - **Android App Bundle (AAB)** 선택 (Play Store는 AAB 권장).
   - **Create new...** 로 키스토어 새로 만들기 (비밀번호·별칭 기억해 두기).
   - **release** 빌드 타입 선택 후 **Finish**.
3. 빌드가 끝나면 `android/app/release/app-release.aab` 파일이 생성됩니다.  
   → 이 파일을 **4단계**에서 Play Store에 업로드합니다.

### 2단계 체크리스트

- [ ] Android Studio 설치됨 (없으면 https://developer.android.com/studio)
- [ ] `npm run android` 로 Android Studio에서 프로젝트 열림
- [ ] (선택) 앱 아이콘 변경: **File → New → Image Asset** 또는 `res/mipmap-*/ic_launcher*.png` 교체
- [ ] **Build → Generate Signed Bundle / APK** → **Android App Bundle** 선택
- [ ] **Create new...** 로 키스토어 생성 (경로·비밀번호·별칭 저장)
- [ ] release 빌드 완료 → `android/app/release/app-release.aab` 확인

---

## 3단계: iOS 앱 빌드 (Mac 필요)

iOS 플랫폼은 이미 추가되어 있습니다. **Mac**에서만 실제 빌드가 가능합니다.

### 3-1. Mac에서 필요한 것

- **Xcode** (Mac App Store에서 설치)
- **CocoaPods**: 터미널에서 `sudo gem install cocoapods`
- **Apple Developer Program** 가입 ($99/년) — 스토어 제출 전에 필요

### 3-2. CocoaPods 설치 후 동기화

```bash
cd mobile-app
npx cap sync ios
cd ios/App && pod install && cd ../..
npx cap open ios
```

### 3-3. Xcode에서 할 일

1. **서명(Signing)**: 프로젝트 선택 → **Signing & Capabilities** → Team에 본인 Apple 개발자 계정 선택.
2. **실기기 또는 시뮬레이터**에서 실행해 동작 확인.
3. **Archive**: 메뉴 **Product → Archive** → 완료 후 **Distribute App** → **App Store Connect** 업로드.

→ **5단계**에서 App Store Connect에서 스토어 정보를 채우고 심사 요청하면 됩니다.

---

## 4단계: Play Store 제출

AAB 파일(`app-release.aab`)이 준비되었으면 아래 순서대로 진행하세요.

### 4-1. Google Play Console 가입

1. **https://play.google.com/console** 접속
2. Google 계정으로 로그인
3. **개발자 계정 등록** (등록비 **$25** 일회, 카드 결제)
4. 개발자 계약·정책 동의 후 대시보드 들어가기

### 4-2. 앱 만들기

1. **앱 만들기** (또는 "앱 추가") 클릭
2. 입력할 항목:
   - **앱 이름**: mytripfy (또는 원하는 이름)
   - **기본 언어**: 한국어 또는 English
   - **앱 또는 게임**: 앱
   - **무료 또는 유료**: 무료 (또는 유료)
3. **앱 만들기** 완료

### 4-3. 스토어 등록 정보 채우기

왼쪽 메뉴 **정책** → **앱 콘텐츠** 및 **성장** → **스토어 설정** / **스토어 등록**에서:

| 항목 | 내용 예시 |
|------|-----------|
| **앱 설명** (간단) | 여행 동행·현지 가이드를 찾는 플랫폼 등 |
| **앱 설명** (전체) | mytripfy 소개, 주요 기능 설명 (4000자 제한) |
| **스크린샷** | 휴대폰에서 앱 실행 후 캡처 (최소 2장, 권장 4~8장) |
| **앱 아이콘** | **512 x 512** PNG (투명 배경 불가) |
| **기능 요약** | 짧은 문구 (80자 제한) |

### 4-4. AAB 업로드 (출시)

1. 왼쪽 **출시** → **프로덕션** (또는 **내부 테스트**로 먼저 시험 가능)
2. **새 버전 만들기** (또는 "출시 만들기")
3. **앱 번들 업로드**: `app-release.aab` 파일 선택  
   (위치: `mobile-app\android\app\release\app-release.aab` 또는 빌드 시 지정한 destination folder)
4. **버전 이름** (예: 1.0.0), **출시 노트** 입력 후 저장

### 4-5. 필수 정책·설정 완료

다음이 **모두 완료**되어야 제출 가능합니다. 왼쪽 메뉴에서 상태 확인:

- **개인정보 처리방침**: URL 입력 (웹사이트에 정책 페이지 있으면 그 주소)
- **앱 액세스**: 로그인 필요 여부 등 (예: “일부 기능은 로그인 필요”)
- **광고**: 앱에 광고 있으면 “예” 선택 후 세부 입력
- **콘텐츠 등급**: 설문 작성 후 등급 받기
- **대상 그룹 및 콘텐츠**: 타겟 연령 등
- **뉴스 앱**: 해당 없으면 “아니오”

### 4-6. 검토 제출

- **출시** → **프로덕션** (또는 선택한 트랙)에서 **검토 제출** / **출시 검토 제출**
- Google 검토 (보통 며칠 소요) 후 승인되면 스토어에 노출됩니다.

### 4단계 체크리스트

- [ ] Play Console 가입 ($25)
- [ ] 앱 만들기 (이름, 언어, 무료/유료)
- [ ] 스토어 등록: 설명, 스크린샷, 512x512 아이콘
- [ ] AAB 업로드 (app-release.aab)
- [ ] 개인정보 처리방침 URL
- [ ] 콘텐츠 등급·앱 액세스 등 필수 항목 완료
- [ ] 검토 제출

---

## 5단계: App Store 제출

### 5-1. Apple Developer Program

- https://developer.apple.com/programs/ 가입 (**$99/년**).

### 5-2. App Store Connect

1. https://appstoreconnect.apple.com 에서 **앱** → **+** 로 새 앱 추가 (Bundle ID는 Xcode 프로젝트의 것과 동일하게).
2. **앱 정보**: 이름, 부제목, 설명, 키워드, 스크린샷, 아이콘 등 입력.
3. **3단계**에서 Archive 후 업로드한 **빌드**를 선택.
4. **제출 검토** 요청 → 승인 후 판매 가능합니다.

---

*각 단계를 진행할 때 이 문서를 함께 보면서 체크리스트를 채워 나가면 됩니다. 다음은 **4단계: Play Store 제출**을 진행하면 됩니다.*
