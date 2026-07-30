"use client"

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
import { CaseFacts } from "@/components/claim-guide/demo/case-facts"
import { JourneyProgress } from "@/components/claim-guide/demo/journey-progress"
import { ResultsPanel } from "@/components/claim-guide/demo/results-panel"
import { useClaimAnalysis } from "@/components/claim-guide/demo/use-claim-analysis"
import { EvidenceRail } from "@/components/claim-guide/evidence-rail"
import { journeyPresentation } from "@/components/claim-guide/journey-presentation"
import { answerOptions, claimCases } from "@/lib/claim-guide/cases"
import { ANALYSIS_STEPS } from "@/lib/claim-guide/presentation"
import type { Answer } from "@/lib/claim-guide/types"

const caseIcons: LucideIcon[] = [BoneIcon, CalendarClockIcon, ShieldAlertIcon]

export function AgentDemo() {
  const {
    activeCase,
    activeStep,
    answer,
    applyAnswer,
    changeCase,
    demoRef,
    phase,
    results,
    saveSession,
    selectedId,
    setActiveStep,
    setAnswer,
    startAnalysis,
  } = useClaimAnalysis()
  const isComplete = phase === "complete"

  return (
    <section className="section-shell demo-section" id="demo" ref={demoRef}>
      <div className="section-heading">
        <div>
          <Badge variant="outline">Interactive demo</Badge>
          <h2>한 번에 한 단계씩 확인해보세요</h2>
          <p>
            사례 선택부터 근거 검토, 추가 정보 확인, 다음 행동까지 같은 순서로
            안내합니다.
          </p>
        </div>
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

      <Card className="journey-card" id="case-workspace">
        <CardHeader>
          <div>
            <Badge variant="outline">합성 데이터</Badge>
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
                    <Badge>
                      1단계 · {journeyPresentation[0].label}
                    </Badge>
                    <h3 id="journey-stage-title">이 사례를 분석할까요?</h3>
                    <p>
                      Agent가 가입 시점의 약관을 찾고 정의·지급·면책 조항을 함께
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
                    <Badge variant="warning">
                      2단계 · {journeyPresentation[1].label}
                    </Badge>
                    <h3 id="journey-stage-title">
                      {ANALYSIS_STEPS[activeStep]} 정보를 확인하고 있습니다
                    </h3>
                    <p>
                      적용 약관 버전과 연결된 정의·지급·면책 조항을 순서대로
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
                    <AlertTitle>Agent 분석 중</AlertTitle>
                    <AlertDescription>
                      결과를 만들기 전 근거가 충분한지 먼저 확인합니다.
                    </AlertDescription>
                  </Alert>
                </>
              ) : null}

              {phase === "question" ? (
                <>
                  <div className="journey-stage-heading">
                    <Badge variant="warning">
                      3단계 · {journeyPresentation[2].label}
                    </Badge>
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
                  >
                    <AccordionItem value="evidence">
                      <AccordionTrigger>
                        Agent가 확인한 근거 경로
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
                    <Badge variant="success">
                      4단계 · {journeyPresentation[3].label}
                    </Badge>
                    <h3 id="journey-stage-title">확인할 항목을 정리했습니다</h3>
                    <p>
                      지급 확정이 아니라 우선순위, 근거, 다음 행동을 같은
                      기준으로 보여드립니다.
                    </p>
                  </div>
                  <ResultsPanel results={results} phase={phase} />
                  <Accordion
                    className="evidence-disclosure"
                    type="single"
                    collapsible
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
        <AlertTitle>이 데모의 역할 경계</AlertTitle>
        <AlertDescription>
          합성 사례를 서버에서 판정 규칙과 대조하고, 답변에 따라 결과·근거·
          Action Pack을 갱신합니다. 실제 보험금 지급 여부는 판단하지 않습니다.
        </AlertDescription>
      </Alert>
    </section>
  )
}
