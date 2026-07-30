import { NextRequest, NextResponse } from "next/server"

import { resolvePolicyVersion } from "@/lib/claim-guide/policies"

export function GET(request: NextRequest) {
  const productCode = request.nextUrl.searchParams.get("productCode") ?? ""
  const contractDate = request.nextUrl.searchParams.get("contractDate") ?? ""
  const resolution = resolvePolicyVersion(productCode, contractDate)

  return NextResponse.json(resolution, {
    status: resolution.status === "resolved" ? 200 : 404,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  })
}
