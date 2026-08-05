import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: [
    'en', 'ko', 'zh', 'zh-TW', 'ja',
    'es', 'pt', 'pt-BR', 'fr', 'de', 'it', 'nl', 'pl', 'sv',
    'ru', 'uk', 'tr',
    'ar', 'fa', 'hi', 'bn',
    'id', 'ms',
    'vi', 'th'
  ],
  defaultLocale: 'en',
  /** 최초 접속 시 항상 영어(defaultLocale)로 진입. URL에 locale이 있으면 해당 언어 유지. */
  localeDetection: false,
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);

export type AppLocale = (typeof routing.locales)[number];

/** 임의의 문자열이 지원 로케일인지 좁혀 준다. */
export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (routing.locales as readonly string[]).includes(value);
}
