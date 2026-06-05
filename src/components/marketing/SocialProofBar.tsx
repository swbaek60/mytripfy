import { Users, Compass, Trophy, Globe } from 'lucide-react'

interface Props {
  postCount: number
  guideCount: number
  certCount: number
  countryCount: number
  labels: {
    companions: string
    guides: string
    certs: string
    countries: string
  }
  variant?: 'light' | 'dark'
}

export default function SocialProofBar({
  postCount,
  guideCount,
  certCount,
  countryCount,
  labels,
  variant = 'light',
}: Props) {
  const isDark = variant === 'dark'
  const items = [
    { icon: Users, value: postCount, label: labels.companions },
    { icon: Compass, value: guideCount, label: labels.guides },
    { icon: Trophy, value: certCount, label: labels.certs },
    { icon: Globe, value: countryCount, label: labels.countries },
  ]

  return (
    <div
      className={
        isDark
          ? 'border-y border-white/10 bg-midnight/95'
          : 'border-y border-edge/60 bg-surface'
      }
    >
      <div className="ds-container-wide py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={
                  isDark
                    ? 'w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center'
                    : 'w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center'
                }
              >
                <Icon className={isDark ? 'w-5 h-5 text-white' : 'w-5 h-5 text-brand'} />
              </div>
              <div>
                <div className={`text-xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-heading'}`}>
                  {value.toLocaleString()}+
                </div>
                <div className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-subtle'}`}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
