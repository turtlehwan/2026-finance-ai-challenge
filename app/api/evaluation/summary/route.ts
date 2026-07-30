import { NextResponse } from "next/server"

import { evaluateClaimGraph } from "@/lib/claim-guide/evaluation"

export async function GET() {
  const summary = await evaluateClaimGraph()

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
