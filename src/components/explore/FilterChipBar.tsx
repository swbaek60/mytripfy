'use client'

import { cn } from '@/lib/utils'

export interface FilterChip {
  id: string
  label: string
}

interface FilterChipBarProps {
  chips: FilterChip[]
  activeId?: string | null
  onSelect: (id: string | null) => void
  allLabel?: string
  className?: string
}

export default function FilterChipBar({
  chips,
  activeId,
  onSelect,
  allLabel = 'All',
  className,
}: FilterChipBarProps) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)} style={{ scrollbarWidth: 'thin' }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors',
          activeId == null
            ? 'bg-brand text-white shadow-sm'
            : 'bg-surface border border-edge text-body hover:bg-surface-hover'
        )}
      >
        {allLabel}
      </button>
      {chips.map(chip => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onSelect(chip.id === activeId ? null : chip.id)}
          className={cn(
            'shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors',
            activeId === chip.id
              ? 'bg-brand text-white shadow-sm'
              : 'bg-surface border border-edge text-body hover:bg-surface-hover'
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
