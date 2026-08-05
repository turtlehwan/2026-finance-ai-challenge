"use client"

import { useRef, useState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  FileTextIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import type { DocumentBundle } from "@/lib/claim-guide/documents"

type DocumentIntakeProps = {
  onBundle: (bundle: DocumentBundle) => void
}

const samplePaths = [
  "/samples/insurance-certificate.txt",
  "/samples/medical-record.txt",
]

async function loadSampleFiles() {
  return Promise.all(
    samplePaths.map(async (path) => {
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error("샘플 문서를 불러오지 못했습니다.")
      }
      const blob = await response.blob()
      return new File([blob], path.split("/").at(-1) ?? "sample.txt", {
        type: "text/plain",
      })
    }),
  )
}

async function parseFiles(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))

  const response = await fetch("/api/documents/parse", {
    method: "POST",
    body: formData,
  })
  const payload = (await response.json()) as DocumentBundle & {
    error?: string
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "문서를 처리하지 못했습니다.")
  }

  return payload
}

type AiInterpretation = {
  intakeSummary: string
  missingFacts: string[]
  suggestedQuestion: string
}

async function convertWithAi(files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))
  const response = await fetch("/api/documents/ai-convert", {
    method: "POST",
    body: formData,
  })
  const payload = (await response.json()) as {
    documents?: Array<{ filename: string; text: string }>
    error?: string
  }
  if (!response.ok || !payload.documents?.length) {
    throw new Error(payload.error ?? "AI 문서 변환을 완료하지 못했습니다.")
  }

  return payload.documents.map(
    (document) =>
      new File([document.text], `${document.filename}.txt`, {
        type: "text/plain",
      }),
  )
}

async function interpretMaskedFacts(bundle: DocumentBundle) {
  const response = await fetch("/api/ai/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maskedPreviews: bundle.documents.map((document) => document.maskedPreview),
    }),
  })
  const payload = (await response.json()) as {
    mode?: "workers-ai" | "unavailable"
    model?: string
    result?: AiInterpretation
    error?: string
  }
  if (!response.ok || payload.mode !== "workers-ai" || !payload.result) {
    throw new Error(payload.error ?? "AI 문서 이해를 완료하지 못했습니다.")
  }

  return { model: payload.model ?? "Workers AI", result: payload.result }
}

