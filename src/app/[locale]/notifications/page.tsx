import { createClient, getAuthUser } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import NotificationsList from './NotificationsList'
import { getTranslations } from 'next-intl/server'

export default async function NotificationsPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Notifications' })
  const supabase = await createClient()
  const authUser = await getAuthUser()
  const user = authUser ? { id: authUser.profileId, email: authUser.email } : null
  if (!user) redirect(`/sign-in`)

  // 메시지 타입 제외 (메시지는 💬 버튼에서 따로 관리)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .neq('type', 'message')
    .order('created_at', { ascending: false })
    .limit(50)

  // 메시지 제외 알림만 읽음 처리
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .neq('type', 'message')
    .eq('is_read', false)

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Header user={user} locale={locale} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-heading mb-6">{t('title')}</h1>
        <NotificationsList notifications={notifications ?? []} locale={locale} />
      </main>
    </div>
  )
}
