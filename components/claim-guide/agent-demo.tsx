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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
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

const caseIcons: LucideIcon[] = [
  BoneIcon,
  CalendarClockIcon,
  ShieldAlertIcon,
]

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
      <Badge variant="warning">추가 확인 {counts.warning}</Badge>
      <Badge variant="secondary">가능성 낮음 {counts.muted}</Badge>
      <Badge variant="destructive">확인 불가 {counts.blocked}</Badge>
    </div>
  )
}

function CaseFacts({ activeCase }: { activeCase: ClaimCase }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>사례 사실 관계</CardTitle>
        <CardDescription>{activeCase.category}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="fact-list">
          {activeCase.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
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
        <AlertTitle>분석을 시작할 준비가 됐습니다</AlertTitle>
        <AlertDescription>
          왼쪽 사례 정보를 확인한 뒤 Agent 분석 시작을 눌러주세요.
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
        <Button onClick={sharePack}>
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
  const [selectedId, setSelectedId] =
    useState<ClaimCase["id"]>("fracture")
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
      gsapContextRef.current?.add(() => {
        gsap.fromTo(
          ".result-accordion-item",
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

  const hasResults = phase === "question" || phase === "complete"

  return (
    <section className="section-shell demo-section" id="demo" ref={demoRef}>
      <div className="section-heading">
        <div>
          <h2>Agent 분석 데모</h2>
          <p>
            준비된 합성 사례를 선택하면 실제 서버 요청과 단계별 검증 흐름이
            작동합니다.
          </p>
        </div>
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
          <TooltipContent>개인정보 없이 사례 선택만 저장합니다</TooltipContent>
        </Tooltip>
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
            <ToggleGroupItem value={claimCase.id} key={claimCase.id}>
              <Icon data-icon="inline-start" />
              {claimCase.shortTitle}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <div className="demo-grid">
        <div className="case-column">
          <Card>
            <CardHeader>
              <CardTitle>{activeCase.title}</CardTitle>
              <CardDescription>{activeCase.description}</CardDescription>
              <CardAction>
                <Badge variant="outline">합성 데이터</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <CaseFacts activeCase={activeCase} />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={startAnalysis}
                disabled={phase === "running"}
              >
                {phase === "running" ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
                {phase === "running" ? "Agent 분석 중" : "Agent 분석 시작"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="analysis-column">
          <Card>
            <CardHeader>
              <CardTitle>Agent 분석 진행 상황</CardTitle>
              <CardDescription>
                목표 이해부터 다음 행동까지 6단계로 확인합니다.
              </CardDescription>
              <CardAction>
                <Badge variant={phase === "running" ? "warning" : "outline"}>
                  {phase === "running"
                    ? "분석 중"
                    : hasResults
                      ? "검증 완료"
                      : "대기"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="analysis-progress">
              <Progress
                aria-label="Agent 분석 진행률"
                value={
                  phase === "idle"
                    ? 0
                    : ((activeStep + 1) / analysisSteps.length) * 100
                }
              />
              <EvidenceRail
                compact
                items={activeCase.evidence}
                activeStep={activeStep}
                onSelect={hasResults ? setActiveStep : undefined}
              />
              {phase === "question" || phase === "complete" ? (
                <Alert className="agent-question">
                  <ScaleIcon />
                  <AlertTitle>Agent 확인 질문</AlertTitle>
                  <AlertDescription>
                    <strong>{activeCase.question}</strong>
                    <span>{activeCase.questionHint}</span>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={answer ?? ""}
                      onValueChange={(value) => {
                        if (value) {
                          void applyAnswer(value as Answer)
                        }
                      }}
                      aria-label="추가 정보 답변"
                    >
                      {answerOptions.map((option) => (
                        <ToggleGroupItem
                          value={option.value}
                          key={option.value}
                        >
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <ClipboardCheckIcon />
                  <AlertTitle>
                    {phase === "running"
                      ? `${analysisSteps[activeStep]} 단계 진행 중`
                      : "근거가 부족하면 질문하고 멈춥니다"}
                  </AlertTitle>
                  <AlertDescription>
                    보상 조항만 찾지 않고 정의·면책·사용자 사실을 함께
                    검토합니다.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="result-column">
          <Card>
            <CardHeader>
              <CardTitle>분석 결과 요약</CardTitle>
              <CardDescription>
                지급 확정 대신 확인 우선순위와 근거를 보여줍니다.
              </CardDescription>
              <CardAction>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="결과 판정 기준"
                    >
                      <InfoIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    결과는 합성 약관·사례를 기준으로 생성됩니다
                  </TooltipContent>
                </Tooltip>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ResultsPanel results={results} phase={phase} />
            </CardContent>
          </Card>
        </div>
      </div>

      {hasResults ? (
        <div className="action-pack-reveal">
          <ActionPack activeCase={activeCase} results={results} />
          <Button variant="outline" size="lg" asChild>
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
        <AlertTitle>이 데모가 실제로 하는 일</AlertTitle>
        <AlertDescription>
          합성 사례를 서버에서 판정 규칙과 대조하고, 답변에 따라 결과·근거·
          Action Pack을 갱신합니다. 실제 보험금 지급 여부는 판단하지
          않습니다.
        </AlertDescription>
      </Alert>
    </section>
  )
}
