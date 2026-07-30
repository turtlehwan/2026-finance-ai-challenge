import { CheckCircle2Icon } from "lucide-react"

import { journeyPresentation } from "@/components/claim-guide/journey-presentation"
import { Progress } from "@/components/ui/progress"
import type { DemoPhase } from "@/lib/claim-guide/types"

function getJourneyStep(phase: DemoPhase) {
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

export function JourneyProgress({ phase }: { phase: DemoPhase }) {
  const currentStep = getJourneyStep(phase)
  const currentJourney = journeyPresentation[currentStep]

  return (
    <div className="journey-progress-wrap">
      <div className="journey-progress-copy">
        <span>
          {currentStep + 1} / {journeyPresentation.length}
        </span>
        <strong>{currentJourney.label}</strong>
      </div>
      <Progress
        aria-label={`분석 여정 ${currentJourney.label}`}
        value={((currentStep + 1) / journeyPresentation.length) * 100}
      />
      <ol className="journey-progress" aria-label="보험금 확인 단계">
        {journeyPresentation.map((step, index) => {
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
              key={step.id}
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
