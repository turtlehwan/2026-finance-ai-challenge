import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import JSZip from "jszip";
import { parse, renderHwpxToSvg, validateHwpx } from "kordoc";

const HP_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph";
const TEAM_NAME = process.env.SUBMISSION_TEAM_NAME?.trim() || "쿠쿠";
const MEMBER_NAMES = process.env.SUBMISSION_MEMBER_NAMES?.trim() || "";
const MEMBER_BLOCKER = "※ 제출 직전 팀장·팀원 실명 입력 필수";
const PRIVATE_MODE = MEMBER_NAMES.length > 0;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const CACHE_DIR = path.join(ROOT_DIR, "tmp", "hwpx-template-cache");
const RENDER_DIR = path.join(ROOT_DIR, "tmp", "hwpx-render");
const PUBLIC_OUTPUT_DIR = path.join(ROOT_DIR, "output", "hwpx");
const PRIVATE_OUTPUT_DIR = path.join(ROOT_DIR, "output", "private", "submission");
const A4_PAGE_HEIGHT_PT = 841.86;

const FLOW_SUMMARY =
  "보험가입증서·진료자료 → 사건·사실 추출 → 상품코드·가입일 기준 보험약관 버전 선택 → 보장 항목 대조 → 정보 부족 시 사람에게 질문 → 정의·지급·제한·면책 근거 감사 → 서류·공식 경로 → 사용자와 보험사의 최종 확인";

const DOCUMENTS = [
  {
    id: "proposal",
    label: "기획서",
    sourcePath: path.join(ROOT_DIR, "docs", "planning-proposal.md"),
    templateUrl:
      "https://cfiles.dacon.co.kr/competitions/daker_2026-finance-ai-challenge/%28%EC%B2%A8%EB%B6%801%29%202026%20%EA%B8%88%EC%9C%B5%20AI%20Challenge%20%EA%B3%B5%EB%AA%A8%EC%A0%84%20%EA%B8%B0%ED%9A%8D%EC%84%9C.hwpx",
    templateSha256:
      "15ba1f89595f15c7582abec69bf4f06dc99864c5ac778a400d224f38ce95c039",
    templateFilename: "proposal-template.hwpx",
    expectedTemplateRows: 17,
    sectionCount: 7,
    bodyCharPr: "9",
    boldCharPr: "2",
    teamCharPr: "12",
    titleText: "2026 금융 AI Challenge 기획서",
    publicFilename: "2026_금융_AI_Challenge_기획서_팀정보입력필요.hwpx",
    privateFilename: "2026_금융_AI_Challenge_기획서_최종.hwpx",
    appendSection: { sourceSection: "sources", targetSection: 7, heading: "출처" },
    requiredMarkers: [
      "보험금 길잡이 Agent",
      "가입 당시 적용된 보험약관",
      "10.3조 원",
      "P400073",
      "사람에게 질문",
      "50건 고정 fixture",
      "15건 수작업 라벨 holdout",
      "최종 지급 판단·청구 대행·손해사정·상품 권유는 하지 않으며",
    ],
  },
  {
    id: "feature-specification",
    label: "기능명세서",
    sourcePath: path.join(ROOT_DIR, "docs", "feature-specification.md"),
    templateUrl:
      "https://cfiles.dacon.co.kr/competitions/daker_2026-finance-ai-challenge/%28%EC%B2%A8%EB%B6%802%29%202026%20%EA%B8%88%EC%9C%B5%20AI%20Challenge%20%EA%B8%B0%EB%8A%A5%EB%AA%85%EC%84%B8%EC%84%9C.hwpx",
    templateSha256:
      "83be2cd46904d54717d624272f3af88c99b5b06c45cb12490f93688d31604a4b",
    templateFilename: "feature-specification-template.hwpx",
    expectedTemplateRows: 13,
    sectionCount: 5,
    bodyCharPr: "8",
    boldCharPr: "1",
    teamCharPr: "11",
    titleText: "2026 금융 AI Challenge 기능 명세서",
    publicFilename: "2026_금융_AI_Challenge_기능명세서_팀정보입력필요.hwpx",
    privateFilename: "2026_금융_AI_Challenge_기능명세서_최종.hwpx",
    appendSection: { sourceSection: 6, targetSection: 5, heading: "실제 데이터·기술 출처" },
    requiredMarkers: [
      "실제 Agent 상태 그래프",
      "P400073",
      "React Flow",
      "https://finai26.turtlehwan.dev",
      "50건",
      "15건 수작업 라벨 holdout",
      "범용 LLM·임베딩 검색·Hybrid RAG는 현재 런타임에서 수행하지 않는다",
      "실제 보험금 지급 여부는 보험회사가 결정",
    ],
  },
];

