import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StoryCardProps {
  href: string
  imageUrl: string
  imageAlt?: string
  badge?: ReactNode
  overlay?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export default function StoryCard({
  href,
  imageUrl,
  imageAlt = '',
  badge,
  overlay,
  footer,
  className,
  children,
}: StoryCardProps) {
  return (
    <Link href={href} className={cn('ds-story-card block group', className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}
        {overlay && <div className="absolute top-3 right-3 z-10">{overlay}</div>}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">{children}</div>
      </div>
      {footer && (
        <div className="p-4 border-t border-edge/40 bg-surface">{footer}</div>
      )}
    </Link>
  )
}
