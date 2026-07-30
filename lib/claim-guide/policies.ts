import type { EvidenceCitation } from "@/lib/claim-guide/types"

export type PolicyClauseType =
  | "coverage"
  | "definition"
  | "limitation"
  | "exclusion"
  | "procedure"
  | "benefit-table"
  | "classification"

export type PolicyClause = EvidenceCitation & {
  id: string
  type: PolicyClauseType
  summary: string
  relatedClauseIds: string[]
}

export type PolicyVersion = {
  id: string
  insurer: string
  sourceOrganization: string
  productName: string
  productCodes: string[]
  versionLabel: string
  effectiveStart: string
  effectiveEnd: string
  sourceUrl: string
  publicDataUrl: string
  documentPages: number
  evidenceReady: boolean
  riderName: string
  clauses: PolicyClause[]
}

export type PolicyResolution =
  | {
      status: "resolved"
      productCode: string
      contractDate: string
      policy: PolicyVersion
      reason: string
    }
  | {
      status: "not-found"
      productCode: string
      contractDate: string
      policy: null
      reason: string
    }

const POLICY_2504_URL =
  "https://www.epostlife.go.kr/resources/js/biz/ip/gs/pdf/YAK_P400073_202504.pdf"

const PUBLIC_DATA_URL = "https://www.data.go.kr/data/15111699/openapi.do"

const policy2504Base = {
  sourceTitle: "무배당 우체국와이드건강보험 2504 약관",
  sourceUrl: POLICY_2504_URL,
}

const fractureClauses2504: PolicyClause[] = [
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-3-3",
    type: "coverage",
    article: "생활재해보장특약Ⅱ 제3조 제3호",
    page: 497,
    excerpt: "보험기간 중 재해로 인하여 골절상태가 되었을 때",
    summary:
      "보험기간 중 재해로 골절 상태가 되면 재해골절보험금의 확인 대상이 된다.",
    relatedClauseIds: [
      "P400073-2504-RIDER-4-15",
      "P400073-2504-RIDER-6",
      "P400073-2504-RIDER-APPENDIX-1",
    ],
  },
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-4-15",
    type: "limitation",
    article: "생활재해보장특약Ⅱ 제4조 제15항",
    page: 500,
    excerpt: "동일한 재해로 인하여 두 가지 이상의 골절",
    summary:
      "보장개시일 이전 골절은 지급하지 않으며, 같은 재해의 복합골절은 1회만 지급하고 치료 목적의 골절술은 제외한다.",
    relatedClauseIds: [
      "P400073-2504-RIDER-3-3",
      "P400073-2504-RIDER-6",
    ],
  },
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-6",
    type: "definition",
    article: "생활재해보장특약Ⅱ 제6조",
    page: 501,
    excerpt: "재해로 인하여 뼈 일부의 연속성이 단절된 상태",
    summary:
      "골절은 재해로 뼈 일부의 연속성이 단절되고 별표5 분류표에 포함되는 상태다.",
    relatedClauseIds: [
      "P400073-2504-RIDER-3-3",
      "P400073-2504-RIDER-APPENDIX-5-S52",
    ],
  },
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-8",
    type: "exclusion",
    article: "생활재해보장특약Ⅱ 제8조",
    page: 502,
    excerpt: "보험금을 지급하지 않거나 보험료 납입을 면제하지 않습니다",
    summary:
      "피보험자·보험수익자·계약자의 고의 등 공통 면책 사유를 확인해야 한다.",
    relatedClauseIds: ["P400073-2504-RIDER-3-3"],
  },
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-9",
    type: "procedure",
    article: "생활재해보장특약Ⅱ 제9조",
    page: 502,
    excerpt: "골절진단서, 재해임을 확인할 수 있는 서류",
    summary:
      "청구서, 골절진단서, 재해임을 확인할 수 있는 서류, 신분증 등이 필요하다.",
    relatedClauseIds: ["P400073-2504-RIDER-3-3"],
  },
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-APPENDIX-1",
    type: "benefit-table",
    article: "생활재해보장특약Ⅱ 별표1",
    page: 512,
    excerpt: "재해골절(치아파절제외)보험금 10만원",
    summary:
      "특약보험가입금액 1,000만 원 기준 재해골절보험금은 사고 1회당 10만 원이다.",
    relatedClauseIds: ["P400073-2504-RIDER-3-3"],
  },
  {
    ...policy2504Base,
    id: "P400073-2504-RIDER-APPENDIX-5-S52",
    type: "classification",
    article: "생활재해보장특약Ⅱ 별표5",
    page: 516,
    excerpt: "아래팔의 골절 S52",
    summary:
      "골절 분류표는 아래팔의 골절 S52를 재해골절 확인 대상 분류에 포함한다.",
    relatedClauseIds: ["P400073-2504-RIDER-6"],
  },
]

export const policyVersions: PolicyVersion[] = [
  {
    id: "wide-health-2112",
    insurer: "우체국보험",
    sourceOrganization: "우정사업본부",
    productName: "무배당 우체국와이드건강보험",
    productCodes: ["P400051", "P400052", "P400053", "P400054"],
    versionLabel: "2112",
    effectiveStart: "2021-12-01",
    effectiveEnd: "2025-04-02",
    sourceUrl:
      "https://www.epostlife.go.kr/resources/js/biz/ip/gs/pdf/40190.pdf",
    publicDataUrl: PUBLIC_DATA_URL,
    documentPages: 0,
    evidenceReady: false,
    riderName: "버전별 특약 확인 필요",
    clauses: [],
  },
  {
    id: "wide-health-2504",
    insurer: "우체국보험",
    sourceOrganization: "우정사업본부",
    productName: "무배당 우체국와이드건강보험",
    productCodes: ["P400073", "P400074", "P400075", "P400076"],
    versionLabel: "2504",
    effectiveStart: "2025-04-03",
    effectiveEnd: "2025-06-04",
    sourceUrl: POLICY_2504_URL,
    publicDataUrl: PUBLIC_DATA_URL,
    documentPages: 550,
    evidenceReady: true,
    riderName: "무배당 생활재해보장특약Ⅱ 2504",
    clauses: fractureClauses2504,
  },
]

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function resolvePolicyVersion(
  productCode: string,
  contractDate: string,
): PolicyResolution {
  const normalizedCode = productCode.trim().toUpperCase()
  const normalizedDate = contractDate.trim()

  if (!normalizedCode || !isIsoDate(normalizedDate)) {
    return {
      status: "not-found",
      productCode: normalizedCode,
      contractDate: normalizedDate,
      policy: null,
      reason: "상품코드와 YYYY-MM-DD 형식의 계약일이 필요합니다.",
    }
  }

  const policy = policyVersions.find(
    (candidate) =>
      candidate.productCodes.includes(normalizedCode) &&
      normalizedDate >= candidate.effectiveStart &&
      normalizedDate <= candidate.effectiveEnd,
  )

  if (!policy) {
    return {
      status: "not-found",
      productCode: normalizedCode,
      contractDate: normalizedDate,
      policy: null,
      reason:
        "공식 판매기간과 계약일이 일치하는 검증된 약관 버전을 찾지 못했습니다.",
    }
  }

  return {
    status: "resolved",
    productCode: normalizedCode,
    contractDate: normalizedDate,
    policy,
    reason: `${normalizedDate} 계약일이 공식 적용기간 ${policy.effectiveStart}~${policy.effectiveEnd}에 포함됩니다.`,
  }
}

export function getFractureEvidence() {
  const policy = policyVersions.find(
    (candidate) => candidate.id === "wide-health-2504",
  )

  return policy?.clauses ?? []
}
