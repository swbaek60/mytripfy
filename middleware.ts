import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const ASSET_LINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.mytripfy.app',
      sha256_cert_fingerprints: [
        'A0:5F:3A:B1:52:56:C8:45:80:A0:02:BE:78:30:0B:AC:14:18:84:7C:E6:8E:0A:C7:92:B5:FE:1B:1C:E2:83:81',
      ],
    },
  },
]

export default clerkMiddleware(async (_auth, request) => {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/.well-known/') || pathname === '/well-known/assetlinks.json') {
    return NextResponse.json(ASSET_LINKS)
  }

  // 미들웨어 동작 확인용 디버그 엔드포인트
  if (pathname === '/debug-middleware') {
    return NextResponse.json({ ok: true, time: Date.now() })
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
