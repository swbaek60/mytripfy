import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

/** 영문을 베이스로 로케일로 덮어쓰기. 누락된 키는 en으로 채워 25개 언어 선택 시 에러 방지 */
function mergeMessages(
  en: Record<string, Record<string, string>>,
  locale: Record<string, Record<string, string> | undefined> | null
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const sections = new Set([...Object.keys(en), ...Object.keys(locale || {})]);
  for (const section of sections) {
    const enBlock = en[section] || {};
    const localeBlock = locale?.[section] || {};
    out[section] = { ...enBlock, ...localeBlock };
  }
  return out;
}

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import('../../messages/en.json')).default as Record<string, Record<string, string>>;
  let messages = enMessages;

  if (locale !== routing.defaultLocale) {
    try {
      const localeMessages = (await import(`../../messages/${locale}.json`)).default as Record<string, Record<string, string> | undefined>;
      messages = mergeMessages(enMessages, localeMessages);
    } catch {
      // 로케일 파일 없거나 파싱 실패 시 영문만 사용
    }
  }

  return {
    locale,
    messages,
  };
});