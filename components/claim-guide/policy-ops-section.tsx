"use client"

import { useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { LucideIcon } from "lucide-react"
import {
  BarChart3Icon,
  CheckCircle2Icon,
  FileSearchIcon,
  GitCompareArrowsIcon,
  InfoIcon,
  NetworkIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { policyOpsSteps } from "@/lib/claim-guide/cases"
import { cn } from "@/lib/utils"

type DiffMode = "payment" | "exclusion"

type DiffRow = {
  clause: string
  before: string
  after: string
  change: "added" | "changed" | "removed"
}

const stepIcons: LucideIcon[] = [
  FileSearchIcon,
  GitCompareArrowsIcon,
  NetworkIcon,
  BarChart3Icon,
  UserRoundCheckIcon,
]

const diffRows: Record<DiffMode, DiffRow[]> = {
  payment: [
    {
      clause: "제7조 · 입원의 정의",
      before: "의사의 직접 치료를 목적으로 입원한 경우",
      after: "의사의 입원 필요 소견에 따라 72시간 이상 입원한 경우",
      change: "changed",
    },
    {
      clause: "제12조 · 골절진단비",
      before: "약관상 골절 진단 시 1회 지급",
      after: "골절분류표 해당 및 진단 확정 시 사고당 1회 지급",
      change: "changed",
    },
    {
      clause: "제18조 · 제출 서류",
      before: "진단서",
      after: "진단서와 질병분류코드 확인 서류",
      change: "added",
    },
  ],
  exclusion: [
    {
      clause: "제14조 · 지급하지 않는 사유",
      before: "정신질환으로 인한 후유장해는 보상하지 않음",
      after: "상해장해분류표 기준을 충족한 정신질환 후유장해는 보상",
      change: "changed",
    },
    {
      clause: "제15조 · 고의 사고",
      before: "피보험자의 고의 사고",
      after: "피보험자의 고의 사고. 단, 심신상실 상태는 별도 심사",
      change: "added",
    },
    {
      clause: "별표 1 · 제외 목록",
      before: "기존 12개 항목",
      after: "개정 10개 항목",
      change: "removed",
    },
  ],
}

const reviewChecklist = [
  "변경 요약과 영향 범위 확인",
  "근거 그래프 연결 일관성 확인",
  "회귀 평가 24/24 통과",
  "운영 검색 결과 자동 변경 없음",
]

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function PolicyOpsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [mode, setMode] = useState<DiffMode>("payment")
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const rows = useMemo(() => diffRows[mode], [mode])

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
            return
          }

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 72%",
              toggleActions: "play none none reverse",
            },
            defaults: { duration: 0.55, ease: "power2.out" },
          })

          timeline
            .from(".policy-heading", { autoAlpha: 0, y: 20 })
            .from(
              ".policy-step",
              { autoAlpha: 0, y: 18, stagger: 0.1 },
              "-=0.28",
            )
            .from(
              ".policy-workspace",
              { autoAlpha: 0, y: 22, scale: 0.99 },
              "-=0.26",
            )
        },
      )

      return () => media.revert()
    },
    { scope: sectionRef },
  )

  const approve = async () => {
    setApproving(true)
    try {
      const response = await fetch("/api/policyops/review", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("승인 실패")
      }
      setApproved(true)
      toast.success("검토한 약관 버전을 운영 후보로 반영했습니다.")
    } catch {
      toast.error("승인 결과를 저장하지 못했습니다.")
    } finally {
      setApproving(false)
    }
  }

  return (
    <section
      className="section-shell policy-section"
      id="policyops"
      ref={sectionRef}
    >
      <div className="section-heading policy-heading">
        <div>
          <h2>새 약관이 들어와도, 사람의 승인 아래 안전하게 갱신됩니다</h2>
          <p>
            모델이 금융 판단을 스스로 바꾸지 않습니다. 변경 감지, 비교,
            평가, 승인을 모두 통과한 지식만 반영합니다.
          </p>
        </div>
      </div>

      <div className="policy-steps" role="list" aria-label="PolicyOps 갱신 절차">
        {policyOpsSteps.map((step, index) => {
          const Icon = stepIcons[index]
          return (
            <div
              className={cn(
                "policy-step",
                approved || index < 4 ? "is-complete" : "is-current",
              )}
              role="listitem"
              key={step}
            >
              <span aria-hidden="true">
                <Icon />
              </span>
              <strong>{step}</strong>
            </div>
          )
        })}
      </div>

      <Card className="policy-workspace">
        <CardHeader>
          <CardTitle>표준약관_상해후유장해 · v1.3 → v1.4</CardTitle>
          <CardDescription>
            실제 운영 반영 전, 조항 단위 변경과 영향 범위를 검토합니다.
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              variant="outline"
              value={mode}
              onValueChange={(value) => {
                if (value) {
                  setMode(value as DiffMode)
                }
              }}
              aria-label="약관 변경 유형"
            >
              <ToggleGroupItem value="payment">지급 조건</ToggleGroupItem>
              <ToggleGroupItem value="exclusion">면책 조항</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent className="policy-grid">
          <div className="diff-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>조항</TableHead>
                  <TableHead>이전 버전 · 2024.04</TableHead>
                  <TableHead>신규 버전 · 2025.05</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.clause}>
                    <TableCell className="font-medium">{row.clause}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "diff-copy",
                          row.change !== "added" && "diff-before",
                        )}
                      >
                        {row.before}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "diff-copy",
                          row.change !== "removed" && "diff-after",
                        )}
                      >
                        {row.after}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Alert>
              <InfoIcon />
              <AlertTitle>자동 적용하지 않습니다</AlertTitle>
              <AlertDescription>
                이 변경은 영향 범위와 회귀 평가를 통과한 뒤 검토자가
                승인해야 운영 검색에 반영됩니다.
              </AlertDescription>
            </Alert>
          </div>

          <Separator orientation="vertical" className="policy-separator" />

          <div className="approval-panel">
            <div className="approval-panel-heading">
              <div>
                <strong>사람 승인 체크리스트</strong>
                <span>위험한 자동 지식 갱신을 차단합니다.</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="승인 규칙 설명"
                  >
                    <InfoIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  승인 전에는 운영 검색 결과가 바뀌지 않습니다
                </TooltipContent>
              </Tooltip>
            </div>
            <ul>
              {reviewChecklist.map((item) => (
                <li key={item}>
                  <CheckCircle2Icon aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              onClick={approve}
              disabled={approving || approved}
            >
              <UserRoundCheckIcon data-icon="inline-start" />
              {approving
                ? "승인 처리 중"
                : approved
                  ? "검토 반영 완료"
                  : "검토 후 반영"}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <ShieldCheckIcon aria-hidden="true" />
          <span>
            거버넌스 라인: 비교 → 평가 → 사람 승인 이후에만 운영 지식으로
            승격합니다.
          </span>
          <Badge variant={approved ? "success" : "outline"}>
            {approved ? "승인됨" : "승인 대기"}
          </Badge>
        </CardFooter>
      </Card>
    </section>
  )
}
