"use client"

import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useGSAP } from "@gsap/react"
import type { LucideIcon } from "lucide-react"
import {
  BotIcon,
  ClipboardCheckIcon,
  FileSearchIcon,
  ListChecksIcon,
  MessageCircleMoreIcon,
  MicIcon,
  RouteIcon,
  SendIcon,
  SquareIcon,
  UserRoundIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Answer, DemoPhase } from "@/lib/claim-guide/types"
import { cn } from "@/lib/utils"

export type AssistantView =
  | "task"
  | "case"
  | "trace"
  | "evidence"
  | "actions"

type SpeechRecognitionResultEvent = {
  results: {
    0?: {
      0?: {
        transcript?: string
      }
    }
  }
}

type SpeechRecognitionErrorEvent = {
  error?: string
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type ViewOption = {
  value: AssistantView
  label: string
  detail: string
  icon: LucideIcon
}

const phaseMessages: Record<DemoPhase, string> = {
  idle: "혼자 다 읽지 않으셔도 돼요. 이 사례에서 필요한 것부터 같이 볼게요.",
  running: "가입 당시 약관부터 차례로 찾고 있어요. 확인이 필요한 내용만 크게 보여드릴게요.",
  question: "한 가지만 더 여쭐게요. 답을 모르셔도 괜찮아요.",
  complete: "먼저 확인할 항목만 꺼내 두었어요. 근거나 준비 서류도 바로 보여드릴게요.",
  error: "분석을 끝내지 못했어요. 다시 시작할 수 있도록 현재 상태는 그대로 두었습니다.",
}

function getViewOptions(phase: DemoPhase): ViewOption[] {
  if (phase === "idle") {
    return [
      {
        value: "task",
        label: "지금 할 일",
        detail: "분석 시작",
        icon: ListChecksIcon,
      },
      {
        value: "case",
        label: "사례 정보",
        detail: "가입·진단 사실",
        icon: UserRoundIcon,
      },
    ]
  }

  if (phase === "running") {
    return [
      {
        value: "trace",
        label: "분석 과정",
        detail: "지금 확인 중",
        icon: RouteIcon,
      },
      {
        value: "case",
        label: "사례 정보",
        detail: "입력한 사실",
        icon: UserRoundIcon,
      },
    ]
  }

  if (phase === "question") {
    return [
      {
        value: "task",
        label: "한 가지 질문",
        detail: "답을 알려주세요",
        icon: MessageCircleMoreIcon,
      },
      {
        value: "evidence",
        label: "근거 경로",
        detail: "지금까지 확인",
        icon: FileSearchIcon,
      },
      {
        value: "case",
        label: "사례 정보",
        detail: "입력한 사실",
        icon: UserRoundIcon,
      },
    ]
  }

  if (phase === "complete") {
    return [
      {
        value: "task",
        label: "결과 요약",
        detail: "먼저 볼 항목",
        icon: ListChecksIcon,
      },
      {
        value: "evidence",
        label: "근거 원문",
        detail: "약관과 쪽수",
        icon: FileSearchIcon,
      },
      {
        value: "actions",
        label: "다음 행동",
        detail: "서류와 질문",
        icon: ClipboardCheckIcon,
      },
      {
        value: "trace",
        label: "분석 과정",
        detail: "Agent 실행 기록",
        icon: RouteIcon,
      },
    ]
  }

  return [
    {
      value: "task",
      label: "다시 시도",
      detail: "분석 재시작",
      icon: ListChecksIcon,
    },
  ]
}

function getQuickRequests(phase: DemoPhase) {
  if (phase === "idle") {
    return ["분석 시작해줘", "가입 정보를 먼저 보여줘"]
  }

  if (phase === "question") {
    return ["수술은 안 했어요", "지금까지 근거 보여줘"]
  }

  if (phase === "complete") {
    return ["가장 먼저 볼 것", "근거 약관 보여줘", "준비 서류 알려줘"]
  }

  return ["지금 어디까지 했어?", "입력한 사례 보여줘"]
}

function normalizeRequest(value: string) {
  return value.replaceAll(" ", "").toLowerCase()
}

function requestIncludes(request: string, words: string[]) {
  return words.some((word) => request.includes(word))
}

export function AdaptiveAssistant({
  activeView,
  answer,
  onAnswer,
  onStart,
  onViewChange,
  phase,
}: {
  activeView: AssistantView
  answer: Answer | null
  onAnswer: (answer: Answer) => void
  onStart: () => void
  onViewChange: (view: AssistantView) => void
  phase: DemoPhase
}) {
  const [input, setInput] = useState("")
  const [messageState, setMessageState] = useState<{
    phase: DemoPhase
    value: string
  } | null>(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const quickRequests = useMemo(() => getQuickRequests(phase), [phase])
  const message =
    messageState?.phase === phase ? messageState.value : phaseMessages[phase]
  const setCurrentMessage = useCallback(
    (value: string) => setMessageState({ phase, value }),
    [phase],
  )

  useEffect(() => {
    const supportTimer = window.setTimeout(() => {
      setSpeechSupported(
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
      )
    }, 0)

    return () => {
      window.clearTimeout(supportTimer)
      recognitionRef.current?.abort()
    }
  }, [])

  const handleRequest = useCallback(
    (rawValue: string) => {
      const value = rawValue.trim()
      if (!value) {
        return
      }

      const request = normalizeRequest(value)
      setInput("")

      if (
        phase === "idle" &&
        requestIncludes(request, ["분석", "시작", "봐줘", "확인해줘"])
      ) {
        setCurrentMessage("네, 가입 당시 약관부터 찾아볼게요.")
        onViewChange("task")
        onStart()
        return
      }

      if (phase === "question") {
        if (requestIncludes(request, ["아니오", "아니요", "안했", "않았"])) {
          onAnswer("no")
          onViewChange("task")
          setCurrentMessage(
            "수술하지 않은 것으로 이해했어요. 아래 선택이 맞는지 한 번만 확인해 주세요.",
          )
          return
        }

        if (requestIncludes(request, ["모르", "기억안", "잘모르"])) {
          onAnswer("unknown")
          onViewChange("task")
          setCurrentMessage(
            "모르는 상태로 남겨둘게요. 추정하지 않고 확인이 필요한 항목으로 정리합니다.",
          )
          return
        }

        if (requestIncludes(request, ["예", "했어요", "받았", "수술했"])) {
          onAnswer("yes")
          onViewChange("task")
          setCurrentMessage(
            "수술을 받은 것으로 이해했어요. 아래 선택이 맞는지 한 번만 확인해 주세요.",
          )
          return
        }
      }

      if (requestIncludes(request, ["근거", "약관", "조항", "쪽수"])) {
        onViewChange("evidence")
        setCurrentMessage("근거가 된 약관과 쪽수를 앞으로 가져왔어요.")
        return
      }

      if (requestIncludes(request, ["서류", "준비", "다음", "질문", "청구"])) {
        if (phase === "complete") {
          onViewChange("actions")
          setCurrentMessage(
            "보험사에 가기 전에 챙길 서류와 질문을 크게 보여드릴게요.",
          )
        } else {
          onViewChange("task")
          setCurrentMessage(
            "결과가 정리되면 필요한 서류와 질문만 따로 꺼내드릴게요.",
          )
        }
        return
      }

      if (requestIncludes(request, ["과정", "어디까지", "에이전트", "agent"])) {
        if (phase !== "idle" && phase !== "error") {
          onViewChange("trace")
          setCurrentMessage(
            "Agent가 확인한 순서를 지금 단계 중심으로 보여드릴게요.",
          )
        } else {
          setCurrentMessage(
            "분석을 시작하면 확인 과정을 단계별로 보여드릴게요.",
          )
        }
        return
      }

      if (requestIncludes(request, ["가입", "사례", "진단", "정보"])) {
        onViewChange("case")
        setCurrentMessage(
          "입력된 가입 정보와 진단 사실만 모아 보여드릴게요.",
        )
        return
      }

      if (requestIncludes(request, ["결과", "요약", "먼저", "항목"])) {
        onViewChange("task")
        setCurrentMessage(
          phase === "complete"
            ? "우선순위가 높은 확인 항목부터 다시 보여드릴게요."
            : phaseMessages[phase],
        )
        return
      }

      setCurrentMessage(
        "바로 찾지 못했어요. 아래에서 지금 보고 싶은 항목을 골라 주세요.",
      )
    },
    [onAnswer, onStart, onViewChange, phase, setCurrentMessage],
  )

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleRequest(input)
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setCurrentMessage(
        "이 브라우저에서는 음성 입력을 지원하지 않아요. 글로 입력해 주세요.",
      )
      return
    }

    const recognition = new Recognition()
    recognition.lang = "ko-KR"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => {
      setIsListening(true)
      setCurrentMessage("듣고 있어요. 평소 말하듯 말씀해 주세요.")
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setCurrentMessage(
        "음성을 알아듣지 못했어요. 글로 입력해도 같은 방식으로 동작합니다.",
      )
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (!transcript) {
        return
      }
      setInput(transcript)
      handleRequest(transcript)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  return (
    <section className="adaptive-assistant" aria-labelledby="assistant-title">
      <div className="assistant-intro">
        <span className="assistant-avatar" aria-hidden="true">
          <BotIcon />
        </span>
        <div>
          <span>나만의 보험 확인 비서</span>
          <h3 id="assistant-title">제가 옆에서 하나씩 같이 볼게요</h3>
          <p role="status" aria-live="polite">
            {message}
          </p>
        </div>
      </div>

      <form className="assistant-composer" onSubmit={submitRequest}>
        <Input
          id="assistant-request-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={quickRequests[0]}
          aria-label="보험 확인 비서에게 요청하기"
        />
        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="icon-lg"
          onClick={toggleListening}
          disabled={!speechSupported}
          aria-label={isListening ? "음성 듣기 중지" : "음성으로 요청하기"}
          aria-pressed={isListening}
        >
          {isListening ? <SquareIcon /> : <MicIcon />}
        </Button>
        <Button type="submit" disabled={!input.trim()}>
          <SendIcon data-icon="inline-start" />
          요청하기
        </Button>
      </form>

      <div className="assistant-quick-requests" aria-label="빠른 요청">
        {quickRequests.map((request) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRequest(request)}
            key={request}
          >
            {request}
          </Button>
        ))}
      </div>

      <p className="assistant-privacy-note">
        {speechSupported
          ? "마이크는 누를 때만 켜집니다. 브라우저에 따라 음성이 외부 인식 서비스로 전송될 수 있습니다."
          : "현재 브라우저에서는 음성 입력을 지원하지 않아 글로 요청할 수 있습니다."}
      </p>

      <span className="sr-only">
        현재 보기: {activeView}, 현재 답변: {answer ?? "선택 안 함"}
      </span>
    </section>
  )
}

