"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Answer = "yes" | "no" | "unknown";
type ResultTone = "positive" | "warning" | "muted" | "blocked";

type CaseResult = {
  title: string;
  status: string;
  tone: ResultTone;
  reason: string;
  detail: string;
  clause: string;
};

type CaseData = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  question: string;
  questionHint: string;
  evidence: {
    label: string;
    meta: string;
    kind?: "warning";
  }[];
  actionTitle: string;
  documents: string[];
  questions: string[];
  resultFor: (answer: Answer | null) => CaseResult[];
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`ui-icon ui-icon-${name} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

const cases: CaseData[] = [
  {
    id: "fracture",
    title: "손목 골절 — 실손만 청구한 경우",
    shortTitle: "손목 골절",
    description:
      "넘어져 손목 골절 치료를 받고 실손만 청구했습니다. 같은 증권의 정액 담보는 확인하지 않은 사례입니다.",
    category: "담보가 있는 줄 몰랐던 사례",
    question: "이번 치료에서 수술을 받으셨나요?",
    questionHint:
      "상해수술비를 확인하려면 진단명만으로는 부족합니다. 모르면 추정하지 않고 다음 단계에 표시합니다.",
    evidence: [
      { label: "손목 골절", meta: "2025.04.15" },
      { label: "S52 진단군", meta: "진료 정보" },
      { label: "골절진단비", meta: "가입 특약" },
      { label: "제12조", meta: "지급사유" },
      { label: "제14조", meta: "면책 확인" },
      { label: "확인 권장", meta: "정액 담보" },
    ],
    actionTitle: "골절진단비 확인을 위한 Action Pack",
    documents: [
      "진단명·질병분류코드가 있는 진단서",
      "보험증권 또는 가입내역",
      "사고일을 확인할 수 있는 자료",
    ],
    questions: [
      "이 사고로 골절진단비를 이미 청구했나요?",
      "가입 당시 적용 약관의 골절 정의에 해당하나요?",
    ],
    resultFor: (answer) => [
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
              : "추가 정보 필요",
        tone:
          answer === "yes"
            ? "positive"
            : answer === "no"
              ? "muted"
              : "warning",
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
    ],
  },
  {
    id: "maturity",
    title: "오래된 계약 — 중도보험금 발생 추정",
    shortTitle: "오래된 계약",
    description:
      "14년째 유지 중인 종합보험입니다. 계약일과 약관 조건을 역산해 이미 발생했을 수 있는 중도보험금 시점을 찾습니다.",
    category: "지급 사유 발생을 몰랐던 사례",
    question: "계약 중 중도 인출이나 해지를 한 적이 있나요?",
    questionHint:
      "중도보험금 발생 시점을 추정할 수는 있지만, 실제 지급·인출 이력은 보험사 내부 데이터 확인이 필요합니다.",
    evidence: [
      { label: "2012년 계약", meta: "계약일" },
      { label: "14년 유지", meta: "경과 기간" },
      { label: "중도보험금", meta: "약관 조건" },
      { label: "제21조", meta: "발생 시점" },
      { label: "지급 이력", meta: "보험사 확인", kind: "warning" },
      { label: "시점 확인", meta: "공식 채널" },
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
    resultFor: (answer) => [
      {
        title: "중도보험금 발생 시점",
        status: "확인 권장",
        tone: "positive",
        reason:
          "계약일과 약관의 경과기간 조건을 대조하면 2022년이 최초 후보 시점입니다.",
        detail:
          "이는 발생 가능 시점의 역산 결과이며 미지급 금액이나 수령 가능 금액을 뜻하지 않습니다. 보험사 계약·지급 내역에서 실제 상태를 확인해야 합니다.",
        clause: "주계약 약관 제21조 · 중도보험금 지급",
      },
      {
        title: "이미 지급 또는 인출했는지",
        status:
          answer === "no"
            ? "공식 조회 필요"
            : answer === "yes"
              ? "추가 확인 필요"
              : "확인 불가",
        tone:
          answer === "no"
            ? "warning"
            : answer === "yes"
              ? "warning"
              : "blocked",
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
    ],
  },
  {
    id: "exclusion",
    title: "면책 함정 — 조항만 보면 오답",
    shortTitle: "면책 함정",
    description:
      "보상 조항만 보면 후보처럼 보이지만 면책 조항과 사고 조건을 함께 보아야 결론이 달라지는 사례입니다.",
    category: "환각·면책 방어 사례",
    question: "사고 당시 음주운전 또는 무면허 운전이었나요?",
    questionHint:
      "고위험 조건은 Agent가 임의로 채우지 않습니다. 답변이 없으면 근거 경로를 멈추고 판단을 보류합니다.",
    evidence: [
      { label: "교통사고", meta: "사고 정보" },
      { label: "상해 담보", meta: "가입 특약" },
      { label: "제9조", meta: "보상 조항" },
      { label: "제11조", meta: "면책 조항" },
      { label: "사고 조건", meta: "추가 질문", kind: "warning" },
      { label: "판단 보류", meta: "근거 우선" },
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
    resultFor: (answer) => [
      {
        title: "교통상해 담보",
        status:
          answer === "no"
            ? "확인 권장"
            : answer === "yes"
              ? "판단 보류"
              : "추가 정보 필요",
        tone:
          answer === "no"
            ? "positive"
            : answer === "yes"
              ? "blocked"
              : "warning",
        reason:
          answer === "yes"
            ? "사용자 답변이 면책 조항 검토를 필요로 하는 고위험 조건과 연결됩니다."
            : answer === "no"
              ? "현재 답변에서는 해당 면책 조건이 확인되지 않았습니다."
              : "사고 당시 운전 조건이 확인되지 않았습니다.",
        detail:
          "보상 조항만으로 지급 가능성을 제시하지 않습니다. 면책 조항, 사실확인 자료, 보험사의 최종 심사가 함께 필요합니다.",
        clause: "교통상해 특별약관 제9조 · 제11조",
      },
      {
        title: "보상 조항 단독 검색 결과",
        status: "사용 금지",
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
        tone: "muted",
        reason: "보험회사의 사고 조사와 지급 심사가 필요한 항목입니다.",
        detail:
          "Agent는 확인해야 할 조건과 서류를 준비하며 최종 지급 여부를 대신 결정하지 않습니다.",
        clause: "보험회사 최종 심사 영역",
      },
    ],
  },
];

const answerOptions: { value: Answer; label: string }[] = [
  { value: "yes", label: "예" },
  { value: "no", label: "아니오" },
  { value: "unknown", label: "잘 모르겠어요" },
];

const processSteps = ["목표 이해", "문서 구조화", "근거 연결", "검증 완료"];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Header({
  largeText,
  onToggleText,
}: {
  largeText: boolean;
  onToggleText: () => void;
}) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="보험금 길잡이 Agent 홈">
        <BrandMark />
        <span>보험금 길잡이 Agent</span>
      </a>
      <nav aria-label="주요 메뉴">
        <a href="#demo">직접 확인하기</a>
        <a href="#policyops">작동 방식</a>
        <a href="#trust">신뢰 원칙</a>
      </nav>
      <button
        className="text-toggle"
        type="button"
        onClick={onToggleText}
        aria-pressed={largeText}
      >
        <span>큰글씨</span>
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-knob">가</span>
        </span>
      </button>
    </header>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <h1>
          부모님의 보험,
          <br />
          놓친 항목이 없도록
          <br />
          Agent가 함께 확인합니다
        </h1>
        <p>
          증권과 치료 정보를 연결해 확인해볼 보험금 항목을 선별하고, 약관
          근거와 다음 행동까지 정리합니다.
        </p>
        <div className="hero-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={onStart}
          >
            합성 사례로 확인하기
            <Icon name="arrow" />
          </button>
          <span>AI가 지급 여부를 결정하지 않습니다.</span>
        </div>
      </div>
      <div className="hero-evidence" aria-label="근거 연결 예시">
        <div className="document-preview">
          <div className="document-head">
            <span>상해보험 특별약관</span>
            <Icon name="document-search" />
          </div>
          <div className="clause">
            <strong>제12조 (보험금의 지급사유)</strong>
            <p>
              회사는 피보험자가 보험기간 중 상해로 골절 진단을 받은 경우,
              골절진단비를 지급합니다.
            </p>
          </div>
          <div className="clause clause-muted">
            <strong>제14조 (보험금을 지급하지 않는 사유)</strong>
            <p>
              다음 각 호의 어느 하나에 해당하는 경우에는 지급하지 않습니다.
            </p>
          </div>
        </div>
        <div className="hero-path" aria-hidden="true">
          {[
            "손목 골절",
            "골절진단비",
            "제12조 지급사유",
            "제14조 면책 확인",
            "확인 권장",
          ].map((label, index) => (
            <div className="hero-path-step" key={label}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgressRail({
  completedSteps,
  running,
}: {
  completedSteps: number;
  running: boolean;
}) {
  return (
    <div className="progress-rail" aria-label="Agent 작업 계획">
      {processSteps.map((step, index) => {
        const isDone = completedSteps > index;
        const isActive = running && completedSteps === index;
        return (
          <div
            className={`progress-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`}
            key={step}
          >
            <span>{isDone ? <Icon name="check" /> : index + 1}</span>
            <strong>{step}</strong>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceMap({
  activeCase,
  activeNode,
  onSelectNode,
}: {
  activeCase: CaseData;
  activeNode: number;
  onSelectNode: (index: number) => void;
}) {
  const selected = activeCase.evidence[activeNode];
  return (
    <div className="evidence-map">
      <div className="panel-heading">
        <div>
          <span className="section-label">Claim Evidence Map</span>
          <h3>사건부터 약관·행동까지 잇는 근거 지도</h3>
        </div>
        <Icon name="network" />
      </div>
      <div className="evidence-flow" role="group" aria-label="근거 경로">
        {activeCase.evidence.map((node, index) => (
          <button
            type="button"
            className={`evidence-node ${node.kind === "warning" ? "is-warning" : ""} ${activeNode === index ? "is-selected" : ""}`}
            key={`${activeCase.id}-${node.label}`}
            onClick={() => onSelectNode(index)}
            aria-pressed={activeNode === index}
          >
            <span>{index + 1}</span>
            <strong>{node.label}</strong>
            <small>{node.meta}</small>
          </button>
        ))}
      </div>
      <div
        className={`evidence-detail ${selected.kind === "warning" ? "is-warning" : ""}`}
      >
        <strong>{selected.label}</strong>
        <span>
          {selected.kind === "warning"
            ? "이 지점은 자료가 부족해 Agent가 추가 질문을 요청한 구간입니다."
            : "원문·계약 정보와 연결된 검증 가능한 근거 지점입니다."}
        </span>
      </div>
    </div>
  );
}

function ResultRows({
  results,
  openResult,
  onToggle,
}: {
  results: CaseResult[];
  openResult: number;
  onToggle: (index: number) => void;
}) {
  return (
    <div className="result-list">
      {results.map((result, index) => (
        <div className={`result-row tone-${result.tone}`} key={result.title}>
          <button
            className="result-summary"
            type="button"
            onClick={() => onToggle(index)}
            aria-expanded={openResult === index}
          >
            <span className="result-symbol" aria-hidden="true">
              {result.tone === "positive" ? (
                <Icon name="check" />
              ) : result.tone === "warning" ? (
                <Icon name="alert" />
              ) : result.tone === "blocked" ? (
                <Icon name="shield" />
              ) : (
                <span>—</span>
              )}
            </span>
            <span className="result-main">
              <strong>{result.title}</strong>
              <small>{result.reason}</small>
            </span>
            <span className="result-clause">{result.clause}</span>
            <span className="status">{result.status}</span>
            <Icon
              name="chevron"
              className={openResult === index ? "is-open" : ""}
            />
          </button>
          {openResult === index && (
            <div className="result-detail">
              <strong>Agent 설명</strong>
              <p>{result.detail}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionPack({ activeCase }: { activeCase: CaseData }) {
  return (
    <div className="action-pack">
      <div className="panel-heading">
        <div>
          <span className="section-label">Action Pack</span>
          <h3>{activeCase.actionTitle}</h3>
        </div>
        <Icon name="route" />
      </div>
      <div className="action-columns">
        <div>
          <strong>준비할 자료</strong>
          <ul>
            {activeCase.documents.map((item) => (
              <li key={item}>
                <Icon name="document-check" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>보험사에 물어볼 질문</strong>
          <ol>
            {activeCase.questions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Demo() {
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [running, setRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [activeNode, setActiveNode] = useState(0);
  const [openResult, setOpenResult] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeCase = useMemo(
    () => cases.find((item) => item.id === selectedId) ?? cases[0],
    [selectedId],
  );
  const results = useMemo(
    () => activeCase.resultFor(answer),
    [activeCase, answer],
  );
  const isReady = completedSteps >= processSteps.length;

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const runAnalysis = () => {
    stopTimer();
    setAnswer(null);
    setActiveNode(0);
    setOpenResult(0);
    setCompletedSteps(0);
    setRunning(true);
    let nextStep = 0;
    timerRef.current = setInterval(() => {
      nextStep += 1;
      setCompletedSteps(nextStep);
      setActiveNode(Math.min(nextStep, activeCase.evidence.length - 1));
      if (nextStep >= processSteps.length) {
        stopTimer();
        setRunning(false);
      }
    }, 480);
  };

  useEffect(() => stopTimer, []);

  const selectCase = (id: string) => {
    stopTimer();
    setSelectedId(id);
    setAnswer(null);
    setRunning(false);
    setCompletedSteps(0);
    setActiveNode(0);
    setOpenResult(0);
  };

  return (
    <section className="demo-section" id="demo">
      <div className="section-intro">
        <div>
          <span className="section-label">
            Interactive MVP · 비식별 합성 데이터
          </span>
          <h2>Agent가 확인하는 과정을 직접 따라가 보세요</h2>
        </div>
        <p>
          세 사례는 실제 개인정보가 아닌 합성 데이터입니다. 클릭하면 목표 설정,
          추가 질문, 근거 검증, 다음 행동이 한 흐름으로 이어집니다.
        </p>
      </div>

      <div className="demo-shell">
        <aside className="case-rail" aria-label="합성 사례 선택">
          <div className="rail-heading">
            <strong>합성 사례</strong>
            <span>3개</span>
          </div>
          {cases.map((item, index) => (
            <button
              type="button"
              className={`case-button ${selectedId === item.id ? "is-selected" : ""}`}
              onClick={() => selectCase(item.id)}
              aria-pressed={selectedId === item.id}
              key={item.id}
            >
              <span>{index + 1}</span>
              <strong>{item.shortTitle}</strong>
              <small>{item.category}</small>
              {selectedId === item.id && <Icon name="check" />}
            </button>
          ))}
          <div className="case-context">
            <Icon name="spark" />
            <strong>{activeCase.title}</strong>
            <p>{activeCase.description}</p>
          </div>
          <button
            className="button button-primary button-full"
            type="button"
            onClick={runAnalysis}
            disabled={running}
          >
            {running
              ? "Agent가 분석 중입니다"
              : isReady
                ? "다시 분석하기"
                : "Agent 분석 시작"}
            {!running && <Icon name="arrow" />}
          </button>
        </aside>

        <div className="demo-workspace">
          <div className="workspace-top">
            <div className="work-plan">
              <div className="panel-heading">
                <div>
                  <span className="section-label">Agent 작업 계획</span>
                  <h3>근거가 부족하면 멈추고 질문합니다</h3>
                </div>
                <Icon name="shield" />
              </div>
              <ProgressRail
                completedSteps={completedSteps}
                running={running}
              />
              <div
                className={`agent-question ${isReady ? "is-visible" : ""}`}
              >
                <div>
                  <span>확인 질문</span>
                  <strong>
                    {isReady
                      ? activeCase.question
                      : "분석을 시작하면 필요한 질문이 여기에 표시됩니다."}
                  </strong>
                  {isReady && <p>{activeCase.questionHint}</p>}
                </div>
                {isReady && (
                  <div
                    className="answer-options"
                    role="group"
                    aria-label={activeCase.question}
                  >
                    {answerOptions.map((option) => (
                      <button
                        type="button"
                        className={
                          answer === option.value ? "is-selected" : ""
                        }
                        onClick={() => setAnswer(option.value)}
                        aria-pressed={answer === option.value}
                        key={option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <EvidenceMap
              activeCase={activeCase}
              activeNode={activeNode}
              onSelectNode={setActiveNode}
            />
          </div>

          <div className="result-panel" aria-live="polite">
            <div className="panel-heading">
              <div>
                <span className="section-label">근거 검토 결과</span>
                <h3>
                  {isReady
                    ? `확인할 항목 ${results.length}건`
                    : "분석을 시작하면 결과가 여기에 표시됩니다"}
                </h3>
              </div>
              {isReady && <Icon name="check-badge" />}
            </div>
            {isReady ? (
              <ResultRows
                results={results}
                openResult={openResult}
                onToggle={(index) =>
                  setOpenResult(openResult === index ? -1 : index)
                }
              />
            ) : (
              <div className="empty-state">
                <Icon name="search" />
                <p>왼쪽 사례를 선택한 뒤 Agent 분석 시작을 눌러주세요.</p>
              </div>
            )}
          </div>

          {isReady && <ActionPack activeCase={activeCase} />}
        </div>
      </div>
    </section>
  );
}

const policySteps = [
  { label: "신규 약관 감지", icon: "document-search" },
  { label: "버전·조항 비교", icon: "compare" },
  { label: "근거 그래프 갱신", icon: "network" },
  { label: "회귀 평가", icon: "shield" },
  { label: "사람 승인", icon: "person" },
];

function PolicyOps() {
  const [diffType, setDiffType] = useState<"coverage" | "exclusion">(
    "coverage",
  );
  const [approved, setApproved] = useState(false);

  return (
    <section className="policyops-section" id="policyops">
      <div className="section-intro">
        <div>
          <span className="section-label">PolicyOps Loop</span>
          <h2>새 약관이 들어오면, 지식도 안전하게 갱신됩니다</h2>
        </div>
        <p>
          모델이 금융 판단을 스스로 바꾸지 않습니다. 변경을 감지하고 비교·검증한
          뒤, 사람의 승인까지 받은 지식만 반영합니다.
        </p>
      </div>

      <div className="policy-flow" aria-label="약관 지식 갱신 절차">
        {policySteps.map(({ label, icon }, index) => (
          <div className="policy-step" key={label}>
            <span>
              <Icon name={icon} />
            </span>
            <strong>{label}</strong>
            {index < policySteps.length - 1 && (
              <Icon name="arrow" />
            )}
          </div>
        ))}
      </div>

      <div className="diff-shell">
        <div className="diff-main">
          <div className="diff-toolbar">
            <div>
              <strong>표준약관_상해후유장해</strong>
              <span>v1.3 → v1.4</span>
            </div>
            <div
              className="diff-tabs"
              role="group"
              aria-label="변경 조항 종류"
            >
              <button
                type="button"
                className={diffType === "coverage" ? "is-selected" : ""}
                onClick={() => setDiffType("coverage")}
                aria-pressed={diffType === "coverage"}
              >
                지급 조건
              </button>
              <button
                type="button"
                className={diffType === "exclusion" ? "is-selected" : ""}
                onClick={() => setDiffType("exclusion")}
                aria-pressed={diffType === "exclusion"}
              >
                면책 조항
              </button>
            </div>
          </div>
          <div className="diff-grid">
            <div className="diff-version">
              <div className="version-heading">
                <span>이전 버전</span>
                <strong>2024.04</strong>
              </div>
              <p>제7조 (보험금의 지급사유)</p>
              <div className="diff-line is-removed">
                <span>−</span>
                {diffType === "coverage"
                  ? "회사는 약관에 정한 상해의 직접 결과로 후유장해가 발생한 경우 보상합니다."
                  : "정신질환으로 인한 후유장해는 보상하지 않습니다."}
              </div>
              <p>관련 분류표는 별표 1과 같습니다.</p>
            </div>
            <div className="diff-version">
              <div className="version-heading">
                <span>신규 버전</span>
                <strong>2025.05</strong>
              </div>
              <p>제7조 (보험금의 지급사유)</p>
              <div className="diff-line is-added">
                <span>+</span>
                {diffType === "coverage"
                  ? "회사는 상해의 직접 결과로 약관상 장해분류표의 기준을 충족한 경우 보상합니다."
                  : "정신질환 관련 장해는 별표 1의 진단·평가 기준을 충족한 경우 보상합니다."}
              </div>
              <p>관련 분류표는 별표 1과 같습니다.</p>
            </div>
          </div>
          <div className="diff-note">
            <Icon name="alert" />
            이 변경은 자동 적용되지 않습니다. 영향 범위와 회귀 평가를 통과한 뒤
            검토자가 반영합니다.
          </div>
        </div>

        <aside className="approval-panel">
          <span className="section-label">Human approval</span>
          <h3>사람의 검토와 승인을 거쳐 반영합니다</h3>
          <ul>
            <li>
              <Icon name="check" /> 변경 요약 확인
            </li>
            <li>
              <Icon name="check" /> 영향 범위 확인
            </li>
            <li>
              <Icon name="check" /> 회귀 평가 24/24 통과
            </li>
          </ul>
          <button
            className={`button button-full ${approved ? "button-approved" : "button-outline"}`}
            type="button"
            onClick={() => setApproved((value) => !value)}
            aria-pressed={approved}
          >
            {approved ? (
              <>
                승인됨 <Icon name="check" />
              </>
            ) : (
              <>
                검토 후 반영 <Icon name="person" />
              </>
            )}
          </button>
          <p>
            {approved
              ? "검증된 신규 버전이 운영 지식 후보로 승인되었습니다."
              : "승인 전에는 운영 검색 결과가 바뀌지 않습니다."}
          </p>
        </aside>
      </div>
    </section>
  );
}

const knowable = [
  [
    "증권상 담보·특약",
    "증권에 기재된 담보 범위와 특약 내용을 확인합니다.",
  ],
  [
    "치료 상황 대응 담보 후보",
    "치료·수술·진단 상황과 연결 가능한 담보 후보를 선별합니다.",
  ],
  [
    "중도·만기보험금 발생 추정 시점",
    "계약일과 약관 조건을 바탕으로 발생 가능 시점을 역산합니다.",
  ],
];

const unknowable = [
  [
    "이미 청구했는지",
    "과거 청구 이력은 보험회사 시스템에서만 확인할 수 있습니다.",
  ],
  ["확정된 숨은 보험금 금액", "지급 심사 전에는 금액을 확정하지 않습니다."],
  ["최종 지급 여부", "최종 결정은 보험회사의 심사 결과에 따릅니다."],
];

function TrustSection() {
  return (
    <section className="trust-section" id="trust">
      <div className="section-intro">
        <div>
          <span className="section-label">Transparency</span>
          <h2>알 수 있는 것과 없는 것</h2>
        </div>
        <p>
          한계를 먼저 밝히는 것이 금융 서비스의 신뢰 요건이라고 판단했습니다.
          이 경계는 결과 화면에도 항상 표시됩니다.
        </p>
      </div>
      <div className="trust-ledger">
        <div className="ledger-column can">
          <div className="ledger-heading">
            <Icon name="check-badge" />
            <strong>확인 가능</strong>
          </div>
          {knowable.map(([title, description]) => (
            <div className="ledger-row" key={title}>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <div className="ledger-column cannot">
          <div className="ledger-heading">
            <Icon name="alert" />
            <strong>확정 불가</strong>
          </div>
          {unknowable.map(([title, description]) => (
            <div className="ledger-row" key={title}>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HandoffSection() {
  const agentTasks = [
    { label: "조사", icon: "search" },
    { label: "비교", icon: "compare" },
    { label: "검증", icon: "shield" },
    { label: "준비", icon: "document-check" },
  ];
  const humanTasks = [
    { label: "확인", icon: "person" },
    { label: "판단", icon: "scale" },
    { label: "청구", icon: "route" },
  ];

  return (
    <section className="handoff-section">
      <div className="handoff-title">
        <span className="section-label">Human-in-the-loop</span>
        <h2>Agent가 준비하고, 사람은 공식 채널에서 실행합니다</h2>
      </div>
      <div className="handoff-rail">
        <div className="task-group">
          <span>Agent가 수행하는 일</span>
          <div>
            {agentTasks.map(({ label, icon }) => (
              <div className="task-node" key={label}>
                <Icon name={icon} />
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </div>
        <Icon name="arrow" className="handoff-arrow" />
        <div className="task-group human">
          <span>사람이 수행하는 일</span>
          <div>
            {humanTasks.map(({ label, icon }) => (
              <div className="task-node" key={label}>
                <Icon name={icon} />
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="official-links">
        <a href="https://cont.insure.or.kr/" target="_blank" rel="noreferrer">
          <span className="official-mark">내</span>
          <span>
            <strong>내보험찾아줌</strong>
            <small>확정된 숨은 보험금 조회·청구</small>
          </span>
          <Icon name="external" />
        </a>
        <a
          href="https://www.silson24.or.kr/claim/web/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="official-mark">24</span>
          <span>
            <strong>실손24</strong>
            <small>실손보험 청구 전산 통로</small>
          </span>
          <Icon name="external" />
        </a>
      </div>
      <div className="boundary-strip">
        <div>
          <Icon name="lock" />
          <span>
            <strong>회원가입 없음</strong>
            <small>심사 데모는 로그인 없이 사용합니다.</small>
          </span>
        </div>
        <div>
          <Icon name="database" />
          <span>
            <strong>합성 데이터</strong>
            <small>실제 개인정보를 사용하지 않습니다.</small>
          </span>
        </div>
        <div>
          <Icon name="trash" />
          <span>
            <strong>세션 종료 시 폐기</strong>
            <small>실서비스 업로드 문서의 원칙입니다.</small>
          </span>
        </div>
        <div>
          <Icon name="scale" />
          <span>
            <strong>보험회사가 최종 결정</strong>
            <small>Agent는 지급 여부를 확정하지 않습니다.</small>
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div>
        <a className="brand" href="#top">
          <BrandMark />
          <span>보험금 길잡이 Agent</span>
        </a>
        <p>
          2026 금융 AI Challenge 출품용 인터랙티브 MVP · 실제 약관 검색과 LLM
          추론을 연결하기 전, 사용자 흐름과 안전 판정 규칙을 검증하는 합성 데이터
          데모입니다.
        </p>
      </div>
      <a
        href="https://daker.ai/public/hackathons/2026-finance-ai-challenge"
        target="_blank"
        rel="noreferrer"
      >
        2026 금융 AI Challenge
        <Icon name="external" />
      </a>
    </footer>
  );
}

export function ClaimGuideApp() {
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("claim-guide-large-text") !== "true") {
      return;
    }
    const frame = window.requestAnimationFrame(() => setLargeText(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleText = () => {
    setLargeText((current) => {
      const next = !current;
      window.localStorage.setItem("claim-guide-large-text", String(next));
      return next;
    });
  };

  const startDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`app-shell ${largeText ? "large-text" : ""}`}>
      <Header largeText={largeText} onToggleText={toggleText} />
      <main>
        <Hero onStart={startDemo} />
        <Demo />
        <PolicyOps />
        <TrustSection />
        <HandoffSection />
      </main>
      <Footer />
    </div>
  );
}
