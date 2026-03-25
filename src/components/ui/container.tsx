import * as React from "react"
import { cn } from "@/lib/utils"

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("ds-container", className)}
      {...props}
    />
  )
}

function ContainerWide({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("ds-container-wide", className)}
      {...props}
    />
  )
}

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="section"
      className={cn("ds-section", className)}
      {...props}
    />
  )
}

export { Container, ContainerWide, Section }