export function AdaptiveAssistantWorkspace({
  activeView,
  children,
  focusRef,
  onAsk,
  onViewChange,
  phase,
}: {
  activeView: AssistantView
  children: ReactNode
  focusRef: RefObject<HTMLElement | null>
  onAsk: () => void
  onViewChange: (view: AssistantView) => void
  phase: DemoPhase
}) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const gsapRef = useRef<typeof import("gsap").default | null>(null)
  const [motionReady, setMotionReady] = useState(false)
  const viewOptions = useMemo(() => getViewOptions(phase), [phase])

  useEffect(() => {
    let cancelled = false

    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) {
        return
      }
      gsap.registerPlugin(useGSAP)
      gsapRef.current = gsap
      setMotionReady(true)
    })

    return () => {
      cancelled = true
      gsapRef.current = null
    }
  }, [])

  useGSAP(
    () => {
      const gsap = gsapRef.current
      if (
        !gsap ||
        !motionReady ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return
      }

      gsap.fromTo(
        ".assistant-focus-content",
        { autoAlpha: 0, y: 18, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.38,
          ease: "power2.out",
          clearProps: "transform,opacity,visibility",
        },
      )
    },
    {
      dependencies: [activeView, phase, motionReady],
      scope: scopeRef,
      revertOnUpdate: true,
    },
  )

  return (
    <div className="assistant-workspace" ref={scopeRef}>
      <nav className="assistant-view-nav" aria-label="지금 크게 볼 내용">
        {viewOptions.map((option) => {
          const Icon = option.icon
          const isActive = option.value === activeView

          return (
            <button
              type="button"
              className={cn("assistant-view-button", isActive && "is-active")}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onViewChange(option.value)}
              key={option.value}
            >
              <Icon aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
            </button>
          )
        })}
        <button
          type="button"
          className="assistant-view-button assistant-ask-button"
          onClick={onAsk}
        >
          <MessageCircleMoreIcon aria-hidden="true" />
          <span>
            <strong>다른 요청</strong>
            <small>글 또는 음성</small>
          </span>
        </button>
      </nav>

      <section
        className="assistant-focus-surface"
        id="assistant-focus-panel"
        aria-label="지금 필요한 내용"
        tabIndex={-1}
        ref={focusRef}
      >
        <div className="assistant-focus-content" key={`${phase}-${activeView}`}>
          {children}
        </div>
      </section>
    </div>
  )
}
