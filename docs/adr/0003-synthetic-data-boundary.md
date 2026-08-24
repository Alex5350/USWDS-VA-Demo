# ADR 0003: Synthetic data and honest framing as a hard boundary

**Status:** Accepted

## Context

The domain is fraud/waste/abuse triage over claims, providers and veterans. Real data
is out of the question (PHI/PII, government systems); worse than having no data would
be a demo that *implies* real findings about real parties.

## Decision

- **All data is synthetic and deterministic**: generated from documented patterns
  (`database/seed`), with obviously-demo names ("Demo Community Dental Group",
  "Sample Regional Imaging LLC").
- A **synthetic-data disclaimer appears on every page** that displays data and in the
  README: no real veteran, patient, claim, provider, VA, PHI or PII data; indicators
  do not represent confirmed fraud.
- The product language is *triage and prioritization* ("review candidates",
  "questioned cost estimates"), never "fraud detected". The README states outright:
  this application does not determine fraud.

## Consequences

- The repo is safe to publish, demo and discuss publicly; the posture is documented in
  `docs/OPEN-SOURCE-NOTES.md`.
- Deterministic seed data keeps screenshots, tests and the demo script stable across
  runs.
- The framing constraint shaped the UI: explainable risk *findings* with rule
  references, escalation justification required, audit trail visible; the system
  always shows its work.
