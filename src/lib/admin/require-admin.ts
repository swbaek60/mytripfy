import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const ADMIN_EMAIL = 'swbaek60@gmail.com'

export async function requireAdmin(locale: string, returnPath = `/${locale}/admin`) {
  const user = await currentUser()
  if (!user) redirect(`/${locale}/login?returnTo=${encodeURIComponent(returnPath)}`)

  const email = user.emailAddresses?.[0]?.emailAddress ?? ''
  if (email !== ADMIN_EMAIL) redirect(`/${locale}`)

  return { user, email }
}
