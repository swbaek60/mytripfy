import { redirect } from 'next/navigation'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/sign-in?redirect_url=/${locale}`)
}
