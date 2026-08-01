import { Annotation, END, START, StateGraph } from "@langchain/langgraph"

import { buildResults, getClaimCase } from "@/lib/claim-guide/cases"
import type { DocumentBundle } from "@/lib/claim-guide/documents"
import {
  getFractureEvidence,
  resolvePolicyVersion,
  type PolicyClause,
  type PolicyResolution,
} from "@/lib/claim-guide/policies"
import {
  getStandardTermsEvidence,
  STANDARD_TERMS_SOURCE,
} from "@/lib/claim-guide/standard-terms"
import {
  CLAIM_STATUS,
  type AgentTraceEvent,
  type AnalysisResponse,
  type Answer,
  type ClaimCase,
  type ClaimResult,
  type EvidenceAudit,
} from "@/lib/claim-guide/types"

type GraphFacts = {
  productCode: string | null
  contractDate: string | null
  coverages: string[]
  diagnosisCodes: string[]
  accidentDate: string | null
  treatment: string | null
}

const emptyFacts: GraphFacts = {
  productCode: null,
  contractDate: null,
  coverages: [],
  diagnosisCodes: [],
  accidentDate: null,
  treatment: null,
}

const answerLabels: Record<Answer, string> = {
  yes: "예",
  no: "아니오",
  unknown: "잘 모르겠어요",
}

function getAnswerLabel(answer: Answer | null) {
  return answer ? answerLabels[answer] : "미확인"
}

