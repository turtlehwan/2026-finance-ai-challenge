"use client"

import { useEffect, useRef } from "react"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  XCircleIcon,
} from "lucide-react"

import { SectionHeading } from "@/components/claim-guide/section-heading"
import { Separator } from "@/components/ui/separator"

const confirmable = [
  {
    title: "보험증권에 적힌 보장 내용과 특약",
    detail: "보험증권에 기재된 계약·보장 사실",
  },
  {
    title: "이번 치료에 해당할 수 있는 보장 항목",
    detail: "진단·치료 사실과 보험약관의 지급 조건을 대조한 결과",
  },
  {
    title: "가입 당시 적용된 보험약관 버전",
    detail: "상품코드·계약일과 공식 판매기간을 대조한 결과",
  },
]

const notConfirmable = [
  {
    title: "이미 청구한 건인지",
    detail: "보험사 전산의 청구 이력을 봐야 알 수 있습니다",
  },
  {
    title: "받게 될 금액",
    detail: "보험사 지급 심사를 거쳐야 정해집니다",
  },
  {
    title: "지급이 될지 안 될지",
    detail: "판단 권한이 보험회사에 있습니다",
  },
]

export function TrustSections({ policyOps }: { policyOps: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        if (cancelled) {
          return
        }
        gsap.registerPlugin(ScrollTrigger)
        const context = gsap.context(() => {
          const media = gsap.matchMedia()
          media.add(
            {
              motion: "(prefers-reduced-motion: no-preference)",
              reduced: "(prefers-reduced-motion: reduce)",
            },
            (conditions) => {
              if (conditions.conditions?.reduced) {
                return
              }

              ScrollTrigger.batch(".scroll-reveal", {
                start: "top 84%",
                once: true,
                onEnter: (elements) => {
                  gsap.fromTo(
                    elements,
                    { autoAlpha: 0, y: 8 },
                    {
                      autoAlpha: 1,
                      y: 0,
                      duration: 0.62,
                      stagger: 0.08,
                      ease: "power2.out",
                      clearProps: "transform,opacity,visibility",
                    },
                  )
                },
              })
            },
          )
        }, rootRef)

        cleanup = () => context.revert()
      },
    )

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <div ref={rootRef}>
      <section className="section-shell handoff-section scroll-reveal" id="official-channels">
        <div className="handoff-copy">
          <h2>정리한 내용을 공식 채널에서 확인하세요</h2>
          <p>
            공식 조회와 청구는 무료입니다. 여기서 정리한 근거와 질문을 챙긴 뒤
            공식 창구에서 직접 확인하거나 청구하세요.
          </p>
          <div className="official-links">
            <span className="official-links-label">공식 조회·청구 창구</span>
            <a
              href="https://cont.insure.or.kr/"
              target="_blank"
              rel="noreferrer"
            >
              <strong>내보험찾아줌</strong>
              <span>생명·손해보험협회 · 가입 내역 통합 조회</span>
              <ExternalLinkIcon aria-hidden="true" />
            </a>
            <a
              href="https://www.silson24.or.kr/claim/web/"
              target="_blank"
              rel="noreferrer"
            >
              <strong>실손24</strong>
              <span>실손의료보험 청구</span>
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="section-shell trust-section" id="trust">
        <SectionHeading
          className="scroll-reveal"
          title="알 수 있는 것, 알 수 없는 것"
          description="보험사 전산에 들어가지 않고는 알 수 없는 것이 있습니다. 화면 전체에서 같은 기준으로 선을 긋습니다."
        />

        <div className="trust-ledger scroll-reveal">
          <div className="ledger-column is-confirmable">
            <div className="ledger-heading">
              <CheckCircle2Icon aria-hidden="true" />
              <strong>여기서 확인됩니다</strong>
            </div>
            {confirmable.map((item) => (
              <div className="ledger-row" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>

          <Separator orientation="vertical" className="ledger-separator" />

          <div className="ledger-column is-blocked">
            <div className="ledger-heading">
              <XCircleIcon aria-hidden="true" />
              <strong>여기서는 알 수 없습니다</strong>
            </div>
            {notConfirmable.map((item) => (
              <div className="ledger-row" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="trust-boundary scroll-reveal">
          보험금 액수를 확정하거나, 청구를 대신하거나, 손해사정을 하거나, 상품을
          권하지 않습니다. 최종 지급 여부는 보험회사가 정합니다.
        </p>
      </section>

      {policyOps}
    </div>
  )
}
