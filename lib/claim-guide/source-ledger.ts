import {
  EPOSTLIFE_2112_SOURCE,
  EPOSTLIFE_2504_SOURCE,
  EPOSTLIFE_ONLINE_ADMISSION_SURGERY_2112_SOURCE,
} from "@/lib/claim-guide/policies"
import {
  STANDARD_TERMS_PREVIOUS_SOURCE,
  STANDARD_TERMS_SOURCE,
} from "@/lib/claim-guide/standard-terms"
import type { PolicySource } from "@/lib/claim-guide/types"

/**
 * 화면에 공개하는 원문 목록입니다. `data/policies/manifest.json`과 같은
 * 출처·시행일·페이지·해시를 쓰며, 값이 갈리면 manifest가 기준입니다.
 */
export const SOURCE_LEDGER: PolicySource[] = [
  STANDARD_TERMS_SOURCE,
  STANDARD_TERMS_PREVIOUS_SOURCE,
  EPOSTLIFE_2504_SOURCE,
  EPOSTLIFE_2112_SOURCE,
  EPOSTLIFE_ONLINE_ADMISSION_SURGERY_2112_SOURCE,
]

export function formatEffectivePeriod(source: PolicySource) {
  if (source.effectiveDate) {
    return `${source.effectiveDate.replaceAll("-", ".")} 시행`
  }
  if (source.effectiveStart && source.effectiveEnd) {
    return `${source.effectiveStart.replaceAll("-", ".")}~${source.effectiveEnd.replaceAll("-", ".")} 판매`
  }
  return "시행일 미상"
}

export function shortHash(sha256?: string) {
  return sha256 ? `${sha256.slice(0, 12)}…` : "해시 없음"
}
