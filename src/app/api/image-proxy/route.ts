import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://upload.wikimedia.org',
  'https://commons.wikimedia.org',
]

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const origin = u.origin
    return ALLOWED_ORIGINS.some((allowed) => origin === allowed)
  } catch {
    return false
  }
}

/** Wikimedia 이미지 핫링크 차단 회피: 서버에서 이미지를 가져와 그대로 반환 */
export async function GET(request: NextRequest) {
  let url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Invalid or disallowed URL' }, { status: 400 })
  }
  // 클라이언트 encodeURIComponent로 %가 %25로 이중 인코딩될 수 있음 → %25가 없을 때까지 반복 디코딩
  for (let i = 0; i < 3; i++) {
    if (!url.includes('%25')) break
    try {
      url = decodeURIComponent(url)
    } catch {
      break
    }
  }
  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: 'Invalid or disallowed URL' }, { status: 400 })
  }

  const TIMEOUT_MS = 35000
  const doFetch = () =>
    fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'MyTripfy/1.0 (https://mytripfy.com; contact@mytripfy.com) Image Proxy',
        'Accept': 'image/*',
      },
      next: { revalidate: 86400 }, // 24h cache
    })

  try {
    let res = await doFetch()
    // 429/502/503/504면 최대 3회 재시도, 백오프 1.5s/3s/4.5s (Wikimedia 순간 오류·과부하 완화)
    for (let retry = 0; retry < 3 && !res.ok && [429, 502, 503, 504].includes(res.status); retry++) {
      await new Promise((r) => setTimeout(r, 1500 * (retry + 1)))
      res = await doFetch()
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error', status: res.status }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (e) {
    console.error('[image-proxy]', e)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 })
  }
}