const PRESERVE_ONLY_PARTS = [
  "mimetype",
  "version.xml",
  "Contents/header.xml",
  "settings.xml",
  "META-INF/container.xml",
  "META-INF/manifest.xml",
  "META-INF/container.rdf",
  "Contents/content.hpf",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function getVerifiedTemplate(document) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, document.templateFilename);
  if (await fileExists(cachePath)) {
    const cached = await readFile(cachePath);
    if (sha256(cached) === document.templateSha256) return cached;
  }

  const response = await fetch(document.templateUrl, {
    headers: { "user-agent": "2026-finance-ai-challenge-submission-builder/1.0" },
  });
  if (!response.ok) {
    throw new Error(`${document.label} 공식 양식 다운로드 실패: HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const actualHash = sha256(bytes);
  if (actualHash !== document.templateSha256) {
    throw new Error(
      `${document.label} 공식 양식 해시 불일치: expected=${document.templateSha256}, actual=${actualHash}`,
    );
  }
  await writeFile(cachePath, bytes);
  return bytes;
}

function elementChildren(node, tagName) {
  return Array.from(node.childNodes).filter(
    (child) => child.nodeType === 1 && (!tagName || child.tagName === tagName),
  );
}

function nodeText(node) {
  return Array.from(node.getElementsByTagName("hp:t"))
    .map((item) => item.textContent || "")
    .join("");
}

function cleanInlineMarkdown(value, { keepLinkUrls = false } = {}) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) =>
      keepLinkUrls ? `${label}: ${url}` : label,
    )
    .replace(/<([^>]+)>/g, "$1")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([*_`])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/·\s+/g, "·")
    .trim();
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanInlineMarkdown(cell));
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableToParagraphs(lines) {
  if (lines.length < 2 || !isTableSeparator(lines[1])) {
    return lines.map((line) => ({ kind: "body", text: cleanInlineMarkdown(line) }));
  }
  const headers = splitTableRow(lines[0]);
  const rows = lines.slice(2).map(splitTableRow).filter((row) => row.some(Boolean));
  const result = [];
  for (const row of rows) {
    if (headers.length <= 2) {
      result.push({ kind: "body", text: `• ${row[0] || headers[0]}: ${row[1] || ""}` });
      continue;
    }
    result.push({ kind: "lead", text: `• ${row[0] || headers[0]}` });
    for (let index = 1; index < headers.length; index += 1) {
      if (!row[index]) continue;
      result.push({ kind: "body", text: `  - ${headers[index]}: ${row[index]}` });
    }
  }
  return result;
}

