import { Users } from 'lucide-react'

interface Props {
  count: number
  label?: string
}

export default function ApplicantPreview({ count, label }: Props) {
  return (
    <div className="flex items-center gap-1.5 shrink-0 text-xs text-subtle">
      <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center">
        <Users className="w-3.5 h-3.5 text-brand" />
      </div>
      <span className="font-semibold text-heading tabular-nums">{count}</span>
      {label && <span className="hidden sm:inline text-hint">{label}</span>}
    </div>
  )
}
