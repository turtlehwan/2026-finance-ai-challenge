import type {
  EvidenceCitation,
  PolicySource,
  SupportedClaimType,
} from "@/lib/claim-guide/types"

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
  source: PolicySource
  documentPages: number
  evidenceReady: boolean
  riderName: string
  clauses: PolicyClause[]
  supportedClaimTypes: SupportedClaimType[]
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

const POLICY_2112_URL =
  "https://www.epostlife.go.kr/resources/js/biz/ip/gs/pdf/40190.pdf"

const ONLINE_ADMISSION_SURGERY_2112_URL =
  "https://epostlife.go.kr/resources/js/biz/ip/gs/pdf/60440.pdf"

const PUBLIC_DATA_URL = "https://www.data.go.kr/data/15111699/openapi.do"

export const EPOSTLIFE_2504_SOURCE: PolicySource = {
  id: "epostlife-wide-health-2504",
  title: "무배당 우체국와이드건강보험 2504 약관",
  sourceOrganization: "우정사업본부 · 우체국보험",
  sourceKind: "official-product-policy",
  sourceUrl: POLICY_2504_URL,
  documentUrl: POLICY_2504_URL,
  effectiveStart: "2025-04-03",
  effectiveEnd: "2025-06-04",
  retrievedAt: "2026-07-31",
  documentPages: 550,
  sha256:
    "fc21574f8cc63a413ac0b45f8b08526a6d90fa760732cbf831579ab7eea1ab87",
  rightsNote:
    "우체국보험 공식 약관을 적용기간 확인과 필요한 근거 인용에 사용합니다. 공개 열람과 원문 전체의 복제·재배포 권한은 구분하며, 상품별 이용조건을 확인합니다.",
}

export const EPOSTLIFE_2112_SOURCE: PolicySource = {
  id: "epostlife-wide-health-2112",
  title: "무배당 우체국와이드건강보험 2112 약관",
  sourceOrganization: "우정사업본부 · 우체국보험",
  sourceKind: "official-product-policy",
  sourceUrl: POLICY_2112_URL,
  documentUrl: POLICY_2112_URL,
  effectiveStart: "2021-12-01",
  effectiveEnd: "2025-04-02",
  retrievedAt: "2026-07-31",
  documentPages: 544,
  sha256:
    "e55697f8a90b1bcea972aea216d096b012e0850df81283f6665904f2cd81cb1a",
  rightsNote:
    "공식 약관을 적용기간 확인과 필요한 근거 인용에 사용합니다. 공개 열람과 원문 전체의 복제·재배포 권한은 구분하며, 상품별 이용조건을 확인합니다.",
}

export const EPOSTLIFE_ONLINE_ADMISSION_SURGERY_2112_SOURCE: PolicySource = {
  id: "epostlife-online-admission-surgery-2112",
  title: "무배당 우체국온라인입원수술보험 2112 약관",
  sourceOrganization: "우정사업본부 · 우체국보험",
  sourceKind: "official-product-policy",
  sourceUrl: ONLINE_ADMISSION_SURGERY_2112_URL,
  documentUrl: ONLINE_ADMISSION_SURGERY_2112_URL,
  effectiveStart: "2021-12-01",
  effectiveEnd: "2025-04-02",
  retrievedAt: "2026-08-05",
  documentPages: 116,
  sha256:
    "cece0ce6e0bde91350c9442f5afba9b40914740d12a7afe20a666aff74ebadff",
  rightsNote:
    "공식 약관을 적용기간 확인과 필요한 근거 인용에 사용합니다. 공개 열람과 원문 전체의 복제·재배포 권한은 구분하며, 상품별 이용조건을 확인합니다.",
}

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

const policy2112Base = {
  sourceTitle: "무배당 우체국와이드건강보험 2112 약관",
  sourceUrl: POLICY_2112_URL,
}

