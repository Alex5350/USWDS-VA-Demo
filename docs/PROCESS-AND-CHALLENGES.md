# The build, in brief: decisions, challenges, and what they taught

The commit history is the real log; this is the narrative version, centered on the two
threads that define this project: **accessibility as an engineering requirement** and
**building a federal-grade interface on USWDS 3.x**. Decisions with fuller reasoning
live in [docs/adr/](adr/).

## The accessibility work that only showed up at runtime

The checklist (`docs/ACCESSIBILITY-508.md`) was written first: landmarks, skip links,
labeled controls, no color-only meaning. What the checklist could not catch were the
behaviors that only appear when you operate the app the way assistive-tech users do.
Each of these shipped as a fix commit during the case-assistant work:

- **Streaming chat broke focus conventions.** As assistant messages streamed in, focus
  behavior and handoff between turns had to be hardened twice ("harden chat turn
  handoff", "harden chat initial handoff"): the composer needed to keep keyboard
  context stable while the transcript grew underneath it.
- **Message roles were visually distinct but not semantically distinct.** "Distinguish
  chat message roles" made analyst-vs-assistant a structure-level fact, not a styling
  one; the same information a screen reader needs and a sighted user gets from
  alignment.
- **Collapsible suggestions leaked collapsed content.** Suggestions that collapse
  visually must disappear from the accessibility tree too ("hide collapsed chat
  suggestions"); otherwise tab order and announcement order lie about what is on
  screen.
- **Actions drifted out of the navigation path.** Chat actions living outside the
  side navigation created a keyboard dead-end; "keep chat actions in side navigation"
  pulled them back into the landmark structure the rest of the app promised.
- **The composer needed explicit focus management** on state transitions, the kind of
  detail native HTML solves for static forms but streaming UIs have to own.

The pattern across all five: **automated checks passed; keyboard-and-screen-reader
passes found the defects.** The verification section of the a11y doc is not
aspirational; it is the reproduction steps for this class of bug.

## USWDS: adopted, not fought

Using USWDS 3.x through React wrappers (`UsaButton`, table and form patterns) meant
customization had a seam that never touched `node_modules`. That seam paid off for the
chat interface: USWDS has no chat pattern, so the transcript, composer and suggestion
disclosure were composed from primitives while keeping USWDS typography, spacing and
focus rings.

The VA OIG header went through real design iteration: lockup alignment, department
line, a local VA logo asset, and a solid red header rule replacing an earlier
treatment. Six commits of "make it look like the real thing" because federal
credibility lives or dies in the masthead.

## Product-judgment fixes (the quiet kind)

History also records decisions to *remove* things that tested fine but were wrong for
the audience: a recycle-bin metaphor on every record row (removed:
record-level destructive actions in a triage queue invite mistakes), status text
duplicated between queue and detail views (removed: one authoritative source), report
pagination that mutated shared filter state (isolated), and case deletion that stranded
the user (return to the risk queue after delete). Escalation now *requires
justification*, an accountability rule enforced by the UI, not just the domain.

## The reporting and data story

Reports are where the SQL heritage shows: SQL views + Dapper read queries back
provider concentration, questioned-cost trends and case aging; every chart ships a
text summary and data-table alternative (an accessibility requirement that
accidentally made print-to-PDF good); CSV exports preserve analyst-friendly column
names. The frontend renders all of it from typed DTOs documented in
`docs/API-ENDPOINTS.md` and, per [ADR 0004](adr/0004-client-offline-fallback.md),
from an embedded offline dataset when the API is absent, which is how the README
screenshots run.

## The AI assistant, bounded

The Gemini-backed case assistant summarizes and groups the synthetic caseload through
**read-only tools** ([ADR 0005](adr/0005-ai-assistant-boundary.md)). The interesting
engineering was not the streaming; it was everything around it: session integrity
constraints, message-id collision fixes, persisted transcript with hard delete, and the
accessibility fixes listed above. The assistant never writes; wrong generations can
only produce wrong *summaries*, and summaries group data the tools actually returned.
