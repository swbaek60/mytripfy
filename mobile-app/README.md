# mytripfy 모바일 앱 (Capacitor)

이 폴더는 mytripfy 웹사이트를 감싼 **Android / iOS 네이티브 앱** 프로젝트입니다.  
앱은 `capacitor.config.ts`의 `server.url`(기본: https://mytripfy.com)을 웹뷰로 불러옵니다.

## 요구 사항

- **Node.js** 18+
- **Android 빌드**: Android Studio
- **iOS 빌드**: Mac + Xcode + CocoaPods

## 사용한 명령어

```bash
# 의존성 설치 (최초 1회)
npm install

# 설정 변경 후 네이티브 프로젝트 동기화 (npx 대신 npm 스크립트 사용 권장)
npm run cap:sync

# Android Studio에서 열기 (빌드·AAB 생성)
npm run android

# Xcode에서 열기 (Mac만, 빌드·IPA 생성)
npm run ios
```

**Windows에서 `npx` 실행 오류가 날 때** (PowerShell 실행 정책 오류):  
`npx cap sync` 대신 **`npm run cap:sync`** 를 사용하세요. 동일하게 `npm run android`로 Android Studio를 열 수 있습니다.

## URL 변경

다른 도메인으로 서비스할 때는 `capacitor.config.ts`의 `server.url`을 수정한 뒤 `npx cap sync`를 실행하세요.

## 상세 단계

전체 스토어 등록 단계는 프로젝트 루트의 **`docs/store-submission-steps.md`** 를 참고하세요.
