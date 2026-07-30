export type Answer = "yes" | "no" | "unknown"

export type ResultTone = "positive" | "warning" | "muted" | "blocked"

export const CLAIM_STATUS = {
  recommended: "확인 권장",
  informationRequired: "정보 필요",
  lowLikelihood: "가능성 낮음",
  unavailable: "확인 불가",
} as const

export type ClaimStatus = (typeof CLAIM_STATUS)[keyof typeof CLAIM_STATUS]

export type DemoPhase = "idle" | "running" | "question" | "complete" | "error"

export type ClaimResult = {
  title: string
  status: ClaimStatus
  tone: ResultTone
  reason: string
  detail: string
  clause: string
  citations?: EvidenceCitation[]
}

export type EvidenceNode = {
  label: string
  meta: string
  warning?: boolean
}

export type EvidenceCitation = {
  sourceTitle: string
  sourceUrl: string
  page: number
  article: string
  excerpt: string
}

export type ClaimCase = {
  id: "fracture" | "maturity" | "exclusion"
  title: string
  shortTitle: string
  description: string
  category: string
  question: string
  questionHint: string
  facts: { label: string; value: string }[]
  evidence: EvidenceNode[]
  actionTitle: string
  documents: string[]
  questions: string[]
}

export type AnalysisResponse = {
  caseId: ClaimCase["id"]
  answer: Answer | null
  needsAnswer: boolean
  results: ClaimResult[]
  generatedAt: string
}
