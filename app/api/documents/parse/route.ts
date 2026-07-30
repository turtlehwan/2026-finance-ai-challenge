import { NextRequest, NextResponse } from "next/server"
import { extractText, getDocumentProxy } from "unpdf"

import {
  buildDocumentBundle,
  extractDocumentFacts,
} from "@/lib/claim-guide/documents"

const MAX_FILES = 2
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_PDF_PAGES = 30
const acceptedMediaTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
])

async function extractFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`)
  }

  const mediaType =
    file.type || (file.name.toLowerCase().endsWith(".txt") ? "text/plain" : "")
  if (!acceptedMediaTypes.has(mediaType)) {
    throw new Error(`${file.name}: PDF 또는 TXT 파일만 지원합니다.`)
  }

  if (mediaType === "application/pdf") {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdf = await getDocumentProxy(bytes)

    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(`${file.name}: PDF는 30쪽 이하만 지원합니다.`)
    }

    const result = await extractText(pdf, { mergePages: true })
    return extractDocumentFacts(result.text, {
      filename: file.name,
      mediaType,
      totalPages: result.totalPages,
    })
  }

  return extractDocumentFacts(await file.text(), {
    filename: file.name,
    mediaType,
    totalPages: null,
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File)

    if (!files.length || files.length > MAX_FILES) {
      return NextResponse.json(
        { error: "PDF 또는 TXT 파일을 1~2개 선택해 주세요." },
        { status: 400 },
      )
    }

    const documents = await Promise.all(files.map(extractFile))
    return NextResponse.json(buildDocumentBundle(documents), {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "문서를 처리하지 못했습니다.",
      },
      { status: 422 },
    )
  }
}
