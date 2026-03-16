# mytripfy 앱 서비스 가이드 (Android + iOS)

웹사이트를 **Android**와 **Apple(iOS)** 양쪽에서 앱처럼 쓰는 가장 간단한 방법 두 가지를 정리했습니다.

---

## 방법 1: PWA (Progressive Web App) — 가장 간단

**한 번 배포로 웹 + 앱 경험**을 동시에 제공하는 방식입니다. 앱스토어 등록은 없고, 사용자가 브라우저에서 “홈 화면에 추가”로 앱처럼 설치합니다.

### 장점
- 구현이 가장 단순함 (이미 manifest·메타 설정 적용됨)
- Play Store / App Store 심사 없음
- 웹 배포만 하면 Android·iOS 모두 대응
- 별도 네이티브 앱 빌드·유지보수 불필요

### 사용 방법 (사용자)
- **Android**: Chrome에서 사이트 접속 → 메뉴(⋮) → **앱에 추가** 또는 **홈 화면에 추가**
- **iOS**: Safari에서 사이트 접속 → 공유 버튼 → **홈 화면에 추가**

### 이미 적용된 것
- `public/manifest.json` — 앱 이름, 아이콘, 테마색, standalone 표시
- 레이아웃 메타데이터에 `manifest`, `appleWebApp` 연결

### 선택 사항 (아이콘 품질)
- Android에서 더 나은 아이콘을 쓰려면 **192x192**, **512x512** PNG를 만들어 `public/`에 넣고 `manifest.json`의 `icons` 배열에 추가하면 됩니다.
- iOS는 `apple-icon.png`(또는 apple-touch-icon)만 있어도 “홈 화면에 추가” 시 사용됩니다.

---

## 방법 2: 스토어 등록 앱 (Capacitor 등) — 앱스토어에 올리고 싶을 때

**Play Store / App Store에 실제 앱으로 등록**하려면, 웹 화면을 감싼 네이티브 앱을 만드는 방식이 가장 간단합니다.

### 추천: Capacitor (Ionic)

- 현재 **Next.js 웹 프로젝트는 그대로 두고**, 빌드 결과(정적 파일 또는 배포 URL)를 앱에서 불러와 웹뷰로 보여 주는 방식입니다.
- 한 번 구성해 두면 **Android / iOS 앱을 각각 빌드**해서 스토어에 제출할 수 있습니다.

### 대략적인 단계

1. **웹 배포**
   - Next.js를 배포(예: Vercel)하고, 앱에서 접속할 **URL**을 정합니다.  
   - 또는 `output: 'export'`로 정적 export 후 그 결과를 앱에 넣을 수 있음 (API/동적 기능이 많으면 URL 방식이 더 적합).

2. **Capacitor 프로젝트 추가**
   ```bash
   # 새 폴더에 간단한 웹뷰 앱 생성 후, 앱에서 위 URL 로드
   npm init @capacitor/app
   # 또는 기존 Next 빌드 결과물을 capacitor의 webDir로 지정
   ```

3. **Android**
   - Android Studio 설치 → `npx cap add android` → `npx cap open android`에서 빌드 후 **AAB** 생성 → Play Store 업로드.

4. **iOS**
   - Mac + Xcode 필요 → `npx cap add ios` → `npx cap open ios`에서 빌드 → App Store Connect에 업로드.

### 참고
- Next.js는 서버 렌더링을 쓰므로, **앱은 보통 “배포된 웹 URL”을 웹뷰로 여는 방식**이 구현·운영이 쉽습니다.
- 푸시 알림·카메라 등 네이티브 기능이 필요하면 Capacitor 플러그인으로 추가할 수 있습니다.

---

## 정리

| 목표 | 추천 방법 |
|------|-----------|
| 가장 간단하게, 앱처럼 쓰게만 하기 (스토어 등록 X) | **방법 1: PWA** (이미 적용됨) |
| Play Store / App Store에 올리기 | **방법 2: Capacitor** 등으로 웹뷰 앱 제작 후 스토어 제출 |

지금은 **PWA 설정이 들어가 있으므로**, 웹을 배포한 뒤 Android에서는 “앱에 추가”, iOS에서는 “홈 화면에 추가”만 안내해 주면 앱처럼 사용할 수 있습니다. 나중에 스토어 등록이 필요해지면 Capacitor로 웹뷰 앱을 추가하는 순서로 진행하면 됩니다.
