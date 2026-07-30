"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function ClaimGuideProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={160}>
      {children}
      <Toaster position="bottom-center" richColors closeButton />
    </TooltipProvider>
  )
}
