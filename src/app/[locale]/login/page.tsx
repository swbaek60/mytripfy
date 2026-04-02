import { redirect } from 'next/navigation'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  const returnTo = sp.returnTo || `/${locale}`
  redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`)
}
