import { createClient, getAdminClientSafe } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/** 스폰서별 승인된 방문 인증 목록 (방문 인증 목록 섹션용) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sponsorId } = await params
    if (!sponsorId) return NextResponse.json({ error: 'Sponsor id required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const selectCols = 'id, user_id, photo_url, created_at, points_granted'
    let list: { id: string; user_id: string; photo_url: string; created_at: string; points_granted: number }[] = []

    const admin = getAdminClientSafe()
    if (admin) {
      const { data, error } = await admin
        .from('sponsor_visits')
        .select(selectCols)
        .eq('sponsor_id', sponsorId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(24)
      if (!error && data) list = data as typeof list
    }
    if (list.length === 0) {
      const { data } = await supabase
        .from('sponsor_visits')
        .select(selectCols)
        .eq('sponsor_id', sponsorId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(24)
      if (data) list = data as typeof list
    }

    const otherVisits = list.filter((v) => v.user_id !== user?.id)
    return NextResponse.json({ visits: otherVisits })
  } catch (e) {
    console.error('GET /api/sponsors/[id]/visits', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