function parseMarkdownSections(markdown) {
  const sections = new Map();
  let currentKey = null;
  let currentLines = [];
  const commit = () => {
    if (currentKey !== null) sections.set(currentKey, currentLines);
  };
  for (const line of markdown.split(/\r?\n/)) {
    const numberedHeading = line.match(/^##\s+(\d+)\.\s+/);
    if (numberedHeading) {
      commit();
      currentKey = Number(numberedHeading[1]);
      currentLines = [];
      continue;
    }
    if (/^##\s+출처\s*$/.test(line)) {
      commit();
      currentKey = "sources";
      currentLines = [];
      continue;
    }
    if (currentKey !== null) currentLines.push(line);
  }
  commit();
  return sections;
}

function markdownLinesToParagraphs(lines, { keepLinkUrls = false } = {}) {
  const paragraphs = [];
  let prose = [];
  let table = [];
  let inFence = false;
  let fenceLanguage = "";
  let listContinuationIndex = null;
  const flushProse = () => {
    if (prose.length === 0) return;
    const raw = prose.join(" ").trim();
    const fullyBold = /^\*\*[^*]+\*\*$/.test(raw);
    const text = cleanInlineMarkdown(raw, { keepLinkUrls });
    if (text) paragraphs.push({ kind: fullyBold ? "lead" : "body", text });
    prose = [];
  };
  const flushTable = () => {
    if (table.length === 0) return;
    paragraphs.push(...tableToParagraphs(table));
    table = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("```")) {
      flushProse();
      flushTable();
      listContinuationIndex = null;
      if (!inFence) {
        inFence = true;
        fenceLanguage = trimmed.slice(3).trim().toLowerCase();
      } else {
        if (fenceLanguage === "mermaid") {
          paragraphs.push({ kind: "lead", text: `■ Agentic 실행 흐름: ${FLOW_SUMMARY}` });
        }
        inFence = false;
        fenceLanguage = "";
      }
      continue;
    }
    if (inFence) continue;
    if (!trimmed) {
      flushProse();
      flushTable();
      listContinuationIndex = null;
      continue;
    }
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushProse();
      listContinuationIndex = null;
      table.push(trimmed);
      continue;
    }
    flushTable();

    const subheading = trimmed.match(/^###\s+(.+)$/);
    if (subheading) {
      flushProse();
      listContinuationIndex = null;
      paragraphs.push({ kind: "lead", text: `■ ${cleanInlineMarkdown(subheading[1], { keepLinkUrls })}` });
      continue;
    }
    const quote = trimmed.match(/^>\s*(.+)$/);
    if (quote) {
      flushProse();
      listContinuationIndex = null;
      paragraphs.push({ kind: "lead", text: cleanInlineMarkdown(quote[1], { keepLinkUrls }) });
      continue;
    }
    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      flushProse();
      paragraphs.push({ kind: "body", text: `• ${cleanInlineMarkdown(bullet[1], { keepLinkUrls })}` });
      listContinuationIndex = paragraphs.length - 1;
      continue;
    }
    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (ordered) {
      flushProse();
      paragraphs.push({ kind: "body", text: `${ordered[1]}) ${cleanInlineMarkdown(ordered[2], { keepLinkUrls })}` });
      listContinuationIndex = paragraphs.length - 1;
      continue;
    }
    if (/^\s{2,}\S/.test(rawLine) && listContinuationIndex !== null) {
      const continuation = cleanInlineMarkdown(trimmed, { keepLinkUrls });
      if (continuation) {
        paragraphs[listContinuationIndex].text += ` ${continuation}`;
      }
      continue;
    }
    listContinuationIndex = null;
    prose.push(trimmed.replace(/^그림\s+\d+\.\s*/, ""));
  }
  flushProse();
  flushTable();
  return paragraphs.filter((paragraph) => paragraph.text.length > 0);
}

function buildSectionParagraphs(markdown, document) {
  const sections = parseMarkdownSections(markdown);
  const result = new Map();
  for (let sectionNumber = 1; sectionNumber <= document.sectionCount; sectionNumber += 1) {
    const sourceLines = sections.get(sectionNumber);
    if (!sourceLines) throw new Error(`${document.label} 최신본에 ${sectionNumber}번 섹션이 없습니다.`);
    result.set(sectionNumber, markdownLinesToParagraphs(sourceLines));
  }
  const append = document.appendSection;
  if (append) {
    const sourceLines = sections.get(append.sourceSection);
    if (!sourceLines) {
      throw new Error(`${document.label} 최신본에 부록 섹션 ${String(append.sourceSection)}이 없습니다.`);
    }
    const target = result.get(append.targetSection);
    target.push({ kind: "lead", text: `■ ${append.heading}` });
    target.push(...markdownLinesToParagraphs(sourceLines, { keepLinkUrls: true }));
  }
  return result;
}

function weightedLength(text) {
  let units = 0;
  for (const character of text) {
    if (/\s/.test(character)) units += 0.35;
    else if (/^[\x00-\x7F]$/.test(character)) units += 0.55;
    else units += 1;
  }
  return units;
}

function estimatedLines(paragraph) {
  return Math.max(1, Math.ceil(weightedLength(paragraph.text) / (paragraph.kind === "lead" ? 43 : 47)));
}

