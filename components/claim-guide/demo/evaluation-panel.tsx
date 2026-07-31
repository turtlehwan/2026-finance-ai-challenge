"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2Icon,
  FlaskConicalIcon,
  GitBranchIcon,
  RouteIcon,
  ShieldCheckIcon,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { EvaluationSummary } from "@/lib/claim-guide/evaluation"

const metricPresentation = [
  {
    key: "versionSelection" as const,
    label: "약관 버전 회귀 통과",
    icon: GitBranchIcon,
  },
  {
    key: "evidenceCompleteness" as const,
    label: "근거 완전성 회귀 통과",
    icon: CheckCircle2Icon,
  },
  {
    key: "safeAbstention" as const,
    label: "안전 중단 회귀 통과",
    icon: ShieldCheckIcon,
  },
  {
    key: "traceIntegrity" as const,
    label: "Agent trace 회귀 통과",
    icon: RouteIcon,
  },
]

export function EvaluationPanel() {
  const [summary, setSummary] = useState<EvaluationSummary | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void fetch("/api/evaluation/summary", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("평가 결과를 불러오지 못했습니다.")
        }
        return response.json() as Promise<EvaluationSummary>
      })
      .then(setSummary)
      .catch(() => {
        if (!controller.signal.aborted) {
          setSummary(null)
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <Card className="evaluation-card">
      <CardHeader>
        <div>
          <Badge variant="outline">
            <FlaskConicalIcon data-icon="inline-start" />
            내부 회귀 테스트
          </Badge>
          <CardTitle>Agent 안전성도 결과와 함께 공개합니다</CardTitle>
        </div>
        {summary ? (
          <Badge variant="secondary">{summary.dataset.total}건 실행</Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="evaluation-honesty" role="note">
          <strong>정직한 해석</strong>
          <span>
            아래 100%는 실제 보험금 지급 정확도가 아니라, 고정된 합성 fixture를
            대상으로 한 계약·안전성 회귀 통과율입니다.
          </span>
        </div>
        <div className="evaluation-metrics">
          {metricPresentation.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.key}>
                <span>
                  <Icon aria-hidden="true" />
                </span>
                <strong>
                  {summary ? (
                    `${summary.metrics[metric.key]}%`
                  ) : (
                    <Skeleton className="h-7 w-16" />
                  )}
                </strong>
                <p>{metric.label}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Accordion type="single" collapsible>
          <AccordionItem value="methodology">
            <AccordionTrigger>평가 범위와 한계 보기</AccordionTrigger>
            <AccordionContent>
              {summary ? (
                <div className="evaluation-method">
                  <p>
                    지원 사례 {summary.dataset.supported}건과 미지원·핵심정보
                    누락 사례 {summary.dataset.unsupported}건을 같은 LangGraph에
                    실행했습니다.
                  </p>
                  <p>
                    평가 유형: 결정론적 회귀 테스트 · 독립 holdout: {summary.dataset.independentHoldout}건 · 실제 지급 데이터: 없음
                  </p>
                  <ul>
                    {summary.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>평가 결과를 계산하고 있습니다.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  )
}
