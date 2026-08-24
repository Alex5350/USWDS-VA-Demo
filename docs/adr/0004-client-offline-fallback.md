# ADR 0004: Client offline fallback (the demo renders without infrastructure)

**Status:** Accepted

## Context

The full stack wants SQL Server 2022 (Docker Compose), the .NET API and the Next.js
client. But a portfolio reviewer, interviewer, or the author taking screenshots should
be able to see the *product* (the accessible USWDS interface) without standing up a
database first.

## Decision

Every client data call goes through one gateway (`api-client.ts`) with a
**request/fallback contract**: try the API, and on any failure return an embedded,
typed fallback dataset that mirrors the API's documented DTO shapes
(`docs/API-ENDPOINTS.md`). The risk-queue fallback even implements filtering and
pagination locally so the queue behaves, not just renders.

## Consequences

- `bun run dev` alone produces a fully navigable, demonstrable portal; this is how
  the marketing screenshots in the README were taken (captured from the real client
  rendering its offline dataset).
- The fallback doubles as living documentation of the API contract: when the DTOs
  change, the types + fallback data keep the client compiling and rendering.
- The trade-off is a second source of truth for demo data; it is accepted because
  both sources are synthetic, and the API remains authoritative whenever present
  (the client marks nothing differently today: a known, documented simplification).