function chunkParagraphs(paragraphs, maxLines = 24) {
  const chunks = [];
  let current = [];
  let lineCount = 0;
  const groups = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const group = [paragraphs[index]];
    if (paragraphs[index].kind === "lead" && paragraphs[index].text.startsWith("• ")) {
      while (index + 1 < paragraphs.length && paragraphs[index + 1].text.startsWith("  - ")) {
        index += 1;
        group.push(paragraphs[index]);
      }
    }
    groups.push(group);
  }
  for (const group of groups) {
    const lines = group.reduce((sum, paragraph) => sum + estimatedLines(paragraph), 0);
    if (current.length > 0 && lineCount + lines > maxLines) {
      chunks.push(current);
      current = [];
      lineCount = 0;
    }
    current.push(...group);
    lineCount += lines;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function createParagraph(doc, paragraph, document) {
  const p = doc.createElementNS(HP_NS, "hp:p");
  Object.entries({ id: "2147483648", paraPrIDRef: "0", styleIDRef: "0", pageBreak: "0", columnBreak: "0", merged: "0" }).forEach(([key, value]) => p.setAttribute(key, value));
  const run = doc.createElementNS(HP_NS, "hp:run");
  run.setAttribute("charPrIDRef", paragraph.kind === "lead" ? document.boldCharPr : document.bodyCharPr);
  const text = doc.createElementNS(HP_NS, "hp:t");
  text.appendChild(doc.createTextNode(paragraph.text));
  run.appendChild(text);
  p.appendChild(run);
  return p;
}

function replaceCellParagraphs(cell, paragraphs, doc, document, charPrOverride) {
  const subList = cell.getElementsByTagName("hp:subList")[0];
  if (!subList) throw new Error("HWPX 셀의 hp:subList를 찾지 못했습니다.");
  subList.setAttribute("vertAlign", paragraphs.length === 1 ? "CENTER" : "TOP");
  for (const child of Array.from(subList.childNodes)) subList.removeChild(child);
  for (const paragraph of paragraphs) {
    const p = createParagraph(doc, paragraph, document);
    if (charPrOverride) p.getElementsByTagName("hp:run")[0].setAttribute("charPrIDRef", charPrOverride);
    subList.appendChild(p);
  }
}

function setRowHeight(row, height) {
  for (const cell of elementChildren(row, "hp:tc")) {
    const size = cell.getElementsByTagName("hp:cellSz")[0];
    if (size) size.setAttribute("height", String(height));
  }
}

function chunkHeight(chunk) {
  const totalLines = chunk.reduce((sum, paragraph) => sum + estimatedLines(paragraph), 0);
  return Math.min(49_000, Math.max(4_000, totalLines * 1_800 + 1_700));
}

function findMainTable(doc, expectedRows) {
  const tables = Array.from(doc.getElementsByTagName("hp:tbl"));
  return (
    tables.find((table) => Number(table.getAttribute("rowCnt")) === expectedRows) ||
    tables
      .filter((table) => Number(table.getAttribute("colCnt")) === 2)
      .sort((a, b) => Number(b.getAttribute("rowCnt")) - Number(a.getAttribute("rowCnt")))[0]
  );
}

function fillTeamRows(mainTable, doc, document) {
  const rows = elementChildren(mainTable, "hp:tr");
  const teamCells = elementChildren(rows[0], "hp:tc");
  const memberCells = elementChildren(rows[1], "hp:tc");
  if (teamCells.length !== 2 || memberCells.length !== 2) {
    throw new Error(`${document.label} 팀 정보 행 구조가 공식 양식과 다릅니다.`);
  }
  replaceCellParagraphs(teamCells[1], [{ kind: "body", text: TEAM_NAME }], doc, document, document.teamCharPr);
  replaceCellParagraphs(memberCells[1], [{ kind: "body", text: MEMBER_NAMES || MEMBER_BLOCKER }], doc, document, document.teamCharPr);
}

function insertSectionContent(mainTable, sectionNumber, paragraphs, doc, document) {
  const rows = elementChildren(mainTable, "hp:tr");
  const headingRowIndex = rows.findIndex((row) => nodeText(row).trim().startsWith(`${sectionNumber}.`));
  if (headingRowIndex < 0 || !rows[headingRowIndex + 1]) {
    throw new Error(`${document.label} 공식 양식에서 ${sectionNumber}번 답변 칸을 찾지 못했습니다.`);
  }
  const answerRow = rows[headingRowIndex + 1];
  const chunks = chunkParagraphs(paragraphs);
  replaceCellParagraphs(elementChildren(answerRow, "hp:tc")[0], chunks[0], doc, document);
  setRowHeight(answerRow, chunkHeight(chunks[0]));
  let insertAfter = answerRow;
  for (const chunk of chunks.slice(1)) {
    const continuation = answerRow.cloneNode(true);
    replaceCellParagraphs(elementChildren(continuation, "hp:tc")[0], chunk, doc, document);
    setRowHeight(continuation, chunkHeight(chunk));
    mainTable.insertBefore(continuation, insertAfter.nextSibling);
    insertAfter = continuation;
  }
}

function updateProposalFreeTitle(mainTable) {
  const headingRow = elementChildren(mainTable, "hp:tr").find((row) => nodeText(row).trim().startsWith("7."));
  if (!headingRow) return;
  const textNodes = Array.from(headingRow.getElementsByTagName("hp:t"));
  if (textNodes[0]) textNodes[0].textContent = "7. 안전성과 검증 가능성을 기능으로 만든 Agent";
}

function removeLayoutCaches(doc) {
  const caches = doc.getElementsByTagName("hp:linesegarray");
  while (caches.length > 0) caches[0].parentNode.removeChild(caches[0]);
}

function updateTableGeometry(mainTable) {
  const rows = elementChildren(mainTable, "hp:tr");
  let tableHeight = 0;
  rows.forEach((row, rowIndex) => {
    let rowHeight = 0;
    for (const cell of elementChildren(row, "hp:tc")) {
      const address = cell.getElementsByTagName("hp:cellAddr")[0];
      const size = cell.getElementsByTagName("hp:cellSz")[0];
      if (address) address.setAttribute("rowAddr", String(rowIndex));
      if (size) rowHeight = Math.max(rowHeight, Number(size.getAttribute("height")) || 0);
    }
    tableHeight += rowHeight;
  });
  mainTable.setAttribute("rowCnt", String(rows.length));
  const size = elementChildren(mainTable, "hp:sz")[0];
  if (size) size.setAttribute("height", String(tableHeight));
}

function buildPreviewText(document, sectionParagraphs) {
  const lines = [document.titleText, `팀명: ${TEAM_NAME}`, `구성원 성명: ${MEMBER_NAMES || MEMBER_BLOCKER}`, ""];
  for (let sectionNumber = 1; sectionNumber <= document.sectionCount; sectionNumber += 1) {
    lines.push(`${sectionNumber}.`);
    lines.push(...sectionParagraphs.get(sectionNumber).map((paragraph) => paragraph.text));
    lines.push("");
  }
  return lines.join("\n");
}

function assertXmlWellFormed(xml, label) {
  const errors = [];
  new DOMParser({ onError: (level, message) => errors.push(`${level}: ${message}`) }).parseFromString(xml, "application/xml");
  if (errors.length > 0) throw new Error(`${label} XML 직렬화 오류: ${errors.join(" | ")}`);
}

async function snapshotPartHashes(zip, parts) {
  const result = new Map();
  for (const part of parts) {
    const entry = zip.file(part);
    if (entry) result.set(part, sha256(await entry.async("nodebuffer")));
  }
  return result;
}

async function assertPreservedParts(zip, expectedHashes, label) {
  for (const [part, expectedHash] of expectedHashes) {
    const entry = zip.file(part);
    if (!entry) throw new Error(`${label} 보존 파트 누락: ${part}`);
    if (sha256(await entry.async("nodebuffer")) !== expectedHash) {
      throw new Error(`${label} 비편집 파트 변경 감지: ${part}`);
    }
  }
}

async function writeHwpx(zip) {
  const mimetypeEntry = zip.file("mimetype");
  if (!mimetypeEntry) throw new Error("HWPX mimetype 엔트리가 없습니다.");
  const mimetype = await mimetypeEntry.async("string");
  zip.file("mimetype", mimetype, { compression: "STORE" });
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 }, platform: "UNIX" });
}

