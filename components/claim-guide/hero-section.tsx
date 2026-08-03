"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowDownIcon, PlayIcon } from "lucide-react"

import { journeyPresentation } from "@/components/claim-guide/journey-presentation"
import { Button } from "@/components/ui/button"
import { EvidenceRail } from "@/components/claim-guide/evidence-rail"

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
                  ".hero-visual",
                  ".hero-photo",
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
                ".hero-visual",
                { autoAlpha: 0, y: 22, scale: 0.985 },
                "-=0.52",
              )
              .from(
                ".hero-photo",
                { scale: 1.035, duration: 1.35, ease: "power2.out" },
                "-=0.72",
              )

            const rail = gsap.timeline()
            journeyPresentation.forEach((_, index) => {
              rail
                .call(() => setActiveStep(index))
                .to(`[data-evidence-node="${index}"] .evidence-icon-wrap`, {
                  scale: 1.07,
                  duration: 0.24,
                  ease: "power2.out",
                  yoyo: true,
                  repeat: 1,
                })
                .to({}, { duration: 0.58 })
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
          <span className="hero-title-line">부모님 보험의 보장 내용을</span>
          <span className="hero-title-line">
            <em>가입 당시 약관</em> 기준으로
          </span>
          <span className="hero-title-line">확인할 항목부터</span>
          <span className="hero-title-line">정리해 드립니다</span>
        </h1>
        <p className="hero-support">
          보험증권과 진단 기록을 바탕으로 확인해 볼 보장 항목을 정리하고, 가입
          당시 적용된 보험약관의 근거 조항과 쪽수를 함께 보여 드립니다. 최종 지급
          여부는 보험회사가 판단합니다.
        </p>
        <div className="hero-actions">
          <Button size="lg" onClick={scrollToDemo}>
            <PlayIcon data-icon="inline-start" />
            준비된 사례로 확인하기
          </Button>
          <Button variant="ghost" size="lg" onClick={scrollToWorkflow}>
            확인 절차 보기
            <ArrowDownIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <div className="hero-visual">
        <Image
          className="hero-photo"
          src="/family-policy-review-v4.webp"
          alt="태블릿에서 보험약관과 보험증권을 함께 확인하는 어머니와 청년 자녀"
          width={1536}
          height={1024}
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
        <div className="hero-rail">
          <div className="hero-rail-header">
            <strong>확인 순서</strong>
            <span>네 단계</span>
          </div>
          <EvidenceRail items={journeyPresentation} activeStep={activeStep} />
          <div className="hero-status" aria-live="polite">
            <span aria-hidden="true" />
            {journeyPresentation[activeStep].label} 단계입니다
          </div>
        </div>
      </div>
    </section>
  )
}
