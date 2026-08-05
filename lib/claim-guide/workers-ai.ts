/** Request-scoped, constrained Workers AI intake helpers. */

export type WorkersAiBinding = {
  run: (model: string, input: unknown) => Promise<unknown>
  toMarkdown: (files: Array<{ name: string; blob: Blob }>) => Promise<unknown>
}

const AI_FACT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast"
const MAX_AI_REQUEST_BYTES = 24_000
const MAX_DOCUMENTS = 2
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024
const AI_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

function withinLimit(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  return !contentLength || contentLength <= MAX_AI_REQUEST_BYTES
}

/**
 * Defense in depth for the browser-side masker. This route is public, so it
 * never relies on a caller's claim that a preview is already de-identified.
 * The patterns deliberately favour false positives over sending identifiers to
 * the fact-only AI tool.
 */
function maskPreviewForAi(value: string) {
  return value
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "[주민번호 마스킹]")
    .replace(/\b\d{2,4}-\d{3,4}-\d{4}\b/g, "[전화번호 마스킹]")
    .replace(/\b\d{2,6}-\d{2,6}-\d{2,8}\b/g, "[식별번호 마스킹]")
    .replace(/\b\d{10,16}\b/g, "[긴 숫자 마스킹]")
    .replace(/((?:성명|환자명|피보험자|계약자)\s*)[:：]\s*[^\n]{1,40}/g, "$1: [이름 마스킹]")
}

/**
 * Workers AI receives only a parser-masked preview. The response is an aid for
 * identifying missing facts; policy versioning, citations, and statuses remain
 * deterministic in the LangGraph path.
 */
export async function handleMaskedFactInterpretation(
  request: Request,
  ai: WorkersAiBinding,
) {
  if (request.method !== "POST") {
    return json({ error: "POST 요청만 허용합니다." }, 405)
  }
  if (!withinLimit(request)) {
    return json({ error: "AI 보조 요청이 너무 큽니다." }, 413)
  }

  const body = await request.json().catch(() => null)
  if (!isRecord(body) || !Array.isArray(body.maskedPreviews)) {
    return json({ error: "마스킹된 문서 미리보기가 필요합니다." }, 400)
  }

  const previews = body.maskedPreviews
    .filter((value): value is string => typeof value === "string")
    .map((value) => maskPreviewForAi(value).slice(0, 800))
    .slice(0, MAX_DOCUMENTS)
  if (!previews.length) {
    return json({ error: "읽을 수 있는 마스킹 미리보기가 없습니다." }, 400)
  }

  try {
    const raw = (await ai.run(AI_FACT_MODEL, {
      messages: [
        {
          role: "system",
          content:
            "You are a Korean insurance document intake assistant. The text was masked before reaching you. Return only JSON. Do not infer missing facts, decide eligibility, recommend products, estimate money, or cite policy clauses. Identify at most three missing fact labels from productCode, contractDate, coverage, diagnosisCode, hospitalDays, surgeryRecord, priorClaim. Keep all Korean strings short.",
        },
        {
          role: "user",
          content: previews.join("\n---\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: {
            intakeSummary: { type: "string" },
            missingFacts: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "productCode",
                  "contractDate",
                  "coverage",
                  "diagnosisCode",
                  "hospitalDays",
                  "surgeryRecord",
                  "priorClaim",
                ],
              },
            },
            suggestedQuestion: { type: "string" },
          },
          required: ["intakeSummary", "missingFacts", "suggestedQuestion"],
        },
      },
    })) as { response?: unknown }
    const response = raw.response
    if (!isRecord(response)) {
      throw new Error("JSON Mode 응답 형식이 올바르지 않습니다.")
    }

    return json({
      mode: "workers-ai",
      model: AI_FACT_MODEL,
      result: {
        intakeSummary:
          typeof response.intakeSummary === "string"
            ? response.intakeSummary.slice(0, 160)
            : "문서에서 확인할 사실을 정리했습니다.",
        missingFacts: Array.isArray(response.missingFacts)
          ? response.missingFacts
              .filter((value): value is string => typeof value === "string")
              .slice(0, 3)
          : [],
        suggestedQuestion:
          typeof response.suggestedQuestion === "string"
            ? response.suggestedQuestion.slice(0, 160)
            : "보험가입증서와 진료자료에서 누락된 사실을 확인해 주세요.",
      },
    })
  } catch {
    return json(
      {
        mode: "unavailable",
        error:
          "AI 보조를 실행하지 못했습니다. 결정론적 문서 추출과 약관 검증만 계속할 수 있습니다.",
      },
      503,
    )
  }
}

/**
 * This is an opt-in conversion boundary for PDF and image uploads. The source
 * bytes are not written to Worker storage; converted text is returned directly
 * to the browser and then parsed by the existing no-storage route.
 */
export async function handleAiDocumentConversion(
  request: Request,
  ai: WorkersAiBinding,
) {
  if (request.method !== "POST") {
    return json({ error: "POST 요청만 허용합니다." }, 405)
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return json({ error: "문서를 읽지 못했습니다." }, 400)
  }
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File)
  if (!files.length || files.length > MAX_DOCUMENTS) {
    return json({ error: "문서는 1~2개만 선택해 주세요." }, 400)
  }
  for (const file of files) {
    if (file.size > MAX_DOCUMENT_SIZE) {
      return json({ error: `${file.name}: 파일 크기는 5MB 이하여야 합니다.` }, 413)
    }
    if (!AI_DOCUMENT_TYPES.has(file.type)) {
      return json(
        { error: `${file.name}: PDF, JPG, PNG 또는 WEBP만 AI 문서 변환을 지원합니다.` },
        400,
      )
    }
  }

  try {
    const converted = await ai.toMarkdown(
      files.map((file) => ({ name: file.name, blob: file })),
    )
    const results = (Array.isArray(converted) ? converted : [converted]) as Array<{
      name?: string
      format?: "markdown" | "text" | "error"
      data?: string
    }>
    const documents = results
      .filter((result) => result.format !== "error" && typeof result.data === "string")
      .map((result, index) => ({
        filename: result.name ?? files[index]?.name ?? `converted-${index + 1}.txt`,
        text: result.data!.slice(0, 24_000),
      }))

    if (!documents.length) {
      return json(
        { error: "AI 문서 변환 결과에서 읽을 수 있는 텍스트를 찾지 못했습니다." },
        422,
      )
    }

    return json({
      mode: "workers-ai-markdown",
      model: "Workers AI Markdown Conversion",
      documents,
    })
  } catch {
    return json(
      {
        mode: "unavailable",
        error:
          "AI 문서 변환을 실행하지 못했습니다. 텍스트 레이어 PDF 또는 TXT로 다시 시도해 주세요.",
      },
      503,
    )
  }
}