function svgSlice(svg, pageIndex = 0) {
  const widthMatch = svg.match(/<svg[^>]*viewBox="0 0 ([0-9.]+) [0-9.]+"/);
  if (!widthMatch) return svg;
  const width = widthMatch[1];
  const top = (pageIndex * A4_PAGE_HEIGHT_PT).toFixed(2);
  return svg
    .replace(/viewBox="0 0 [0-9.]+ [0-9.]+"/, `viewBox="0 ${top} ${width} ${A4_PAGE_HEIGHT_PT}"`)
    .replace(/height="[0-9.]+pt"/, `height="${A4_PAGE_HEIGHT_PT}pt"`);
}

async function renderAndBuildPreview(buffer, outputStem) {
  await mkdir(RENDER_DIR, { recursive: true });
  const render = await renderHwpxToSvg(buffer, { reflow: true });
  const fullSvgPath = path.join(RENDER_DIR, `${outputStem}.svg`);
  const firstPageSvgPath = path.join(RENDER_DIR, `${outputStem}-page-1.svg`);
  const previewPath = path.join(RENDER_DIR, `${outputStem}-preview.png`);
  const qaDirectory = path.join(RENDER_DIR, `${outputStem}-a4-slices`);
  const a4SliceCount = Math.max(1, Math.ceil(render.height / A4_PAGE_HEIGHT_PT));
  await writeFile(fullSvgPath, render.svg, "utf8");
  await writeFile(firstPageSvgPath, svgSlice(render.svg), "utf8");
  let preview = null;
  try {
    execFileSync("/usr/bin/sips", ["-s", "format", "png", "--resampleHeightWidth", "1024", "724", firstPageSvgPath, "--out", previewPath], { stdio: "ignore" });
    preview = await readFile(previewPath);
    await mkdir(qaDirectory, { recursive: true });
    for (let pageIndex = 0; pageIndex < a4SliceCount; pageIndex += 1) {
      const pageNumber = String(pageIndex + 1).padStart(2, "0");
      const sliceSvgPath = path.join(qaDirectory, `page-${pageNumber}.svg`);
      const slicePngPath = path.join(qaDirectory, `page-${pageNumber}.png`);
      await writeFile(sliceSvgPath, svgSlice(render.svg, pageIndex), "utf8");
      execFileSync("/usr/bin/sips", ["-s", "format", "png", "--resampleHeightWidth", "1024", "724", sliceSvgPath, "--out", slicePngPath], { stdio: "ignore" });
    }
  } catch {
    // Cross-platform generation remains valid when macOS sips is unavailable.
  }
  return { ...render, fullSvgPath, preview, qaDirectory, a4SliceCount };
}

