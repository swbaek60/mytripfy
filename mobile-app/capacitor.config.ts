import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mytripfy.app',
  appName: 'mytripfy',
  webDir: 'web',
  server: {
    // 앱 실행 시 이 URL을 웹뷰로 불러옵니다. 배포된 웹 주소로 변경하세요.
    url: 'https://mytripfy.com',
    cleartext: false,
  },
};

export default config;
