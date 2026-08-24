# ADR 0002: USWDS 3.x and accessibility as a first-class requirement

**Status:** Accepted

## Context

A VA-facing workflow demo earns credibility by looking and behaving like a federal
application: the U.S. Web Design System is that look. Accessibility (Section 508 /
WCAG AA) is not garnish for this domain; it is the core quality attribute an
evaluator will probe.

## Decision

- **USWDS 3.x as the design foundation** (header, side navigation, breadcrumbs,
  alerts, summary boxes, tags, tables, form controls, pagination), adopted as
  distributed, never edited inside `node_modules`; customization happens in our own
  Sass layer and React wrappers (`UsaButton` and friends).
- **A written accessibility contract** (`docs/ACCESSIBILITY-508.md`) that every page
  is held to: skip link, semantic landmarks, unique titles, ordered headings, labeled
  controls, native elements before ARIA, visible focus, keyboard-complete flows,
  tables with captions and scoped headers, and **no color-only meaning**: risk
  levels always carry text.
- Accessibility bugs are treated as *defects with commits*, not review notes;
  see the process narrative for the focus-management and live-region fixes shipped
  during the chat-assistant work.

## Consequences

- The a11y checklist doubles as the manual QA script; the verification steps in the
  doc are the actual pass performed per page.
- Some USWDS patterns needed tuning (chat live regions, composer focus, suggestion
  disclosure); wrappers gave us the seam to do that without forking the library.
- Charts always ship with text summaries and data-table alternatives, which also
  made them print/PDF-friendly for the reporting command center.
