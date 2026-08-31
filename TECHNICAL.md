# VA OIG FWA Risk Triage & Reporting Portal: the engineering view

The companion to the [README's product story](README.md): the architecture, the request path,
the stack, and every major engineering decision traced back to the oversight problem it exists
to solve. Component detail, route inventory and chat plumbing are linked throughout rather than
duplicated; the pieces gathered here are the ones [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
covers only briefly or not at all.

## Architecture

![Request flow: the USWDS client prefers the ASP.NET Core API and falls back to an embedded offline dataset; demo auth maps X-Demo-User to roles and policies; services run over a zero-dependency domain; EF Core and Dapper persist to SQL Server; the Gemini assistant streams through read-only case tools](docs/diagrams/request-flow.svg)

In flow order:

- **Next.js + USWDS client** (Bun, React, TypeScript, Sass): every page is a USWDS pattern
  wrapped in React, and every data call goes through one typed gateway (`api-client.ts`).
- **Offline fallback**: if the API is absent, the gateway returns an embedded, typed dataset
  that mirrors the documented DTO shapes; the risk-queue fallback even filters and paginates
  locally ([ADR 0004](docs/adr/0004-client-offline-fallback.md)).
- **ASP.NET Core API**: Swagger/OpenAPI, ProblemDetails, health checks, CORS, and server-side
  authorization policies on every endpoint.
- **Application**: use cases, DTOs, risk scoring, case workflow, reporting export services.
- **Domain**: entities, enums, value objects and rules with zero framework dependencies
  (no EF Core, ASP.NET Core or Dapper references).
- **Infrastructure**: EF Core DbContext and repositories for transactional data; Dapper
  reporting repositories, migrations and demo seed services.
- **SQL Server 2022**: visible schema, synthetic seed data, reporting views and stored
  procedures kept as reviewable SQL files under `database/`.
- **Gemini case assistant**: a Next.js route-handler layer streaming through a read-only tool
  set over the .NET API's bounded case endpoints.

The backend is a Clean Architecture / vertical-slice hybrid with strict reference directions
(`Api -> Application, Infrastructure; Application -> Domain; Infrastructure -> Application,
Domain; Tests -> everything`), chosen so business rules unit-test without infrastructure while
the project layout stays readable in a walkthrough ([ADR 0001](docs/adr/0001-clean-architecture-hybrid.md)).
Frontend routes, chat session management, and the full component inventory live in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### The reporting SQL

Reporting is read-only analytics over the normalized model, and every number traces to a file a
reviewer can open. Dapper repositories call four views (`vw_DashboardSummary`,
`vw_ProviderRiskSummary`, `vw_CaseAging`, `vw_QuestionedCostByMonth`) and two stored procedures
(`sp_GetRiskQueue`, `sp_GetProviderRiskReport`) with parameters for the shared filter
vocabulary (date range, case status, provider, provider type, state or territory, provider
search). The same procedures back the queue UI table, the drill-down links, CSV export and the
print-friendly report pages, so the screen and the export can never disagree about the
definition of a number. Filters are always passed as Dapper parameters, never concatenated.
Full column-level detail: [docs/REPORTING.md](docs/REPORTING.md); the SQL itself lives in
`database/views/` and `database/procedures/`.

### Mock auth and permission overrides

The `DemoAuth` scheme maps an `X-Demo-User` request header (default
`demo.readonly@local`) to one of five demo users spanning ReadOnly, Analyst, Investigator,
Supervisor and Administrator. The API enforces named policies per endpoint (`CanEditCase`,
`CanExportReports`, `CanViewAudit` and the rest); the frontend role selector is convenience UI
only. Administrators can assign effective permissions to demo users from `/admin/security`;
overrides persist in `DemoUserPermissionOverrides` and every administrative action (case
create/update/delete/restore, escalation with justification, provider and procedure-code
changes, permission updates) lands in `AuditEvents`. The role matrix, policy list and override
mechanics: [docs/SECURITY.md](docs/SECURITY.md).

### The AI assistant boundary

The case assistant is a Next.js streaming route over the Vercel AI SDK calling Google Gemini
with a server-only key. Its tool set is read-only by construction: case summary and insight
tools that query the existing application services through bounded endpoints for counts, case
summaries, risk queue search, provider risk and case aging. It can read and summarize; it
cannot create, edit, escalate or delete anything, and it never gets arbitrary SQL access. The
design goal in [ADR 0005](docs/adr/0005-ai-assistant-boundary.md): the blast radius of a bad
generation is a wrong summary, and summaries always cite the case data they grouped. Sessions,
messages and tool calls persist in SQL Server with a hard-delete capability, and the feature
degrades gracefully in the offline client (empty history, working interface).

## How the tech solves the business problem

| Business problem | Engineering decision | Why this tech | What it buys | Where documented |
|---|---|---|---|---|
| A public FWA demo could imply real findings about real parties; that would be worse than no demo | Synthetic, deterministic data with obviously-demo names, a disclaimer on every data page, and triage-only language ("review candidate", "estimated questioned cost", never "fraud detected") | The boundary is documented as an ADR and enforced in product language, not just in the seed script | The repo is safe to publish, demo and discuss publicly; institutional trust is preserved | [ADR 0003](docs/adr/0003-synthetic-data-boundary.md), [docs/OPEN-SOURCE-NOTES.md](docs/OPEN-SOURCE-NOTES.md) |
| An LLM assistant is the natural fit for "summarize my queue" and the riskiest component in this domain | Read-only tool boundary over existing services; SQL-backed session persistence with hard delete | Bounded tools make hallucinations non-destructive and auditable | Worst case is a wrong summary that still cites its case data; no record can be mutated by a generation | [ADR 0005](docs/adr/0005-ai-assistant-boundary.md) |
| For a VA-facing workflow, accessibility is the core quality attribute an evaluator will probe | USWDS 3.x as the design foundation plus a written Section 508 contract every page is held to; a11y bugs treated as defects with commits | The design system carries federal patterns; the contract makes the requirement testable | Keyboard-and-screen-reader-operable UI; charts ship text and table alternatives, which also made print-to-PDF good | [ADR 0002](docs/adr/0002-uswds-accessibility-first.md), [docs/ACCESSIBILITY-508.md](docs/ACCESSIBILITY-508.md) |
| A reviewer or interviewer should not need SQL Server standing to see the product | Every client data call through one gateway with a request/fallback contract: try the API, else return an embedded typed dataset mirroring the documented DTOs | The fallback doubles as living documentation of the API contract | `bun run dev` alone produces a fully navigable demo anywhere, no infrastructure required | [ADR 0004](docs/adr/0004-client-offline-fallback.md) |
| A walkthrough must show real discipline without drowning in ceremony | Clean Architecture / vertical-slice hybrid: four projects, strict reference directions, zero-dependency domain | Each tool where it fits: EF Core for transactional writes, Dapper for SQL-shaped reporting reads | The reviewer or maintainer can trace any rule or report to its layer; the boundaries are part of the product being demonstrated | [ADR 0001](docs/adr/0001-clean-architecture-hybrid.md) |
| Report numbers must survive the question "where did that come from?" | Read-only reporting over named SQL views and parameterized stored procedures, one shared filter model across pages and exports | SQL files are reviewable artifacts; Dapper keeps the read path close to them | Every figure in a report is explainable row by row; screen and export share one definition | [docs/REPORTING.md](docs/REPORTING.md) |
| A security demo must not fake authorization | Policy-based server-side authorization on every endpoint, permission overrides and audit events persisted server-side | ASP.NET Core authorization policies are declarative and testable | Who-can-do-what is enforced by the API, visible in the UI, and recorded in `AuditEvents` | [docs/SECURITY.md](docs/SECURITY.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |

The row that shaped everything else is the synthetic-data boundary. The domain is
fraud/waste/abuse triage over claims, providers and veterans, so real data was out of the
question, and a demo that implied real findings about real parties would have been worse than
no demo at all. Making that a hard boundary (deterministic seed patterns, a disclaimer on
every data page, triage language enforced as product vocabulary) is what makes the rest of the
repository publishable: screenshots, the demo script, and the case assistant's answers are all
safe to show because none of them can be read as an accusation against a real provider or
veteran. The constraint even shaped the UI positively: explainable findings with rule
references, escalation that requires a persisted justification, and a visible audit trail, so
the system always shows its work.

## Request and data flow

One representative path: loading the risk queue (sky path in the diagram), with the two
branches that make this demo portable:

1. The browser hits the Next.js + USWDS client; the page is keyboard- and screen-reader-
   operable and carries the synthetic-data notice.
2. The client's data gateway (`api-client.ts`) issues a typed request with the `X-Demo-User`
   header.
3. **Offline fallback branch:** if the API is unreachable, the gateway returns the embedded
   typed dataset; for the risk queue it applies filtering and pagination locally, so the queue
   behaves rather than merely renders ([ADR 0004](docs/adr/0004-client-offline-fallback.md)).
4. The ASP.NET Core API maps the header through `DemoAuth` to a demo user, then enforces the
   endpoint's authorization policy (`CanViewRiskQueue`); failures go out as ProblemDetails.
5. Application services run the use case; domain rules (risk scoring, workflow transitions)
   execute with zero infrastructure dependencies.
6. Infrastructure persists or queries: EF Core for transactional writes; Dapper for reporting
   reads against the views and `sp_GetRiskQueue` with parameterized filters; SQL Server returns
   the paged, filtered queue rows.
7. **Assistant branch (amber path):** `/chat` streams from a Next.js route handler through the
   Vercel AI SDK to Gemini; case facts reach the model only through the read-only tools backed
   by bounded .NET endpoints, and the transcript persists to SQL Server.

## Stack, and why

| Area | Choice and why |
|---|---|
| **ASP.NET Core Web API on .NET 10** | REST API with Swagger/OpenAPI, ProblemDetails, health checks and policy-based authorization; SDK `10.0.201` pinned by `src/server/global.json` |
| **EF Core** | LINQ for transactional data (case CRUD, notes, rules, claims, providers, authorizations); migrations and demo seed services in Infrastructure |
| **Dapper** | Parameterized SQL close to the reporting views and procedures it serves ([ADR 0001](docs/adr/0001-clean-architecture-hybrid.md)) |
| **SQL Server 2022 (Docker Compose)** | Visible schema, seed, views and procedures as reviewable files under `database/`; same path for Windows and macOS developers |
| **Next.js + React + TypeScript + Sass on Bun `1.3.10`** | One client codebase with typed DTOs end to end; Bun pinned for package management and scripts (`src/client/bun.lock` committed) |
| **USWDS 3.x** | The federal design system as distributed, customized through our own Sass layer and React wrappers; never edited inside `node_modules` ([ADR 0002](docs/adr/0002-uswds-accessibility-first.md)) |
| **Vercel AI SDK + Google Gemini** | Streaming chat with explicit read-only tools rather than an agent loop; easier to audit for this tool surface (chat details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) |
| **xUnit** | Backend test host covering policies, workflow, scoring, chat and reporting queries |

Runtime policy: latest LTS or stable production packages only; no preview, alpha, beta, canary,
release-candidate or nightly packages unless a change documents the reason
([docs/SPECIFICATION.md](docs/SPECIFICATION.md)).

## Testing

- **Backend: 41 xUnit tests across 8 test classes** (authorization policies, case workflow,
  risk scoring, case insight tools, chat service and repository, dashboard and reporting
  queries). Repository tests run against the EF Core InMemory provider, so workflow and policy
  behavior is checked without a database; the domain rules they exercise are the same
  zero-dependency rules production uses.
- **CI (GitHub Actions, [ci.yml](.github/workflows/ci.yml))**: `dotnet restore/build/test` on
  the solution in Release, then frontend gates with Bun: `lint` (ESLint, zero warnings
  allowed), `typecheck` (`tsc --noEmit`) and a production `next build` against the frozen
  lockfile.
- **Accessibility verification is manual by design**: the verification steps in
  [docs/ACCESSIBILITY-508.md](docs/ACCESSIBILITY-508.md) are the actual per-page pass
  (keyboard-only navigation, focus order, screen reader spot checks); the process narrative
  records that the a11y defects shipped during chat work were caught by these passes, not by
  automated checks.

## Security and operations

- No secrets in source control; `.env.example` only; the Gemini key is server-only and must
  never carry a `NEXT_PUBLIC_` prefix ([docs/SETUP.md](docs/SETUP.md)).
- Mock auth clearly labeled; the `X-Demo-User` header is deliberately easy to switch for demos
  and is backed by server-side policies on every endpoint.
- CORS restricted to the local frontend origins (`http://localhost:3000`, `:3001`).
- EF Core LINQ for transactional data; Dapper with parameterized SQL for reports; no dynamic
  SQL concatenation for user-controlled values; pagination values validated and bounded.
- No real data: synthetic seed patterns only, reviewed at contribution time
  ([docs/OPEN-SOURCE-NOTES.md](docs/OPEN-SOURCE-NOTES.md)).
- Vulnerability reporting and scope: [SECURITY.md](SECURITY.md); role matrix, policies,
  overrides and audit mechanics: [docs/SECURITY.md](docs/SECURITY.md).

## Jargon

Terms used across this repo, from [OIG](docs/GLOSSARY.md) and [questioned
cost](docs/GLOSSARY.md) to [clean architecture hybrid](docs/GLOSSARY.md) and the [read-only AI
boundary](docs/GLOSSARY.md), are defined in the [glossary](docs/GLOSSARY.md), plain English
first.
