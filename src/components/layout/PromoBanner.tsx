import Link from 'next/link'

interface Props {
  locale: string
  message: string
  ctaLabel: string
  ctaHref: string
  dismissible?: boolean
}

export default function PromoBanner({ locale, message, ctaLabel, ctaHref }: Props) {
  return (
    <div className="bg-sunset text-white text-center text-sm py-2.5 px-4 relative">
      <span className="font-medium">{message}</span>
      {' '}
      <Link href={`/${locale}${ctaHref}`} className="underline underline-offset-2 font-bold hover:text-white/90">
        {ctaLabel}
      </Link>
    </div>
  )
}
