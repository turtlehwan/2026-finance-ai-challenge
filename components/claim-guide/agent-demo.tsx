"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BoneIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  PlayIcon,
  SaveIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ActionPack } from "@/components/claim-guide/demo/action-pack"
import { AgentFlowGraph } from "@/components/claim-guide/demo/agent-flow-graph"
import { CaseFacts } from "@/components/claim-guide/demo/case-facts"
import { DocumentIntake } from "@/components/claim-guide/demo/document-intake"
import { EvaluationPanel } from "@/components/claim-guide/demo/evaluation-panel"
import { JourneyProgress } from "@/components/claim-guide/demo/journey-progress"
import { ResultsPanel } from "@/components/claim-guide/demo/results-panel"
import { useClaimAnalysis } from "@/components/claim-guide/demo/use-claim-analysis"
import { EvidenceRail } from "@/components/claim-guide/evidence-rail"
import { journeyPresentation } from "@/components/claim-guide/journey-presentation"
import { SectionHeading } from "@/components/claim-guide/section-heading"
import { answerOptions, claimCases } from "@/lib/claim-guide/cases"
import { ANALYSIS_STEPS } from "@/lib/claim-guide/presentation"
import type { Answer } from "@/lib/claim-guide/types"
import type { DocumentBundle } from "@/lib/claim-guide/documents"

const caseIcons: LucideIcon[] = [BoneIcon, CalendarClockIcon, ShieldAlertIcon]

const demoRunbook = [
  {
    step: "01",
    title: "사례 고르기",
    detail: "준비된 사례를 하나 선택합니다.",
  },
  {
    step: "02",
    title: "근거 분석 시작",
    detail: "사례 카드에서 분석을 시작합니다.",
  },
  {
    step: "03",
    title: "추가 질문 답변",
    detail: "모르는 사실은 추정하지 않고 남깁니다.",
  },
  {
    step: "04",
    title: "결과와 원문 확인",
    detail: "근거·준비물·공식 채널을 차례로 봅니다.",
  },
]

