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

test("server-renders the insurance claim guide MVP", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /<title>보험금 길잡이 Agent<\/title>/);
  assert.match(html, /부모님의 보험,/);
  assert.match(html, /Agent가 함께 확인합니다/);
  assert.match(html, /Claim Evidence Map/);
  assert.match(html, /PolicyOps Loop/);
  assert.match(html, /알 수 있는 것과 없는 것/);
  assert.match(html, /https:\/\/cont\.insure\.or\.kr\//);
  assert.match(html, /https:\/\/www\.silson24\.or\.kr\/claim\/web\//);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/claim-guide\.example\/og\.png"\/>/,
  );
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps starter-only assets removed and production metadata wired", async () => {
  const [page, layout, app, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/ClaimGuideApp.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<ClaimGuideApp \/>/);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /summary_large_image/);
  assert.match(app, /requestAnimationFrame/);
  assert.match(app, /claim-guide-large-text/);
  assert.match(app, /Agent 분석 시작/);
  assert.match(app, /검토 후 반영/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|lucide-react/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(
    access(
      new URL(
        "../app/_sites-preview/SkeletonPreview.tsx",
        import.meta.url,
      ),
    ),
  );
});
