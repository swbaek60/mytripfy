/**
 * Clerk Webhook Handler
 * 사용자 생성/업데이트/삭제 시 Supabase profiles 테이블 자동 동기화
 *
 * Clerk 대시보드에서 Webhook 설정:
 * URL: https://www.mytripfy.com/api/webhooks/clerk
 * Events: user.created, user.updated, user.deleted
 * Signing Secret → CLERK_WEBHOOK_SECRET 환경변수에 설정
 */
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/utils/supabase/server'

interface ClerkEmailAddress {
  id: string
  email_address: string
  primary?: boolean
}

interface ClerkUserData {
  id: string
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
  email_addresses?: ClerkEmailAddress[]
  primary_email_address_id?: string | null
  created_at?: number
  updated_at?: number
}

interface WebhookEvent {
  type: string
  data: ClerkUserData
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Svix 헤더 추출
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Webhook 서명 검증
  const body = await req.text()
  const wh = new Webhook(webhookSecret)
  let evt: WebhookEvent
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[clerk-webhook] Webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const { type, data } = evt
  const admin = createAdminClient()

  if (type === 'user.created' || type === 'user.updated') {
    const primaryEmail = data.email_addresses?.find(
      e => e.id === data.primary_email_address_id
    )?.email_address ?? data.email_addresses?.[0]?.email_address ?? ''

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

    if (type === 'user.created') {
      // 이미 clerk_id로 프로필이 있으면 업데이트, 없으면 생성
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('clerk_id', data.id)
        .maybeSingle()

      if (!existing) {
        const { error } = await admin.from('profiles').insert({
          clerk_id: data.id,
          email: primaryEmail,
          full_name: fullName,
          avatar_url: data.image_url ?? null,
          preferred_locale: 'en',
        })
        if (error) console.error('[clerk-webhook] Failed to create profile:', error)
        else console.log('[clerk-webhook] Profile created for', data.id)
      }
    }

    if (type === 'user.updated') {
      const { error } = await admin
        .from('profiles')
        .update({
          email: primaryEmail,
          full_name: fullName,
          avatar_url: data.image_url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', data.id)
      if (error) console.error('[clerk-webhook] Failed to update profile:', error)
      else console.log('[clerk-webhook] Profile updated for', data.id)
    }
  }

  if (type === 'user.deleted') {
    // 소프트 삭제 또는 하드 삭제 (비즈니스 요구사항에 따라 선택)
    // 여기서는 clerk_id만 null로 설정 (데이터 보존)
    const { error } = await admin
      .from('profiles')
      .update({ clerk_id: null, updated_at: new Date().toISOString() })
      .eq('clerk_id', data.id)
    if (error) console.error('[clerk-webhook] Failed to soft-delete profile:', error)
    else console.log('[clerk-webhook] Profile soft-deleted for', data.id)
  }

  return NextResponse.json({ received: true })
}
