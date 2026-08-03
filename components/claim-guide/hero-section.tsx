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
          <span className="hero-title-line">부모님 증권에서</span>
          <span className="hero-title-line">빠뜨린 담보가 있는지,</span>
          <span className="hero-title-line">
            <em>가입 시점 약관</em>으로
          </span>
          <span className="hero-title-line">확인하세요</span>
        </h1>
        <p className="hero-support">
          증권과 진단 기록을 넣으면 해당될 만한 담보를 찾고, 그 판단의 근거가 된
          약관 조항과 쪽수를 함께 보여 드립니다. 지급 여부를 정하는 것은
          보험회사입니다.
        </p>
        <div className="hero-actions">
          <Button size="lg" onClick={scrollToDemo}>
            <PlayIcon data-icon="inline-start" />
            샘플 사례로 먼저 보기
          </Button>
          <Button variant="ghost" size="lg" onClick={scrollToWorkflow}>
            작동 방식 보기
            <ArrowDownIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
      <div className="hero-visual">
        <Image
          className="hero-photo"
          src="/family-policy-review-v4.webp"
          alt="태블릿의 약관 문서와 보험 서류를 함께 확인하는 어머니와 청년 자녀"
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
