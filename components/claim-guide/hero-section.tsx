"use client"

import { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowDownIcon, PlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EvidenceRail } from "@/components/claim-guide/evidence-rail"

const heroEvidence = [
  { label: "사건", meta: "손목 골절" },
  { label: "진단", meta: "S52 진단군" },
  { label: "담보", meta: "골절진단비" },
  { label: "지급사유", meta: "제12조" },
  { label: "면책", meta: "제14조" },
  { label: "다음 행동", meta: "확인 권장" },
]

gsap.registerPlugin(useGSAP)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useGSAP(
    () => {
      const media = gsap.matchMedia()

      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            gsap.set(
              [".hero-title-line", ".hero-support", ".hero-actions", ".hero-rail"],
              { clearProps: "all" },
            )
            return
          }

          const intro = gsap.timeline({
            defaults: { duration: 0.72, ease: "power3.out" },
          })

          intro
            .from(".hero-title-line", {
              autoAlpha: 0,
              y: 28,
              stagger: 0.1,
            })
            .from(".hero-support", { autoAlpha: 0, y: 18 }, "-=0.42")
            .from(".hero-actions", { autoAlpha: 0, y: 14 }, "-=0.5")
            .from(
              ".hero-rail",
              { autoAlpha: 0, y: 22, scale: 0.985 },
              "-=0.52",
            )

          const rail = gsap.timeline({
            repeat: -1,
            repeatDelay: 0.5,
          })
          heroEvidence.forEach((_, index) => {
            rail
              .call(() => setActiveStep(index))
              .to(
                `[data-evidence-node="${index}"] .evidence-icon-wrap`,
                {
                  scale: 1.07,
                  duration: 0.24,
                  ease: "power2.out",
                  yoyo: true,
                  repeat: 1,
                },
              )
              .to({}, { duration: 0.42 })
          })
        },
      )

      return () => media.revert()
    },
    { scope: sectionRef },
  )

  const scrollToDemo = () => {
    document.querySelector("#demo")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  return (
    <section className="hero-section" id="top" ref={sectionRef}>
      <div className="hero-copy">
        <h1>
          <span className="hero-title-line">부모님의 보험,</span>
          <span className="hero-title-line">놓친 항목이 없도록</span>
          <span className="hero-title-line">
            <em>Agent</em>가 함께 확인합니다
          </span>
        </h1>
        <p className="hero-support">
          증권과 치료 정보를 연결해 확인할 담보, 약관 근거, 다음 행동을 한
          흐름으로 정리합니다.
        </p>
        <div className="hero-actions">
          <Button size="lg" onClick={scrollToDemo}>
            <PlayIcon data-icon="inline-start" />
            합성 사례로 시작하기
          </Button>
          <Button variant="ghost" size="lg" onClick={scrollToDemo}>
            분석 과정 보기
            <ArrowDownIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <div className="hero-rail">
        <div className="hero-rail-header">
          <strong>근거 경로</strong>
          <span>Agent가 확인 중인 단계</span>
        </div>
        <EvidenceRail items={heroEvidence} activeStep={activeStep} />
        <div className="hero-status" aria-live="polite">
          <span aria-hidden="true" />
          {heroEvidence[activeStep].label} 정보를 확인하고 있습니다
        </div>
      </div>
    </section>
  )
}
