"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowDownIcon,
  ClipboardCheckIcon,
  FolderCheckIcon,
  PlayIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { EvidenceRail } from "@/components/claim-guide/evidence-rail"

const heroEvidence = [
  { label: "사례 선택", meta: "사실 확인", icon: ClipboardCheckIcon },
  { label: "근거 분석", meta: "약관 대조", icon: ScaleIcon },
  { label: "정보 확인", meta: "추가 질문", icon: ShieldCheckIcon },
  { label: "다음 행동", meta: "확인 목록", icon: FolderCheckIcon },
]

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) {
        return
      }

      const context = gsap.context(() => {
        const media = gsap.matchMedia()
        media.add(
          {
            motion: "(prefers-reduced-motion: no-preference)",
            reduced: "(prefers-reduced-motion: reduce)",
          },
          (conditions) => {
            if (conditions.conditions?.reduced) {
              gsap.set(
                [
                  ".hero-title-line",
                  ".hero-support",
                  ".hero-actions",
                  ".hero-rail",
                ],
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
                .to(`[data-evidence-node="${index}"] .evidence-icon-wrap`, {
                  scale: 1.07,
                  duration: 0.24,
                  ease: "power2.out",
                  yoyo: true,
                  repeat: 1,
                })
                .to({}, { duration: 0.42 })
            })
          },
        )
      }, sectionRef)

      cleanup = () => context.revert()
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  const scrollToDemo = () => {
    document.querySelector("#case-workspace")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  const scrollToWorkflow = () => {
    document.querySelector("#workflow")?.scrollIntoView({
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
          <Button variant="ghost" size="lg" onClick={scrollToWorkflow}>
            Agent 작동 방식
            <ArrowDownIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <div className="hero-rail">
        <div className="hero-rail-header">
          <strong>4단계 확인 여정</strong>
          <span>한 번에 한 단계씩</span>
        </div>
        <EvidenceRail items={heroEvidence} activeStep={activeStep} />
        <div className="hero-status" aria-live="polite">
          <span aria-hidden="true" />
          {heroEvidence[activeStep].label} 단계입니다
        </div>
      </div>
    </section>
  )
}