export function DocumentIntake({ onBundle }: DocumentIntakeProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [bundle, setBundle] = useState<DocumentBundle | null>(null)
  const [aiInsight, setAiInsight] = useState<AiInterpretation | null>(null)
  const [useAiAssistance, setUseAiAssistance] = useState(false)
  const [phase, setPhase] = useState<"idle" | "running" | "complete" | "error">(
    "idle",
  )
  const [error, setError] = useState("")

  async function process(files: File[]) {
    if (!files.length) {
      setError("PDF, TXT 또는 이미지 파일을 1~2개 선택해 주세요.")
      setPhase("error")
      return
    }

    setPhase("running")
    setError("")

    try {
      const needsAiConversion = files.some((file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
      if (needsAiConversion && !useAiAssistance) {
        throw new Error(
          "이미지 자료는 ‘AI 보조 문서 이해’를 켠 경우에만 변환합니다. 텍스트 레이어 PDF·TXT는 AI 보조 없이도 처리할 수 있습니다.",
        )
      }
      const useAiConversion =
        useAiAssistance &&
        files.some((file) => file.type !== "text/plain" && file.type !== "text/markdown")
      const parserFiles = useAiConversion ? await convertWithAi(files) : files
      let nextBundle = await parseFiles(parserFiles)
      let nextInsight: AiInterpretation | null = null

      if (useAiAssistance) {
        try {
          const interpretation = await interpretMaskedFacts(nextBundle)
          nextInsight = interpretation.result
          nextBundle = {
            ...nextBundle,
            processing: {
              ...nextBundle.processing,
              ai: {
                conversion: useAiConversion
                  ? "workers-ai-markdown"
                  : "text-parser",
                interpretation: "workers-ai",
                model: interpretation.model,
              },
            },
          }
        } catch (aiError) {
          nextBundle = {
            ...nextBundle,
            warnings: [
              ...nextBundle.warnings,
              aiError instanceof Error
                ? aiError.message
                : "AI 보조를 실행하지 못했습니다. 결정론적 추출만 사용합니다.",
            ],
            processing: {
              ...nextBundle.processing,
              ai: {
                conversion: useAiConversion
                  ? "workers-ai-markdown"
                  : "text-parser",
                interpretation: "unavailable",
                model: null,
              },
            },
          }
        }
      }
      setBundle(nextBundle)
      setAiInsight(nextInsight)
      setPhase("complete")
      onBundle(nextBundle)
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : "문서를 처리하지 못했습니다.",
      )
      setPhase("error")
    }
  }

  async function handleSampleDocuments() {
    setPhase("running")
    setError("")
    setAiInsight(null)
    try {
      const files = await loadSampleFiles()
      setSelectedFiles(files)
      await process(files)
    } catch (sampleError) {
      setError(
        sampleError instanceof Error
          ? sampleError.message
          : "샘플 문서를 불러오지 못했습니다.",
      )
      setPhase("error")
    }
  }

  const facts = bundle?.combinedFacts

  return (
    <Card className="document-intake-card">
      <CardHeader>
        <div>
          <Badge variant="success">
            <DatabaseIcon data-icon="inline-start" />
            공식 원문 5건 연결
          </Badge>
          <CardTitle>내 문서로 확인</CardTitle>
          <CardDescription>
            보험증권과 진료자료에서 정보를 읽어, 우체국보험 실제 보험약관 가운데
            계약일에 맞는 판본을 찾아 연결합니다.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="document-intake-grid">
          <div className="document-upload-panel">
            <FieldGroup>
              <Field data-disabled={phase === "running"}>
                <FieldLabel htmlFor="claim-documents">
                  보험증권·진료자료
                </FieldLabel>
                <Input
                  ref={inputRef}
                  id="claim-documents"
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp"
                  multiple
                  disabled={phase === "running"}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []).slice(
                      0,
                      2,
                    )
                    setSelectedFiles(files)
                    setBundle(null)
                    setAiInsight(null)
                    setPhase("idle")
                  }}
                />
                <FieldDescription>
                  PDF·TXT는 기본 추출 · 이미지와 스캔 자료는 아래 AI 보조를
                  켠 경우 변환 · 파일당 5MB · 최대 2개 · 원본은 저장하지 않음
                </FieldDescription>
              </Field>
              <Field className="document-ai-opt-in">
                <div>
                  <FieldLabel htmlFor="ai-document-assistance">
                    AI 보조 문서 이해
                  </FieldLabel>
                  <FieldDescription>
                    스캔 이미지·PDF를 Workers AI로 텍스트화하고, 마스킹된
                    미리보기에서 누락 사실 후보만 정리합니다. 보험금 결과와
                    약관 인용은 이 AI가 결정하지 않습니다.
                  </FieldDescription>
                </div>
                <Switch
                  id="ai-document-assistance"
                  checked={useAiAssistance}
                  onCheckedChange={setUseAiAssistance}
                  disabled={phase === "running"}
                  aria-label="AI 보조 문서 이해 사용"
                />
              </Field>
            </FieldGroup>

            {selectedFiles.length ? (
              <div className="selected-documents" aria-label="선택한 문서">
                {selectedFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`}>
                    <FileTextIcon aria-hidden="true" />
                    <span>{file.name}</span>
                    <Badge variant="outline">
                      {(file.size / 1024).toFixed(0)}KB
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="document-actions">
              <Button
                onClick={() => void process(selectedFiles)}
                disabled={!selectedFiles.length || phase === "running"}
              >
                {phase === "running" ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <UploadIcon data-icon="inline-start" />
                )}
                문서 정보 추출하기
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleSampleDocuments()}
                disabled={phase === "running"}
              >
                <DatabaseIcon data-icon="inline-start" />
                공식 약관 연결 샘플 불러오기
              </Button>
            </div>
          </div>

          <div className="document-result-panel" aria-live="polite">
            {phase === "idle" ? (
              <div className="document-result-empty">
                <div className="document-result-heading">
                  <div>
                    <strong>정보 추출 결과 미리보기</strong>
                    <p>분석에 필요한 네 가지 정보만 추립니다.</p>
                  </div>
                </div>
                <dl className="document-facts is-placeholder" aria-hidden="true">
                  <div>
                    <dt>상품코드</dt>
                    <dd>P400073</dd>
                  </div>
                  <div>
                    <dt>계약일</dt>
                    <dd>2025-05-10</dd>
                  </div>
                  <div>
                    <dt>가입특약</dt>
                    <dd>생활재해보장특약Ⅱ 2504</dd>
                  </div>
                  <div>
                    <dt>진단코드</dt>
                    <dd>S52.5</dd>
                  </div>
                </dl>
                <p className="document-privacy-note">
                  <ShieldCheckIcon aria-hidden="true" />
                  원본은 저장하지 않습니다. 개인정보를 가린 뒤 위 네 가지 사실만
                  꺼내 쓰고, 모델 학습에는 쓰지 않습니다.
                </p>
                <p className="document-privacy-note">
                  <ShieldCheckIcon aria-hidden="true" />
                  AI 보조를 켠 경우에만 Cloudflare Workers AI에 문서를 전송하고,
                  변환 결과는 이 요청 안에서만 사용합니다.
                </p>
              </div>
            ) : null}

            {phase === "running" ? (
              <Alert>
                <Spinner />
                <AlertTitle>문서에서 정보를 읽고 있습니다</AlertTitle>
                <AlertDescription>
                  개인정보 마스킹 후 상품코드·계약일·특약·진단코드를
                  찾습니다.
                </AlertDescription>
              </Alert>
            ) : null}

            {phase === "error" ? (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>문서를 처리하지 못했습니다</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {phase === "complete" && bundle && facts ? (
              <>
                <div className="document-result-heading">
                  <span>
                    <CheckCircle2Icon aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{bundle.documents.length}개 문서 정보 추출 완료</strong>
                    <p>원본 저장 없음 · 모델 학습 사용 없음</p>
                  </div>
                </div>
                <dl className="document-facts">
                  <div>
                    <dt>상품코드</dt>
                    <dd>{facts.productCode ?? "정보 필요"}</dd>
                  </div>
                  <div>
                    <dt>계약일</dt>
                    <dd>{facts.contractDate ?? "정보 필요"}</dd>
                  </div>
                  <div>
                    <dt>가입특약</dt>
                    <dd>{facts.coverages[0] ?? "정보 필요"}</dd>
                  </div>
                  <div>
                    <dt>진단코드</dt>
                    <dd>{facts.diagnosisCodes.join(", ") || "정보 필요"}</dd>
                  </div>
                </dl>
                {bundle.warnings.length ? (
                  <Alert>
                    <AlertTriangleIcon />
                    <AlertTitle>추가 확인 {bundle.warnings.length}건</AlertTitle>
                    <AlertDescription>
                      {bundle.warnings.join(" ")}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {aiInsight ? (
                  <Alert>
                    <ShieldCheckIcon />
                    <AlertTitle>AI 보조 문서 이해 완료</AlertTitle>
                    <AlertDescription>
                      {aiInsight.intakeSummary} {aiInsight.suggestedQuestion}
                      {aiInsight.missingFacts.length
                        ? ` 확인이 필요한 항목: ${aiInsight.missingFacts.join(", ")}`
                        : ""}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
