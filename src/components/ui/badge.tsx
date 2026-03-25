import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface-sunken text-subtle px-2 py-0.5",
        brand: "bg-brand-light text-brand px-2 py-0.5",
        success: "bg-success-light text-success px-2 py-0.5",
        warning: "bg-warning-light text-warning px-2 py-0.5",
        danger: "bg-danger-light text-danger px-2 py-0.5",
        info: "bg-info-light text-info px-2 py-0.5",
        amber: "bg-amber-light text-amber px-2 py-0.5",
        purple: "bg-purple-light text-purple px-2 py-0.5",
        outline: "border border-edge text-subtle px-2 py-0.5",
      },
      size: {
        default: "text-xs px-2 py-0.5",
        sm: "text-[10px] px-1.5 py-px",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
