import { Users, ShieldCheck, Map, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Pillar {
  icon: LucideIcon
  title: string
  description: string
  accent: string
}

interface Props {
  pillars: Pillar[]
  title: string
  subtitle?: string
}

export default function ValuePropGrid({ pillars, title, subtitle }: Props) {
  return (
    <div>
      <div className="text-center mb-10 md:mb-14">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-heading tracking-tight">{title}</h2>
        {subtitle && <p className="text-subtle mt-3 max-w-xl mx-auto text-sm sm:text-base">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {pillars.map(p => (
          <div
            key={p.title}
            className="relative overflow-hidden rounded-2xl bg-surface border border-edge/60 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${p.accent}18` }}
            >
              <p.icon className="w-6 h-6" style={{ color: p.accent }} />
            </div>
            <h3 className="font-bold text-heading text-lg mb-2">{p.title}</h3>
            <p className="text-sm text-subtle leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const DEFAULT_PILLAR_ICONS = { Users, ShieldCheck, Map, Trophy }
