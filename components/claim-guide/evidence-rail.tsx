"use client"

import type { LucideIcon } from "lucide-react"
import {
  CalendarDaysIcon,
  CircleSlash2Icon,
  FileTextIcon,
  RouteIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const evidenceIcons: LucideIcon[] = [
  CalendarDaysIcon,
  StethoscopeIcon,
  ShieldCheckIcon,
  FileTextIcon,
  CircleSlash2Icon,
  RouteIcon,
]

export type EvidenceRailItem = {
  label: string
  meta?: string
  warning?: boolean
}

export function EvidenceRail({
  items,
  activeStep = 0,
  onSelect,
  compact = false,
}: {
  items: EvidenceRailItem[]
  activeStep?: number
  onSelect?: (index: number) => void
  compact?: boolean
}) {
  const progress = items.length > 1 ? activeStep / (items.length - 1) : 0

  return (
    <div
      className={cn("evidence-rail", compact && "evidence-rail-compact")}
      role="group"
      aria-label="근거 경로"
    >
      <div className="evidence-line" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      {items.map((item, index) => {
        const Icon = evidenceIcons[index] ?? FileTextIcon
        const isActive = index === activeStep
        const isComplete = index < activeStep
        const content = (
          <>
            <span className="evidence-icon-wrap" aria-hidden="true">
              <Icon />
            </span>
            <strong>{item.label}</strong>
            {item.meta ? <span>{item.meta}</span> : null}
          </>
        )

        return onSelect ? (
          <button
            type="button"
            className={cn(
              "evidence-node",
              isActive && "is-active",
              isComplete && "is-complete",
              item.warning && "is-warning",
            )}
            data-evidence-node={index}
            aria-pressed={isActive}
            key={`${item.label}-${item.meta ?? index}`}
            onClick={() => onSelect(index)}
          >
            {content}
          </button>
        ) : (
          <div
            className={cn(
              "evidence-node",
              isActive && "is-active",
              isComplete && "is-complete",
              item.warning && "is-warning",
            )}
            data-evidence-node={index}
            key={`${item.label}-${item.meta ?? index}`}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
