'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaqItem {
  question: string
  answer: string
}

interface Props {
  title: string
  items: FaqItem[]
}

export default function FaqAccordion({ title, items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-heading text-center mb-8">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={item.question} className="rounded-2xl border border-edge/60 bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-sunken/50 transition-colors"
              >
                <span className="font-semibold text-heading text-sm sm:text-base">{item.question}</span>
                <ChevronDown
                  className={cn('w-5 h-5 text-hint shrink-0 transition-transform', isOpen && 'rotate-180')}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-sm text-subtle leading-relaxed border-t border-edge/40 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
