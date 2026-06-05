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

export default function TestimonialTabs({ title, items }: Props) {
  const [active, setActive] = useState(0)
  const current = items[active]

  if (!current) return null

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-heading mb-8">{title}</h2>
      <blockquote className="text-lg sm:text-xl md:text-2xl font-medium text-heading leading-relaxed mb-8 min-h-[4rem]">
        &ldquo;{current.quote}&rdquo;
      </blockquote>
      <p className="font-bold text-heading">
        {current.name}
        {current.age != null && <span className="text-subtle font-normal">, {current.age}</span>}
      </p>
      {current.location && <p className="text-sm text-hint mt-1">{current.location}</p>}
      <div className="flex justify-center gap-2 mt-8">
        {items.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              i === active ? 'bg-brand w-8' : 'bg-edge hover:bg-hint'
            )}
            aria-label={item.name}
          />
        ))}
      </div>
    </div>
  )
}
