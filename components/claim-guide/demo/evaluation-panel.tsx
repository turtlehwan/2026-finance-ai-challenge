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
    label: "가입 당시 적용된 보험약관 버전을 골랐는가",
    scope: "전체 사례",
    denominator: (dataset) => dataset.total,
  },
  {
    key: "evidenceCompletenessPassed",
    label: "사례별 필수 근거 5유형을 모두 달았는가",
    scope: "보장 항목이 있는 사례",
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
      <h4>직접 인용·버전 참고에 쓴 공식 원문</h4>
      <p>
        상품 약관 3건은 결과의 직접 인용 근거이고, 표준약관 2건은 공통 용어와
        시행본 비교 참고입니다. 내려받은 원문의 시행일·분량·해시를 공개합니다.
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
        <h3 id="verification-title">공식 원문과 검증 결과</h3>
        <p>
          출처와 시행일, 문서 해시, 합성 사례 점검 결과를 공개합니다. 보험금 지급
          정확도를 뜻하는 수치는 아닙니다.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="verification-disclosure"
      >
        <AccordionItem value="evidence">
          <AccordionTrigger>
            <span className="verification-summary">
              <span>
                <strong>공식 원문 {SOURCE_LEDGER.length}건</strong>
                <small>시행일과 SHA-256 공개</small>
              </span>
              <span>
                {summary ? (
                  <strong>
                    회귀 {summary.dataset.total}건 · 경계 {summary.boundary.dataset.total}건 · 안전 중단 {summary.safety.dataset.total}건
                  </strong>
                ) : (
                  <Skeleton className="h-5 w-28" />
                )}
                <small>
                  {summary
                    ? "버전·근거·중단·경로 점검"
                    : "점검 결과를 불러오는 중"}
                </small>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="verification-details">
              <SourceLedger />

              <div className="regression-block">
                <h4>
                  {summary
                    ? `합성 사례 ${summary.dataset.total}건으로 돌린 내부 점검`
                    : "합성 사례 점검 결과를 불러오는 중"}
                </h4>
                <p>
                  같은 그래프에 넣고 네 가지를 확인했습니다. 모두 합성 사례이며,
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
                <Accordion
                  type="single"
                  collapsible
                  className="regression-method"
                >
                  <AccordionItem value="methodology">
                    <AccordionTrigger>점검 범위와 한계</AccordionTrigger>
                    <AccordionContent>
                      {summary ? (
                        <div className="evaluation-method">
                          <p>
                            보장 항목이 있는 사례 {summary.dataset.supported}건,
                            버전이 어긋나거나 사실이 빠진 사례{" "}
                            {summary.dataset.unsupported}건을 같은 LangGraph에
                            넣었습니다. 매번 같은 답이 나오는 결정론적 회귀이고,
                            별도로 공식 약관 규칙을 다시 확인해 기대값을 기록한
                            경계 사례는 {summary.dataset.boundaryCaseCount}건입니다.
                            같은 검증 상품군이므로 독립 holdout은 아닙니다.
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

              <div className="regression-block regression-block-boundary">
                <h4>
                  {summary
                    ? `규칙 재확인 경계 사례 ${summary.boundary.dataset.total}건`
                    : "규칙 재확인 경계 사례를 불러오는 중"}
                </h4>
                <p>
                  같은 검증 상품군에서 공식 원문·적용기간·조항 유형을 보고 사람이
                  기대값을 적은 합성 사실관계입니다. 독립 표본이나 실제 지급 결과가 아닙니다.
                </p>
                <dl className="regression-list">
                  {checkRows.map((row) => (
                    <div key={`boundary-${row.key}`}>
                      <dt>
                        {row.label}
                        <span>{row.scope}</span>
                      </dt>
                      <dd>
                        {summary ? (
                          <>
                            <strong>{summary.boundary.counts[row.key]}</strong>
                            <span>
                              / {row.denominator(summary.boundary.dataset)}건
                            </span>
                          </>
                        ) : (
                          <Skeleton className="h-5 w-20" />
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                {summary?.boundary.dataset.labelMethod ? (
                  <p className="evaluation-label-method">
                    라벨 방법: {summary.boundary.dataset.labelMethod}
                  </p>
                ) : null}
              </div>

              <div className="regression-block regression-block-boundary">
                <h4>
                  {summary
                    ? `공식 근거 미연결 안전 중단 ${summary.safety.dataset.total}건`
                    : "안전 중단 시나리오를 불러오는 중"}
                </h4>
                <p>
                  중도보험금·면책 시연처럼 공식 상품 약관이 연결되지 않은
                  사례에서 추천 결과를 만들지 않는지 별도로 검사합니다.
                </p>
                <dl className="regression-list">
                  <div>
                    <dt>
                      근거가 없을 때 모든 결과를 차단했는가
                      <span>공식 약관 미연결 사례</span>
                    </dt>
                    <dd>
                      {summary ? (
                        <>
                          <strong>{summary.safety.counts.safeAbstentionPassed}</strong>
                          <span>/ {summary.safety.dataset.total}건</span>
                        </>
                      ) : (
                        <Skeleton className="h-5 w-20" />
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      안전 중단 trace를 끝까지 남겼는가
                      <span>전체 안전 시나리오</span>
                    </dt>
                    <dd>
                      {summary ? (
                        <>
                          <strong>{summary.safety.counts.traceIntegrityPassed}</strong>
                          <span>/ {summary.safety.dataset.total}건</span>
                        </>
                      ) : (
                        <Skeleton className="h-5 w-20" />
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
