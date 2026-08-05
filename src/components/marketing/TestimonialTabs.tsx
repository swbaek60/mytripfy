'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Testimonial {
  name: string
  age?: number
  quote: string
  location?: string
}

interface Props {
  title: string
  items: Testimonial[]
}

const AVATAR_COLORS = [
  'bg-brand text-white',
  'bg-gold text-heading',
  'bg-teal-strong text-white',
  'bg-purple text-white',
  'bg-challenge text-white',
]

export default function TestimonialTabs({ title, items }: Props) {
  const [active, setActive] = useState(0)
  const current = items[active]

  if (!current) return null

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-heading mb-8">{title}</h2>
      <blockquote className="text-lg sm:text-xl md:text-2xl font-medium text-heading leading-relaxed mb-6 min-h-[5rem] px-4">
        &ldquo;{current.quote}&rdquo;
      </blockquote>
      <p className="font-bold text-heading">
        {current.name}
        {current.age != null && <span className="text-subtle font-normal">, {current.age}</span>}
      </p>
      {current.location && <p className="text-sm text-hint mt-1">{current.location}</p>}

      {/* Avatar navigation */}
      <div className="flex justify-center gap-3 mt-8">
        {items.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ring-2',
              i === active
                ? `${AVATAR_COLORS[i % AVATAR_COLORS.length]} ring-offset-2 ring-brand scale-110 shadow-md`
                : 'bg-surface-sunken text-hint ring-edge/40 hover:ring-brand/40 hover:scale-105'
            )}
            aria-label={item.name}
            title={item.name}
          >
            {item.name.charAt(0)}
          </button>
        ))}
      </div>
    </div>
  )
}
