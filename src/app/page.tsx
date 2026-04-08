import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

/** http://localhost:3000/ → 기본 로케일 홈 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`)
}
