import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://claim-guide.example/", {
      headers: {
        accept: "text/html",
        host: "claim-guide.example",
        "x-forwarded-host": "claim-guide.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function fetchWorker(pathname, init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("api-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://claim-guide.example${pathname}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the insurance claim guide MVP", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /<title>보험금 길잡이 Agent<\/title>/);
  assert.match(html, /부모님 증권에서/);
  assert.match(html, /<em>가입 시점 약관<\/em>으로/);
  assert.match(html, /확인하세요/);
  assert.match(html, /\/family-policy-review-v4\.webp/);
  assert.match(html, /태블릿의 약관 문서와 보험 서류/);
  assert.match(html, /지급 여부를 정하는 것은/);
  assert.match(html, /근거 경로/);
  assert.match(html, /새 약관은 검토 후 반영합니다/);
  assert.match(html, /실제 흐름을 끝까지 확인하세요/);
  assert.match(html, /사례 선택/);
  assert.match(html, /근거 분석/);
  assert.match(html, /정보 확인/);
  assert.match(html, /다음 행동/);
  assert.match(html, /알 수 있는 것, 알 수 없는 것/);
  // 근거는 주장이 아니라 대조 가능한 값으로 노출한다.
  assert.match(html, /공식 원문과 검증 결과/);
  assert.match(html, /3ca9d2cdb152/);
  assert.match(html, /https:\/\/cont\.insure\.or\.kr\//);
  assert.match(html, /https:\/\/www\.silson24\.or\.kr\/claim\/web\//);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/claim-guide\.example\/og-v2\.png"\/>/,
  );
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps starter-only assets removed and production metadata wired", async () => {
  const [
    page,
    layout,
    app,
    demo,
    analysisHook,
    journeyPresentation,
    policyOps,
    preferenceHook,
    packageJson,
  ] = await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../app/components/ClaimGuideApp.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../components/claim-guide/agent-demo.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../components/claim-guide/demo/use-claim-analysis.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../lib/claim-guide/presentation.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../components/claim-guide/policy-ops-section.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../hooks/use-large-text.ts", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);

  assert.match(page, /<ClaimGuideApp \/>/);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /summary_large_image/);
  assert.match(app, /<AgentDemo \/>/);
  assert.match(demo, /useClaimAnalysis/);
  assert.match(demo, /이 사례 분석하기/);
  assert.match(demo, /답변 반영하고 결과 보기/);
  assert.match(analysisHook, /requestAnimationFrame/);
  assert.match(analysisHook, /\/api\/analyze/);
  assert.match(journeyPresentation, /JOURNEY_STEPS/);
  assert.match(journeyPresentation, /RESULT_STATE/);
  assert.match(policyOps, /검토 후 반영/);
  assert.match(policyOps, /\/api\/policyops\/review/);
  assert.match(preferenceHook, /claim-guide-preferences:v1/);
  assert.match(packageJson, /"gsap"/);
  assert.match(analysisHook, /import\("gsap"\)/);
  assert.match(packageJson, /"lucide-react"/);
  assert.match(packageJson, /"radix-ui"/);
  assert.match(packageJson, /"shadcn"/);

  await access(new URL("../public/og-v2.png", import.meta.url));
  await access(
    new URL("../public/family-policy-review-v1.webp", import.meta.url),
  );
  await access(
    new URL("../public/family-policy-review-v2.webp", import.meta.url),
  );
  await access(
    new URL("../public/family-policy-review-v3.webp", import.meta.url),
  );
  await access(
    new URL("../public/family-policy-review-v4.webp", import.meta.url),
  );
  await assert.rejects(
    access(
      new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url),
    ),
  );
});

test("analysis API asks for missing facts and updates the result", async () => {
  const firstResponse = await fetchWorker("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caseId: "fracture", answer: null }),
  });
  assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  assert.equal(first.needsAnswer, true);
  assert.equal(first.results.length, 3);
  assert.equal(first.trace.length, 7);
  assert.equal(first.trace.at(-1).nodeId, "human_review");
  assert.equal(first.trace.at(-1).status, "waiting");

  const answeredResponse = await fetchWorker("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caseId: "fracture", answer: "yes" }),
  });
  assert.equal(answeredResponse.status, 200);
  const answered = await answeredResponse.json();
  assert.equal(answered.needsAnswer, false);
  assert.equal(answered.results[1].status, "정보 필요");
  assert.equal(answered.results[0].citations.length, 6);
  assert.match(answered.results[0].clause, /생활재해보장특약Ⅱ 2504/);
  assert.equal(answered.trace.length, 8);
  assert.equal(answered.trace.at(-2).nodeId, "evidence_auditor");
  assert.equal(answered.trace.at(-1).nodeId, "action_planner");
  assert.equal(answered.audit.approved, true);
  assert.equal(answered.audit.standardTermsIncluded, true);
  assert.equal(answered.sources.length, 2);
  assert.match(answered.sources[1].title, /질병·상해보험 표준약관/);
  assert.equal(answered.dataMode, "official-sample");
});

test("policy resolver selects the official version by product code and date", async () => {
  const response = await fetchWorker(
    "/api/policies/resolve?productCode=P400073&contractDate=2025-05-10",
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.status, "resolved");
  assert.equal(result.policy.versionLabel, "2504");
  assert.equal(result.policy.evidenceReady, true);
  assert.equal(result.policy.clauses.length, 7);
  assert.match(result.policy.sourceUrl, /epostlife\.go\.kr/);
});

