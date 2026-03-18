import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'mytripfy_oauth_next'
const LOCALE_COOKIE = 'mytripfy_oauth_locale'

function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://mytripfy.com'
}

/**
 * 모바일 전용 중간 페이지.
 * location.replace()는 갤럭시 등에서 Facebook으로 갈 때 새 탭이 뜨는 경우가 있어,
 * 데스크톱과 동일하게 form GET + target="_self" + form.submit()으로 이동 (같은 탭 유지).
 */
function buildFormRedirectHtml(url: string): string {
  const urlAttr = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <base target="_self">
  <title>Redirecting…</title>
  <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f8fafc;color:#64748b;font-size:14px}</style>
</head>
<body>
  <p>Redirecting…</p>
  <form id="oauthForm" method="GET" action="${urlAttr}" target="_self"></form>
  <script>
    (function () {
      var form = document.getElementById('oauthForm');
      try {
        if (window.top !== window.self) form.target = '_top';
        form.submit();
      } catch (e) {
        form.submit();
      }
    })();
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${urlAttr}" />
    <a href="${urlAttr}" target="_self">Continue</a>
  </noscript>
</body>
</html>`
}

export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  const locale = cookieStore.get(LOCALE_COOKIE)?.value
  const origin = getOrigin()
  const localeDecoded = locale ? decodeURIComponent(locale) : 'en'

  let url: string
  try {
    if (!raw) throw new Error('missing cookie')
    url = Buffer.from(raw, 'base64url').toString('utf-8')
    if (!url.startsWith('https://')) throw new Error('invalid url')
  } catch {
    const res = NextResponse.redirect(`${origin}/${localeDecoded}/login?message=Invalid+redirect`, 302)
    res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
    return res
  }

  const html = buildFormRedirectHtml(url)
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
