import { NextRequest, NextResponse } from "next/server"

import { runClaimGraph } from "@/lib/claim-guide/agent-graph"
import { getClaimCase } from "@/lib/claim-guide/cases"
import type { DocumentBundle } from "@/lib/claim-guide/documents"
import type { Answer } from "@/lib/claim-guide/types"

const answers = new Set<Answer>(["yes", "no", "unknown"])

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    caseId?: string
    answer?: Answer | null
    documentBundle?: DocumentBundle | null
  }
  const claimCase = getClaimCase(body.caseId ?? "")
  const answer =
    body.answer && answers.has(body.answer) ? body.answer : null

  const payload = await runClaimGraph({
    caseId: claimCase.id,
    answer,
    documentBundle: body.documentBundle,
  })

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
