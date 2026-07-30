"use client"

import { useEffect, useRef } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRightIcon,
  BanknoteXIcon,
  BookOpenCheckIcon,
  BotIcon,
  CalendarSearchIcon,
  CheckCircle2Icon,
  DatabaseZapIcon,
  ExternalLinkIcon,
  FileScanIcon,
  FileStackIcon,
  LandmarkIcon,
  ListChecksIcon,
  MessageCircleQuestionIcon,
  RouteIcon,
  ScaleIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserCheckIcon,
  UserRoundIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const workflowSteps: { label: string; detail: string; icon: LucideIcon }[] = [
  {
    label: "사례 선택",
    detail: "보험사건과 증권·치료 사실을 확인",
    icon: FileScanIcon,
  },
  {
    label: "근거 분석",
    detail: "가입 시점 약관과 면책을 함께 검토",
    icon: ScaleIcon,
  },
  {
    label: "정보 확인",
    detail: "빠진 사실을 한 가지씩 질문",
    icon: MessageCircleQuestionIcon,
  },
  {
    label: "다음 행동",
    detail: "서류·질문·공식 경로를 준비",
    icon: RouteIcon,
  },
]

const confirmable = [
  {
    title: "증권상 담보·특약",
    detail: "증권과 가입내역에 기재된 사실",
    icon: FileStackIcon,
  },
  {
    title: "치료 상황 대응 담보 후보",
    detail: "진단·치료 사실과 약관 조건의 연결",
    icon: StethoscopeIcon,
  },
  {
    title: "중도·만기보험금 발생 추정 시점",
    detail: "계약일과 약관 경과기간의 역산",
    icon: CalendarSearchIcon,
  },
]

const notConfirmable = [
  {
    title: "이미 청구했는지",
    detail: "보험사 내부 청구 이력이 필요",
    icon: DatabaseZapIcon,
  },
  {
    title: "확정된 숨은 보험금 금액",
    detail: "보험사의 지급 심사 전에는 확정 불가",
    icon: BanknoteXIcon,
  },
  {
    title: "최종 지급 여부",
    detail: "최종 결정 권한은 보험회사에 있음",
    icon: UserCheckIcon,
  },
]

const agentTasks = [
  "증권·치료 사실 구조화",
  "가입 시점 약관 선택",
  "정의·지급·면책 근거 연결",
  "필요 서류와 질문 준비",
]

const humanTasks = [
  "빠진 사실 확인",
  "Agent 근거 검토",
  "보험사 공식 채널 조회",
  "최종 청구 실행",
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
            <h2>Agent는 조사하고, 사람은 결정합니다</h2>
            <p>화면에서 본 네 단계를 그대로 따라 사실과 근거를 완성합니다.</p>
          </div>
        </div>
        <div className="workflow-line">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div className="workflow-step scroll-reveal" key={step.label}>
                <span aria-hidden="true">
                  <Icon />
                </span>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
                <Badge variant="outline">{index + 1}</Badge>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section-shell trust-section" id="trust">
        <div className="section-heading scroll-reveal">
          <div>
            <h2>알 수 있는 것과 없는 것</h2>
            <p>
              금융 서비스의 신뢰는 답변의 범위보다 한계를 분명히 밝히는 데서
              시작합니다.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="투명성 원칙 설명"
              >
                <BookOpenCheckIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              화면 전반에서 동일한 역할 경계를 유지합니다
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="trust-ledger scroll-reveal">
          <div className="ledger-column is-confirmable">
            <div className="ledger-heading">
              <CheckCircle2Icon aria-hidden="true" />
              <strong>확인 가능</strong>
            </div>
            {confirmable.map((item) => {
              const Icon = item.icon
              return (
                <div className="ledger-row" key={item.title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator orientation="vertical" className="ledger-separator" />

          <div className="ledger-column is-blocked">
            <div className="ledger-heading">
              <WalletCardsIcon aria-hidden="true" />
              <strong>확정 불가</strong>
            </div>
            {notConfirmable.map((item) => {
              const Icon = item.icon
              return (
                <div className="ledger-row" key={item.title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Alert className="scroll-reveal trust-alert">
          <ShieldCheckIcon />
          <AlertTitle>역할 경계</AlertTitle>
          <AlertDescription>
            보험금 액수 확정·청구 대행·손해사정·상품 권유를 하지 않습니다. 최종
            지급 여부는 보험회사가 결정합니다.
          </AlertDescription>
        </Alert>
      </section>

      <section className="handoff-section scroll-reveal">
        <div className="handoff-copy">
          <h2>실제 실행은 공식 채널에서</h2>
          <p>
            Agent가 조사·비교·검증·준비하고, 사람은 공식 채널에서 확인하고
            실행합니다.
          </p>
        </div>
        <div className="handoff-grid">
          <div className="handoff-tasks">
            <div>
              <span aria-hidden="true">
                <BotIcon />
              </span>
              <strong>Agent가 하는 일</strong>
              <ul>
                {agentTasks.map((task) => (
                  <li key={task}>
                    <ListChecksIcon aria-hidden="true" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
            <ArrowRightIcon className="handoff-arrow" aria-hidden="true" />
            <div>
              <span aria-hidden="true">
                <UserRoundIcon />
              </span>
              <strong>사람이 하는 일</strong>
              <ul>
                {humanTasks.map((task) => (
                  <li key={task}>
                    <CheckCircle2Icon aria-hidden="true" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="official-links">
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://cont.insure.or.kr/"
                target="_blank"
                rel="noreferrer"
              >
                <LandmarkIcon data-icon="inline-start" />
                내보험찾아줌
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://www.silson24.or.kr/claim/web/"
                target="_blank"
                rel="noreferrer"
              >
                <ShieldCheckIcon data-icon="inline-start" />
                실손24
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {policyOps}
    </div>
  )
}
