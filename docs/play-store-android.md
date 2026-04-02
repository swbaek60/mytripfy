# Google Play 스토어 (Android) 출시 체크리스트

앱 ID: `com.mytripfy.app` · WebView는 `https://mytripfy.com` 로드(Capacitor `server.url`).

## 1. 사전 준비 (한 번만)

1. [Google Play Console](https://play.google.com/console) 에 개발자 계정 등록(등록비 있음).
2. **앱 만들기** → 앱 이름 **Mytripfy**(또는 표시명) → 기본 언어 선택.
3. **개인정보처리방침 URL**: `https://mytripfy.com/en/privacy` (또는 해당 로케일 공개 URL).

## 2. 업로드용 서명 키 생성 (로컬, Git에 넣지 않음)

PowerShell 또는 터미널에서 (비밀번호·별칭은 본인이 기억할 값):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore mytripfy-upload.jks -alias mytripfy -keyalg RSA -keysize 2048 -validity 10000
```

생성한 `mytripfy-upload.jks` 를 **`android/` 폴더**에 두거나, 원하는 경로에 두고 `storeFile` 경로만 맞춥니다.

## 3. `keystore.properties` 설정

`android/keystore.properties.example` 을 복사해 `android/keystore.properties` 로 저장:

```properties
storePassword=(키스토어 비밀번호)
keyPassword=(키 비밀번호)
keyAlias=mytripfy
storeFile=mytripfy-upload.jks
```

`storeFile` 은 **android 폴더 기준** 상대 경로입니다.

## 4. 웹 자산 동기화 & AAB 빌드

**JDK**: Gradle은 `JAVA_HOME`이 필요합니다. Android Studio를 쓰는 경우 보통 `C:\Program Files\Android\Android Studio\jbr`(Windows) 또는 `/Applications/Android Studio.app/Contents/jbr`(macOS)입니다. `npm run android:bundle` 은 `JAVA_HOME`이 비어 있으면 위 경로를 자동으로 시도합니다. 수동 설정 예(PowerShell): `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`.

프로젝트 루트에서:

```bash
npm run cap:prep
npm run android:bundle
```

성공 시 AAB 경로:

`android/app/build/outputs/bundle/release/app-release.aab`

## 5. Play Console에 업로드

1. **출시** → **프로덕션**(또는 내부 테스트) → **새 버전 만들기**.
2. **앱 번들**에 위 `app-release.aab` 업로드.
3. **Google Play 앱 서명** 사용 권장(콘솔 안내에 따라 업로드 키 등록).
4. 스토어 등록정보: 짧은/전체 설명, 스크린샷(휴대전화 필수), 아이콘 512×512, 그래픽 이미지 등.
5. **콘텐츠 등급**, **타겟 잠재고객**, **광고·데이터 안전** 설문 작성.
6. 검토 제출.

## 6. 버전 올리기 (이후 업데이트마다)

`android/app/build.gradle` 의 `defaultConfig` 에서:

- `versionCode` → 정수, **이전보다 반드시 큰 값**
- `versionName` → 사용자에게 보이는 버전 문자열(예: `1.0.1`)

수정 후 다시 `npm run cap:prep` → `npm run android:bundle` → 콘솔에 새 번들 업로드.

## 7. App Links / Digital Asset Links

앱에서 `https://mytripfy.com` 링크를 열게 하려면 `/.well-known/assetlinks.json` 이 패키지·서명과 일치해야 합니다. 서버·Play 서명 키 지문은 배포 후 [연결 확인 도구](https://developers.google.com/digital-asset-links/tools/generator)로 검증하세요.
