"use client"

import { ShieldCheckIcon } from "lucide-react"

import { AgentDemo } from "@/components/claim-guide/agent-demo"
import { HeroSection } from "@/components/claim-guide/hero-section"
import { PolicyOpsSection } from "@/components/claim-guide/policy-ops-section"
import { SiteHeader } from "@/components/claim-guide/site-header"
import { TrustSections } from "@/components/claim-guide/trust-sections"
import { useLargeText } from "@/hooks/use-large-text"

export default function ClaimGuideApp() {
  const { largeText, setLargeText } = useLargeText()

  return (
    <div className="site-frame">
      <SiteHeader
        largeText={largeText}
        onTextSizeChange={setLargeText}
      />
      <main>
        <HeroSection />
        <AgentDemo />
        <TrustSections policyOps={<PolicyOpsSection />} />
      </main>
      <footer className="site-footer">
        <a className="footer-brand" href="#top">
          <ShieldCheckIcon aria-hidden="true" />
          <span>보험금 길잡이 Agent</span>
        </a>
        <p>
          2026 금융 AI Challenge 출품용 합성데이터 MVP · 최종 지급 여부는
          보험회사가 결정합니다.
        </p>
        <a
          href="https://daker.ai/public/hackathons/2026-finance-ai-challenge"
          target="_blank"
          rel="noreferrer"
        >
          대회 안내
        </a>
      </footer>
    </div>
  )
}
