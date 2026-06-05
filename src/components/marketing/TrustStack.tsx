import { ShieldCheck, MessageCircle, Scale, BadgeCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface TrustItem {
  icon: LucideIcon
  title: string
  description: string
}

interface Props {
  title: string
  items: TrustItem[]
}

export default function TrustStack({ title, items }: Props) {
  return (
    <div className="text-center">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-10 md:mb-12">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(item => (
          <div
            key={item.title}
            className="rounded-2xl bg-white/5 border border-white/10 p-6 text-left hover:bg-white/8 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-trust/20 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5 text-teal-trust" />
            </div>
            <h3 className="font-bold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const TRUST_ICONS = { ShieldCheck, MessageCircle, Scale, BadgeCheck }
