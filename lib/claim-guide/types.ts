export type Answer = "yes" | "no" | "unknown"

export type ResultTone = "positive" | "warning" | "muted" | "blocked"

export type ClaimResult = {
  title: string
  status: string
  tone: ResultTone
  reason: string
  detail: string
  clause: string
}

export type EvidenceNode = {
  label: string
  meta: string
  warning?: boolean
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
