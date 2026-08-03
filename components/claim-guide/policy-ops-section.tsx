"use client"

import { useMemo, useState } from "react"
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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/claim-guide/section-heading"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { POLICY_OPS_STEPS } from "@/lib/claim-guide/presentation"
import {
  STANDARD_TERMS_DIFF_HASH,
  STANDARD_TERMS_SOURCE,
} from "@/lib/claim-guide/standard-terms"
import { cn } from "@/lib/utils"

type DiffMode = "payment" | "exclusion"

type DiffRow = {
  clause: string
  source: string
  connected: string
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
      clause: "제2조 · 용어의 정의",
      source: "상해·장해·보험기간의 공통 정의",
      connected: "사건 사실과 진단코드의 기준 노드",
    },
    {
      clause: "제3조 · 보험금의 지급사유",
      source: "사망·장해·입원·통원·요양·수술",
      connected: "상품별 지급 조항과 대조하는 공통 기준",
    },
    {
      clause: "제4조 · 지급 세부규정",
      source: "보장별 지급기준·기간·횟수 제한",
      connected: "보험금 후보의 제한 조건 확인",
    },
  ],
  exclusion: [
    {
      clause: "제5조 · 보험금을 지급하지 않는 사유",
      source: "고의·임신·출산·전쟁 등 공통 면책",
      connected: "보상 조항과 함께 회수하는 안전 기준",
    },
    {
      clause: "제7조 · 보험금의 청구",
      source: "청구서·사고증명서·신분증·추가서류",
      connected: "준비물 목록의 서류 항목",
    },
    {
      clause: "제8조 · 보험금의 지급절차",
      source: "3영업일·지연 통지·가지급",
      connected: "공식 청구 후 확인할 절차 안내",
    },
  ],
}

const reviewChecklist = [
  "공식 원문 조항·페이지 확인",
  "근거 그래프 연결 일관성 확인",
  "공식 표준약관 근거 검사 8/8 통과",
  "운영 인덱스 자동 변경 없음",
]

export function PolicyOpsSection() {
  const [mode, setMode] = useState<DiffMode>("payment")
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const rows = useMemo(() => diffRows[mode], [mode])

  const approve = async () => {
    setApproving(true)
    try {
      const response = await fetch("/api/policyops/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          policyId: STANDARD_TERMS_SOURCE.id,
          diffHash: STANDARD_TERMS_DIFF_HASH,
        }),
      })
      if (!response.ok) {
        throw new Error("승인 실패")
      }
      setApproved(true)
      toast.success("공식 원문 검토 상태를 시연용으로 승인했습니다.")
    } catch {
      toast.error("승인 결과를 저장하지 못했습니다.")
    } finally {
      setApproving(false)
    }
  }

  return (
    <section className="section-shell policy-section" id="policyops">
      <SectionHeading
        className="policy-heading"
        title="새 약관은 검토 후 반영합니다"
        description="공식 원문을 구조화하고 변경 영향을 점검하되, 운영 지식은 사람 승인과 별도 배포 전에는 바뀌지 않습니다."
      />

      <Accordion
        className="policy-disclosure"
        type="single"
        collapsible
      >
        <AccordionItem value="policyops-demo">
          <AccordionTrigger>
            <span className="policy-disclosure-trigger">
              <strong>표준약관 검토 화면 열기</strong>
              <span>원문 확인부터 사람 승인까지 다섯 단계</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div
              className="policy-steps"
              role="list"
              aria-label="공식 약관 검토 절차"
            >
              {POLICY_OPS_STEPS.map((step, index) => {
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
              <CardTitle>
                {STANDARD_TERMS_SOURCE.title} · 2026.07.15 시행
              </CardTitle>
              <CardDescription>
                  국가법령정보센터의 실제 PDF를 질병·상해보험 핵심 조항 단위로
                  추출해 서비스 근거 그래프와 연결했습니다.
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
                    aria-label="표준약관 근거 유형"
                  >
                    <ToggleGroupItem value="payment">지급·정의</ToggleGroupItem>
                    <ToggleGroupItem value="exclusion">
                      면책·절차
                    </ToggleGroupItem>
                  </ToggleGroup>
                </CardAction>
              </CardHeader>
              <CardContent className="policy-grid">
                <div className="diff-table-wrap">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>조항</TableHead>
                        <TableHead>공식 원문에서 확인한 내용</TableHead>
                        <TableHead>서비스 연결 방식</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.clause}>
                          <TableCell className="font-medium">
                            {row.clause}
                          </TableCell>
                          <TableCell>
                            <span className="diff-copy diff-after">
                              {row.source}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="diff-copy diff-after">
                              {row.connected}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Alert>
                    <InfoIcon />
                    <AlertTitle>운영 인덱스에는 자동 적용하지 않습니다</AlertTitle>
                    <AlertDescription>
                      위 내용은 실제 공식 원문에서 추출한 구조화 결과입니다. 승인 버튼은
                      예선 데모의 검토 상태만 바꾸며, 운영 검색·지급 규칙을 변경하지 않습니다.
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator
                  orientation="vertical"
                  className="policy-separator"
                />

                <div className="approval-panel">
                  <div className="approval-panel-heading">
                    <div>
                      <strong>사람 승인 체크리스트</strong>
                        <span>운영 지식의 자동 변경을 차단합니다.</span>
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
                        이 데모에서 승인해도 운영 검색 결과는 바뀌지 않습니다
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
                  거버넌스 라인: 공식 원문 확인 → 내부 회귀 테스트 → 사람 승인 상태를
                  기록합니다. 운영 인덱스 반영은 별도 배포 절차입니다.
                </span>
                <Badge variant={approved ? "success" : "outline"}>
                  {approved ? "시연 승인 완료" : "시연 승인 대기"}
                </Badge>
              </CardFooter>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
