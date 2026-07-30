"use client"

import type { CSSProperties } from "react"
import type { LucideIcon } from "lucide-react"
import {
  CalendarDaysIcon,
  CircleSlash2Icon,
  FileTextIcon,
  RouteIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
} from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
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
  icon?: LucideIcon
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
  const className = cn(
    "evidence-rail",
    compact && "evidence-rail-compact",
  )
  const style = {
    "--evidence-count": items.length,
    "--evidence-edge": `${100 / Math.max(items.length * 2, 1)}%`,
  } as CSSProperties

  const content = (
    <>
      <div className="evidence-line" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      {items.map((item, index) => {
        const Icon = item.icon ?? evidenceIcons[index] ?? FileTextIcon
        const isActive = index === activeStep
        const isComplete = index < activeStep
        const itemClassName = cn(
          "evidence-node",
          isActive && "is-active",
          isComplete && "is-complete",
          item.warning && "is-warning",
        )
        const itemContent = (
          <>
            <span className="evidence-icon-wrap" aria-hidden="true">
              <Icon />
            </span>
            <strong>{item.label}</strong>
            {item.meta ? <span>{item.meta}</span> : null}
          </>
        )

        return onSelect ? (
          <ToggleGroupItem
            value={String(index)}
            className={itemClassName}
            data-evidence-node={index}
            aria-label={`${item.label}${item.meta ? `: ${item.meta}` : ""}`}
            key={`${item.label}-${item.meta ?? index}`}
          >
            {itemContent}
          </ToggleGroupItem>
        ) : (
          <div
            className={itemClassName}
            data-evidence-node={index}
            key={`${item.label}-${item.meta ?? index}`}
          >
            {itemContent}
          </div>
        )
      })}
    </>
  )

  return onSelect ? (
    <ToggleGroup
      type="single"
      value={String(activeStep)}
      className={className}
      aria-label="근거 경로"
      style={style}
      onValueChange={(value) => {
        if (value) {
          onSelect(Number(value))
        }
      }}
    >
      {content}
    </ToggleGroup>
  ) : (
    <div
      className={className}
      role="group"
      aria-label="근거 경로"
      style={style}
    >
      {content}
    </div>
  )
}
