import type { PolicyClause } from "@/lib/claim-guide/policies"
import type { PolicySource } from "@/lib/claim-guide/types"

/**
 * 금융감독원 표준약관은 국가법령정보센터의 별표 원문에서 내려받아
 * 질병·상해보험 구간만 구조화한 실제 출처입니다. 개인 계약의 지급 여부를
 * 대신 판정하는 자료가 아니라, 상품 약관을 교차 확인하는 공통 기준으로 씁니다.
 */
export const STANDARD_TERMS_SOURCE: PolicySource = {
  id: "fss-standard-terms-20260715",
  title: "질병·상해보험 표준약관 (보험업감독업무시행세칙 별표 15)",
  sourceOrganization: "금융감독원 · 국가법령정보센터",
  sourceKind: "official-standard-terms",
  sourceUrl:
    "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2200000108867&chrClsCd=010202",
  documentUrl:
    "https://www.law.go.kr/LSW/flDownload.do?flSeq=167076957&flNm=%5B별표+15%5D+표준약관%28제5-13조제1항관련%29&bylClsCd=200201",
  effectiveDate: "2026-07-15",
  retrievedAt: "2026-07-31",
  documentPages: 491,
  pageRange: "질병·상해보험 인쇄면 143~149",
  sha256:
    "3ca9d2cdb152770d43d3301e37d528a57df859d44bad7c47adcc6092dde80c35",
  rightsNote:
    "국가법령정보센터 공개 원문을 출처·시행일과 함께 참조하며, 원문 전체를 모델 학습·재배포하지 않습니다.",
}

export const STANDARD_TERMS_PREVIOUS_SOURCE: PolicySource = {
  id: "fss-standard-terms-20250611",
  title: "질병·상해보험 표준약관 (2025.06.11 시행본)",
  sourceOrganization: "금융감독원 · 국가법령정보센터",
  sourceKind: "official-standard-terms",
  sourceUrl:
    "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2200000107393&chrClsCd=010202",
  documentUrl:
    "https://www.law.go.kr/LSW/flDownload.do?flSeq=152932717&flNm=%5B별표+15%5D+표준약관%28제5-13조제1항관련%29&bylClsCd=200201",
  effectiveDate: "2025-06-11",
  retrievedAt: "2026-07-31",
  documentPages: 416,
  pageRange: "질병·상해보험 인쇄면 143~149",
  sha256:
    "3b9ee9ba6c72788b1d8e3bb85e2e81fbf578786a20a99a659d0c5504c06486be",
  rightsNote:
    "버전 비교용 보관 원문입니다. 현행성은 국가법령정보센터의 최신 시행본을 우선합니다.",
}

export const KB_POLICY_CATALOG_SOURCE: PolicySource = {
  id: "kb-insurance-policy-catalog",
  title: "KB손해보험 상품목록(약관)",
  sourceOrganization: "KB손해보험",
  sourceKind: "official-catalog",
  sourceUrl: "https://www.kbinsure.co.kr/CG802030001.ecs",
  retrievedAt: "2026-07-31",
  rightsNote:
    "상품코드·판매중지 여부·약관 연결을 확인하는 공식 공시 목록으로만 사용하며, 개별 PDF의 이용조건을 별도 확인합니다.",
}

const STANDARD_TERMS_PDF_URL = STANDARD_TERMS_SOURCE.documentUrl!
const STANDARD_TERMS_TITLE = STANDARD_TERMS_SOURCE.title

