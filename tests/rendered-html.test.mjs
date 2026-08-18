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
  assert.match(html, /부모님 보험에서/);
  assert.match(html, /<em>가입 당시 약관<\/em> 기준으로/);
  assert.match(html, /확인할 보장 항목을/);
  assert.match(html, /정리해 드립니다/);
  assert.match(html, /\/family-policy-review-v4\.webp/);
  assert.match(html, /태블릿에서 보험약관과 보험증권을 함께 확인하는 어머니와 청년 자녀/);
  assert.match(html, /최종 지급 여부는 보험회사가 정합니다/);
  assert.match(html, /새 약관은 검토 후 반영합니다/);
  assert.match(html, /가입 당시 적용된 보험약관 버전/);
  assert.doesNotMatch(html, /중도·만기보험금이 생겼을 시점/);
  assert.match(html, /먼저, 사례 하나를 골라보세요/);
  assert.match(html, /골절 · 2112/);
  assert.match(html, /글이나 음성으로 요청하기/);
  assert.match(html, /내 문서로 확인하기/);
  assert.match(html, /사례 선택/);
  assert.match(html, /알 수 있는 것, 알 수 없는 것/);
  assert.doesNotMatch(html, /조사는 Agent, 결정은 사람/);
  // 근거는 주장이 아니라 대조 가능한 값으로 노출한다.
  assert.match(html, /공식 원문과 검증 결과/);
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
    adaptiveAssistant,
    analysisHook,
    journeyPresentation,
    resultsPanel,
    evaluationPanel,
    policyOps,
    preferenceHook,
    packageJson,
    deployWorkflow,
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
          "../components/claim-guide/demo/adaptive-assistant.tsx",
          import.meta.url,
        ),
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
          "../components/claim-guide/demo/results-panel.tsx",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../components/claim-guide/demo/evaluation-panel.tsx",
          import.meta.url,
        ),
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
      readFile(
        new URL("../.github/workflows/deploy.yml", import.meta.url),
        "utf8",
      ),
    ]);

  assert.match(page, /<ClaimGuideApp \/>/);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /summary_large_image/);
  assert.match(app, /<AgentDemo \/>/);
  assert.match(demo, /useClaimAnalysis/);
  assert.match(demo, /확인할 보장 항목, 가입 당시 보험약관의 근거 조항과 쪽수/);
  assert.doesNotMatch(demo, /demoRunbook|권장 시연 순서|이 화면에서 실제로 일어나는 일/);
  assert.match(demo, /AdaptiveAssistantWorkspace/);
  assert.match(demo, /이 사례 분석하기/);
  assert.match(demo, /답변 반영하고 결과 보기/);
  assert.match(demo, /PDF·TXT 또는 준비된 샘플/);
  assert.match(adaptiveAssistant, /나만의 보험 확인 비서/);
  assert.match(adaptiveAssistant, /SpeechRecognition/);
  assert.match(adaptiveAssistant, /useGSAP/);
  assert.match(adaptiveAssistant, /외부 인식 서비스로 전달/);
  assert.doesNotMatch(adaptiveAssistant, /현재 보기:/);
  assert.match(analysisHook, /requestAnimationFrame/);
  assert.match(analysisHook, /\/api\/analyze/);
  assert.match(journeyPresentation, /JOURNEY_STEPS/);
  assert.match(journeyPresentation, /RESULT_STATE/);
  assert.match(journeyPresentation, /보험증권과 진단 기록/);
  assert.match(resultsPanel, /type="single"/);
  assert.match(resultsPanel, /defaultValue="result-0"/);
  assert.doesNotMatch(evaluationPanel, /defaultValue=/);
  assert.doesNotMatch(evaluationPanel, /forceMount|summary \? summary\.dataset\.total : 50/);
  assert.match(evaluationPanel, /Skeleton className="h-5 w-28"/);
  assert.match(policyOps, /검토 후 반영/);
  assert.match(policyOps, /\/api\/policyops\/review/);
  assert.match(policyOps, /is-reviewed/);
  assert.doesNotMatch(policyOps, /CardFooter|승인 규칙 설명/);
  assert.doesNotMatch(policyOps, /defaultValue="policyops-demo"/);
  assert.match(preferenceHook, /claim-guide-preferences:v1/);
  assert.match(packageJson, /"gsap"/);
  assert.match(analysisHook, /import\("gsap"\)/);
  assert.match(packageJson, /"lucide-react"/);
  assert.match(packageJson, /"radix-ui"/);
  assert.match(packageJson, /"shadcn"/);
  assert.match(deployWorkflow, /prepare-cloudflare-deploy/);
  assert.match(deployWorkflow, /npx wrangler versions deploy/);
  assert.match(deployWorkflow, /--config wrangler\.json --yes/);
  assert.match(deployWorkflow, /@100%/);
  assert.match(deployWorkflow, /working-directory: dist\/server/);

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
  assert.equal(answered.results[0].citations.length, 7);
  assert.match(answered.results[0].clause, /생활재해보장특약Ⅱ 2504/);
  assert.equal(answered.trace.length, 8);
  assert.equal(answered.trace.at(-2).nodeId, "evidence_auditor");
  assert.equal(answered.trace.at(-1).nodeId, "action_planner");
  assert.equal(answered.audit.approved, true);
  assert.equal(answered.actionPlan.evidenceStatus, "verified");
  assert.equal(answered.actionPlan.documents.length, 3);
  assert.equal(answered.sources.length, 1);
  assert.match(answered.sources[0].title, /우체국와이드건강보험 2504/);
  assert.equal(answered.dataMode, "official-policy-linked-synthetic-case");
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
  assert.equal(result.processing.ai.interpretation, "not-requested");
  assert.doesNotMatch(
    result.documents.map((document) => document.maskedPreview).join(" "),
    /550312-1234567|김가상/,
  );
});

