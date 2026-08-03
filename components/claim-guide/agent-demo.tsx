"use client"

import { useEffect, useRef, useState } from "react"
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
import {
  AdaptiveAssistant,
  AdaptiveAssistantWorkspace,
  type AssistantView,
} from "@/components/claim-guide/demo/adaptive-assistant"
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
import type { Answer, DemoPhase } from "@/lib/claim-guide/types"
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
  const [viewSelection, setViewSelection] = useState<{
    phase: DemoPhase
    view: AssistantView
  } | null>(null)
  const assistantFocusRef = useRef<HTMLElement>(null)
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
  const activeView =
    viewSelection?.phase === phase
      ? viewSelection.view
      : phase === "running"
        ? "trace"
        : "task"

  const showAssistantView = (view: AssistantView) => {
    setViewSelection({ phase, view })
    window.requestAnimationFrame(() => {
      assistantFocusRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      })
    })
  }

  const showAssistantInput = () => {
    const input = document.querySelector<HTMLInputElement>(
      "#assistant-request-input",
    )
    input?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    })
    input?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (phase === "idle") {
      return
    }

    const scrollTimer = window.setTimeout(() => {
      assistantFocusRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      })
    }, 0)

    return () => window.clearTimeout(scrollTimer)
  }, [phase])

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
              setViewSelection(null)
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
          <AdaptiveAssistant
            activeView={activeView}
            answer={answer}
            onAnswer={setAnswer}
            onStart={startAnalysis}
            onViewChange={showAssistantView}
            phase={phase}
          />

          <AdaptiveAssistantWorkspace
            activeView={activeView}
            focusRef={assistantFocusRef}
            onAsk={showAssistantInput}
            onViewChange={showAssistantView}
            phase={phase}
          >
            {activeView === "case" ? (
              <CaseFacts activeCase={activeCase} />
            ) : null}

            {activeView === "trace" && phase !== "idle" ? (
              <AgentFlowGraph
                trace={trace}
                activeTraceIndex={activeTraceIndex}
                humanAnswer={answer}
              />
            ) : null}

            {activeView === "evidence" ? (
              <section
                className="journey-stage"
                aria-live="polite"
                aria-labelledby="journey-stage-title"
              >
                <div className="journey-stage-heading">
                  <span className="journey-stage-label">
                    {phase === "complete" ? "공식 근거" : "지금까지 확인"}
                  </span>
                  <h3 id="journey-stage-title">
                    {phase === "complete"
                      ? "근거가 된 약관과 쪽수입니다"
                      : "여기까지 확인한 근거예요"}
                  </h3>
                  <p>
                    보장 항목과 연결된 약관 버전, 지급사유, 면책·제한을 한
                    흐름으로 보여드립니다.
                  </p>
                </div>
                {phase === "complete" ? (
                  <ResultsPanel
                    display="evidence"
                    results={results}
                    phase={phase}
                    sources={sources}
                  />
                ) : (
                  <EvidenceRail
                    compact
                    items={activeCase.evidence}
                    activeStep={activeStep}
                    onSelect={setActiveStep}
                  />
                )}
              </section>
            ) : null}

            {activeView === "actions" && isComplete ? (
              <section
                className="journey-stage assistant-actions-stage"
                aria-live="polite"
                aria-labelledby="journey-stage-title"
              >
                <div className="journey-stage-heading">
                  <span className="journey-stage-label is-success">
                    다음 행동
                  </span>
                  <h3 id="journey-stage-title">
                    보험사에 가기 전에 이것만 챙기세요
                  </h3>
                  <p>
                    준비할 서류와 물어볼 질문만 모았습니다. 청구와 최종 판단은
                    공식 채널에서 진행합니다.
                  </p>
                </div>
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
              </section>
            ) : null}

            {activeView === "task" ? (
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
                      <h3 id="journey-stage-title">이 사례를 같이 확인할까요?</h3>
                      <p>
                        가입 당시 적용된 보험약관을 찾고 정의·지급·면책 조항을
                        함께 확인합니다.
                      </p>
                    </div>
                    <Alert>
                      <ShieldCheckIcon />
                      <AlertTitle>모르는 내용은 넘겨짚지 않을게요</AlertTitle>
                      <AlertDescription>
                        근거가 부족하면 멈추고 필요한 것만 한 번에 하나씩
                        여쭙습니다.
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
                    </div>
                    <Progress
                      aria-label="Agent 근거 분석 진행률"
                      value={((activeStep + 1) / ANALYSIS_STEPS.length) * 100}
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
                  </>
                ) : null}

                {isComplete ? (
                  <>
                    <div className="journey-stage-heading">
                      <span className="journey-stage-label is-success">
                        4단계 · {journeyPresentation[3].label}
                      </span>
                      <h3 id="journey-stage-title">
                        먼저 확인할 항목부터 정리했어요
                      </h3>
                      <p>
                        지급 확정이 아니라 우선순위부터 보여드립니다. 한 번에 한
                        항목만 펼쳐 읽을 수 있습니다.
                      </p>
                    </div>
                    <ResultsPanel
                      display="summary"
                      results={results}
                      phase={phase}
                      sources={sources}
                    />
                  </>
                ) : null}

                {phase === "error" ? (
                  <>
                    <div className="journey-stage-heading">
                      <Badge variant="destructive">분석 중단</Badge>
                      <h3 id="journey-stage-title">
                        분석을 완료하지 못했습니다
                      </h3>
                      <p>네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
                    </div>
                    <Button size="lg" onClick={startAnalysis}>
                      <PlayIcon data-icon="inline-start" />
                      다시 분석하기
                    </Button>
                  </>
                ) : null}
              </section>
            ) : null}
          </AdaptiveAssistantWorkspace>
        </CardContent>
      </Card>

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
