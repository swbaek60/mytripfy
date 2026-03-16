import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // API, 정적 파일, _next, auth/callback 제외 (OAuth 팝업이 locale 리다이렉트 없이 /auth/callback 직접 처리하도록)
  matcher: ['/((?!api|_next|_vercel|auth/callback|.*\\..*).*)'],
};
