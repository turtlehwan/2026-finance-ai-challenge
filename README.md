# 보험금 길잡이 Agent

고령 부모의 보험을 대신 챙기는 가족을 위한 약관 근거 기반 확인·행동 Agent다.
보험금 지급을 확정하지 않고, 실제 공식 약관과 합성 사건을 연결해 확인할 항목,
근거, 추가 질문, 필요 서류를 준비한다.

## 빠른 실행

```bash
npm install
npm run dev
```

Node.js `>=24.0.0`이 필요하다. 브라우저에서 `http://localhost:5173`을 열고
`공식 약관 연결 샘플 불러오기` → `손목 골절` → `이 사례 분석하기` 순서로 실행한다.

## 검증 명령

```bash
npm test
npm run lint
npm run build
```

테스트는 LangGraph 분석 API, 50건 결정론적 회귀 fixture, 15건 수작업 라벨
holdout, 표준약관 provenance API, PolicyOps의 승인 payload 검증까지 실행한다.
회귀·holdout 지표의 100%는 실제 보험금 지급 정확도가 아니다.

## 제출 문서

- [기획서 최신본](docs/planning-proposal.md)
- [기능명세서 최신본](docs/feature-specification.md)
- [주장·의사결정 근거 대장](docs/claim-evidence-matrix.md)
- [예선 준비도 보고서](docs/contest-readiness-report.md)
- [조사 근거와 1위 전략](docs/research-basis.md)
- [제출 문서용 시각 자료](docs/submission-visuals.md)
- [기획서 PDF 초안](output/pdf/2026-finance-ai-challenge-proposal-draft.pdf)
- [기능명세서 PDF 초안](output/pdf/2026-finance-ai-challenge-feature-specification-draft.pdf)
- [공식 양식 기반 HWPX와 최종 생성 안내](output/hwpx/README.md)
- [공식 양식 기반 기획서 HWPX](output/hwpx/2026_금융_AI_Challenge_기획서_팀정보입력필요.hwpx)
- [공식 양식 기반 기능명세서 HWPX](output/hwpx/2026_금융_AI_Challenge_기능명세서_팀정보입력필요.hwpx)

공식 HWPX에는 최신 내용과 팀명 `쿠쿠`가 이식되어 있다. 공개 저장소의 두 파일은
구성원 실명 대신 제출 차단 표식을 포함하므로 그대로 제출하지 않는다. 제출 직전
`SUBMISSION_MEMBER_NAMES` 환경 변수로 Git 제외 경로에 실명본을 생성하고, 한컴에서
쪽 나눔을 확인한 뒤 PDF로 변환한다. 자세한 절차는 HWPX 안내 문서를 따른다.

## 실제 데이터 출처

- 우체국보험 공식 약관과 공공데이터포털 판매기간 메타데이터
- 금융감독원·국가법령정보센터 `보험업감독업무시행세칙 별표 15` 표준약관
- 손해보험협회 소비자포털의 표준 청구서류 안내

출처 URL, 시행일, 페이지 범위, SHA-256은 `data/policies/manifest.json`과
결과 화면에 공개한다. `data/policies/`의 PDF는 개인 정보가 없는 공식 원문이며,
서비스는 개인 보험증권·진료자료를 저장하거나 학습에 사용하지 않는다.

## 제품 범위와 한계

- 기본 경로는 텍스트 레이어 PDF·TXT를 처리한다. 사용자가 `AI 보조 문서 이해`에
  동의하면 Workers AI 문서 변환으로 PDF·JPG·PNG·WEBP를 텍스트화한다. 저해상도·
  손상 문서·복잡한 표는 실패할 수 있으며 원문 확인을 대체하지 않는다.
- AI 보조 문서 변환은 원본을 Cloudflare Workers AI에 전송한다. 일반 LLM 도구에는
  마스킹된 미리보기만 전달하며, 서비스는 원본을 자체 저장소나 모델 학습에 사용하지 않는다.
- 개인 문서는 합성 샘플 또는 사용자가 직접 넣은 세션 데이터다.
- 보험사 내부 청구 이력·지급 심사·확정 금액은 조회하지 않는다.
- PolicyOps 승인 버튼은 예선 시연 상태만 기록하고 운영 인덱스를 자동 변경하지
  않는다. 실제 반영은 별도 검토·배포 절차가 필요하다.
- 최종 지급 여부는 보험회사가 결정한다.

## 배포

예선 제출용 배포 URL: `https://finai26.turtlehwan.dev`

운영 배포는 Cloudflare Workers와 사용자 도메인을 사용한다. 기존 OpenAI Sites
주소는 전환 안정화 기간의 장애 대비용으로만 유지하며 제출 문서의 정본 URL로
사용하지 않는다.

`main` 푸시는 GitHub Actions에서 lint·test·build를 통과한 뒤 새 Worker version을
업로드하고 100% 트래픽으로 승격한다. `finai26.turtlehwan.dev`는 이 Worker에 연결된
Cloudflare 인프라 설정으로 유지한다. 배포 토큰과 계정 식별자는 GitHub `production`
Environment Secret에만 둔다.

배포 전에는 위 검증 명령과 브라우저에서 90초 검증 흐름을 다시 실행한다.
