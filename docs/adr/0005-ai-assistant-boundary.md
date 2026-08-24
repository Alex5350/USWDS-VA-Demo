# ADR 0005: AI case assistant with a read-only tool boundary

**Status:** Accepted

## Context

An LLM assistant is a natural fit for analyst workflows ("summarize my queue",
"which providers drive questioned cost"). It is also the riskiest component in a
domain where hallucinated findings would be unacceptable and where the demo must
stay synthetic-data-only.

## Decision

- The assistant is a **Next.js route-handler layer** (streaming) calling Google
  Gemini, with server-side chat persistence (sessions and messages) and a
  **read-only tool set**: case summary/insight tools that query the existing
  application services. The assistant can *read and summarize*; it cannot create,
  edit, escalate or delete anything.
- Chat state and history moved to a dedicated page with a hard-delete capability:
  conversation retention is the user's decision, consistent with a demo posture.
- The USWDS chat interface honors the accessibility contract: distinguishable
  message roles, managed composer focus, collapsible suggestions that are hidden
  from assistive tech when collapsed, and chat actions kept reachable in the side
  navigation.
- Boundaries are documented before code (`docs/CASE-ASSISTANT-QUESTIONS.md`,
  the chat setup guide) so demo prompts stay inside the toolset's competence.

## Consequences

- The assistant demonstrably answers operational questions over the synthetic
  dataset without gaining write authority: the blast radius of a bad generation
  is a wrong *summary*, and summaries always cite the case data they grouped.
- Suggestion generation also runs server-side with a deterministic seed option,
  keeping demos reproducible.
- The chat schema additions live with the main database schema, so the feature
  degrades gracefully in the offline client (empty history, working interface).
