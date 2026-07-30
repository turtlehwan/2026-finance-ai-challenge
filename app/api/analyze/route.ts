import { NextRequest, NextResponse } from "next/server"

import {
  buildResults,
  getClaimCase,
} from "@/lib/claim-guide/cases"
import type { AnalysisResponse, Answer } from "@/lib/claim-guide/types"

const answers = new Set<Answer>(["yes", "no", "unknown"])

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    caseId?: string
    answer?: Answer | null
  }
  const claimCase = getClaimCase(body.caseId ?? "")
  const answer =
    body.answer && answers.has(body.answer) ? body.answer : null

  const payload: AnalysisResponse = {
    caseId: claimCase.id,
    answer,
    needsAnswer: answer === null,
    results: buildResults(claimCase.id, answer),
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
