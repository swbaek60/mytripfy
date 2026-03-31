import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

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

const clerk = clerkMiddleware()

export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/.well-known/assetlinks.json') {
    return NextResponse.json(ASSET_LINKS, {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return clerk(request as any, {} as any)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
