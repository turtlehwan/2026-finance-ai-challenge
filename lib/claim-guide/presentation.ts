import type {
  ClaimResult,
  ClaimStatus,
  ResultTone,
} from "@/lib/claim-guide/types"
import { CLAIM_STATUS } from "@/lib/claim-guide/types"

export { CLAIM_STATUS }

export const RESULT_STATE = {
  recommended: {
    status: CLAIM_STATUS.recommended,
    tone: "positive",
  },
  informationRequired: {
    status: CLAIM_STATUS.informationRequired,
    tone: "warning",
  },
  lowLikelihood: {
    status: CLAIM_STATUS.lowLikelihood,
    tone: "muted",
  },
  unavailable: {
    status: CLAIM_STATUS.unavailable,
    tone: "blocked",
  },
} as const satisfies Record<
  string,
  Pick<ClaimResult, "status" | "tone">
>

export const RESULT_STATE_ORDER: {
  tone: ResultTone
  status: ClaimStatus
  badgeVariant: "success" | "warning" | "secondary" | "destructive"
}[] = [
  {
    ...RESULT_STATE.recommended,
    badgeVariant: "success",
  },
  {
    ...RESULT_STATE.informationRequired,
    badgeVariant: "warning",
  },
  {
    ...RESULT_STATE.lowLikelihood,
    badgeVariant: "secondary",
  },
  {
    ...RESULT_STATE.unavailable,
    badgeVariant: "destructive",
  },
]

export const JOURNEY_STEPS = [
  {
    id: "case",
    label: "사례 선택",
    meta: "사실 확인",
    detail:
      "보험증권과 진단 기록에서 사고일, 진단명, 가입한 특약을 읽어 냅니다.",
  },
  {
    id: "evidence",
    label: "근거 분석",
    meta: "보험약관 대조",
    detail:
      "계약일에 맞는 보험약관 버전을 고른 뒤, 지급 조항뿐 아니라 면책 조항까지 함께 봅니다.",
  },
  {
    id: "question",
    label: "정보 확인",
    meta: "추가 질문",
    detail:
      "빠진 사실이 있으면 넘겨짚지 않고 멈춥니다. 한 번에 한 가지만 되묻습니다.",
  },
  {
    id: "action",
    label: "다음 행동",
    meta: "확인 목록",
    detail:
      "낼 서류와 보험사에 물어볼 것을 정리합니다. 청구는 공식 창구에서 직접 하십니다.",
  },
] as const

export const ANALYSIS_STEPS = [
  "사건",
  "진단",
  "보장 항목",
  "지급사유",
  "면책",
  "다음 행동",
] as const

export const POLICY_OPS_STEPS = [
  "공식 원문 확인",
  "핵심 조항 추출",
  "필수 근거 묶음 연결",
  "내부 회귀 테스트",
  "사람 승인 상태",
] as const
