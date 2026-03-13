import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// DELETE /api/notifications?id=xxx        → 개별 삭제
// DELETE /api/notifications?all=true      → 전체 삭제
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    if (all === 'true') {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .neq('type', 'message')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else if (id) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'id or all=true required' }, { status: 400 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('notifications DELETE error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