test("official policy graph exposes the 2025-04-02 and 2025-04-03 version boundary", async () => {
  const [priorVersionResponse, priorAnalysisResponse, currentAnalysisResponse, admissionVersionResponse, admissionAnalysisResponse] =
    await Promise.all([
      fetchWorker(
        "/api/policies/resolve?productCode=P400051&contractDate=2024-02-14",
      ),
      fetchWorker("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: "fracture-legacy", answer: "no" }),
      }),
      fetchWorker("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: "fracture", answer: "no" }),
      }),
      fetchWorker(
        "/api/policies/resolve?productCode=P600107&contractDate=2024-03-20",
      ),
      fetchWorker("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: "hospitalization", answer: "no" }),
      }),
    ]);

  const [priorVersion, priorAnalysis, currentAnalysis, admissionVersion, admissionAnalysis] = await Promise.all([
    priorVersionResponse.json(),
    priorAnalysisResponse.json(),
    currentAnalysisResponse.json(),
    admissionVersionResponse.json(),
    admissionAnalysisResponse.json(),
  ]);
  assert.equal(priorVersion.status, "resolved");
  assert.equal(priorVersion.policy.versionLabel, "2112");
  assert.equal(priorVersion.policy.clauses.length, 7);
  assert.equal(priorAnalysis.policyResolution.policy.versionLabel, "2112");
  assert.equal(priorAnalysis.results[0].citations[0].page, 491);
  assert.match(priorAnalysis.results[0].clause, /2112/);
  assert.equal(currentAnalysis.policyResolution.policy.versionLabel, "2504");
  assert.equal(currentAnalysis.results[0].citations[0].page, 497);
  assert.match(currentAnalysis.results[0].clause, /2504/);
  assert.equal(admissionVersion.status, "resolved");
  assert.equal(admissionVersion.policy.productCodes[0], "P600107");
  assert.equal(admissionVersion.policy.clauses.length, 6);
  assert.equal(admissionAnalysis.audit.approved, true);
  assert.equal(admissionAnalysis.results[0].status, "확인 권장");
  assert.equal(admissionAnalysis.sources[0].id, "epostlife-online-admission-surgery-2112");
});

