# 예선 제출용 HWPX

이 폴더의 두 HWPX는 DAKER가 제공한 공식 `첨부 1`·`첨부 2` 양식에
[`docs/submission/proposal/report.md`](../../docs/submission/proposal/report.md)와
[`docs/submission/feature-specification/report.md`](../../docs/submission/feature-specification/report.md)의 최신 내용을
이식한 공개 안전본이다.

## 현재 파일

- `2026_금융_AI_Challenge_기획서_팀정보입력필요.hwpx`
- `2026_금융_AI_Challenge_기능명세서_팀정보입력필요.hwpx`
- `generation-report.json`: 공식 양식 해시, 결과물 해시, 구조·렌더 검증 요약

두 HWPX의 구성원 성명 칸에는
`※ 제출 직전 팀장·팀원 실명 입력 필수`가 들어 있다. 공개 저장소에 실명을 남기지
않기 위한 의도적인 제출 차단 표식이므로 **이 파일을 그대로 제출하면 안 된다.**

## 생성과 최종본 만들기

공개 안전본을 다시 생성한다.

```bash
npm run docs:hwpx
```

제출 직전 로컬에서만 팀장·팀원 실명을 주입한다. 값은 공식 참가 신청 순서와
동일하게 입력한다.

```bash
SUBMISSION_MEMBER_NAMES="팀장 실명, 팀원 실명" npm run docs:hwpx
```

실명본은 Git에서 제외된 `output/private/submission/`에 생성된다. 생성 로그와
파일명에는 실명이 기록되지 않는다.

## 안전성과 양식 보존

- 기획서 공식 양식 SHA-256:
  `15ba1f89595f15c7582abec69bf4f06dc99864c5ac778a400d224f38ce95c039`
- 기능명세서 공식 양식 SHA-256:
  `83be2cd46904d54717d624272f3af88c99b5b06c45cb12490f93688d31604a4b`
- 공식 양식 해시가 달라지면 생성 중단
- 제목 띠, 회색 항목 행, A4 용지 설정, 쪽 번호, 글꼴·테두리와 비편집 패키지
  파트 보존
- HWPX 구조 검증, 독립 파서 왕복, 미리보기 렌더 수행
- 기획서 3개, 기능명세서 2개의 판단용 시각자료를 실제 PNG `BinData`로 삽입
- `mimetype` 엔트리는 ZIP 첫 항목이자 무압축 상태로 유지

## 제출 직전 필수 확인

1. `output/private/submission/`의 실명본 두 파일을 한컴오피스 또는 한컴독스에서 연다.
2. 팀명 `쿠쿠`와 팀장·팀원 실명 및 순서를 확인한다.
3. 모든 표가 여러 쪽에 정상 분할되고 글자 겹침·잘림이 없는지 전 페이지를 본다.
4. 한컴에서 PDF로 내보낸 뒤 다시 전 페이지를 확인한다.
5. 기획서 PDF, 기능명세서 PDF, 배포 URL을 DAKER 제출란에 각각 등록한다.

저장소에는 위 4단계에서 만든 PDF를 커밋하지 않는다. HWPX를 유일한 제출 문서
관리본으로 두고, 공식 업로드용 PDF는 검수한 최종 HWPX에서 사용자가 직접 만든다.

Kordoc 독립 렌더러는 긴 HWPX 표를 연속 캔버스로 그리므로 생성 보고서의
`rendererPageCount`는 한컴의 실제 쪽 수가 아니다. `a4SliceCount`는 시각 감사용
추정치이며, 최종 쪽 나눔은 반드시 한컴 렌더 결과로 확인한다.