const fractureClauses2112: PolicyClause[] = [
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-3-3",
    type: "coverage",
    article: "생활재해보장특약Ⅱ 제3조 제3호",
    page: 491,
    excerpt: "보험기간 중 재해로 인하여 골절상태가 되었을 때",
    summary:
      "보험기간 중 재해로 골절 상태가 되면 재해골절보험금의 확인 대상이 된다.",
    relatedClauseIds: [
      "P400051-2112-RIDER-4-15",
      "P400051-2112-RIDER-6",
      "P400051-2112-RIDER-APPENDIX-5-S52",
    ],
  },
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-4-15",
    type: "limitation",
    article: "생활재해보장특약Ⅱ 제4조 제15항",
    page: 494,
    excerpt: "동일한 재해로 인하여 두 가지 이상의 골절",
    summary:
      "보장개시일 이전 골절은 지급하지 않으며, 같은 재해의 복합골절은 1회만 지급하고 치료 목적의 골절술은 제외한다.",
    relatedClauseIds: ["P400051-2112-RIDER-3-3", "P400051-2112-RIDER-6"],
  },
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-6",
    type: "definition",
    article: "생활재해보장특약Ⅱ 제6조",
    page: 495,
    excerpt: "재해로 인하여 뼈 일부의 연속성이 단절된 상태",
    summary:
      "골절은 재해로 뼈 일부의 연속성이 단절되고 별표5 분류표에 포함되는 상태다.",
    relatedClauseIds: [
      "P400051-2112-RIDER-3-3",
      "P400051-2112-RIDER-APPENDIX-5-S52",
    ],
  },
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-8",
    type: "exclusion",
    article: "생활재해보장특약Ⅱ 제8조",
    page: 496,
    excerpt: "보험금을 지급하지 않거나 보험료 납입을 면제하지 않습니다",
    summary:
      "피보험자·보험수익자·계약자의 고의 등 공통 면책 사유를 확인해야 한다.",
    relatedClauseIds: ["P400051-2112-RIDER-3-3"],
  },
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-9",
    type: "procedure",
    article: "생활재해보장특약Ⅱ 제9조",
    page: 496,
    excerpt: "골절진단서, 재해임을 확인할 수 있는 서류",
    summary:
      "청구서, 골절진단서, 재해임을 확인할 수 있는 서류, 신분증 등이 필요하다.",
    relatedClauseIds: ["P400051-2112-RIDER-3-3"],
  },
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-APPENDIX-1",
    type: "benefit-table",
    article: "생활재해보장특약Ⅱ 별표1",
    page: 506,
    excerpt: "재해골절(치아파절제외)보험금 10만원",
    summary:
      "특약보험가입금액 1,000만 원 기준 재해골절보험금은 사고 1회당 10만 원이다.",
    relatedClauseIds: ["P400051-2112-RIDER-3-3"],
  },
  {
    ...policy2112Base,
    id: "P400051-2112-RIDER-APPENDIX-5-S52",
    type: "classification",
    article: "생활재해보장특약Ⅱ 별표5",
    page: 510,
    excerpt: "아래팔의 골절 S52",
    summary:
      "골절 분류표는 아래팔의 골절 S52를 재해골절 확인 대상 분류에 포함한다.",
    relatedClauseIds: ["P400051-2112-RIDER-6"],
  },
]

const onlineAdmissionSurgery2112Base = {
  sourceTitle: "무배당 우체국온라인입원수술보험 2112 약관",
  sourceUrl: ONLINE_ADMISSION_SURGERY_2112_URL,
}

