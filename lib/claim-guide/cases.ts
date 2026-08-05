import type { Answer, ClaimCase, ClaimResult } from "@/lib/claim-guide/types"
import {
  getFractureEvidence,
  getPolicyEvidence,
  type PolicyVersion,
} from "@/lib/claim-guide/policies"
import {
  CLAIM_STATUS,
  RESULT_STATE,
} from "@/lib/claim-guide/presentation"

export const claimCases: ClaimCase[] = [
  {
    id: "fracture",
    title: "손목 골절 — 실손만 청구한 경우",
    shortTitle: "손목 골절",
    description:
      "넘어져 손목 골절 치료를 받고 실손만 청구했습니다. 같은 보험의 정액 보장 항목은 확인하지 않은 합성 사례입니다.",
    category: "보장 항목이 있는 줄 몰랐던 사례",
    question: "이번 치료에서 수술을 받으셨나요?",
    questionHint: "상해수술비는 진단명만으로는 확인하기 어렵습니다.",
    facts: [
      { label: "사고일", value: "2025. 05. 22" },
      { label: "진단명", value: "좌측 요골 원위부 골절 (S52.5)" },
      { label: "가입특약", value: "생활재해보장특약Ⅱ 2504" },
      { label: "계약", value: "P400073 · 2025. 05. 10" },
    ],
    evidence: [
      { label: "사건", meta: "손목 골절" },
      { label: "진단", meta: "S52.5" },
      { label: "약관 버전", meta: "P400073 · 2504" },
      { label: "지급사유", meta: "특약 제3조" },
      { label: "면책·제한", meta: "특약 제4·8조" },
      { label: "다음 행동", meta: CLAIM_STATUS.recommended },
    ],
    actionTitle: "재해골절보험금, 이렇게 확인하세요",
    documents: [
      "진단명·질병분류코드가 있는 진단서",
      "보험증권 또는 보험가입내역",
      "사고일을 확인할 수 있는 자료",
    ],
    questions: [
      "이 사고로 골절진단비를 이미 청구했나요?",
      "가입 당시 적용된 보험약관의 골절 정의에 해당하나요?",
    ],
  },
  {
    id: "hospitalization",
    title: "5일 입원 — 입원보험금과 수술보험금 구분",
    shortTitle: "5일 입원",
    description:
      "골절 치료로 5일 입원했지만 수술 여부와 약관상 수술 정의는 아직 확인하지 않은 합성 사례입니다. 우체국보험 실제 주계약 원문을 연결합니다.",
    category: "입원·수술 조건을 함께 확인하는 사례",
    question: "이번 치료에서 약관상 수술에 해당할 수 있는 수술을 받으셨나요?",
    questionHint:
      "수술 여부만으로 수술보험금을 확정하지 않습니다. 수술기록과 약관의 수술 분류표가 더 필요합니다.",
    facts: [
      { label: "입원", value: "2024. 05. 10~05. 14 · 5일" },
      { label: "진단명", value: "좌측 요골 원위부 골절 (S52.5)" },
      { label: "가입 보장", value: "입원보험금 · 수술보험금" },
      { label: "계약", value: "P600107 · 2024. 03. 20" },
    ],
    evidence: [
      { label: "사건", meta: "골절 치료 입원 5일" },
      { label: "약관 버전", meta: "P600107 · 2112" },
      { label: "지급사유", meta: "주계약 제3조" },
      { label: "정의·제한", meta: "주계약 제4·5조" },
      { label: "면책", meta: "주계약 제6조" },
      { label: "다음 행동", meta: CLAIM_STATUS.recommended },
    ],
    actionTitle: "입원보험금과 수술보험금을 나누어 확인하세요",
    documents: [
      "입·퇴원 날짜와 직접 치료 목적이 적힌 입원확인서",
      "수술을 했다면 수술명·수술일이 적힌 수술증명서",
      "보험가입증서 또는 보험가입내역",
    ],
    questions: [
      "입원확인서에 입원일과 퇴원일, 직접 치료 목적이 적혀 있나요?",
      "수술을 했다면 수술명과 수술일이 적힌 수술증명서가 있나요?",
    ],
  },
  {
    id: "maturity",
    title: "오래된 계약 — 중도보험금 발생 추정",
    shortTitle: "오래된 계약",
    description:
      "14년째 유지 중인 종합보험입니다. 계약일과 약관 조건을 역산해 중도보험금 발생 후보 시점을 찾는 합성 사례입니다.",
    category: "지급 사유 발생을 몰랐던 사례",
    question: "계약 중 중도 인출이나 해지를 한 적이 있나요?",
    questionHint:
      "발생 후보 시점은 추정할 수 있지만, 실제 지급·인출 이력은 보험사 내부 데이터 확인이 필요합니다.",
    facts: [
      { label: "계약일", value: "2012. 03. 20" },
      { label: "유지기간", value: "14년 4개월" },
      { label: "상품", value: "종합건강보험 주계약" },
      { label: "조건", value: "계약 후 10년 경과 시 중도보험금" },
    ],
    evidence: [
      { label: "사건", meta: "장기 유지" },
      { label: "진단", meta: "해당 없음" },
      { label: "보장 항목", meta: "중도보험금" },
      { label: "지급사유", meta: "제21조" },
      { label: "면책", meta: "지급 이력", warning: true },
      { label: "다음 행동", meta: "공식 조회" },
    ],
    actionTitle: "중도보험금이 생겼는지 확인하는 법",
    documents: [
      "보험증권에서 확인할 계약일·만기일",
      "보험약관의 중도보험금 지급 조건",
      "보험사 계약·지급 내역",
    ],
    questions: [
      "약관상 최초 발생일 이후 계약을 계속 유지했나요?",
      "보험사에서 이미 자동 지급 또는 적립 처리했나요?",
    ],
  },
  {
    id: "exclusion",
    title: "면책 함정 — 조항만 보면 오답",
    shortTitle: "면책 함정",
    description:
      "보상 조항만 보면 후보처럼 보이지만 면책 조항과 사고 조건을 함께 보아야 결론이 달라지는 합성 사례입니다.",
    category: "환각·면책 방어 사례",
    question: "사고 당시 음주운전 또는 무면허 운전이었나요?",
    questionHint:
      "고위험 조건은 Agent가 임의로 채우지 않습니다. 답변이 없으면 근거 경로를 멈추고 판단을 보류합니다.",
    facts: [
      { label: "사고", value: "교통사고 · 상해 치료" },
      { label: "가입특약", value: "교통상해 특별약관" },
      { label: "보상조항", value: "제9조 보험금 지급사유" },
      { label: "면책조항", value: "제11조 지급하지 않는 사유" },
    ],
    evidence: [
      { label: "사건", meta: "교통사고" },
      { label: "진단", meta: "상해 치료" },
      { label: "보장 항목", meta: "교통상해" },
      { label: "지급사유", meta: "제9조" },
      { label: "면책", meta: "사고 조건", warning: true },
      { label: "다음 행동", meta: CLAIM_STATUS.unavailable },
    ],
    actionTitle: "면책에 걸리는지 먼저 확인하세요",
    documents: [
      "사고사실확인원",
      "경찰·교통사고 관련 확인 자료",
      "가입 당시 적용된 특별약관",
    ],
    questions: [
      "사고 당시 운전 조건이 면책 사유에 해당하나요?",
      "특약이 주계약 조건을 달리 정하고 있나요?",
    ],
  },
]

