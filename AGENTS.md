# Project working agreements

## Product decision records

- Before product or UX implementation, search the repository for an existing
  PRD or product requirements document.
- If a PRD exists, append material product intent, trade-offs, rejected
  alternatives, and decision rationale to its decision-history section.
- If no PRD exists, maintain the working record in
  `docs/local/product-decisions.md`.
- `docs/local/` is intentionally ignored by Git. Never force-add files from
  that directory.
- Preserve the reason behind a decision, not only the resulting implementation.
- When a decision changes, mark the prior decision as superseded instead of
  deleting it.
- If a PRD is introduced later, migrate the still-valid local decisions into
  the PRD and continue recording there.
