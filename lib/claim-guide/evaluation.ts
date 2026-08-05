import manualHoldout from "@/data/evaluation/holdout-v1.json"
import { runClaimGraph } from "@/lib/claim-guide/agent-graph"
import type { DocumentBundle } from "@/lib/claim-guide/documents"
import { CLAIM_STATUS, type ClaimCase } from "@/lib/claim-guide/types"

type EvaluationFixture = {
  id: string
  caseId: ClaimCase["id"]
  expectedVersionResolved: boolean
  expectedApproved: boolean
  bundle: DocumentBundle
}

export type EvaluationDataset = {
  name: string
  evaluationType: "deterministic-regression" | "manual-labelled-holdout"
  independentHoldout: number
  total: number
  supported: number
  unsupported: number
  generatedAt: string
  labelMethod?: string
}

export type EvaluationCounts = {
  versionSelectionPassed: number
  evidenceCompletenessPassed: number
  safeAbstentionPassed: number
  traceIntegrityPassed: number
}

export type EvaluationMetrics = {
  versionSelection: number
  evidenceCompleteness: number
  safeAbstention: number
  traceIntegrity: number
}

export type EvaluationSummary = {
  dataset: EvaluationDataset
  metrics: EvaluationMetrics
  counts: EvaluationCounts
  holdout: {
    dataset: EvaluationDataset
    metrics: EvaluationMetrics
    counts: EvaluationCounts
  }
  limitations: string[]
}

const fracture2112Codes = ["P400051", "P400052", "P400053", "P400054"]
const fracture2504Codes = ["P400073", "P400074", "P400075", "P400076"]
const fracture2112Dates = ["2021-12-01", "2023-03-08", "2024-02-14", "2025-04-02"]
const fracture2504Dates = ["2025-04-03", "2025-04-17", "2025-05-10", "2025-06-04"]
const hospitalizationDates = ["2021-12-01", "2022-08-20", "2023-06-11", "2024-03-20"]

function makeBundle(input: {
  id: string
  productCode: string
  contractDate: string
  coverage: string | null
  diagnosisCode: string | null
  hospitalDays?: number | null
}): DocumentBundle {
  const coverages = input.coverage ? [input.coverage] : []
  const diagnosisCodes = input.diagnosisCode ? [input.diagnosisCode] : []
  const hospitalDays = input.hospitalDays ?? null
  const combinedFacts = {
    productCode: input.productCode,
    contractDate: input.contractDate,
    coverages,
    diagnosisCodes,
    accidentDate: "2025-05-22",
    treatment:
      hospitalDays === null
        ? "부목 고정 후 통원 치료"
        : `직접 치료를 위해 ${hospitalDays}일 입원`,
    hospitalDays,
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
      ai: {
        conversion: "text-parser",
        interpretation: "not-requested",
        model: null,
      },
    },
  }
}

/**
 * 반복 실행에서 버전·근거·안전 중단이 바뀌지 않는지 보는 내부 회귀 fixture다.
 * 사용자 분포나 실제 보험금 지급 결과를 표본화한 데이터가 아니다.
 */
export function buildEvaluationFixtures(): EvaluationFixture[] {
  const fixtures: EvaluationFixture[] = []

  for (let index = 0; index < 12; index += 1) {
    fixtures.push({
      id: `fracture-2112-${index + 1}`,
      caseId: "fracture",
      expectedVersionResolved: true,
      expectedApproved: true,
      bundle: makeBundle({
        id: `fracture-2112-${index + 1}`,
        productCode: fracture2112Codes[index % fracture2112Codes.length],
        contractDate: fracture2112Dates[index % fracture2112Dates.length],
        coverage: "무배당 생활재해보장특약Ⅱ 2112",
        diagnosisCode: index % 2 ? "S52.5" : "S52.9",
      }),
    })
  }

  for (let index = 0; index < 12; index += 1) {
    fixtures.push({
      id: `fracture-2504-${index + 1}`,
      caseId: "fracture",
      expectedVersionResolved: true,
      expectedApproved: true,
      bundle: makeBundle({
        id: `fracture-2504-${index + 1}`,
        productCode: fracture2504Codes[index % fracture2504Codes.length],
        contractDate: fracture2504Dates[index % fracture2504Dates.length],
        coverage: "무배당 생활재해보장특약Ⅱ 2504",
        diagnosisCode: index % 2 ? "S52.5" : "S52.9",
      }),
    })
  }

  for (let index = 0; index < 12; index += 1) {
    fixtures.push({
      id: `hospitalization-2112-${index + 1}`,
      caseId: "hospitalization",
      expectedVersionResolved: true,
      expectedApproved: true,
      bundle: makeBundle({
        id: `hospitalization-2112-${index + 1}`,
        productCode: "P600107",
        contractDate: hospitalizationDates[index % hospitalizationDates.length],
        coverage: "입원보험금 · 수술보험금",
        diagnosisCode: "S52.5",
        hospitalDays: 4 + (index % 5),
      }),
    })
  }

  for (let index = 0; index < 7; index += 1) {
    const isUnknownCode = index % 2 === 0
    fixtures.push({
      id: `unsupported-version-${index + 1}`,
      caseId: isUnknownCode ? "fracture" : "hospitalization",
      expectedVersionResolved: false,
      expectedApproved: false,
      bundle: makeBundle({
        id: `unsupported-version-${index + 1}`,
        productCode: isUnknownCode ? "P999999" : "P600107",
        contractDate: isUnknownCode ? "2025-05-10" : "2025-04-03",
        coverage: isUnknownCode
          ? "무배당 생활재해보장특약Ⅱ 2504"
          : "입원보험금",
        diagnosisCode: "S52.5",
        hospitalDays: isUnknownCode ? null : 5,
      }),
    })
  }

  for (let index = 0; index < 7; index += 1) {
    const isHospitalization = index % 2 === 0
    fixtures.push({
      id: `missing-critical-fact-${index + 1}`,
      caseId: isHospitalization ? "hospitalization" : "fracture",
      expectedVersionResolved: true,
      expectedApproved: false,
      bundle: makeBundle({
        id: `missing-critical-fact-${index + 1}`,
        productCode: isHospitalization ? "P600107" : "P400073",
        contractDate: isHospitalization ? "2024-03-20" : "2025-05-10",
        coverage: isHospitalization
          ? index % 4 === 0
            ? null
            : "입원보험금"
          : index % 3 === 0
            ? null
            : "무배당 생활재해보장특약Ⅱ 2504",
        diagnosisCode: isHospitalization
          ? "S52.5"
          : "M25.5",
        hospitalDays: isHospitalization ? (index % 4 === 0 ? 5 : 3) : null,
      }),
    })
  }

  return fixtures
}

