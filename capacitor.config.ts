import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mytripfy.app',
  appName: 'Mytripfy',
  webDir: 'out',
  server: {
    url: 'https://mytripfy.com',
    cleartext: false,
    allowNavigation: [
      'mytripfy.com',
      '*.mytripfy.com',
      'clerk.com',
      '*.clerk.com',
      '*.clerk.accounts.dev',
      // Google OAuth
      'accounts.google.com',
      '*.google.com',
      // Facebook OAuth
      'facebook.com',
      '*.facebook.com',
      'm.facebook.com',
      // Apple OAuth
      'appleid.apple.com',
      '*.apple.com',
      // Supabase
      '*.supabase.co',
    ],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
