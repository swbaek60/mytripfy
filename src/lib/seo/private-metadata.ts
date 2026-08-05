import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from './build-metadata'

/**
 * 로그인·소유자 전용 페이지의 metadata.
 *
 * 이런 페이지는 검색 결과에 나와서는 안 된다. robots.txt 로 크롤링을 막아도, 다른 곳에
 * 링크가 걸리면 구글은 내용을 못 읽은 채 URL 만 색인할 수 있다. 그래서 페이지 자체에
 * noindex 를 박아 둔다. 대신 브라우저 탭·공유 제목은 로케일 문구로 제대로 보여 준다.
 */
export async function buildPrivateMetadata(opts: {
  locale: string
  /** 로케일 제외 경로: '/dashboard' */
  path: string
  namespace: string
  titleKey: string
  descriptionKey?: string
}): Promise<Metadata> {
  const t = await getTranslations({ locale: opts.locale, namespace: opts.namespace })
  const title = t(opts.titleKey)
  return buildPageMetadata({
    locale: opts.locale,
    path: opts.path,
    title,
    description: opts.descriptionKey ? t(opts.descriptionKey) : title,
    noindex: true,
  })
}
