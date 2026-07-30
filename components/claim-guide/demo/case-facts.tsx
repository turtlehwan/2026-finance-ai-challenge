import type { ClaimCase } from "@/lib/claim-guide/types"

export function CaseFacts({ activeCase }: { activeCase: ClaimCase }) {
  return (
    <section className="case-facts" aria-labelledby="case-facts-title">
      <div className="case-facts-heading">
        <strong id="case-facts-title">확인할 사례</strong>
        <span>{activeCase.category}</span>
      </div>
      <dl className="fact-list">
        {activeCase.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
