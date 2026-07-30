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

export function DocumentIntake({ onBundle }: DocumentIntakeProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [bundle, setBundle] = useState<DocumentBundle | null>(null)
  const [phase, setPhase] = useState<"idle" | "running" | "complete" | "error">(
    "idle",
  )
  const [error, setError] = useState("")

  async function process(files: File[]) {
    if (!files.length) {
      setError("PDF 또는 TXT 파일을 1~2개 선택해 주세요.")
      setPhase("error")
      return
    }

    setPhase("running")
    setError("")

    try {
      const nextBundle = await parseFiles(files)
      setBundle(nextBundle)
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
            실제 약관 데이터 연결
          </Badge>
          <CardTitle>내 문서로 바로 확인해보세요</CardTitle>
          <CardDescription>
            증권과 진료자료의 텍스트를 구조화한 뒤 실제 우체국보험 약관
            버전과 연결합니다.
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
                  accept=".pdf,.txt,application/pdf,text/plain"
                  multiple
                  disabled={phase === "running"}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []).slice(
                      0,
                      2,
                    )
                    setSelectedFiles(files)
                    setBundle(null)
                    setPhase("idle")
                  }}
                />
                <FieldDescription>
                  텍스트 레이어 PDF 또는 TXT · 파일당 5MB · 최대 2개 ·
                  원본 저장 안 함
                </FieldDescription>
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
                선택한 문서 구조화
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleSampleDocuments()}
                disabled={phase === "running"}
              >
                <DatabaseIcon data-icon="inline-start" />
                실데이터 연결 샘플 불러오기
              </Button>
            </div>
          </div>

          <div className="document-result-panel" aria-live="polite">
            {phase === "idle" ? (
              <Alert>
                <ShieldCheckIcon />
                <AlertTitle>문서 원본은 저장하지 않습니다</AlertTitle>
                <AlertDescription>
                  파싱 응답에는 마스킹한 미리보기와 분석에 필요한 구조화
                  사실만 포함합니다.
                </AlertDescription>
              </Alert>
            ) : null}

            {phase === "running" ? (
              <Alert>
                <Spinner />
                <AlertTitle>문서에서 사실을 구조화하고 있습니다</AlertTitle>
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
                    <strong>{bundle.documents.length}개 문서 구조화 완료</strong>
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
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
