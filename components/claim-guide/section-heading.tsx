import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function SectionHeading({
  title,
  description,
  aside,
  className,
}: {
  title: string
  description: string
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("section-heading", className)}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {aside}
    </div>
  )
}
