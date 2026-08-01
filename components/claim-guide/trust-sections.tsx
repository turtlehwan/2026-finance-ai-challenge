"use client"

import { useEffect, useRef } from "react"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  XCircleIcon,
} from "lucide-react"

import { journeyPresentation } from "@/components/claim-guide/journey-presentation"
import { Separator } from "@/components/ui/separator"

const confirmable = [
  {
    title: "증권에 적힌 담보와 특약",
    detail: "증권·가입내역 문서에 그대로 쓰여 있는 사실",
  },
  {
    title: "이번 치료에 해당될 만한 담보",
    detail: "진단·치료 사실을 약관의 지급 조건과 맞춰 본 결과",
  },
  {
    title: "중도·만기보험금이 생겼을 시점",
    detail: "계약일에 약관의 경과기간을 더해 계산한 날짜",
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

const agentTasks = [
  "증권과 진단 기록에서 사실 뽑아내기",
  "가입일에 맞는 약관 버전 찾기",
  "정의·지급·면책 조항 이어 붙이기",
  "물어볼 것과 낼 서류 정리",
]

const humanTasks = [
  "빠진 사실 채우기",
  "근거로 든 조항이 맞는지 확인",
  "보험사에 청구 이력 조회",
  "청구서 제출",
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
                    { autoAlpha: 0, y: 22 },
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
      <section className="section-shell workflow-section" id="workflow">
        <div className="section-heading scroll-reveal">
          <div>
            <h2>조사는 Agent, 결정은 사람</h2>
            <p>
              화면에서 보신 네 단계가 실제 순서입니다. 각 단계가 무엇을 확인하는지
              적어 두었습니다.
            </p>
          </div>
        </div>
        <ol className="workflow-line">
          {journeyPresentation.map((step, index) => (
            <li className="workflow-step scroll-reveal" key={step.label}>
              <span className="workflow-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-shell trust-section" id="trust">
        <div className="section-heading scroll-reveal">
          <div>
            <h2>알 수 있는 것, 알 수 없는 것</h2>
            <p>
              보험사 전산에 들어가지 않고는 알 수 없는 것이 있습니다. 그 경계를
              화면 어디서나 같게 지킵니다.
            </p>
          </div>
        </div>

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

      <section className="section-shell handoff-section scroll-reveal">
        <div className="handoff-copy">
          <h2>청구는 공식 채널에서</h2>
          <p>
            여기서 정리한 내용을 들고 아래로 가시면 됩니다. 조회와 청구는 원래
            무료이고, 저희를 거치지 않아도 됩니다.
          </p>
          <div className="official-links">
            <span className="official-links-label">공식 조회 창구</span>
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
        <div className="handoff-grid">
          <div className="handoff-tasks">
            <div>
              <strong>여기서 준비하는 것</strong>
              <ul>
                {agentTasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>직접 하셔야 하는 것</strong>
              <ul>
                {humanTasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {policyOps}
    </div>
  )
}
