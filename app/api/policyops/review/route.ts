import { NextResponse } from "next/server"
import {
  STANDARD_TERMS_DIFF_HASH,
  STANDARD_TERMS_SOURCE,
  validateStandardTerms,
} from "@/lib/claim-guide/standard-terms"

export async function POST(request: Request) {
  let body: { action?: string; policyId?: string; diffHash?: string }

  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { approved: false, error: "공식 원문과 검토 식별자가 필요합니다." },
      { status: 400 },
    )
  }

  if (
    body.action !== "approve" ||
    body.policyId !== STANDARD_TERMS_SOURCE.id ||
    body.diffHash !== STANDARD_TERMS_DIFF_HASH
  ) {
    return NextResponse.json(
      { approved: false, error: "검증되지 않은 약관 검토 요청입니다." },
      { status: 400 },
    )
  }

  const regression = validateStandardTerms()
  if (!regression.passedAll) {
    return NextResponse.json(
      { approved: false, error: "공식 표준약관 근거 검사가 통과하지 못했습니다." },
      { status: 422 },
    )
  }

  return NextResponse.json(
    {
      approved: true,
      status: "approved",
      simulation: true,
      regression: { passed: regression.passed, total: regression.total },
      reviewedAt: new Date().toISOString(),
      message:
        "예선 데모의 공식 원문 검토 상태만 승인했습니다. 운영 인덱스에는 반영하지 않습니다.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
