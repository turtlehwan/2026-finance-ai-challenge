import { useMemo } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileSearchIcon,
  InfoIcon,
  ShieldAlertIcon,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { RESULT_STATE_ORDER } from "@/lib/claim-guide/presentation"
import type {
  ClaimResult,
  DemoPhase,
  PolicySource,
  ResultTone,
} from "@/lib/claim-guide/types"
import { cn } from "@/lib/utils"

const toneIcons: Record<ResultTone, LucideIcon> = {
  positive: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  muted: InfoIcon,
  blocked: ShieldAlertIcon,
}

function ResultSummary({ results }: { results: ClaimResult[] }) {
  const counts = useMemo(() => {
    const next: Record<ResultTone, number> = {
      positive: 0,
      warning: 0,
      muted: 0,
      blocked: 0,
    }

    results.forEach((result) => {
      next[result.tone] += 1
    })
    return next
  }, [results])

  return (
    <dl className="result-counts" aria-label="분석 결과 요약">
      {RESULT_STATE_ORDER.map((state) => (
        <div className={`tone-${state.tone}`} key={state.tone}>
          <dt>{state.status}</dt>
          <dd>{counts[state.tone]}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ResultsPanel({
  display = "summary",
  results,
  phase,
  sources,
}: {
  display?: "summary" | "evidence"
  results: ClaimResult[]
  phase: DemoPhase
  sources: PolicySource[]
}) {
  if (phase === "idle") {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileSearchIcon />
          </EmptyMedia>
          <EmptyTitle>사례를 선택하면 분석을 시작할 수 있습니다</EmptyTitle>
          <EmptyDescription>
            사례 사실을 확인한 뒤 아래의 분석 시작 버튼을 눌러주세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (phase === "running") {
    return (
      <div className="result-skeleton" aria-label="결과 생성 중">
        {[0, 1, 2].map((item) => (
          <div key={item}>
            <Skeleton className="size-9" />
            <div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (phase === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>분석을 완료하지 못했습니다</AlertTitle>
        <AlertDescription>
          네트워크 상태를 확인한 뒤 다시 분석해 주세요.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {display === "summary" ? <ResultSummary results={results} /> : null}
      {display === "evidence" && sources.length ? (
        <div className="result-sources" aria-label="분석에 사용한 공식 출처">
          <div className="result-sources-heading">
            <div>
              <strong>근거가 된 공식 원문부터 보여드릴게요</strong>
              <span>
                출처와 적용일을 공개합니다. 원문만으로 지급 여부를 확정하지
                않습니다.
              </span>
            </div>
          </div>
          <div className="result-source-list">
            {sources.map((source) => (
              <a
                href={source.documentUrl ?? source.sourceUrl}
                target="_blank"
                rel="noreferrer"
                key={source.id}
              >
                <span className="result-source-kind">
                  {source.sourceKind === "official-standard-terms"
                    ? "표준약관"
                    : "상품 약관"}
                </span>
                <span className="result-source-copy">
                  <strong>{source.title}</strong>
                  <span>
                    {source.sourceOrganization}
                    {source.effectiveDate
                      ? ` · ${source.effectiveDate} 시행`
                      : source.effectiveStart
                        ? ` · ${source.effectiveStart}~${source.effectiveEnd}`
                        : ""}
                  </span>
                </span>
                <ExternalLinkIcon aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
      <Accordion
        className="result-accordion"
        type="single"
        collapsible
        defaultValue="result-0"
      >
        {results.map((result, index) => {
          const Icon = toneIcons[result.tone]
          const state = RESULT_STATE_ORDER.find(
            (item) => item.tone === result.tone,
          )

          return (
            <AccordionItem
              className="result-accordion-item"
              value={`result-${index}`}
              key={result.title}
            >
              <AccordionTrigger>
                <span className={cn("result-icon", `tone-${result.tone}`)}>
                  <Icon aria-hidden="true" />
                </span>
                <span className="result-trigger-copy">
                  <strong>{result.title}</strong>
                  <span>{result.reason}</span>
                </span>
                <Badge variant={state?.badgeVariant ?? "secondary"}>
                  {result.status}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <div className="result-detail">
                  <div>
                    <strong>약관 근거</strong>
                    <span>{result.clause}</span>
                  </div>
                  <p>{result.detail}</p>
                  {display === "evidence" && result.citations?.length ? (
                    <div className="result-citations">
                      <strong>공식 원문</strong>
                      {result.citations.map((citation) => (
                        <a
                          href={`${citation.sourceUrl}#page=${citation.page}`}
                          target="_blank"
                          rel="noreferrer"
                          key={`${citation.article}-${citation.page}`}
                        >
                          <span>
                            {citation.article} · PDF {citation.page}쪽
                          </span>
                          <ExternalLinkIcon aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </>
  )
}
