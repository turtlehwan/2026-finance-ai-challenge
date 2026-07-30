"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangleIcon,
  BoneIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClipboardCopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileCheck2Icon,
  FolderCheckIcon,
  InfoIcon,
  PlayIcon,
  SaveIcon,
  ScaleIcon,
  Share2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SparklesIcon,
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EvidenceRail } from "@/components/claim-guide/evidence-rail"
import {
  analysisSteps,
  answerOptions,
  claimCases,
} from "@/lib/claim-guide/cases"
import type {
  AnalysisResponse,
  Answer,
  ClaimCase,
  ClaimResult,
  ResultTone,
} from "@/lib/claim-guide/types"
import { cn } from "@/lib/utils"

const caseIcons: LucideIcon[] = [BoneIcon, CalendarClockIcon, ShieldAlertIcon]

const toneIcons: Record<ResultTone, LucideIcon> = {
  positive: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  muted: InfoIcon,
  blocked: ShieldAlertIcon,
}

const toneVariants: Record<
  ResultTone,
  "success" | "warning" | "secondary" | "destructive"
> = {
  positive: "success",
  warning: "warning",
  muted: "secondary",
  blocked: "destructive",
}

type Phase = "idle" | "running" | "question" | "complete" | "error"
type GsapRuntime = typeof import("gsap").default
type GsapContext = ReturnType<GsapRuntime["context"]>

const SESSION_KEY = "claim-guide-session:v1"
const journeySteps: { label: string; icon: LucideIcon }[] = [
  { label: "사례 선택", icon: ClipboardCheckIcon },
  { label: "근거 분석", icon: ScaleIcon },
  { label: "정보 확인", icon: ShieldCheckIcon },
  { label: "다음 행동", icon: FolderCheckIcon },
]

function getJourneyStep(phase: Phase) {
  if (phase === "running" || phase === "error") {
    return 1
  }
  if (phase === "question") {
    return 2
  }
  if (phase === "complete") {
    return 3
  }
  return 0
}

function JourneyProgress({ phase }: { phase: Phase }) {
  const currentStep = getJourneyStep(phase)

  return (
    <div className="journey-progress-wrap">
      <div className="journey-progress-copy">
        <span>
          {currentStep + 1} / {journeySteps.length}
        </span>
        <strong>{journeySteps[currentStep].label}</strong>
      </div>
      <Progress
        aria-label={`분석 여정 ${journeySteps[currentStep].label}`}
        value={((currentStep + 1) / journeySteps.length) * 100}
      />
      <ol className="journey-progress" aria-label="보험금 확인 단계">
        {journeySteps.map((step, index) => {
          const Icon = step.icon
          const state =
            index < currentStep
              ? "is-complete"
              : index === currentStep
                ? "is-current"
                : ""

          return (
            <li
              className={state}
              key={step.label}
              aria-current={index === currentStep ? "step" : undefined}
            >
              <span aria-hidden="true">
                {index < currentStep ? <CheckCircle2Icon /> : <Icon />}
              </span>
              <strong>{step.label}</strong>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function readSavedSession(): {
  caseId: ClaimCase["id"]
  answer: Answer | null
} | null {
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SESSION_KEY) ?? "null",
    ) as { caseId?: string; answer?: Answer | null } | null
    const claimCase = claimCases.find((item) => item.id === saved?.caseId)
    const savedAnswer =
      saved?.answer && answerOptions.some((item) => item.value === saved.answer)
        ? saved.answer
        : null
    return claimCase ? { caseId: claimCase.id, answer: savedAnswer } : null
  } catch {
    return null
  }
}

async function requestAnalysis(
  caseId: ClaimCase["id"],
  answer: Answer | null,
): Promise<AnalysisResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, answer }),
  })

  if (!response.ok) {
    throw new Error("분석 응답을 불러오지 못했습니다.")
  }

  return (await response.json()) as AnalysisResponse
}

function ResultSummary({ results }: { results: ClaimResult[] }) {
  const counts = useMemo(() => {
    const next = { positive: 0, warning: 0, muted: 0, blocked: 0 }
    results.forEach((result) => {
      next[result.tone] += 1
    })
    return next
  }, [results])

  return (
    <div className="result-counts" role="group" aria-label="분석 결과 요약">
      <Badge variant="success">확인 권장 {counts.positive}</Badge>
      <Badge variant="warning">정보 필요 {counts.warning}</Badge>
      <Badge variant="secondary">가능성 낮음 {counts.muted}</Badge>
      <Badge variant="destructive">확인 불가 {counts.blocked}</Badge>
    </div>
  )
}

