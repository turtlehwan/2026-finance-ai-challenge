---
title: "보험금 길잡이 Agent 주장·의사결정 근거 대장"
status: "shared"
updated: "2026-08-06"
scope: "2026 금융 AI Challenge 예선"
---

# 주장·의사결정 근거 대장

이 문서는 “왜 이 문장과 기능을 넣었는가?”를 제출 전 다시 검증하기 위한
공유 문서다. 기획서에 들어갈 수 있는 모든 문장을 같은 무게로 포장하지 않는다.
각 항목을 공식 사실, 외부 선례, 코드로 증명되는 구현 사실, 팀의 설계 가설로
구분한다. `1위`는 심사 결과가 아니라 이 근거를 바탕으로 한 목표다.

## 1. 근거 등급

| 등급 | 의미 | 제출 문서의 표현 규칙 |
|---|---|---|
| `O` 공식 사실 | 주최·공공기관·공식 원문이 직접 확인되는 사실 | 출처·시행일·페이지·URL을 함께 쓴다 |
| `C` 코드 증명 | 현재 배포 코드와 실행 trace로 재현되는 사실 | 기능명세서에 실제 동작 범위로 쓴다 |
| `E` 외부 선례 | 다른 연도·다른 트랙의 사례 또는 연구 | 현재 대회 평가 기준으로 오인하지 않게 표시한다 |
| `H` 팀 가설 | 문제를 풀기 위한 제품·UX·심사 전략 가설 | 효과를 보장하지 않고 검증 계획과 함께 쓴다 |
| `S` 합성·제한 | 개인 데이터 부재, 합성 fixture, 미구현 범위 | 실제 데이터·정확도로 표현하지 않는다 |

## 2. 핵심 주장과 근거