async function assertRoundTrip(buffer, document, expectedText) {
  const result = await parse(buffer);
  if (!result.success) throw new Error(`${document.label} 독립 파서 왕복 실패: ${result.error}`);
  await mkdir(RENDER_DIR, { recursive: true });
  await writeFile(path.join(RENDER_DIR, `${document.id}-roundtrip.md`), result.markdown, "utf8");
  const normalized = result.markdown.replace(/\s+/g, " ");
  const mustContain = [document.titleText, TEAM_NAME, MEMBER_NAMES || MEMBER_BLOCKER, ...document.requiredMarkers];
  for (const marker of mustContain) {
    if (!normalized.includes(marker.replace(/\s+/g, " "))) {
      throw new Error(`${document.label} 왕복 검사에서 필수 문구 누락: ${marker}`);
    }
  }
  const forbidden = [
    "등록된 팀명과 동일하게 작성",
    "팀장, 팀원 순으로 작성",
    "제안하는 AI 금융 서비스의 직관적인 명칭 기재",
    "제출한 예선 MVP 산출물에서 구현한 기능 범위 작성",
    "문서 상태: 예선 제출용 최신본",
  ];
  for (const marker of forbidden) {
    if (normalized.includes(marker)) throw new Error(`${document.label}에 공식 안내문 또는 편집 메타데이터 잔존: ${marker}`);
  }
  for (const keyPhrase of expectedText) {
    if (!normalized.includes(keyPhrase.replace(/\s+/g, " "))) {
      throw new Error(`${document.label} 최신본 핵심 내용 누락: ${keyPhrase}`);
    }
  }
  return result;
}

