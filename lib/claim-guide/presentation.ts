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
    detail: "보험사건과 증권·치료 사실을 확인",
  },
  {
    id: "evidence",
    label: "근거 분석",
    meta: "약관 대조",
    detail: "가입 시점 약관과 면책을 함께 검토",
  },
  {
    id: "question",
    label: "정보 확인",
    meta: "추가 질문",
    detail: "빠진 사실을 한 가지씩 질문",
  },
  {
    id: "action",
    label: "다음 행동",
    meta: "확인 목록",
    detail: "서류·질문·공식 경로를 준비",
  },
] as const

export const ANALYSIS_STEPS = [
  "사건",
  "진단",
  "담보",
  "지급사유",
  "면책",
  "다음 행동",
] as const

export const POLICY_OPS_STEPS = [
  "신규 약관 감지",
  "버전·조항 비교",
  "근거 그래프 갱신",
  "회귀 평가",
  "사람 승인",
] as const
