"use client"

import { useEffect, useState } from "react"
import { ExternalLinkIcon } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SOURCE_LEDGER,
  formatEffectivePeriod,
  shortHash,
} from "@/lib/claim-guide/source-ledger"
import type { EvaluationSummary } from "@/lib/claim-guide/evaluation"

type CheckRow = {
  key: keyof EvaluationSummary["counts"]
  label: string
  scope: string
  denominator: (dataset: EvaluationSummary["dataset"]) => number
}

const checkRows: CheckRow[] = [
  {
    key: "versionSelectionPassed",
    label: "가입 시점의 약관 버전을 골랐는가",
    scope: "전체 사례",
    denominator: (dataset) => dataset.total,
  },
  {
    key: "evidenceCompletenessPassed",
    label: "정의·지급·면책·서류 근거를 모두 달았는가",
    scope: "담보가 걸린 사례",
    denominator: (dataset) => dataset.supported,
  },
  {
    key: "safeAbstentionPassed",
    label: "근거가 모자랄 때 멈췄는가",
    scope: "버전 불일치·사실 누락 사례",
    denominator: (dataset) => dataset.unsupported,
  },
  {
    key: "traceIntegrityPassed",
    label: "실행 경로를 빠짐없이 남겼는가",
    scope: "전체 사례",
    denominator: (dataset) => dataset.total,
  },
]

const sourceKindLabel = {
  "official-standard-terms": "표준약관",
  "official-product-policy": "상품 약관",
} as const

function SourceLedger() {
  return (
    <div className="source-ledger">
      <h4>근거로 쓴 원문 {SOURCE_LEDGER.length}건</h4>
      <p>
        금융감독원 표준약관과 우체국보험 상품 약관입니다. 내려받은 원문의
        시행일·분량·해시를 그대로 적었으니 직접 대조해 보세요.
      </p>
      <ul>
        {SOURCE_LEDGER.map((source) => (
          <li key={source.id}>
            <span className="ledger-kind">
              {sourceKindLabel[source.sourceKind]}
            </span>
            <a
              className="ledger-title"
              href={source.documentUrl ?? source.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {source.title}
              <ExternalLinkIcon aria-hidden="true" />
            </a>
            <span className="ledger-org">{source.sourceOrganization}</span>
            <span className="ledger-period">
              {formatEffectivePeriod(source)}
            </span>
            <span className="ledger-pages">
              {source.documentPages
                ? `${source.documentPages.toLocaleString("ko-KR")}쪽`
                : "쪽수 미확인"}
            </span>
            <code className="ledger-hash" title={source.sha256}>
              {shortHash(source.sha256)}
            </code>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
    <section className="verification-block" aria-labelledby="verification-title">
      <div className="verification-intro">
        <h3 id="verification-title">직접 확인해 보라고 다 열어 둡니다</h3>
        <p>
          근거가 된 공식 원문과, 그 위에서 돌린 내부 점검 결과입니다. 좋게 보일
          숫자 대신 세어 볼 수 있는 숫자를 적었습니다.
        </p>
      </div>

      <SourceLedger />

      <div className="regression-block">
        <h4>
          합성 사례 {summary ? summary.dataset.total : 50}건으로 돌린 내부 점검
        </h4>
        <p>
          같은 그래프에 넣고 네 가지를 봤습니다. 전부 저희가 만든 합성 사례이며,
          실제 보험금 지급 정확도가 아닙니다.
        </p>
        <dl className="regression-list">
          {checkRows.map((row) => (
            <div key={row.key}>
              <dt>
                {row.label}
                <span>{row.scope}</span>
              </dt>
              <dd>
                {summary ? (
                  <>
                    <strong>{summary.counts[row.key]}</strong>
                    <span>/ {row.denominator(summary.dataset)}건</span>
                  </>
                ) : (
                  <Skeleton className="h-5 w-20" />
                )}
              </dd>
            </div>
          ))}
        </dl>
        <Accordion type="single" collapsible className="regression-method">
          <AccordionItem value="methodology">
            <AccordionTrigger>점검 범위와 한계</AccordionTrigger>
            <AccordionContent>
              {summary ? (
                <div className="evaluation-method">
                  <p>
                    담보가 걸린 사례 {summary.dataset.supported}건,
                    버전이 어긋나거나 사실이 빠진 사례{" "}
                    {summary.dataset.unsupported}건을 같은 LangGraph에
                    넣었습니다. 매번 같은 답이 나오는 결정론적 회귀이고, 따로
                    떼어 둔 검증셋은 {summary.dataset.independentHoldout}건입니다.
                  </p>
                  <ul>
                    {summary.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>점검 결과를 계산하는 중입니다.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}