const hospitalizationClauses2112: PolicyClause[] = [
  {
    ...onlineAdmissionSurgery2112Base,
    id: "P600107-2112-MAIN-3-1",
    type: "coverage",
    article: "주계약 제3조 제1호",
    page: 24,
    excerpt: "그 직접적인 치료를 목적으로 4일 이상 입원하였을 때",
    summary:
      "질병 또는 재해의 직접 치료를 목적으로 4일 이상 입원한 경우 입원보험금의 확인 대상이 된다.",
    relatedClauseIds: [
      "P600107-2112-MAIN-4-2",
      "P600107-2112-MAIN-5",
      "P600107-2112-MAIN-6",
    ],
  },
  {
    ...onlineAdmissionSurgery2112Base,
    id: "P600107-2112-MAIN-3-2",
    type: "coverage",
    article: "주계약 제3조 제2호",
    page: 25,
    excerpt: "별표5에서 정한 수술을 받았을 때",
    summary:
      "약관의 수술 분류표에 해당하는 수술을 받은 경우 수술보험금의 확인 대상이 된다.",
    relatedClauseIds: ["P600107-2112-MAIN-5", "P600107-2112-MAIN-6"],
  },
  {
    ...onlineAdmissionSurgery2112Base,
    id: "P600107-2112-MAIN-4-2",
    type: "limitation",
    article: "주계약 제4조 제2항",
    page: 25,
    excerpt: "1회 입원당 120일을 최고한도로 지급합니다",
    summary:
      "입원보험금은 1회 입원당 120일 한도이며, 동일 질병·재해의 입원 연결 조건을 함께 확인해야 한다.",
    relatedClauseIds: ["P600107-2112-MAIN-3-1"],
  },
  {
    ...onlineAdmissionSurgery2112Base,
    id: "P600107-2112-MAIN-5",
    type: "definition",
    article: "주계약 제5조",
    page: 28,
    excerpt: "의사의 관리 하에 치료에 전념하는 것을 말합니다",
    summary:
      "입원과 수술은 직접 치료 목적·의료기관·의사 관리·약관의 수술 분류표 기준을 함께 확인한다.",
    relatedClauseIds: ["P600107-2112-MAIN-3-1", "P600107-2112-MAIN-3-2"],
  },
  {
    ...onlineAdmissionSurgery2112Base,
    id: "P600107-2112-MAIN-6",
    type: "exclusion",
    article: "주계약 제6조",
    page: 29,
    excerpt: "보험금을 지급하지 않거나 보험료 납입을 면제하지 않습니다",
    summary:
      "고의와 정당한 사유 없는 의사 지시 불이행 등 지급하지 않는 사유를 함께 확인해야 한다.",
    relatedClauseIds: ["P600107-2112-MAIN-3-1", "P600107-2112-MAIN-3-2"],
  },
  {
    ...onlineAdmissionSurgery2112Base,
    id: "P600107-2112-MAIN-9",
    type: "procedure",
    article: "주계약 제9조",
    page: 30,
    excerpt: "입원확인서, 수술증명서 등",
    summary:
      "청구서, 입원확인서 또는 수술증명서, 신분증 등 해당 사고증명서가 필요하다.",
    relatedClauseIds: ["P600107-2112-MAIN-3-1", "P600107-2112-MAIN-3-2"],
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
    source: EPOSTLIFE_2112_SOURCE,
    documentPages: 544,
    evidenceReady: true,
    riderName: "무배당 생활재해보장특약Ⅱ 2112",
    clauses: fractureClauses2112,
    supportedClaimTypes: ["fracture"],
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
    source: EPOSTLIFE_2504_SOURCE,
    documentPages: 550,
    evidenceReady: true,
    riderName: "무배당 생활재해보장특약Ⅱ 2504",
    clauses: fractureClauses2504,
    supportedClaimTypes: ["fracture"],
  },
  {
    id: "online-admission-surgery-2112",
    insurer: "우체국보험",
    sourceOrganization: "우정사업본부",
    productName: "무배당 우체국온라인입원수술보험",
    productCodes: ["P600107"],
    versionLabel: "2112",
    effectiveStart: "2021-12-01",
    effectiveEnd: "2025-04-02",
    sourceUrl: ONLINE_ADMISSION_SURGERY_2112_URL,
    publicDataUrl: PUBLIC_DATA_URL,
    source: EPOSTLIFE_ONLINE_ADMISSION_SURGERY_2112_SOURCE,
    documentPages: 116,
    evidenceReady: true,
    riderName: "주계약",
    clauses: hospitalizationClauses2112,
    supportedClaimTypes: ["hospitalization"],
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

export function getPolicyEvidence(policyId: string | undefined) {
  return policyVersions.find((candidate) => candidate.id === policyId)?.clauses ?? []
}

export function getFractureEvidence(policyId = "wide-health-2504") {
  return getPolicyEvidence(policyId)
}

export function getRequiredEvidenceTypes(
  claimType: SupportedClaimType | null,
) {
  if (claimType === "hospitalization") {
    return ["coverage", "definition", "limitation", "exclusion", "procedure"] as const
  }

  if (claimType === "fracture") {
    return [
      "coverage",
      "definition",
      "limitation",
      "exclusion",
      "classification",
    ] as const
  }

  return [] as const
}