| 주장 또는 결정 | 등급 | 근거 | 현재 검증 | 문서·화면에서의 안전한 표현 |
|---|---|---|---|---|
| 대회는 AI 금융 현안 해결 아이디어와 실제 작동 웹서비스를 요구한다 | `O` | [DAKER 대회 안내](https://daker.ai/public/hackathons/2026-finance-ai-challenge), [금융보안원 공고](https://www.fsec.or.kr/bbs/detail?bbsNo=11997&menuNo=66) | 제출물(기획서·기능명세서·URL)과 URL 접근 기간 확인 | “예선 제출물의 실제 작동 범위”로 한정 |
| 현재 공개 페이지에는 세부 가중치가 공개되지 않았다 | `O` | [DAKER 평가 안내](https://daker.ai/public/hackathons/2026-finance-ai-challenge) | 주제 적합성·부적격 여부 중심으로 확인 | “1위 보장”, “가중치 공략”이라고 쓰지 않음 |
| 숨은보험금 문제는 규모가 크고 발생 사실을 모르는 것이 원인 중 하나다 | `O` | [금융위원회 2026 보도자료](https://www.fsc.go.kr/po010103/87270) | 10.3조 원, 2025년 약 80만 건·3조 2,470억 원, 평균 약 404만 원 | 통계의 기준일과 원출처를 함께 표기 |
| 청구 절차·지급 안내가 소비자 불편으로 조사됐다 | `O` | [보험연구원 보험소비자 행태조사 본문](https://www.kiri.or.kr/pdf/%EC%A0%84%EB%AC%B8%EC%9E%90%EB%A3%8C/nre2022-17.pdf) | 39.7%/52.5%, 지급 과정 54.7%, 지급 내역 51.4% 표 확인 | 조사 문항·응답 방식(단일/복수)을 생략하지 않음 |
| 가족 보호자를 1차 사용자로 둔다 | `H` | 고령층 접근성 문제에 대한 [금융위원회 안내](https://www.fsc.go.kr/po010103/87270) + 문서 수집·공식 채널 실행을 가족이 돕는 제품 관찰 | 사용자 인터뷰 표본으로 검증 전 | “핵심 가설”로 쓰고 고령층 전체의 대표 통계처럼 말하지 않음 |
| 결과는 보험금 확정이 아니라 확인할 항목·서류·공식 경로다 | `C` | `lib/claim-guide/agent-graph.ts`, `lib/claim-guide/types.ts`, 결과 상태 enum 및 화면 고지 | Evidence Auditor 실패 시 중단, `확인 권장/정보 필요/가능성 낮음/확인 불가`만 반환 | “보험금 지급 여부는 보험회사가 결정”을 결과 옆에 고정 |
| 가입 당시 적용 약관을 먼저 선택한다 | `C` + `O` | 우체국보험 약관 API의 적용기간·상품코드, `lib/claim-guide/policies.ts`, `data/policies/manifest.json` | P400051~054, P400073~076, P600107을 계약일과 대조 | “최신 약관 검색”이 아니라 “상품코드·계약일·판매기간 대조”라고 씀 |
| 결과에 실제 공식 약관 원문·쪽수·해시가 연결된다 | `C` + `O` | `data/policies/manifest.json`, `data/policies/`, `components/claim-guide/demo/results-panel.tsx` | 상품 2개·버전 3개, 조항 유형·페이지·SHA-256 표시 | “실제 약관 3개 버전 범위”를 명시 |
| 보험금 길잡이는 단순 챗봇이 아니라 사건 처리 Agent다 | `C` | `lib/claim-guide/agent-graph.ts`: Case Analyst → 문서 도구 → 버전 선택 → Coverage Matcher → 정보 게이트 → Evidence Auditor → Action Planner | 실제 LangGraph trace를 React Flow로 렌더링 | 프레임워크 이름보다 노드 입력·출력·분기 이유를 먼저 보여줌 |
| AI를 과장하지 않고 제한된 역할만 사용한다 | `C` | `lib/claim-guide/workers-ai.ts`, `/api/documents/ai-convert`, `/api/ai/interpret` | 동의 시 문서 변환·마스킹 누락 사실 후보만 Workers AI 사용 | 범용 LLM·임베딩·Hybrid RAG를 현재 구현했다고 쓰지 않음 |
| 실제 사용자가 넣은 PDF/TXT도 같은 파이프라인에서 처리된다 | `C` + `S` | `components/claim-guide/demo/document-intake.tsx`, `lib/claim-guide/documents.ts` | 텍스트 레이어 PDF/TXT 기본, AI 동의 시 이미지·스캔 변환 | 개인 문서·진료 이력은 저장·학습하지 않으며 심사 기본 사례는 합성이라고 고지 |
| 새 약관을 계속 반영할 수 있다 | `C` + `H` | `components/claim-guide/policy-ops-section.tsx`, `lib/claim-guide/policies.ts`, `lib/claim-guide/evaluation.ts` | 변경 감지·Diff·회귀 평가·승인 시연은 동작; 자동 운영 인덱스 반영은 아님 | “자가 학습” 대신 “사람 승인형 PolicyOps 지식 갱신” |
| GraphRAG 방식의 관계 확장이 구현됐다 | `C` | `lib/claim-guide/agent-graph.ts`의 `graphRetrievalTool`, `lib/claim-guide/policies.ts` | 보험 도메인 관계 그래프에서 정의·지급·면책·서류를 결정론적으로 확장 | Microsoft GraphRAG 전체 패키지나 임베딩 검색으로 오인시키지 않음 |
| Agent 실행 그래프를 시각화하면 이해가 쉬워진다 | `H` + `C` | `@xyflow/react` 실행 캔버스 + 실제 trace, `docs/local/product-decisions.md` D-028 | 심사자가 실행 순서·대기·검증 실패를 화면에서 확인 가능 | “심사 이해를 돕는 설계 가설”로 두고 사용성 관찰을 계속 수집 |
| 실제성과 안전 경계를 동시에 보여주는 것이 상위권 전략이다 | `H` + `E` | 2025 대상 SIGNAL 보도 [ZDNET](https://zdnet.co.kr/view/?no=20251112134842)와 현재 대회 요구의 결합 | 전년도 사례는 참고 선례이며 현재 대회의 공식 점수표가 아님 | “전년도 선례에서 얻은 설계 가설”로 명시 |
| 50건 회귀·15건 holdout 수치가 실제 지급 정확도다 | `S` | `tests/fixtures`, `tests/holdout`, `lib/claim-guide/evaluation.ts` | 모두 합성 사실관계; 지급 이력·보험사 심사 데이터 없음 | “결정론적 그래프 품질 지표”라고만 표기 |

## 3. 현재 1위 경쟁력 점검

공개된 2026 가중치가 없으므로 아래 표는 점수가 아니라 **심사자가 URL과 문서를
대조할 때의 증거 완성도**를 점검하는 내부 기준이다.

| 심사 질문 | 현재 상태 | 강점 | 남은 리스크 | 제출 전 조치 |
|---|---|---|---|---|
| 문제가 실제 금융 현안인가? | 강함 | 공식 숨은보험금 통계와 소비자 조사 연결 | 가족 보호자 가설의 직접 인터뷰 부족 | 5~10명 짧은 사용성 인터뷰 또는 “검증 전 가설” 라벨 유지 |
| 실제 데이터가 있는가? | 강함(범위 제한) | 우체국보험 원문·판매기간·페이지·해시 | 개인 증권·지급 이력은 합성/미공개 | 상품 2개·버전 3개 범위를 화면·문서에서 동일하게 고지 |
| AI/Agent가 실제로 움직이는가? | 강함 | LangGraph 조건 분기·Human-in-the-loop·Workers AI opt-in | 범용 LLM 검색·임베딩 RAG는 미구현 | 기능명세서에서 구현·비구현을 계속 분리 |
| 결과를 믿을 수 있는가? | 강함 | 면책 동반 검증, 인용·버전 실패 시 안전 중단 | 실제 지급 정확도 평가 불가 | holdout 라벨·생성 규칙·한계와 실패 사례를 함께 공개 |
| 90초 안에 차별성을 이해하는가? | 보통~강함 | 실제 trace·Claim Evidence Map·Action Pack | 화면에서 보여줄 정보가 많아질 위험 | 기본 여정은 사례→질문→결과, 심화 근거는 요청 시 전면화 |
| 제출 실수가 없는가? | 보완 중 | 문서 단일 진실 원천과 자동 PDF 생성 | 공식 HWPX 전사·최종 URL 접근 기간은 별도 확인 필요 | 제출 직전 체크리스트와 live smoke test 실행 |

## 4. 쓰지 말아야 할 표현

| 위험한 표현 | 바꿔 쓸 표현 |
|---|---|
| AI가 받을 보험금을 찾아준다 | AI가 약관 근거로 확인할 보장 항목을 선별한다 |
| Self-RAG·Hybrid RAG를 구현했다 | 결정론적 관계 탐색과 제한형 Workers AI 보조를 구현했다 |
| 약관이 자동으로 자가 학습된다 | 신규 문서를 감지하고 회귀 평가·사람 승인을 거쳐 지식 구조를 갱신한다 |
| 50건에서 100% 정확하다 | 합성 회귀 fixture의 그래프·근거 검증 통과율을 측정했다 |
| 고령층의 불편을 해결했다 | 가족 보호자 가설을 중심으로 고령층의 문서 확인 부담을 낮추도록 설계했다 |
| 1위 전략이다 | 공식 가중치가 공개되지 않은 상태에서 근거·실행·안전성을 동시에 증명하려는 팀 전략이다 |

## 5. 제출 전 증거 패키지

- [기획서](./planning-proposal.md): 문제·컨셉·데이터·AI·효과의 최신본
- [기능명세서](./feature-specification.md): 배포 URL에서 실제 동작하는 범위
- [조사 근거](./research-basis.md): 공식 요구·실제 데이터·외부 선례·한계
- [출처·권리 판단](./source-rights-and-official-sources.md): 공공 원문·이용조건·규제 경계
- [`data/policies/manifest.json`](../data/policies/manifest.json): 상품·버전·페이지·해시 provenance
- [`data/evaluation/holdout-v1.json`](../data/evaluation/holdout-v1.json): 생성 규칙과 분리한 합성 holdout
- [`docs/submission-visuals.md`](./submission-visuals.md): 실제 trace·근거 경로 시각화

이 대장은 기획서의 새로운 주장 저장소가 아니다. 주장을 추가하거나 범위를
바꾸면 먼저 이 표의 근거 등급과 검증 상태를 갱신하고, 그 다음 기획서와
기능명세서에 반영한다.