test("synthetic safety scenarios never pass evidence audit or recommend a benefit", async () => {
  const responses = await Promise.all(
    ["maturity", "exclusion"].map((caseId) =>
      fetchWorker("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, answer: "no" }),
      }),
    ),
  );
  const results = await Promise.all(responses.map((response) => response.json()));

  for (const result of results) {
    assert.equal(result.audit.approved, false);
    assert.equal(result.audit.caseSupported, false);
    assert.equal(result.audit.citationValidated, false);
    assert.equal(result.audit.exclusionIncluded, false);
    assert.equal(result.actionPlan.evidenceStatus, "blocked");
    assert.equal(result.sources.length, 0);
    assert.equal(result.dataMode, "synthetic-safety-case");
    assert.ok(result.results.every((item) => item.status === "확인 불가"));
    assert.equal(
      result.trace.find((event) => event.nodeId === "evidence_bundle").status,
      "attention",
    );
    assert.equal(result.trace.at(-2).status, "blocked");
    assert.equal(result.trace.at(-1).status, "blocked");
  }
});

test("cost-bearing AI routes are guarded by the Cloudflare rate limiter", async () => {
  const [workerSource, wranglerConfig] = await Promise.all([
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  ]);
  const config = JSON.parse(wranglerConfig);
  const limiter = config.ratelimits.find(
    (item) => item.name === "AI_RATE_LIMITER",
  );

  assert.equal(limiter.simple.limit, 30);
  assert.equal(limiter.simple.period, 60);
  assert.match(workerSource, /\/api\/ai\/interpret/);
  assert.match(workerSource, /\/api\/documents\/ai-convert/);
  assert.match(workerSource, /AI_RATE_LIMITER\.limit/);
  assert.match(workerSource, /status: 429/);
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
              hospitalDays: null,
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
          hospitalDays: null,
        },
        warnings: [],
        processing: {
          originalStored: false,
          trainingUse: false,
          maxFiles: 2,
          maxFileSizeMb: 5,
          ai: {
            conversion: "text-parser",
            interpretation: "not-requested",
            model: null,
          },
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
  assert.equal(result.dataset.supported, 36);
  assert.equal(result.dataset.unsupported, 14);
  assert.equal(result.dataset.evaluationType, "deterministic-regression");
  assert.equal(result.dataset.boundaryCaseCount, 15);
  assert.equal(result.metrics.versionSelection, 100);
  assert.equal(result.metrics.evidenceCompleteness, 100);
  assert.equal(result.metrics.safeAbstention, 100);
  assert.equal(result.metrics.traceIntegrity, 100);
  assert.equal(result.boundary.dataset.total, 15);
  assert.equal(result.boundary.dataset.evaluationType, "rule-reviewed-boundary");
  assert.equal(result.boundary.metrics.versionSelection, 100);
  assert.equal(result.safety.dataset.total, 2);
  assert.equal(result.safety.dataset.evaluationType, "synthetic-safety-regression");
  assert.equal(result.safety.counts.safeAbstentionPassed, 2);
  assert.equal(result.safety.counts.traceIntegrityPassed, 2);
  assert.equal(result.boundary.metrics.evidenceCompleteness, 100);
  assert.equal(result.boundary.metrics.safeAbstention, 100);
  assert.match(result.limitations.join(" "), /보험금 지급 정확도/);
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

test("design system keeps one icon library, a 14px floor, and 15px default UI text", async () => {
  const [styles, badge, button, tooltip] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/badge.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/button.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/tooltip.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /--text-min: 0\.875rem/);
  assert.match(styles, /--text-caption: 0\.9375rem/);
  assert.match(styles, /--text-body: 1\.0625rem/);
  assert.match(styles, /--text-xs: var\(--text-min\)/);
  assert.match(styles, /--text-sm: var\(--text-caption\)/);
  assert.match(styles, /--section-space: 8rem/);
  assert.match(styles, /--section-space-mobile: 6rem/);
  assert.match(styles, /--leading-tight: 1\.35/);
  assert.match(styles, /--leading-body: 1\.65/);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/);
  assert.doesNotMatch(`${badge}\n${button}\n${tooltip}`, /0\.8rem|text-\[(?:1[0-3]|[0-9])px\]/);
  assert.match(badge, /from "lucide-react"|badgeVariants/);
});
