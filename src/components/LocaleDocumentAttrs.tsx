import { isRtlLocale } from '@/lib/seo/site'

/**
 * <html> 의 lang·dir 을 현재 로케일로 바로잡는다.
 *
 * <html> 은 루트 레이아웃만 그릴 수 있는데 그 레이아웃에는 [locale] 세그먼트가 없다.
 * 서버에서 로케일을 읽으려면 요청 헤더를 봐야 하고, 그 순간 하위 페이지가 전부 동적
 * 렌더링으로 떨어진다. 그래서 문서 속성만 페인트 직전에 스크립트로 고친다.
 *
 * lang 이 틀리면 스크린리더가 한국어를 영어 발음으로 읽고, 브라우저 번역·하이픈 처리도
 * 어긋난다. 아랍어·페르시아어는 dir 이 없으면 글이 왼쪽부터 흐른다. 두 속성은 본문
 * 렌더 전에 정해져야 하므로 defer 없는 인라인 스크립트를 쓴다.
 */
export default function LocaleDocumentAttrs({ locale }: { locale: string }) {
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
  return (
    <script
      // 값은 라우팅에서 검증된 로케일 코드라 따옴표가 섞일 수 없다.
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir=${JSON.stringify(dir)};`,
      }}
    />
  )
}
