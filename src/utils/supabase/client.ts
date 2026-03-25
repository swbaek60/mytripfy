import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'

/**
 * 클라이언트 사이드용 Supabase 클라이언트.
 * React 훅 컨텍스트 밖에서 호출할 때는 clerkToken을 직접 전달하세요.
 */
export function createClient(clerkToken?: string | null) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    clerkToken
      ? { global: { headers: { Authorization: `Bearer ${clerkToken}` } } }
      : undefined
  )
}

/**
 * React 클라이언트 컴포넌트에서 Clerk 토큰과 함께 Supabase 클라이언트를 사용하는 훅.
 * 사용 예: const supabase = useSupabaseClient()
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()

  const getClient = async () => {
    const token = await getToken({ template: 'supabase' })
    return createClient(token)
  }

  return { getClient }
}