export function AgentDemo() {
  const [documentBundle, setDocumentBundle] = useState<DocumentBundle | null>(
    null,
  )
  const {
    activeCase,
    activeStep,
    activeTraceIndex,
    answer,
    applyAnswer,
    changeCase,
    demoRef,
    phase,
    results,
    sources,
    saveSession,
    selectedId,
    setActiveStep,
    setAnswer,
    startAnalysis,
    trace,
  } = useClaimAnalysis(documentBundle)
  const isComplete = phase === "complete"

  return (
    <section className="section-shell demo-section" id="demo" ref={demoRef}>
      <SectionHeading
        title="사례로 확인 절차를 따라가 보세요"
        description="보험증권과 진료자료를 넣거나 준비된 사례를 선택하면, 계약일에 맞는 보험약관을 찾고 부족한 정보를 확인한 뒤 근거와 다음 행동을 정리합니다."
      />

      <ol className="demo-runbook" aria-label="권장 시연 순서">
        {demoRunbook.map((item) => (
          <li key={item.step}>
            <span aria-hidden="true">{item.step}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
        <Button variant="outline" asChild>
          <a href="#case-selection">
            <PlayIcon data-icon="inline-start" />
            준비된 사례로 바로 시작
          </a>
        </Button>
      </ol>

      <div className="case-selection" id="case-selection">
        <div className="case-selection-heading">
          <span>권장 시연 · 1단계</span>
          <p>아래 사례를 고른 뒤 분석을 시작하세요.</p>
        </div>
        <ToggleGroup
          className="case-tabs"
          type="single"
          variant="outline"
          value={selectedId}
          onValueChange={(value) => {
            if (value) {
              changeCase(value)
            }
          }}
          aria-label="합성 사례 선택"
        >
          {claimCases.map((claimCase, index) => {
            const Icon = caseIcons[index]
            return (
              <ToggleGroupItem
                value={claimCase.id}
                key={claimCase.id}
                disabled={phase === "running"}
              >
                <Icon data-icon="inline-start" />
                {claimCase.shortTitle}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>

      <Card className="journey-card" id="case-workspace">
        <CardHeader>
          <div>
            <Badge variant="outline">비식별 합성 사례</Badge>
            <CardTitle>{activeCase.title}</CardTitle>
            <CardDescription>{activeCase.description}</CardDescription>
          </div>
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={saveSession}
                  aria-label="현재 사례 저장"
                >
                  <SaveIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                개인정보 없이 사례 선택만 저장합니다
              </TooltipContent>
            </Tooltip>
          </CardAction>
        </CardHeader>
        <CardContent className="journey-card-content">
          <JourneyProgress phase={phase} />

          {phase !== "idle" ? (
            <AgentFlowGraph
              trace={trace}
              activeTraceIndex={activeTraceIndex}
              humanAnswer={answer}
            />
          ) : null}

          <div className="journey-body">
            <CaseFacts activeCase={activeCase} />

            <section
              className="journey-stage"
              aria-live="polite"
              aria-labelledby="journey-stage-title"
            >
              {phase === "idle" ? (
                <>
                  <div className="journey-stage-heading">
                    <span className="journey-stage-label">
                      1단계 · {journeyPresentation[0].label}
                    </span>
                    <h3 id="journey-stage-title">이 사례를 분석할까요?</h3>
                    <p>
                      가입 당시 적용된 보험약관을 찾고 정의·지급·면책 조항을 함께
                      확인합니다.
                    </p>
                  </div>
                  <Alert>
                    <ShieldCheckIcon />
                    <AlertTitle>근거가 부족하면 멈추고 질문합니다</AlertTitle>
                    <AlertDescription>
                      확인되지 않은 사실을 추정해 지급 가능성을 단정하지
                      않습니다.
                    </AlertDescription>
                  </Alert>
                  <Button size="lg" onClick={startAnalysis}>
                    <PlayIcon data-icon="inline-start" />이 사례 분석하기
                  </Button>
                </>
              ) : null}

              {phase === "running" ? (
                <>
                  <div className="journey-stage-heading">
                    <span className="journey-stage-label is-warning">
                      2단계 · {journeyPresentation[1].label}
                    </span>
                    <h3 id="journey-stage-title">
                      {ANALYSIS_STEPS[activeStep]} 정보를 확인하고 있습니다
                    </h3>
                    <p>
                      적용 보험약관 버전과 연결된 정의·지급·면책 조항을 순서대로
                      검토합니다.
                    </p>
                  </div>
                  <Progress
                    aria-label="Agent 근거 분석 진행률"
                    value={((activeStep + 1) / ANALYSIS_STEPS.length) * 100}
                  />
                  <EvidenceRail
                    compact
                    items={activeCase.evidence}
                    activeStep={activeStep}
                  />
                  <Alert>
                    <Spinner />
                    <AlertTitle>근거를 대조하고 있습니다</AlertTitle>
                    <AlertDescription>
                      결과를 만들기 전 근거가 충분한지 먼저 확인합니다.
                    </AlertDescription>
                  </Alert>
                </>
              ) : null}

              {phase === "question" ? (
                <>
                  <div className="journey-stage-heading">
                    <span className="journey-stage-label is-warning">
                      3단계 · {journeyPresentation[2].label}
                    </span>
                    <h3 id="journey-stage-title">{activeCase.question}</h3>
                    <p>{activeCase.questionHint}</p>
                  </div>
                  <ToggleGroup
                    className="answer-options"
                    type="single"
                    variant="outline"
                    value={answer ?? ""}
                    onValueChange={(value) => {
                      if (value) {
                        setAnswer(value as Answer)
                      }
                    }}
                    aria-label="추가 정보 답변"
                  >
                    {answerOptions.map((option) => (
                      <ToggleGroupItem value={option.value} key={option.value}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <Button
                    size="lg"
                    disabled={!answer}
                    onClick={() => {
                      if (answer) {
                        void applyAnswer(answer)
                      }
                    }}
                  >
                    <CheckCircle2Icon data-icon="inline-start" />
                    답변 반영하고 결과 보기
                  </Button>
                  <Accordion
                    className="evidence-disclosure"
                    type="single"
                    collapsible
                    defaultValue="evidence"
                  >
                    <AccordionItem value="evidence">
                      <AccordionTrigger>
                        지금까지 확인한 근거 경로
                      </AccordionTrigger>
                      <AccordionContent>
                        <EvidenceRail
                          compact
                          items={activeCase.evidence}
                          activeStep={activeStep}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              ) : null}

              {isComplete ? (
                <>
                  <div className="journey-stage-heading">
                    <span className="journey-stage-label is-success">
                      4단계 · {journeyPresentation[3].label}
                    </span>
                    <h3 id="journey-stage-title">확인할 항목을 정리했습니다</h3>
                    <p>
                      지급 확정이 아니라 우선순위, 근거, 다음 행동을 같은
                      기준으로 보여드립니다.
                    </p>
                  </div>
                  <ResultsPanel
                    results={results}
                    phase={phase}
                    sources={sources}
                  />
                  <Accordion
                    className="evidence-disclosure"
                    type="single"
                    collapsible
                    defaultValue="evidence"
                  >
                    <AccordionItem value="evidence">
                      <AccordionTrigger>전체 근거 경로 확인</AccordionTrigger>
                      <AccordionContent>
                        <EvidenceRail
                          compact
                          items={activeCase.evidence}
                          activeStep={activeStep}
                          onSelect={setActiveStep}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              ) : null}

              {phase === "error" ? (
                <>
                  <div className="journey-stage-heading">
                    <Badge variant="destructive">분석 중단</Badge>
                    <h3 id="journey-stage-title">분석을 완료하지 못했습니다</h3>
                    <p>네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
                  </div>
                  <Button size="lg" onClick={startAnalysis}>
                    <PlayIcon data-icon="inline-start" />
                    다시 분석하기
                  </Button>
                </>
              ) : null}
            </section>
          </div>
        </CardContent>
      </Card>

      {isComplete ? (
        <div className="action-pack-reveal">
          <ActionPack activeCase={activeCase} results={results} />
          <Button size="lg" asChild>
            <a
              href="https://cont.insure.or.kr/"
              target="_blank"
              rel="noreferrer"
            >
              공식 조회로 이동
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      ) : null}

      <Alert className="demo-boundary">
        <ShieldCheckIcon />
        <AlertTitle>이 화면에서 실제로 일어나는 일</AlertTitle>
        <AlertDescription>
          서버가 합성 사례를 판정 규칙과 대조하고, 답변에 따라 결과와 근거,
          준비물 목록을 다시 계산합니다. 지급 여부는 판단하지 않습니다.
        </AlertDescription>
      </Alert>

      <EvaluationPanel />

      <div className="document-followup" id="document-intake">
        <div className="document-followup-heading">
          <span>직접 실행해 보기</span>
          <h3>내 문서로 같은 흐름을 이어가세요</h3>
          <p>
            보험증권과 진료자료에서 정보를 읽으면, 다음 분석부터 계약일·보장
            항목·진단 정보를 같은 근거 흐름에 반영합니다.
          </p>
        </div>
        <DocumentIntake onBundle={setDocumentBundle} />
      </div>
    </section>
  )
}