export const standardTermsClauses: PolicyClause[] = [
  {
    id: "FSS-20260715-DI-2-definition",
    type: "definition",
    sourceTitle: STANDARD_TERMS_TITLE,
    sourceUrl: STANDARD_TERMS_PDF_URL,
    page: 143,
    article: "제2조(용어의 정의)",
    excerpt: "상해는 보험기간 중 발생한 급격하고도 우연한 외래의 사고를 말합니다.",
    summary: "상해·장해·보험기간 등 공통 용어의 정의를 확인합니다.",
    relatedClauseIds: [
      "FSS-20260715-DI-3-coverage",
      "FSS-20260715-DI-5-exclusion",
    ],
  },
  {
    id: "FSS-20260715-DI-3-coverage",
    type: "coverage",
    sourceTitle: STANDARD_TERMS_TITLE,
    sourceUrl: STANDARD_TERMS_PDF_URL,
    page: 144,
    article: "제3조(보험금의 지급사유)",
    excerpt: "회사는 보험기간 중 발생한 보험사고에 대하여 약관에서 정한 보험금을 지급합니다.",
    summary: "사망·장해·입원·통원·요양·수술 등 지급사유의 공통 구조입니다.",
    relatedClauseIds: [
      "FSS-20260715-DI-2-definition",
      "FSS-20260715-DI-4-limit",
      "FSS-20260715-DI-5-exclusion",
    ],
  },
  {
    id: "FSS-20260715-DI-4-limit",
    type: "limitation",
    sourceTitle: STANDARD_TERMS_TITLE,
    sourceUrl: STANDARD_TERMS_PDF_URL,
    page: 145,
    article: "제4조(보험금 지급에 관한 세부규정)",
    excerpt: "보험금 지급사유와 지급기준은 각 보장별 약관 및 별표에서 정한 바에 따릅니다.",
    summary: "세부 지급기준과 기간·횟수 제한은 개별 상품 약관과 함께 대조합니다.",
    relatedClauseIds: [
      "FSS-20260715-DI-3-coverage",
      "FSS-20260715-DI-5-exclusion",
    ],
  },
  {
    id: "FSS-20260715-DI-5-exclusion",
    type: "exclusion",
    sourceTitle: STANDARD_TERMS_TITLE,
    sourceUrl: STANDARD_TERMS_PDF_URL,
    page: 147,
    article: "제5조(보험금을 지급하지 않는 사유)",
    excerpt: "피보험자의 고의, 임신·출산 관련 사유, 전쟁 등 약관에서 정한 사유에는 보험금을 지급하지 않습니다.",
    summary: "보상 조항만으로 결론을 내리지 않도록 공통 면책 사유를 함께 확인합니다.",
    relatedClauseIds: [
      "FSS-20260715-DI-2-definition",
      "FSS-20260715-DI-3-coverage",
    ],
  },
  {
    id: "FSS-20260715-DI-7-procedure",
    type: "procedure",
    sourceTitle: STANDARD_TERMS_TITLE,
    sourceUrl: STANDARD_TERMS_PDF_URL,
    page: 148,
    article: "제7조(보험금의 청구)",
    excerpt: "보험금 청구서, 사고를 증명하는 서류, 신분증 및 회사가 요구하는 서류를 제출합니다.",
    summary: "청구서·사고증명서·신분증·추가서류의 확인 체크리스트로 연결합니다.",
    relatedClauseIds: [
      "FSS-20260715-DI-3-coverage",
      "FSS-20260715-DI-8-procedure",
    ],
  },
  {
    id: "FSS-20260715-DI-8-procedure",
    type: "procedure",
    sourceTitle: STANDARD_TERMS_TITLE,
    sourceUrl: STANDARD_TERMS_PDF_URL,
    page: 149,
    article: "제8조(보험금의 지급절차)",
    excerpt: "회사는 청구서류를 접수한 날부터 3영업일 이내에 보험금을 지급합니다.",
    summary: "접수·지급·지연 통지와 가지급 절차를 공식 공통 기준으로 안내합니다.",
    relatedClauseIds: ["FSS-20260715-DI-7-procedure"],
  },
]

export const STANDARD_TERMS_DIFF_HASH =
  "fss-standard-terms-20260715:3ca9d2cdb152:di-2-3-4-5-7-8"

export function validateStandardTerms() {
  const ids = new Set(standardTermsClauses.map((clause) => clause.id))
  const checks = [
    STANDARD_TERMS_SOURCE.sourceUrl.includes("law.go.kr"),
    STANDARD_TERMS_SOURCE.documentUrl?.includes("flSeq=167076957") ?? false,
    STANDARD_TERMS_SOURCE.effectiveDate === "2026-07-15",
    STANDARD_TERMS_SOURCE.sha256?.length === 64,
    standardTermsClauses.length === 6,
    standardTermsClauses.every(
      (clause) => clause.sourceUrl.includes("law.go.kr") && clause.page > 0,
    ),
    standardTermsClauses.every((clause) => clause.article.length > 0),
    standardTermsClauses.every((clause) =>
      clause.relatedClauseIds.every((id) => ids.has(id)),
    ),
  ]

  return {
    passed: checks.filter(Boolean).length,
    total: checks.length,
    passedAll: checks.every(Boolean),
  }
}

export function getStandardTermsEvidence() {
  return standardTermsClauses
}

export function getPolicySourceManifest() {
  return {
    productCatalog: KB_POLICY_CATALOG_SOURCE,
    currentStandardTerms: STANDARD_TERMS_SOURCE,
    previousStandardTerms: STANDARD_TERMS_PREVIOUS_SOURCE,
  }
}
