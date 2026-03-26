import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

async function getProfileId(clerkUserId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle()
  return data?.id ?? null
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profileId = await getProfileId(clerkUserId)
    if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    const { revieweeId, rating, content, postId, tags } = await req.json()
    if (!revieweeId || !rating) {
      return NextResponse.json({ error: 'Missing revieweeId or rating' }, { status: 400 })
    }
    if (profileId === revieweeId) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.from('reviews').insert({
      reviewer_id: profileId,
      reviewee_id: revieweeId,
      rating,
      content: content?.trim() || null,
      post_id: postId || null,
      tags: tags && tags.length > 0 ? tags : null,
    }).select().single()

    if (error) {
      console.error('review insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, review: data })
  } catch (e) {
    console.error('reviews POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profileId = await getProfileId(clerkUserId)
    if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    const { reviewId, rating, content } = await req.json()
    if (!reviewId || !rating) {
      return NextResponse.json({ error: 'Missing reviewId or rating' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('reviews')
      .update({ rating, content: content?.trim() || null })
      .eq('id', reviewId)
      .eq('reviewer_id', profileId)

    if (error) {
      console.error('review update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('reviews PUT error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profileId = await getProfileId(clerkUserId)
    if (!profileId) return NextResponse.json({ error: 'Profile not found' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('reviewId')
    if (!reviewId) return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', profileId)

    if (error) {
      console.error('review delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('reviews DELETE error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
