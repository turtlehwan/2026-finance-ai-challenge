import { runClaimGraph } from "@/lib/claim-guide/agent-graph"
import type { DocumentBundle } from "@/lib/claim-guide/documents"
import { CLAIM_STATUS } from "@/lib/claim-guide/types"

type EvaluationFixture = {
  id: string
  expectedVersionResolved: boolean
  expectedApproved: boolean
  bundle: DocumentBundle
}

export type EvaluationSummary = {
  dataset: {
    name: string
    evaluationType: "deterministic-regression"
    independentHoldout: number
    total: number
    supported: number
    unsupported: number
    generatedAt: string
  }
  metrics: {
    versionSelection: number
    evidenceCompleteness: number
    safeAbstention: number
    traceIntegrity: number
  }
  counts: {
    versionSelectionPassed: number
    evidenceCompletenessPassed: number
    safeAbstentionPassed: number
    traceIntegrityPassed: number
  }
  limitations: string[]
}

const supportedCodes = ["P400073", "P400074", "P400075", "P400076"]
const supportedDates = [
  "2025-04-03",
  "2025-04-17",
  "2025-05-10",
  "2025-05-22",
  "2025-06-04",
]

function makeBundle(input: {
  id: string
  productCode: string
  contractDate: string
  coverage: string | null
  diagnosisCode: string | null
}): DocumentBundle {
  const coverages = input.coverage ? [input.coverage] : []
  const diagnosisCodes = input.diagnosisCode ? [input.diagnosisCode] : []
  const combinedFacts = {
    productCode: input.productCode,
    contractDate: input.contractDate,
    coverages,
    diagnosisCodes,
    accidentDate: "2025-05-22",
    treatment: "부목 고정 후 통원 치료",
  }

  return {
    documents: [
      {
        filename: `${input.id}.txt`,
        mediaType: "text/plain",
        totalPages: null,
        characterCount: 120,
        kind: "mixed",
        maskedPreview: `${input.productCode} ${input.contractDate} ${input.coverage ?? ""} ${input.diagnosisCode ?? ""}`,
        piiMasked: false,
        facts: combinedFacts,
      },
    ],
    combinedFacts,
    warnings: [],
    processing: {
      originalStored: false,
      trainingUse: false,
      maxFiles: 2,
      maxFileSizeMb: 5,
    },
  }
}

export function buildEvaluationFixtures(): EvaluationFixture[] {
  return Array.from({ length: 50 }, (_, index) => {
    if (index < 30) {
      const id = `supported-${index + 1}`
      return {
        id,
        expectedVersionResolved: true,
        expectedApproved: true,
        bundle: makeBundle({
          id,
          productCode: supportedCodes[index % supportedCodes.length],
          contractDate: supportedDates[index % supportedDates.length],
          coverage: "무배당 생활재해보장특약Ⅱ 2504",
          diagnosisCode: index % 2 === 0 ? "S52.5" : "S52.9",
        }),
      }
    }

    if (index < 40) {
      const id = `unsupported-version-${index + 1}`
      return {
        id,
        expectedVersionResolved: false,
        expectedApproved: false,
        bundle: makeBundle({
          id,
          productCode: index % 2 === 0 ? "P999999" : "P400073",
          contractDate: index % 2 === 0 ? "2025-05-10" : "2025-06-05",
          coverage: "무배당 생활재해보장특약Ⅱ 2504",
          diagnosisCode: "S52.5",
        }),
      }
    }

    const id = `missing-critical-fact-${index + 1}`
    return {
      id,
      expectedVersionResolved: true,
      expectedApproved: false,
      bundle: makeBundle({
        id,
        productCode: "P400073",
        contractDate: "2025-05-10",
        coverage:
          index % 2 === 0 ? null : "무배당 생활재해보장특약Ⅱ 2504",
        diagnosisCode: index % 2 === 0 ? "S52.5" : "M25.5",
      }),
    }
  })
}

function percentage(passed: number, total: number) {
  return total ? Math.round((passed / total) * 1000) / 10 : 0
}

export async function evaluateClaimGraph(): Promise<EvaluationSummary> {
  const fixtures = buildEvaluationFixtures()
  const results = await Promise.all(
    fixtures.map(async (fixture) => ({
      fixture,
      result: await runClaimGraph({
        caseId: "fracture",
        answer: "no",
        documentBundle: fixture.bundle,
      }),
    })),
  )

  const versionSelectionPassed = results.filter(
    ({ fixture, result }) =>
      (result.policyResolution?.status === "resolved") ===
      fixture.expectedVersionResolved,
  ).length
  const approvedResults = results.filter(
    ({ fixture }) => fixture.expectedApproved,
  )
  const evidenceCompletenessPassed = approvedResults.filter(
    ({ result }) =>
      result.audit?.approved &&
      result.audit.versionMatched &&
      result.audit.citationValidated &&
      result.audit.exclusionIncluded,
  ).length
  const unsupportedResults = results.filter(
    ({ fixture }) => !fixture.expectedApproved,
  )
  const safeAbstentionPassed = unsupportedResults.filter(
    ({ result }) =>
      result.audit?.approved === false &&
      result.results.every(
        (claimResult) => claimResult.status === CLAIM_STATUS.unavailable,
      ),
  ).length
  const traceIntegrityPassed = results.filter(({ fixture, result }) => {
    const nodeIds = new Set(result.trace.map((event) => event.nodeId))
    const expectedLastStatus = fixture.expectedApproved
      ? "completed"
      : "blocked"
    return (
      nodeIds.has("case_analyst") &&
      nodeIds.has("document_tool") &&
      nodeIds.has("version_resolver") &&
      nodeIds.has("graph_retriever") &&
      nodeIds.has("evidence_auditor") &&
      nodeIds.has("action_planner") &&
      result.trace.at(-1)?.status === expectedLastStatus
    )
  }).length

  return {
    dataset: {
      name: "fracture-policy-v1",
      evaluationType: "deterministic-regression",
      independentHoldout: 0,
      total: fixtures.length,
      supported: approvedResults.length,
      unsupported: unsupportedResults.length,
      generatedAt: new Date().toISOString(),
    },
    metrics: {
      versionSelection: percentage(versionSelectionPassed, fixtures.length),
      evidenceCompleteness: percentage(
        evidenceCompletenessPassed,
        approvedResults.length,
      ),
      safeAbstention: percentage(
        safeAbstentionPassed,
        unsupportedResults.length,
      ),
      traceIntegrity: percentage(traceIntegrityPassed, fixtures.length),
    },
    counts: {
      versionSelectionPassed,
      evidenceCompletenessPassed,
      safeAbstentionPassed,
      traceIntegrityPassed,
    },
    limitations: [
      "우체국와이드건강보험 2504 생활재해보장특약Ⅱ의 골절 사례만 다룹니다.",
      "저희가 만든 고정 사례로 돌린 결과이며, 실제 보험금 지급 정확도가 아닙니다.",
      "보험사의 지급심사와 기존 청구 이력은 확인 범위 밖입니다.",
    ],
  }
}
