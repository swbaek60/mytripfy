import { redirect } from 'next/navigation'

/**
 * Fallback if middleware miss — middleware handles cookie + redirect primarily.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>
}) {
  const { locale } = await params
  redirect(`/sign-up?redirect_url=${encodeURIComponent(`/${locale}`)}`)
}