const ClaimGraphState = Annotation.Root({
  caseId: Annotation<ClaimCase["id"]>(),
  answer: Annotation<Answer | null>(),
  documentBundle: Annotation<DocumentBundle | null>(),
  facts: Annotation<GraphFacts>(),
  resolution: Annotation<PolicyResolution | null>(),
  evidence: Annotation<PolicyClause[]>(),
  results: Annotation<ClaimResult[]>(),
  trace: Annotation<AgentTraceEvent[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  needsAnswer: Annotation<boolean>(),
  audit: Annotation<EvidenceAudit | null>(),
})

type ClaimGraphStateValue = typeof ClaimGraphState.State

function elapsed(startedAt: number) {
  return Math.max(1, Math.round(performance.now() - startedAt))
}

function traceEvent(
  event: Omit<AgentTraceEvent, "durationMs">,
  startedAt: number,
) {
  return {
    ...event,
    durationMs: elapsed(startedAt),
  }
}

function caseAnalystAgent(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const claimCase = getClaimCase(state.caseId)

  return {
    trace: [
      traceEvent(
        {
          nodeId: "case_analyst",
          label: "사건 분석",
          role: "Agent",
          status: "completed",
          inputSummary: "사용자 목표·사고·진단 맥락",
          outputSummary: `${claimCase.shortTitle} 사건 목표 구조화`,
        },
        startedAt,
      ),
    ],
  }
}

function documentNormalizerTool(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const bundleFacts = state.documentBundle?.combinedFacts
  const isFracture = state.caseId === "fracture"
  const facts: GraphFacts = bundleFacts
    ? {
        productCode: bundleFacts.productCode,
        contractDate: bundleFacts.contractDate,
        coverages: bundleFacts.coverages,
        diagnosisCodes: bundleFacts.diagnosisCodes,
        accidentDate: bundleFacts.accidentDate,
        treatment: bundleFacts.treatment,
      }
    : isFracture
      ? {
          productCode: "P400073",
          contractDate: "2025-05-10",
          coverages: ["무배당 생활재해보장특약Ⅱ 2504"],
          diagnosisCodes: ["S52.5"],
          accidentDate: "2025-05-22",
          treatment: "부목 고정 후 통원 치료",
        }
      : emptyFacts

  return {
    facts,
    trace: [
      traceEvent(
        {
          nodeId: "document_tool",
          label: "문서 판독",
          role: "Tool",
          status: "completed",
          inputSummary: state.documentBundle
            ? `${state.documentBundle.documents.length}개 사용자 문서`
            : "비식별 준비 사례",
          outputSummary: [
            facts.productCode,
            facts.contractDate,
            facts.diagnosisCodes.join(", "),
          ]
            .filter(Boolean)
            .join(" · ") || "추출 가능한 계약·진료 사실 없음",
        },
        startedAt,
      ),
    ],
  }
}

function versionResolverTool(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const resolution = resolvePolicyVersion(
    state.facts.productCode ?? "",
    state.facts.contractDate ?? "",
  )

  return {
    resolution,
    trace: [
      traceEvent(
        {
          nodeId: "version_resolver",
          label: "약관 버전 확인",
          role: "Tool",
          status:
            resolution.status === "resolved" ? "completed" : "attention",
          inputSummary: `${state.facts.productCode ?? "상품코드 없음"} · ${state.facts.contractDate ?? "계약일 없음"}`,
          outputSummary:
            resolution.status === "resolved"
              ? `${resolution.policy.versionLabel} 약관 · ${resolution.policy.effectiveStart}~${resolution.policy.effectiveEnd}`
              : resolution.reason,
        },
        startedAt,
      ),
    ],
  }
}

function coverageMatcherAgent(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const hasRider = state.facts.coverages.some((coverage) =>
    coverage.includes("생활재해보장특약"),
  )
  const hasFractureCode = state.facts.diagnosisCodes.some((code) =>
    code.startsWith("S52"),
  )

  return {
    trace: [
      traceEvent(
        {
          nodeId: "coverage_matcher",
          label: "담보 대조",
          role: "Agent",
          status:
            state.caseId !== "fracture" || (hasRider && hasFractureCode)
              ? "completed"
              : "attention",
          inputSummary: `${state.facts.coverages.length}개 특약 · ${state.facts.diagnosisCodes.join(", ") || "진단코드 없음"}`,
          outputSummary:
            hasRider && hasFractureCode
              ? "생활재해 특약 ↔ S52 골절 후보 연결"
              : state.caseId === "fracture"
                ? "특약 또는 S52 진단 근거 추가 필요"
                : "합성 안전 시나리오 규칙 연결",
        },
        startedAt,
      ),
    ],
  }
}

function graphRetrievalTool(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const evidence =
    state.caseId === "fracture" &&
    state.resolution?.status === "resolved" &&
    state.resolution.policy.evidenceReady
      ? [...getFractureEvidence(), ...getStandardTermsEvidence()]
      : []
  const clauseTypes = new Set(evidence.map((clause) => clause.type))

  return {
    evidence,
    trace: [
      traceEvent(
        {
          nodeId: "graph_retriever",
          label: "근거 그래프 검색",
          role: "Tool",
          status:
            state.caseId !== "fracture" || evidence.length
              ? "completed"
              : "attention",
          inputSummary:
            state.resolution?.status === "resolved"
              ? `${state.resolution.policy.id} · S52`
              : "검증된 약관 버전 없음",
          outputSummary: evidence.length
            ? `${evidence.length}개 근거 · ${clauseTypes.size}개 관계 유형 확장`
            : "관계 확장 근거 없음",
        },
        startedAt,
      ),
    ],
  }
}

function informationGate(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const needsAnswer = state.answer === null

  return {
    needsAnswer,
    trace: [
      traceEvent(
        {
          nodeId: "information_gate",
          label: "정보 충분성 판단",
          role: "Gate",
          status: needsAnswer ? "waiting" : "completed",
          inputSummary: "수술·면책·기존 처리 사실",
          outputSummary: needsAnswer
            ? "사용자 확인이 필요한 질문 1건"
            : `사용자 답변 반영: ${getAnswerLabel(state.answer)}`,
        },
        startedAt,
      ),
    ],
  }
}

function humanReviewNode(state: ClaimGraphStateValue) {
  const startedAt = performance.now()

  return {
    results: buildResults(state.caseId, null),
    trace: [
      traceEvent(
        {
          nodeId: "human_review",
          label: "사람 확인",
          role: "Human",
          status: "waiting",
          inputSummary: "Agent가 식별한 누락 정보",
          outputSummary: getClaimCase(state.caseId).question,
        },
        startedAt,
      ),
    ],
  }
}

function evidenceAuditorAgent(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const isFracture = state.caseId === "fracture"
  const types = new Set(state.evidence.map((clause) => clause.type))
  const versionMatched = state.resolution?.status === "resolved"
  const citationValidated =
    state.evidence.length > 0 &&
    state.evidence.every(
      (clause) =>
        (clause.sourceUrl.startsWith("https://www.epostlife.go.kr/") ||
          clause.sourceUrl.startsWith("https://www.law.go.kr/")) &&
        clause.page > 0 &&
        clause.article.length > 0,
    )
  const coverageAndLimits =
    types.has("coverage") &&
    types.has("definition") &&
    types.has("limitation") &&
    types.has("exclusion") &&
    types.has("classification")
  const caseFactsMatched =
    !isFracture ||
    (state.facts.coverages.some((coverage) =>
      coverage.includes("생활재해보장특약"),
    ) &&
      state.facts.diagnosisCodes.some((code) => code.startsWith("S52")))
  const approved = isFracture
    ? Boolean(
        versionMatched &&
          citationValidated &&
          coverageAndLimits &&
          caseFactsMatched,
      )
    : true
  const findings = approved
    ? [
        "계약일 기준 약관 버전 확인",
        "지급·정의·제한·면책 근거 동반",
        "공식 원문 URL·페이지 확인",
        "지급 확정 표현 없음",
      ]
    : [
        !versionMatched ? "적용 약관 버전 미확인" : "",
        !coverageAndLimits ? "지급·면책 근거 경로 불완전" : "",
        !caseFactsMatched ? "가입특약 또는 S52 진단 근거 미확인" : "",
        !citationValidated ? "공식 원문 인용 검증 실패" : "",
      ].filter(Boolean)
  const audit: EvidenceAudit = {
    approved,
    versionMatched,
    citationValidated,
    exclusionIncluded: types.has("exclusion") || !isFracture,
    standardTermsIncluded:
      !isFracture ||
      state.evidence.some((clause) =>
        clause.sourceUrl.startsWith("https://www.law.go.kr/"),
      ),
    findings,
  }

  return {
    audit,
    trace: [
      traceEvent(
        {
          nodeId: "evidence_auditor",
          label: "근거 감사",
          role: "Agent",
          status: approved ? "completed" : "blocked",
          inputSummary: `${state.evidence.length}개 근거 · 사용자 답변 ${getAnswerLabel(state.answer)}`,
          outputSummary: approved
            ? "4개 안전성 검사 통과"
            : findings.join(" · "),
        },
        startedAt,
      ),
    ],
  }
}

function actionPlannerAgent(state: ClaimGraphStateValue) {
  const startedAt = performance.now()
  const baseResults = buildResults(state.caseId, state.answer)
  const results =
    state.caseId === "fracture" && !state.audit?.approved
      ? baseResults.map((result) => ({
          ...result,
          status: CLAIM_STATUS.unavailable,
          tone: "blocked" as const,
          reason: "검증된 적용 약관과 근거 경로가 완성되지 않았습니다.",
          detail:
            "상품코드·계약일·가입특약·진단코드를 확인한 뒤 다시 분석해 주세요.",
        }))
      : baseResults

  return {
    results,
    trace: [
      traceEvent(
        {
          nodeId: "action_planner",
          label: "다음 행동 정리",
          role: "Agent",
          status: state.audit?.approved ? "completed" : "blocked",
          inputSummary: `${baseResults.length}개 후보 · Evidence Audit`,
          outputSummary: state.audit?.approved
            ? `${results.length}개 상태와 준비물 목록 생성`
            : "확인 불가 상태로 안전 종료",
        },
        startedAt,
      ),
    ],
  }
}

const claimGraph = new StateGraph(ClaimGraphState)
  .addNode("case_analyst", caseAnalystAgent)
  .addNode("document_tool", documentNormalizerTool)
  .addNode("version_resolver", versionResolverTool)
  .addNode("coverage_matcher", coverageMatcherAgent)
  .addNode("graph_retriever", graphRetrievalTool)
  .addNode("information_gate", informationGate)
  .addNode("human_review", humanReviewNode)
  .addNode("evidence_auditor", evidenceAuditorAgent)
  .addNode("action_planner", actionPlannerAgent)
  .addEdge(START, "case_analyst")
  .addEdge("case_analyst", "document_tool")
  .addEdge("document_tool", "version_resolver")
  .addEdge("version_resolver", "coverage_matcher")
  .addEdge("coverage_matcher", "graph_retriever")
  .addEdge("graph_retriever", "information_gate")
  .addConditionalEdges(
    "information_gate",
    (state) => (state.needsAnswer ? "human_review" : "evidence_auditor"),
    ["human_review", "evidence_auditor"],
  )
  .addEdge("human_review", END)
  .addEdge("evidence_auditor", "action_planner")
  .addEdge("action_planner", END)
  .compile()

export async function runClaimGraph(input: {
  caseId: ClaimCase["id"]
  answer: Answer | null
  documentBundle?: DocumentBundle | null
}): Promise<AnalysisResponse> {
  const state = await claimGraph.invoke({
    caseId: input.caseId,
    answer: input.answer,
    documentBundle: input.documentBundle ?? null,
    facts: emptyFacts,
    resolution: null,
    evidence: [],
    results: [],
    needsAnswer: input.answer === null,
    audit: null,
  })

  return {
    caseId: state.caseId,
    answer: state.answer,
    needsAnswer: state.needsAnswer,
    results: state.results,
    trace: state.trace,
    audit: state.audit,
    policyResolution: state.resolution,
    sources:
      state.caseId === "fracture" && state.resolution?.status === "resolved"
        ? [state.resolution.policy.source, STANDARD_TERMS_SOURCE]
        : [],
    dataMode:
      state.documentBundle && state.documentBundle.documents.length
        ? "user-document"
        : state.caseId === "fracture"
          ? "official-sample"
          : "synthetic-safety-case",
    generatedAt: new Date().toISOString(),
  }
}
