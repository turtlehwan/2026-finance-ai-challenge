"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { claimCases, answerOptions } from "@/lib/claim-guide/cases"
import type { DocumentBundle } from "@/lib/claim-guide/documents"
import { ANALYSIS_STEPS } from "@/lib/claim-guide/presentation"
import type {
  AgentTraceEvent,
  AnalysisResponse,
  Answer,
  ClaimCase,
  ClaimResult,
  DemoPhase,
  PolicySource,
} from "@/lib/claim-guide/types"

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
  documentBundle: DocumentBundle | null,
): Promise<AnalysisResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, answer, documentBundle }),
  })

  if (!response.ok) {
    throw new Error("분석 응답을 불러오지 못했습니다.")
  }

  return (await response.json()) as AnalysisResponse
}

export function useClaimAnalysis(documentBundle: DocumentBundle | null) {
  const demoRef = useRef<HTMLElement>(null)
  const gsapRef = useRef<GsapRuntime | null>(null)
  const gsapContextRef = useRef<GsapContext | null>(null)
  const timelineRef = useRef<GSAPTimeline | null>(null)
  const requestIdRef = useRef(0)
  const [selectedId, setSelectedId] = useState<ClaimCase["id"]>("fracture")
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [phase, setPhase] = useState<DemoPhase>("idle")
  const [activeStep, setActiveStep] = useState(0)
  const [activeTraceIndex, setActiveTraceIndex] = useState(0)
  const [trace, setTrace] = useState<AgentTraceEvent[]>([])
  const [results, setResults] = useState<ClaimResult[]>([])
  const [sources, setSources] = useState<PolicySource[]>([])

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
      const targets =
        demoRef.current?.querySelectorAll(".result-accordion-item")

      if (!gsap || !targets?.length) {
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

      payload.trace.forEach((_, index) => {
        timeline!
          .call(() => {
            setActiveTraceIndex(index)
            setActiveStep(Math.min(index, ANALYSIS_STEPS.length - 1))
          })
          .fromTo(
            `[data-id="${payload.trace[index].nodeId}"] [data-agent-pulse]`,
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
    setSources([])
    setTrace([])
    setActiveTraceIndex(0)
    setActiveStep(0)
    setPhase("running")

    try {
      const payload = await requestAnalysis(selectedId, null, documentBundle)
      if (requestId !== requestIdRef.current) {
        return
      }

      setTrace(payload.trace)
      setSources(payload.sources)

      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      if (media.matches) {
        setActiveStep(ANALYSIS_STEPS.length - 1)
        setActiveTraceIndex(payload.trace.length - 1)
        setResults(payload.results)
        setPhase("question")
        return
      }

      const timeline = playAnalysisTimeline(payload)
      if (!timeline) {
        setActiveStep(ANALYSIS_STEPS.length - 1)
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
    setActiveStep(ANALYSIS_STEPS.length - 2)

    try {
      const payload = await requestAnalysis(
        selectedId,
        value,
        documentBundle,
      )
      if (requestId !== requestIdRef.current) {
        return
      }
      setResults(payload.results)
      setTrace(payload.trace)
      setSources(payload.sources)
      setActiveTraceIndex(payload.trace.length - 1)
      setActiveStep(ANALYSIS_STEPS.length - 1)
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
    setSources([])
    setTrace([])
    setActiveTraceIndex(0)
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

  return {
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
  }
}
