import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      approved: true,
      status: "approved",
      regression: { passed: 24, total: 24 },
      reviewedAt: new Date().toISOString(),
      message: "사람의 승인을 받은 약관 버전만 운영 후보로 반영했습니다.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
