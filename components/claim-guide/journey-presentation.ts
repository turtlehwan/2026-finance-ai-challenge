import type { LucideIcon } from "lucide-react"
import {
  ClipboardCheckIcon,
  FolderCheckIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { JOURNEY_STEPS } from "@/lib/claim-guide/presentation"

const journeyIcons: LucideIcon[] = [
  ClipboardCheckIcon,
  ScaleIcon,
  ShieldCheckIcon,
  FolderCheckIcon,
]

export const journeyPresentation = JOURNEY_STEPS.map((step, index) => ({
  ...step,
  icon: journeyIcons[index],
}))
