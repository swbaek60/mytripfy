import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // API, 정적 파일, _next 제외한 모든 pathname 처리 (루트 / 포함)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
