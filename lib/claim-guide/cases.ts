import type { Answer, ClaimCase, ClaimResult } from "@/lib/claim-guide/types"

export const claimCases: ClaimCase[] = [
  {
    id: "fracture",
    title: "손목 골절 — 실손만 청구한 경우",
    shortTitle: "손목 골절",
    description:
      "넘어져 손목 골절 치료를 받고 실손만 청구했습니다. 같은 증권의 정액 담보는 확인하지 않은 합성 사례입니다.",
    category: "담보가 있는 줄 몰랐던 사례",
    question: "이번 치료에서 수술을 받으셨나요?",
    questionHint:
      "상해수술비는 진단명만으로 확인할 수 없습니다. 모르면 추정하지 않고 정보 필요 항목으로 남깁니다.",
    facts: [
      { label: "사고일", value: "2025. 04. 15" },
      { label: "진단명", value: "좌측 요골 원위부 골절 (S52.5)" },
      { label: "치료", value: "석고 고정 4주 · 통원 치료" },
      { label: "계약", value: "종합보험 · 2012년 가입" },
    ],
    evidence: [
      { label: "사건", meta: "손목 골절" },
      { label: "진단", meta: "S52 진단군" },
      { label: "담보", meta: "골절진단비" },
      { label: "지급사유", meta: "제12조" },
      { label: "면책", meta: "제14조" },
      { label: "다음 행동", meta: "확인 권장" },
    ],
    actionTitle: "골절진단비 확인 Action Pack",
    documents: [
      "진단명·질병분류코드가 있는 진단서",
      "보험증권 또는 가입내역",
      "사고일을 확인할 수 있는 자료",
    ],
    questions: [
      "이 사고로 골절진단비를 이미 청구했나요?",
      "가입 당시 약관의 골절 정의에 해당하나요?",
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
      { label: "담보", meta: "중도보험금" },
      { label: "지급사유", meta: "제21조" },
      { label: "면책", meta: "지급 이력", warning: true },
      { label: "다음 행동", meta: "공식 조회" },
    ],
    actionTitle: "중도보험금 발생 여부 확인 Action Pack",
    documents: [
      "보험증권의 계약일·만기일",
      "중도보험금 지급 조건이 있는 약관",
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
      { label: "가입담보", value: "교통상해 특별약관" },
      { label: "보상조항", value: "제9조 보험금 지급사유" },
      { label: "면책조항", value: "제11조 지급하지 않는 사유" },
    ],
    evidence: [
      { label: "사건", meta: "교통사고" },
      { label: "진단", meta: "상해 치료" },
      { label: "담보", meta: "교통상해" },
      { label: "지급사유", meta: "제9조" },
      { label: "면책", meta: "사고 조건", warning: true },
      { label: "다음 행동", meta: "확인 불가" },
    ],
    actionTitle: "면책 조건 확인 Action Pack",
    documents: [
      "사고사실확인원",
      "경찰·교통사고 관련 확인 자료",
      "가입 당시 적용된 특약 약관",
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

export const analysisSteps = [
  "사건",
  "진단",
  "담보",
  "지급사유",
  "면책",
  "다음 행동",
]

export const policyOpsSteps = [
  "신규 약관 감지",
  "버전·조항 비교",
  "근거 그래프 갱신",
  "회귀 평가",
  "사람 승인",
]

export function getClaimCase(caseId: string): ClaimCase {
  return claimCases.find((item) => item.id === caseId) ?? claimCases[0]
}

export function buildResults(
  caseId: ClaimCase["id"],
  answer: Answer | null,
): ClaimResult[] {
  if (caseId === "maturity") {
    return [
      {
        title: "중도보험금 발생 시점",
        status: "확인 권장",
        tone: "positive",
        reason:
          "계약일과 약관의 경과기간 조건을 대조하면 2022년이 최초 후보 시점입니다.",
        detail:
          "발생 가능 시점의 역산 결과이며 미지급 금액을 뜻하지 않습니다. 보험사 계약·지급 내역에서 실제 상태를 확인해야 합니다.",
        clause: "주계약 약관 제21조 · 중도보험금 지급",
      },
      {
        title: "이미 지급 또는 인출했는지",
        status:
          answer === "no"
            ? "정보 필요"
            : answer === "yes"
              ? "정보 필요"
              : "확인 불가",
        tone: answer === "unknown" || answer === null ? "blocked" : "warning",
        reason:
          answer === "yes"
            ? "사용자 기억과 보험사 지급 이력을 대조해야 합니다."
            : "서비스가 보험사의 과거 지급 이력을 보유하지 않습니다.",
        detail:
          "내보험찾아줌 또는 가입 보험사의 공식 채널에서 지급·적립·인출 상태를 확인해야 합니다.",
        clause: "보험사 내부 계약·지급 데이터 필요",
      },
      {
        title: "확정 금액",
        status: "확인 불가",
        tone: "blocked",
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
        title: "교통상해 담보",
        status:
          answer === "no"
            ? "확인 권장"
            : answer === "yes"
              ? "확인 불가"
              : "정보 필요",
        tone:
          answer === "no"
            ? "positive"
            : answer === "yes"
              ? "blocked"
              : "warning",
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
        title: "보상 조항 단독 검색 결과",
        status: "확인 불가",
        tone: "blocked",
        reason:
          "대응하는 면책·정의 조항이 함께 검색되지 않으면 결과를 생성하지 않습니다.",
        detail:
          "Evidence Auditor가 근거 경로의 누락을 감지해 초안 결과를 차단한 상태입니다.",
        clause: "Evidence Validator 규칙 EV-02",
      },
      {
        title: "최종 지급 여부",
        status: "확인 불가",
        tone: "blocked",
        reason: "보험회사의 사고 조사와 지급 심사가 필요한 항목입니다.",
        detail:
          "Agent는 확인해야 할 조건과 서류를 준비하며 최종 지급 여부를 대신 결정하지 않습니다.",
        clause: "보험회사 최종 심사 영역",
      },
    ]
  }

  return [
    {
      title: "골절진단비 특약",
      status: "확인 권장",
      tone: "positive",
      reason: "증권의 골절진단비 특약과 S52 계열 진단이 연결됩니다.",
      detail:
        "실손 청구와 별개로 정액 담보를 확인할 가치가 있습니다. 지급 여부는 약관상 골절 정의, 진단 확정, 기존 청구 여부에 따라 달라집니다.",
      clause: "골절진단비 특별약관 제12조 · 제14조",
    },
    {
      title: "상해수술비 특약",
      status:
        answer === "yes"
          ? "확인 권장"
          : answer === "no"
            ? "가능성 낮음"
            : "정보 필요",
      tone:
        answer === "yes" ? "positive" : answer === "no" ? "muted" : "warning",
      reason:
        answer === "yes"
          ? "사용자 답변에서 수술 시행 사실을 확인했습니다."
          : answer === "no"
            ? "사용자 답변에서 수술을 받지 않은 것으로 확인했습니다."
            : "수술 여부가 확인되지 않아 약관상 수술 정의를 대조할 수 없습니다.",
      detail:
        "의료행위가 있었다는 사실만으로 약관상 수술에 해당한다고 단정하지 않습니다. 수술기록지와 특약의 수술 정의가 추가로 필요합니다.",
      clause: "상해수술비 특별약관 제8조 · 수술분류표",
    },
    {
      title: "입원일당",
      status: "가능성 낮음",
      tone: "muted",
      reason: "입원 사실이 입력 자료에서 확인되지 않았습니다.",
      detail:
        "입원 치료를 받았다면 입퇴원확인서를 추가해 다시 확인할 수 있습니다. 현재 자료만으로는 후보 우선순위가 낮습니다.",
      clause: "상해입원일당 특별약관 제6조",
    },
  ]
}
