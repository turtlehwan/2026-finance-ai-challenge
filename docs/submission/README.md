# 예선 제출 문서 정본

이 디렉터리는 변경된 `report-writing-studio` 원칙에 따라 기획서와 기능명세서의
내용 정본과 생성 조건을 관리한다.

| 문서 | 내용 정본 | 문서 계약 | HWPX 산출물 |
| --- | --- | --- | --- |
| 기획서 | [`proposal/report.md`](./proposal/report.md) | [`proposal/report.yaml`](./proposal/report.yaml) | [`../../output/hwpx/2026_금융_AI_Challenge_기획서_팀정보입력필요.hwpx`](../../output/hwpx/2026_금융_AI_Challenge_기획서_팀정보입력필요.hwpx) |
| 기능명세서 | [`feature-specification/report.md`](./feature-specification/report.md) | [`feature-specification/report.yaml`](./feature-specification/report.yaml) | [`../../output/hwpx/2026_금융_AI_Challenge_기능명세서_팀정보입력필요.hwpx`](../../output/hwpx/2026_금융_AI_Challenge_기능명세서_팀정보입력필요.hwpx) |

- 공통 외부·실행 근거는 [`evidence.json`](./evidence.json)에 한 번만 기록한다.
- 산출물 검수 범위와 남은 한계는 각 문서의 `render-review.json`에 기록한다.
- 본문·수치·순서·표·그림은 `report.md`에서 먼저 고친 뒤 `npm run docs:hwpx`로
  HWPX를 다시 만든다.
- 저장소에는 내부 검토용 PDF를 보관하지 않는다. 대회가 요구하는 최종 PDF는
  사용자가 실명 입력과 한컴 전 페이지 확인을 끝낸 HWPX에서 제출 직전에 만든다.
- 제품 의도와 선택 이유는 Git에서 제외된
  [`../local/product-decisions.md`](../local/product-decisions.md)에 누적한다.

