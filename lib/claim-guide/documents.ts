export type ExtractedDocument = {
  filename: string
  mediaType: string
  totalPages: number | null
  characterCount: number
  kind: "insurance-certificate" | "medical-record" | "mixed" | "unknown"
  maskedPreview: string
  piiMasked: boolean
  facts: {
    productCode: string | null
    contractDate: string | null
    coverages: string[]
    diagnosisCodes: string[]
    accidentDate: string | null
    treatment: string | null
  }
}

export type DocumentBundle = {
  documents: ExtractedDocument[]
  combinedFacts: {
    productCode: string | null
    contractDate: string | null
    coverages: string[]
    diagnosisCodes: string[]
    accidentDate: string | null
    treatment: string | null
  }
  warnings: string[]
  processing: {
    originalStored: false
    trainingUse: false
    maxFiles: number
    maxFileSizeMb: number
  }
}

const MAX_PREVIEW_LENGTH = 360

function normalizeDate(value: string | undefined) {
  if (!value) {
    return null
  }

  const parts = value
    .replace(/[년./]/g, "-")
    .replace(/[월]/g, "-")
    .replace(/[일]/g, "")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length !== 3) {
    return null
  }

  const [year, month, day] = parts
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function captureDate(text: string, labels: string[]) {
  const labelPattern = labels.join("|")
  const match = text.match(
    new RegExp(
      `(?:${labelPattern})\\s*[:：]?\\s*(\\d{4}\\s*[년./-]\\s*\\d{1,2}\\s*[월./-]\\s*\\d{1,2}\\s*일?)`,
      "i",
    ),
  )

  return normalizeDate(match?.[1])
}

function uniqueMatches(text: string, pattern: RegExp) {
  return [...new Set(Array.from(text.matchAll(pattern), (match) => match[1]))]
}

export function maskSensitiveText(text: string) {
  const masked = text
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "******-*******")
    .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, "010-****-****")
    .replace(
      /((?:피보험자|계약자|보험수익자|환자명|성명)\s*[:：]\s*)[^\n\r]+/g,
      "$1[마스킹]",
    )
    .replace(
      /((?:증권번호|보험증권번호|계약번호)\s*[:：]\s*)[A-Z0-9-]+/gi,
      "$1[마스킹]",
    )

  return {
    text: masked,
    piiMasked: masked !== text,
  }
}

export function extractDocumentFacts(
  text: string,
  metadata: {
    filename: string
    mediaType: string
    totalPages?: number | null
  },
): ExtractedDocument {
  const normalizedText = text.replace(/\u0000/g, " ").replace(/\r/g, "")
  const masked = maskSensitiveText(normalizedText)
  const productCode =
    normalizedText.match(/\b(P\d{6})\b/i)?.[1]?.toUpperCase() ?? null
  const contractDate = captureDate(normalizedText, [
    "계약일",
    "청약일",
    "가입일",
  ])
  const accidentDate = captureDate(normalizedText, [
    "사고일",
    "재해일",
    "발생일",
    "진료일",
  ])
  const diagnosisCodes = uniqueMatches(
    normalizedText.toUpperCase(),
    /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/g,
  ).slice(0, 10)
  const coverages = uniqueMatches(
    normalizedText,
    /([^\n\r:：]{2,40}(?:특약|보험금|진단비|수술비|입원일당))/g,
  )
    .map((coverage) => coverage.replace(/^[·\-*\s]+/, "").trim())
    .filter((coverage) => !coverage.includes("지급사유"))
    .slice(0, 10)
  const treatment =
    normalizedText.match(
      /(?:치료|처치|수술명|진료내용)\s*[:：]?\s*([^\n\r]{2,100})/,
    )?.[1]?.trim() ?? null

  const hasInsuranceFacts = Boolean(productCode || contractDate || coverages.length)
  const hasMedicalFacts = Boolean(
    diagnosisCodes.length || accidentDate || treatment,
  )
  const kind = hasInsuranceFacts
    ? hasMedicalFacts
      ? "mixed"
      : "insurance-certificate"
    : hasMedicalFacts
      ? "medical-record"
      : "unknown"

  return {
    filename: metadata.filename,
    mediaType: metadata.mediaType,
    totalPages: metadata.totalPages ?? null,
    characterCount: normalizedText.length,
    kind,
    maskedPreview: masked.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_PREVIEW_LENGTH),
    piiMasked: masked.piiMasked,
    facts: {
      productCode,
      contractDate,
      coverages,
      diagnosisCodes,
      accidentDate,
      treatment,
    },
  }
}

function firstDefined<T>(values: Array<T | null>) {
  return values.find((value): value is T => value !== null) ?? null
}

export function buildDocumentBundle(
  documents: ExtractedDocument[],
): DocumentBundle {
  const warnings: string[] = []

  if (!documents.some((document) => document.facts.productCode)) {
    warnings.push("상품코드를 찾지 못했습니다. 증권에서 상품코드를 확인해 주세요.")
  }
  if (!documents.some((document) => document.facts.contractDate)) {
    warnings.push("계약일을 찾지 못했습니다. 가입 당시 약관 선택에 필요합니다.")
  }
  if (!documents.some((document) => document.facts.diagnosisCodes.length)) {
    warnings.push("진단코드를 찾지 못했습니다. 진단서의 질병분류코드를 확인해 주세요.")
  }
  if (documents.some((document) => document.characterCount < 20)) {
    warnings.push("텍스트가 거의 없는 PDF는 이미지 OCR이 추가로 필요합니다.")
  }

  return {
    documents,
    combinedFacts: {
      productCode: firstDefined(
        documents.map((document) => document.facts.productCode),
      ),
      contractDate: firstDefined(
        documents.map((document) => document.facts.contractDate),
      ),
      coverages: [
        ...new Set(
          documents.flatMap((document) => document.facts.coverages),
        ),
      ],
      diagnosisCodes: [
        ...new Set(
          documents.flatMap((document) => document.facts.diagnosisCodes),
        ),
      ],
      accidentDate: firstDefined(
        documents.map((document) => document.facts.accidentDate),
      ),
      treatment: firstDefined(
        documents.map((document) => document.facts.treatment),
      ),
    },
    warnings,
    processing: {
      originalStored: false,
      trainingUse: false,
      maxFiles: 2,
      maxFileSizeMb: 5,
    },
  }
}