async function buildDocument(document) {
  const [templateBytes, markdown] = await Promise.all([getVerifiedTemplate(document), readFile(document.sourcePath, "utf8")]);
  const sectionParagraphs = buildSectionParagraphs(markdown, document);
  const templateZip = await JSZip.loadAsync(templateBytes, { checkCRC32: true });
  const preservedHashes = await snapshotPartHashes(templateZip, PRESERVE_ONLY_PARTS);
  const sectionEntry = templateZip.file("Contents/section0.xml");
  if (!sectionEntry) throw new Error(`${document.label} 공식 양식에서 section0.xml을 찾지 못했습니다.`);
  const doc = new DOMParser().parseFromString(await sectionEntry.async("string"), "application/xml");
  const mainTable = findMainTable(doc, document.expectedTemplateRows);
  if (!mainTable) throw new Error(`${document.label} 공식 양식의 본문 표를 찾지 못했습니다.`);

  fillTeamRows(mainTable, doc, document);
  for (let sectionNumber = 1; sectionNumber <= document.sectionCount; sectionNumber += 1) {
    insertSectionContent(mainTable, sectionNumber, sectionParagraphs.get(sectionNumber), doc, document);
  }
  if (document.id === "proposal") updateProposalFreeTitle(mainTable);
  updateTableGeometry(mainTable);
  removeLayoutCaches(doc);

  const serialized = new XMLSerializer().serializeToString(doc);
  assertXmlWellFormed(serialized, document.label);
  templateZip.file("Contents/section0.xml", serialized);
  templateZip.file("Preview/PrvText.txt", buildPreviewText(document, sectionParagraphs));
  await assertPreservedParts(templateZip, preservedHashes, document.label);

  let output = await writeHwpx(templateZip);
  let validation = await validateHwpx(output);
  if (!validation.ok) {
    throw new Error(`${document.label} Kordoc 구조 검증 실패: ${validation.issues.map((issue) => `${issue.path || "package"}: ${issue.message}`).join(" | ")}`);
  }

  const outputDirectory = PRIVATE_MODE ? PRIVATE_OUTPUT_DIR : PUBLIC_OUTPUT_DIR;
  const outputFilename = PRIVATE_MODE ? document.privateFilename : document.publicFilename;
  const outputPath = path.join(outputDirectory, outputFilename);
  const outputStem = path.basename(outputFilename, ".hwpx");
  const render = await renderAndBuildPreview(output, outputStem);
  if (render.preview) {
    const previewZip = await JSZip.loadAsync(output);
    previewZip.file("Preview/PrvImage.png", render.preview);
    await assertPreservedParts(previewZip, preservedHashes, document.label);
    output = await writeHwpx(previewZip);
    validation = await validateHwpx(output);
    if (!validation.ok) throw new Error(`${document.label} 미리보기 삽입 후 구조 검증 실패`);
  }

  await assertRoundTrip(output, document, [sectionParagraphs.get(1)[0].text, sectionParagraphs.get(document.sectionCount).at(-1).text]);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, output);
  return {
    label: document.label,
    outputPath,
    sha256: sha256(output),
    bytes: output.length,
    templateSha256: document.templateSha256,
    rendererPageCount: render.pageCount,
    a4SliceCount: render.a4SliceCount,
    renderWarnings: render.warnings,
    renderSvg: render.fullSvgPath,
    entryCount: validation.entryCount,
  };
}

async function main() {
  const results = [];
  for (const document of DOCUMENTS) results.push(await buildDocument(document));
  const report = {
    mode: PRIVATE_MODE ? "private-final" : "public-team-info-required",
    teamName: TEAM_NAME,
    memberNames: PRIVATE_MODE ? "provided-via-environment" : "required-before-submission",
    outputs: results.map((result) => ({
      label: result.label,
      path: path.relative(ROOT_DIR, result.outputPath),
      sha256: result.sha256,
      bytes: result.bytes,
      templateSha256: result.templateSha256,
      rendererPageCount: result.rendererPageCount,
      a4SliceCount: result.a4SliceCount,
      entryCount: result.entryCount,
      renderWarnings: result.renderWarnings,
      renderSvg: path.relative(ROOT_DIR, result.renderSvg),
    })),
  };
  const reportDirectory = PRIVATE_MODE ? PRIVATE_OUTPUT_DIR : PUBLIC_OUTPUT_DIR;
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(path.join(reportDirectory, "generation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

await main();
