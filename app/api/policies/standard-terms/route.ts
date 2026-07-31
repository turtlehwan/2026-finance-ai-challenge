import { NextResponse } from "next/server"

import {
  getPolicySourceManifest,
  getStandardTermsEvidence,
  STANDARD_TERMS_DIFF_HASH,
} from "@/lib/claim-guide/standard-terms"

export async function GET() {
  return NextResponse.json(
    {
      source: getPolicySourceManifest(),
      clauses: getStandardTermsEvidence(),
      diffHash: STANDARD_TERMS_DIFF_HASH,
      dataMode: "official-source-extract",
      note: "국가법령정보센터 원문에서 질병·상해보험 핵심 조항만 구조화한 시연용 지식셋입니다.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  )
}
