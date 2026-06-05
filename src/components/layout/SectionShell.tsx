import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'light' | 'warm' | 'dark' | 'sunken'

interface SectionShellProps {
  variant?: Variant
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  fullBleed?: boolean
  id?: string
}

const variantClasses: Record<Variant, string> = {
  light: 'bg-surface text-heading',
  warm: 'bg-surface-warm text-heading',
  dark: 'bg-midnight text-white',
  sunken: 'bg-surface-sunken text-heading',
}

export default function SectionShell({
  variant = 'light',
  title,
  subtitle,
  action,
  children,
  className,
  fullBleed = false,
  id,
}: SectionShellProps) {
  const isDark = variant === 'dark'

  return (
    <section id={id} className={cn('ds-section-v2', variantClasses[variant], className)}>
      <div className={cn(!fullBleed && 'ds-container-wide')}>
        {(title || action) && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              {title && (
                <h2
                  className={cn(
                    'text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight',
                    isDark ? 'text-white' : 'text-heading'
                  )}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={cn('text-sm sm:text-base mt-2 max-w-2xl', isDark ? 'text-white/70' : 'text-subtle')}>
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