function buildManualHoldout(): EvaluationFixture[] {
  return manualHoldout.cases.map((fixture) => ({
    id: fixture.id,
    caseId: fixture.caseId as ClaimCase["id"],
    expectedVersionResolved: fixture.expectedVersionResolved,
    expectedApproved: fixture.expectedApproved,
    bundle: makeBundle({
      id: fixture.id,
      productCode: fixture.productCode,
      contractDate: fixture.contractDate,
      coverage: fixture.coverage,
      diagnosisCode: fixture.diagnosisCode,
      hospitalDays: fixture.hospitalDays,
    }),
  }))
}

function percentage(passed: number, total: number) {
  return total ? Math.round((passed / total) * 1000) / 10 : 0
}

async function evaluateFixtures(fixtures: EvaluationFixture[]) {
  const results = await Promise.all(
    fixtures.map(async (fixture) => ({
      fixture,
      result: await runClaimGraph({
        caseId: fixture.caseId,
        answer: "no",
        documentBundle: fixture.bundle,
      }),
    })),
  )
  const approvedResults = results.filter(
    ({ fixture }) => fixture.expectedApproved,
  )
  const unsupportedResults = results.filter(
    ({ fixture }) => !fixture.expectedApproved,
  )
  const versionSelectionPassed = results.filter(
    ({ fixture, result }) =>
      (result.policyResolution?.status === "resolved") ===
      fixture.expectedVersionResolved,
  ).length
  const evidenceCompletenessPassed = approvedResults.filter(
    ({ result }) =>
      result.audit?.approved &&
      result.audit.versionMatched &&
      result.audit.citationValidated &&
      result.audit.exclusionIncluded,
  ).length
  const safeAbstentionPassed = unsupportedResults.filter(
    ({ result }) =>
      result.audit?.approved === false &&
      result.results.every(
        (claimResult) => claimResult.status === CLAIM_STATUS.unavailable,
      ),
  ).length
  const traceIntegrityPassed = results.filter(({ fixture, result }) => {
    const nodeIds = new Set(result.trace.map((event) => event.nodeId))
    const expectedLastStatus = fixture.expectedApproved ? "completed" : "blocked"
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
  const counts = {
    versionSelectionPassed,
    evidenceCompletenessPassed,
    safeAbstentionPassed,
    traceIntegrityPassed,
  }

  return {
    approved: approvedResults.length,
    unsupported: unsupportedResults.length,
    counts,
    metrics: {
      versionSelection: percentage(versionSelectionPassed, fixtures.length),
      evidenceCompleteness: percentage(
        evidenceCompletenessPassed,
        approvedResults.length,
      ),
      safeAbstention: percentage(safeAbstentionPassed, unsupportedResults.length),
      traceIntegrity: percentage(traceIntegrityPassed, fixtures.length),
    },
  }
}

export async function evaluateClaimGraph(): Promise<EvaluationSummary> {
  const [regression, holdout] = await Promise.all([
    evaluateFixtures(buildEvaluationFixtures()),
    evaluateFixtures(buildManualHoldout()),
  ])
  const generatedAt = new Date().toISOString()

  return {
    dataset: {
      name: "official-policy-regression-v2",
      evaluationType: "deterministic-regression",
      independentHoldout: manualHoldout.cases.length,
      total: regression.approved + regression.unsupported,
      supported: regression.approved,
      unsupported: regression.unsupported,
      generatedAt,
    },
    metrics: regression.metrics,
    counts: regression.counts,
    holdout: {
      dataset: {
        name: manualHoldout.name,
        evaluationType: "manual-labelled-holdout",
        independentHoldout: manualHoldout.cases.length,
        total: holdout.approved + holdout.unsupported,
        supported: holdout.approved,
        unsupported: holdout.unsupported,
        generatedAt: manualHoldout.reviewedAt,
        labelMethod: manualHoldout.labelMethod,
      },
      metrics: holdout.metrics,
      counts: holdout.counts,
    },
    limitations: [
      "공식 원문 근거는 우체국보험 2개 상품, 3개 약관 버전의 골절·입원 사례로 제한됩니다.",
      "회귀 fixture와 holdout은 모두 비식별 합성 사실관계이며 실제 고객·지급 결과 표본이 아닙니다.",
      "이 평가는 약관 버전 선택·근거 완전성·면책 동반·안전 중단을 점검하며 보험금 지급 정확도를 뜻하지 않습니다.",
      "보험사의 지급심사와 기존 청구 이력은 확인 범위 밖입니다.",
    ],
  }
}