test("document parser masks PII and structures uploaded facts", async () => {
  const formData = new FormData();
  formData.append(
    "files",
    new File(
      [
        [
          "상품코드: P400073",
          "계약일: 2025-05-10",
          "피보험자: 김가상",
          "주민등록번호: 550312-1234567",
          "가입특약: 무배당 생활재해보장특약Ⅱ 2504",
        ].join("\n"),
      ],
      "certificate.txt",
      { type: "text/plain" },
    ),
  );
  formData.append(
    "files",
    new File(
      [
        [
          "환자명: 김가상",
          "사고일: 2025-05-22",
          "질병분류코드: S52.5",
          "치료: 부목 고정",
        ].join("\n"),
      ],
      "medical.txt",
      { type: "text/plain" },
    ),
  );

  const response = await fetchWorker("/api/documents/parse", {
    method: "POST",
    body: formData,
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.documents.length, 2);
  assert.equal(result.combinedFacts.productCode, "P400073");
  assert.equal(result.combinedFacts.contractDate, "2025-05-10");
  assert.deepEqual(result.combinedFacts.diagnosisCodes, ["S52.5"]);
  assert.equal(result.processing.originalStored, false);
  assert.equal(result.processing.trainingUse, false);
  assert.doesNotMatch(
    result.documents.map((document) => document.maskedPreview).join(" "),
    /550312-1234567|김가상/,
  );
});

test("user document facts run through the graph and block unsupported versions", async () => {
  const response = await fetchWorker("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseId: "fracture",
      answer: "no",
      documentBundle: {
        documents: [
          {
            filename: "unsupported.txt",
            mediaType: "text/plain",
            totalPages: null,
            characterCount: 80,
            kind: "mixed",
            maskedPreview: "상품코드 P999999 계약일 2025-05-10 S52.5",
            piiMasked: false,
            facts: {
              productCode: "P999999",
              contractDate: "2025-05-10",
              coverages: ["생활재해보장특약"],
              diagnosisCodes: ["S52.5"],
              accidentDate: "2025-05-22",
              treatment: "부목 고정",
            },
          },
        ],
        combinedFacts: {
          productCode: "P999999",
          contractDate: "2025-05-10",
          coverages: ["생활재해보장특약"],
          diagnosisCodes: ["S52.5"],
          accidentDate: "2025-05-22",
          treatment: "부목 고정",
        },
        warnings: [],
        processing: {
          originalStored: false,
          trainingUse: false,
          maxFiles: 2,
          maxFileSizeMb: 5,
        },
      },
    }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.dataMode, "user-document");
  assert.equal(result.audit.approved, false);
  assert.equal(result.results[0].status, "확인 불가");
  assert.equal(
    result.trace.find((event) => event.nodeId === "version_resolver").status,
    "attention",
  );
  assert.equal(result.trace.at(-1).status, "blocked");
});

test("evaluation endpoint runs all 50 fixtures through the graph", async () => {
  const response = await fetchWorker("/api/evaluation/summary");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.dataset.total, 50);
  assert.equal(result.dataset.supported, 30);
  assert.equal(result.dataset.unsupported, 20);
  assert.equal(result.dataset.evaluationType, "deterministic-regression");
  assert.equal(result.dataset.independentHoldout, 0);
  assert.equal(result.metrics.versionSelection, 100);
  assert.equal(result.metrics.evidenceCompleteness, 100);
  assert.equal(result.metrics.safeAbstention, 100);
  assert.equal(result.metrics.traceIntegrity, 100);
  assert.match(result.limitations.join(" "), /실제 보험금 지급 정확도/);
});

test("PolicyOps approval endpoint stays human-gated", async () => {
  const response = await fetchWorker("/api/policyops/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "approve",
      policyId: "fss-standard-terms-20260715",
      diffHash: "fss-standard-terms-20260715:3ca9d2cdb152:di-2-3-4-5-7-8",
    }),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.approved, true);
  assert.equal(result.simulation, true);
  assert.equal(result.regression.passed, 8);
  assert.equal(result.regression.total, 8);
});

test("PolicyOps rejects an unverified approval payload", async () => {
  const response = await fetchWorker("/api/policyops/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "approve" }),
  });
  assert.equal(response.status, 400);
});

test("standard terms endpoint exposes official source provenance", async () => {
  const response = await fetchWorker("/api/policies/standard-terms");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.dataMode, "official-source-extract");
  assert.equal(result.clauses.length, 6);
  assert.match(result.source.currentStandardTerms.sourceUrl, /law\.go\.kr/);
  assert.equal(result.source.currentStandardTerms.effectiveDate, "2026-07-15");
  assert.match(result.diffHash, /fss-standard-terms-20260715/);
});

test("keeps the provenance surface limited to approved official sources", async () => {
  const [manifest, rightsDoc] = await Promise.all([
    readFile(new URL("../data/policies/manifest.json", import.meta.url), "utf8"),
    readFile(
      new URL("../docs/source-rights-and-official-sources.md", import.meta.url),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(manifest, /kbinsure|KB손해보험/i);
  assert.doesNotMatch(rightsDoc, /kbinsure|KB손해보험/i);
  assert.match(rightsDoc, /공공누리 이용조건/);
  assert.match(rightsDoc, /금융소비자보호법/);
});

test("design system keeps one icon library and a global 14px text floor", async () => {
  const [styles, badge, button, tooltip] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/badge.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/button.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/tooltip.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /--text-min: 0\.875rem/);
  assert.match(styles, /--text-caption: var\(--text-min\)/);
  assert.match(styles, /--text-xs: var\(--text-min\)/);
  assert.match(styles, /--text-sm: var\(--text-min\)/);
  assert.match(styles, /--leading-tight: 1\.35/);
  assert.match(styles, /--leading-body: 1\.65/);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/);
  assert.doesNotMatch(`${badge}\n${button}\n${tooltip}`, /0\.8rem|text-\[(?:1[0-3]|[0-9])px\]/);
  assert.match(badge, /from "lucide-react"|badgeVariants/);
});