function CaseFacts({ activeCase }: { activeCase: ClaimCase }) {
  return (
    <section className="case-facts" aria-labelledby="case-facts-title">
      <div className="case-facts-heading">
        <strong id="case-facts-title">확인할 사례</strong>
        <span>{activeCase.category}</span>
      </div>
      <dl className="fact-list">
        {activeCase.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ResultsPanel({
  results,
  phase,
}: {
  results: ClaimResult[]
  phase: Phase
}) {
  if (phase === "idle") {
    return (
      <Alert>
        <SparklesIcon />
        <AlertTitle>사례를 선택하면 분석을 시작할 수 있습니다</AlertTitle>
        <AlertDescription>
          사례 사실을 확인한 뒤 아래의 분석 시작 버튼을 눌러주세요.
        </AlertDescription>
      </Alert>
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
      <ResultSummary results={results} />
      <Accordion
        className="result-accordion"
        type="single"
        collapsible
        defaultValue="result-0"
      >
        {results.map((result, index) => {
          const Icon = toneIcons[result.tone]
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
                <Badge variant={toneVariants[result.tone]}>
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
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </>
  )
}

function ActionPack({
  activeCase,
  results,
}: {
  activeCase: ClaimCase
  results: ClaimResult[]
}) {
  const buildText = () => {
    const resultLines = results
      .map(
        (result) =>
          `- ${result.title}: ${result.status}\n  근거: ${result.clause}\n  이유: ${result.reason}`,
      )
      .join("\n")
    const documents = activeCase.documents.map((item) => `- ${item}`).join("\n")
    const questions = activeCase.questions
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n")

    return [
      "보험금 길잡이 Agent · 합성 사례 Action Pack",
      "",
      activeCase.title,
      "",
      "[분석 결과]",
      resultLines,
      "",
      "[준비할 자료]",
      documents,
      "",
      "[보험사에 물어볼 질문]",
      questions,
      "",
      "본 자료는 참고용이며 최종 지급 여부는 보험회사가 결정합니다.",
    ].join("\n")
  }

  const copyQuestions = async () => {
    try {
      await navigator.clipboard.writeText(activeCase.questions.join("\n"))
      toast.success("보험사에 물어볼 질문을 복사했습니다.")
    } catch {
      toast.error("복사하지 못했습니다. 다시 시도해 주세요.")
    }
  }

  const downloadPack = () => {
    const blob = new Blob([buildText()], {
      type: "text/plain;charset=utf-8",
    })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = `보험금-길잡이-${activeCase.shortTitle}-Action-Pack.txt`
    anchor.click()
    URL.revokeObjectURL(href)
    toast.success("Action Pack을 내려받았습니다.")
  }

  const sharePack = async () => {
    const shareText = buildText()
    try {
      if (navigator.share) {
        await navigator.share({
          title: activeCase.title,
          text: shareText,
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        toast.success("공유할 내용을 클립보드에 복사했습니다.")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      toast.error("공유하지 못했습니다. 다시 시도해 주세요.")
    }
  }

  return (
    <Card className="action-pack-card">
      <CardHeader>
        <CardTitle>{activeCase.actionTitle}</CardTitle>
        <CardDescription>
          Agent가 준비하고, 사용자가 공식 채널에서 확인할 항목입니다.
        </CardDescription>
        <CardAction>
          <FolderCheckIcon aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="action-pack-grid">
        <div>
          <strong>준비할 자료</strong>
          <ul>
            {activeCase.documents.map((item) => (
              <li key={item}>
                <FileCheck2Icon aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>보험사에 물어볼 질문</strong>
          <ol>
            {activeCase.questions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </CardContent>
      <CardFooter className="action-pack-actions">
        <Button variant="outline" onClick={copyQuestions}>
          <ClipboardCopyIcon data-icon="inline-start" />
          질문 복사
        </Button>
        <Button variant="outline" onClick={downloadPack}>
          <DownloadIcon data-icon="inline-start" />
          내려받기
        </Button>
        <Button variant="outline" onClick={sharePack}>
          <Share2Icon data-icon="inline-start" />
          결과 공유
        </Button>
      </CardFooter>
    </Card>
  )
}

export function AgentDemo() {
  const demoRef = useRef<HTMLElement>(null)
  const gsapRef = useRef<GsapRuntime | null>(null)
  const gsapContextRef = useRef<GsapContext | null>(null)
  const timelineRef = useRef<GSAPTimeline | null>(null)
  const requestIdRef = useRef(0)
  const [selectedId, setSelectedId] = useState<ClaimCase["id"]>("fracture")
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [activeStep, setActiveStep] = useState(0)
  const [results, setResults] = useState<ClaimResult[]>([])

  const activeCase = useMemo(
    () => claimCases.find((item) => item.id === selectedId) ?? claimCases[0],
    [selectedId],
  )

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const saved = readSavedSession()
      if (!saved) {
        return
      }
      setSelectedId(saved.caseId)
      setAnswer(saved.answer)
    }, 0)

    return () => window.clearTimeout(restoreTimer)
  }, [])

  useEffect(() => {
    let cancelled = false

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) {
        return
      }
      gsapRef.current = gsap
      gsapContextRef.current = gsap.context(() => {}, demoRef)
    })

    return () => {
      cancelled = true
      timelineRef.current?.kill()
      gsapContextRef.current?.revert()
      gsapContextRef.current = null
      gsapRef.current = null
      requestIdRef.current += 1
    }
  }, [])

  const animateResults = () => {
    requestAnimationFrame(() => {
      const gsap = gsapRef.current
      if (!gsap) {
        return
      }
      const targets =
        demoRef.current?.querySelectorAll(".result-accordion-item")
      if (!targets?.length) {
        return
      }
      gsapContextRef.current?.add(() => {
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform,opacity,visibility",
          },
        )
      })
    })
  }

  const playAnalysisTimeline = (
    payload: AnalysisResponse,
  ): GSAPTimeline | null => {
    const gsap = gsapRef.current
    if (!gsap) {
      return null
    }

    let timeline: GSAPTimeline | null = null
    gsapContextRef.current?.add(() => {
      timeline = gsap.timeline({
        defaults: { duration: 0.28, ease: "power2.out" },
        onComplete: () => {
          setResults(payload.results)
          setPhase("question")
          animateResults()
        },
      })

      analysisSteps.forEach((_, index) => {
        timeline!
          .call(() => setActiveStep(index))
          .fromTo(
            `[data-evidence-node="${index}"] .evidence-icon-wrap`,
            { scale: 0.88, y: 6 },
            {
              scale: 1.08,
              y: 0,
              yoyo: true,
              repeat: 1,
              overwrite: "auto",
            },
          )
          .to({}, { duration: 0.18 })
      })
    })

    return timeline
  }

  const startAnalysis = async () => {
    const requestId = ++requestIdRef.current
    timelineRef.current?.kill()
    setAnswer(null)
    setResults([])
    setActiveStep(0)
    setPhase("running")

    try {
      const payload = await requestAnalysis(selectedId, null)
      if (requestId !== requestIdRef.current) {
        return
      }

      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      if (media.matches) {
        setActiveStep(5)
        setResults(payload.results)
        setPhase("question")
        return
      }

      const timeline = playAnalysisTimeline(payload)
      if (!timeline) {
        setActiveStep(5)
        setResults(payload.results)
        setPhase("question")
        return
      }
      timelineRef.current = timeline
    } catch {
      if (requestId === requestIdRef.current) {
        setPhase("error")
        toast.error("분석을 완료하지 못했습니다.")
      }
    }
  }

  const applyAnswer = async (value: Answer) => {
    const requestId = ++requestIdRef.current
    setAnswer(value)
    setPhase("running")
    setActiveStep(4)

    try {
      const payload = await requestAnalysis(selectedId, value)
      if (requestId !== requestIdRef.current) {
        return
      }
      setResults(payload.results)
      setActiveStep(5)
      setPhase("complete")
      animateResults()
      toast.success("답변을 반영해 근거 경로를 갱신했습니다.")
    } catch {
      if (requestId === requestIdRef.current) {
        setPhase("error")
        toast.error("답변을 반영하지 못했습니다.")
      }
    }
  }

  const changeCase = (value: string) => {
    const nextCase = claimCases.find((item) => item.id === value)
    if (!nextCase) {
      return
    }
    requestIdRef.current += 1
    timelineRef.current?.kill()
    setSelectedId(nextCase.id)
    setAnswer(null)
    setResults([])
    setActiveStep(0)
    setPhase("idle")
  }

  const saveSession = () => {
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ caseId: selectedId, answer }),
      )
      toast.success("합성 사례 진행 상태를 이 기기에 저장했습니다.")
    } catch {
      toast.error("진행 상태를 저장하지 못했습니다.")
    }
  }

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
                    <Badge>1단계 · 사례 선택</Badge>
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
                    <Badge variant="warning">2단계 · 근거 분석</Badge>
                    <h3 id="journey-stage-title">
                      {analysisSteps[activeStep]} 정보를 확인하고 있습니다
                    </h3>
                    <p>
                      적용 약관 버전과 연결된 정의·지급·면책 조항을 순서대로
                      검토합니다.
                    </p>
                  </div>
                  <Progress
                    aria-label="Agent 근거 분석 진행률"
                    value={((activeStep + 1) / analysisSteps.length) * 100}
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
                    <Badge variant="warning">3단계 · 정보 확인</Badge>
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
                    <Badge variant="success">4단계 · 다음 행동</Badge>
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
