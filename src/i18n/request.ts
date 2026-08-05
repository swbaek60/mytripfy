import {getRequestConfig} from 'next-intl/server';
import {isAppLocale, routing} from './routing';

/** next-intl 메시지 — 값은 string 또는 중첩 객체(예: Blog 글) */
export type MessageTree = Record<string, unknown>
export type Messages = Record<string, MessageTree>

/** 영문을 베이스로 로케일로 덮어쓰기. 누락된 키는 en으로 채워 25개 언어 선택 시 에러 방지 */
function mergeMessages(en: Messages, locale: Messages | null): Messages {
  const out: Messages = {}
  const sections = new Set([...Object.keys(en), ...Object.keys(locale || {})])
  for (const section of sections) {
    const enBlock = (en[section] as MessageTree) || {}
    const localeBlock = (locale?.[section] as MessageTree) || {}
    out[section] = { ...enBlock, ...localeBlock }
  }
  return out
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : routing.defaultLocale;

  const enMessages = (await import('../../messages/en.json')).default as Messages;
  let messages = enMessages;

  if (locale !== routing.defaultLocale) {
    try {
      const localeMessages = (await import(`../../messages/${locale}.json`)).default as Messages;
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

/** getMessages() 실패 시 레이아웃에서 사용할 영문 폴백 */
export async function getFallbackMessages(): Promise<Messages> {
  const en = (await import('../../messages/en.json')).default as Messages;
  return en ?? {};
}