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
  assert.match(html, /부모님의 보험,/);
  assert.match(html, /<em>Agent<\/em>가 함께 확인합니다/);
  assert.match(html, /근거 경로/);
  assert.match(html, /새 약관이 들어와도/);
  assert.match(html, /Agent 분석 데모/);
  assert.match(html, /알 수 있는 것과 없는 것/);
  assert.match(html, /https:\/\/cont\.insure\.or\.kr\//);
  assert.match(html, /https:\/\/www\.silson24\.or\.kr\/claim\/web\//);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/claim-guide\.example\/og-v2\.png"\/>/,
  );
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps starter-only assets removed and production metadata wired", async () => {
  const [page, layout, app, demo, policyOps, preferenceHook, packageJson] =
    await Promise.all([
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
  assert.match(demo, /requestAnimationFrame/);
  assert.match(demo, /Agent 분석 시작/);
  assert.match(demo, /\/api\/analyze/);
  assert.match(policyOps, /검토 후 반영/);
  assert.match(policyOps, /\/api\/policyops\/review/);
  assert.match(preferenceHook, /claim-guide-preferences:v1/);
  assert.match(packageJson, /"gsap"/);
  assert.match(demo, /import\("gsap"\)/);
  assert.match(packageJson, /"lucide-react"/);
  assert.match(packageJson, /"radix-ui"/);
  assert.match(packageJson, /"shadcn"/);

  await access(new URL("../public/og-v2.png", import.meta.url));
  await assert.rejects(
    access(
      new URL(
        "../app/_sites-preview/SkeletonPreview.tsx",
        import.meta.url,
      ),
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

  const answeredResponse = await fetchWorker("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caseId: "fracture", answer: "yes" }),
  });
  assert.equal(answeredResponse.status, 200);
  const answered = await answeredResponse.json();
  assert.equal(answered.needsAnswer, false);
  assert.equal(answered.results[1].status, "확인 권장");
});

test("PolicyOps approval endpoint stays human-gated", async () => {
  const response = await fetchWorker("/api/policyops/review", {
    method: "POST",
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.approved, true);
  assert.equal(result.regression.passed, 24);
  assert.equal(result.regression.total, 24);
});

test("design system keeps one icon library and readable text tokens", async () => {
  const [styles, badge, button, tooltip] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/badge.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/button.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/tooltip.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(styles, /--text-caption: 0\.875rem/);
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/);
  assert.doesNotMatch(`${badge}\n${button}\n${tooltip}`, /text-xs|0\.8rem/);
  assert.match(badge, /from "lucide-react"|badgeVariants/);
});