export const answerOptions: { value: Answer; label: string }[] = [
  { value: "yes", label: "예" },
  { value: "no", label: "아니오" },
  { value: "unknown", label: "잘 모르겠어요" },
]

export function getClaimCase(caseId: string): ClaimCase {
  return claimCases.find((item) => item.id === caseId) ?? claimCases[0]
}

export function buildResults(
  caseId: ClaimCase["id"],
  answer: Answer | null,
  policy?: PolicyVersion | null,
): ClaimResult[] {
  if (caseId === "hospitalization") {
    const evidence = getPolicyEvidence(policy?.id)
    const findEvidence = (...types: string[]) =>
      evidence.filter((clause) => types.includes(clause.type))

    return [
      {
        ...RESULT_STATE.recommended,
        title: "입원보험금",
        reason:
          "입력한 5일 입원 사실과 P600107 주계약의 ‘직접 치료 목적 4일 이상 입원’ 조건을 대조했습니다.",
        detail:
          "확인 권장 상태이며 지급 확정이 아닙니다. 직접 치료 목적, 같은 질병·재해의 입원 연결 조건, 면책 사유와 보험사의 최종 심사를 함께 확인해야 합니다.",
        clause: "무배당 우체국온라인입원수술보험 2112 주계약 제3조·제4조·제5조·제6조",
        citations: findEvidence("coverage", "definition", "limitation", "exclusion", "procedure"),
      },
      {
        ...(answer === "yes"
          ? RESULT_STATE.informationRequired
          : answer === "no"
            ? RESULT_STATE.lowLikelihood
            : RESULT_STATE.informationRequired),
        title: "수술보험금",
        reason:
          answer === "yes"
            ? "수술 사실은 확인됐지만, 약관의 수술 분류표 해당 여부와 수술증명서가 아직 없습니다."
            : answer === "no"
              ? "사용자 답변에서 수술을 받지 않은 것으로 확인했습니다."
              : "수술 여부와 약관상 수술 정의를 대조할 자료가 없습니다.",
        detail:
          "수술 여부만으로는 확인할 수 없습니다. 수술명·수술일이 적힌 수술증명서와 해당 약관의 수술 분류표를 보험사에 함께 확인해야 합니다.",
        clause: "무배당 우체국온라인입원수술보험 2112 주계약 제3조 제2호 · 제5조",
        citations: findEvidence("coverage", "definition", "procedure"),
      },
      {
        ...RESULT_STATE.unavailable,
        title: "최종 지급 여부",
        reason: "보험사의 계약·사고 조사와 지급 심사가 필요한 항목입니다.",
        detail:
          "Agent는 확인할 조건·근거·서류를 정리하며, 최종 지급 여부나 금액을 대신 결정하지 않습니다.",
        clause: "보험회사 최종 심사 영역",
      },
    ]
  }

  if (caseId === "maturity") {
    return [
      {
        ...RESULT_STATE.recommended,
        title: "중도보험금 발생 시점",
        reason:
          "계약일과 약관의 경과기간 조건을 대조하면 2022년이 최초 후보 시점입니다.",
        detail:
          "발생 가능 시점의 역산 결과이며 미지급 금액을 뜻하지 않습니다. 보험사 계약·지급 내역에서 실제 상태를 확인해야 합니다.",
        clause: "주계약 약관 제21조 · 중도보험금 지급",
      },
      {
        ...(answer === "unknown" || answer === null
          ? RESULT_STATE.unavailable
          : RESULT_STATE.informationRequired),
        title: "이미 지급 또는 인출했는지",
        reason:
          answer === "yes"
            ? "사용자 기억과 보험사 지급 이력을 대조해야 합니다."
            : "서비스가 보험사의 과거 지급 이력을 보유하지 않습니다.",
        detail:
          "내보험찾아줌 또는 가입 보험사의 공식 채널에서 지급·적립·인출 상태를 확인해야 합니다.",
        clause: "보험사 내부 계약·지급 데이터 필요",
      },
      {
        ...RESULT_STATE.unavailable,
        title: "확정 금액",
        reason: "지급 심사 전에는 금액을 확정할 수 없습니다.",
        detail:
          "서비스는 ‘못 받은 돈’처럼 단정하지 않습니다. 공식 조회에서 확정된 금액만 신뢰해야 합니다.",
        clause: "공식 채널 확인 대상",
      },
    ]
  }

  if (caseId === "exclusion") {
    return [
      {
        ...(answer === "no"
          ? RESULT_STATE.recommended
          : answer === "yes"
            ? RESULT_STATE.unavailable
            : RESULT_STATE.informationRequired),
        title: "교통상해 보장 항목",
        reason:
          answer === "yes"
            ? "답변이 면책 검토가 필요한 고위험 조건과 연결됩니다."
            : answer === "no"
              ? "현재 답변에서는 해당 면책 조건이 확인되지 않았습니다."
              : "사고 당시 운전 조건이 확인되지 않았습니다.",
        detail:
          "보상 조항만으로 지급 가능성을 제시하지 않습니다. 면책 조항, 사실확인 자료, 보험사의 최종 심사가 함께 필요합니다.",
        clause: "교통상해 특별약관 제9조 · 제11조",
      },
      {
        ...RESULT_STATE.unavailable,
        title: "보상 조항 단독 검색 결과",
        reason:
          "대응하는 면책·정의 조항이 함께 검색되지 않으면 결과를 생성하지 않습니다.",
        detail:
          "Evidence Auditor가 근거 경로의 누락을 감지해 초안 결과를 차단한 상태입니다.",
        clause: "Evidence Validator 규칙 EV-02",
      },
      {
        ...RESULT_STATE.unavailable,
        title: "최종 지급 여부",
        reason: "보험회사의 사고 조사와 지급 심사가 필요한 항목입니다.",
        detail:
          "Agent는 확인해야 할 조건과 서류를 준비하며 최종 지급 여부를 대신 결정하지 않습니다.",
        clause: "보험회사 최종 심사 영역",
      },
    ]
  }

  const fractureEvidence = policy
    ? getPolicyEvidence(policy.id)
    : getFractureEvidence()
  const findEvidence = (...types: string[]) =>
    fractureEvidence.filter((clause) => types.includes(clause.type))

  return [
    {
      ...RESULT_STATE.recommended,
      title: "재해골절(치아파절제외)보험금",
      reason:
        `보험가입증서에서 확인한 상품코드 ${policy?.productCodes[0] ?? "P400073"}의 생활재해보장특약Ⅱ와 S52.5 진단을 ${policy?.versionLabel ?? "2504"} 보험약관 근거로 대조했습니다.`,
      detail:
        "확인 권장 상태이며 지급 확정이 아닙니다. 재해 여부, 보장개시일, 기존 청구 여부와 공통 면책은 보험사 공식 채널에서 함께 확인해야 합니다.",
      clause:
        `무배당 생활재해보장특약Ⅱ ${policy?.versionLabel ?? "2504"} 제3조·제4조·제6조·제8조·별표1·별표5`,
      citations: findEvidence(
        "coverage",
        "definition",
        "limitation",
        "exclusion",
        "benefit-table",
        "classification",
      ),
    },
    {
      ...(answer === "yes"
        ? RESULT_STATE.informationRequired
        : answer === "no"
          ? RESULT_STATE.lowLikelihood
          : RESULT_STATE.informationRequired),
      title: "상해수술비 특약",
      reason:
        answer === "yes"
          ? "수술 사실은 확인됐지만 현재 보험증권에서 별도 수술 특약 근거를 찾지 못했습니다."
          : answer === "no"
            ? "사용자 답변에서 수술을 받지 않은 것으로 확인했습니다."
            : "수술 여부가 확인되지 않아 약관상 수술 정의를 대조할 수 없습니다.",
      detail:
        "현재 불러온 생활재해보장특약Ⅱ는 수술비 보장 항목이 아닙니다. 보험증권에 별도 수술 특약이 있는지와 해당 보험약관 버전을 추가 확인해야 합니다.",
      clause: "현재 보험증권에서 별도 수술 특약 근거 미확인",
    },
    {
      ...RESULT_STATE.lowLikelihood,
      title: "입원일당",
      reason: "입원 사실이 입력 자료에서 확인되지 않았습니다.",
      detail:
        "입원 치료를 받았거나 보험증권에 별도 입원 특약이 있다면 관련 자료를 추가해 다시 확인할 수 있습니다.",
      clause: "현재 보험증권·진료 기록에서 입원 보장 항목과 입원 사실 미확인",
    },
  ]
}
