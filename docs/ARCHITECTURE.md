# Architecture

## Overview

The application uses a Clean Architecture / Vertical Slice hybrid. The goal is to keep business rules testable while keeping the demo readable for an interview setting.

```text
Next.js + Bun + USWDS
        |
ASP.NET Core Web API
        |
Application services and DTOs
        |
Domain entities and value objects
        |
Infrastructure: EF Core, Dapper, SQL Server
```

## Backend Projects

- `VAOIG.FwaRiskTriage.Api`: REST API, Swagger/OpenAPI, CORS, ProblemDetails, health checks, mock auth, authorization policies.
- `VAOIG.FwaRiskTriage.Application`: use cases, DTOs, service interfaces, risk scoring, case workflow, reporting export service.
- `VAOIG.FwaRiskTriage.Domain`: entities, enums, value objects, domain rules. No EF Core, ASP.NET Core, or Dapper dependencies.
- `VAOIG.FwaRiskTriage.Infrastructure`: EF Core DbContext, EF repositories, Dapper reporting repositories, migrations, demo seed services.

Required references:

```text
Api -> Application, Infrastructure
Application -> Domain
Infrastructure -> Application, Domain
Tests -> Application, Domain, Infrastructure, Api
```

## Frontend

The frontend uses Bun, Next.js, React, TypeScript, Sass, and USWDS.

Core routes:

- `/`
- `/dashboard`
- `/risk-queue`
- `/cases/new`
- `/cases/[caseId]`
- `/rules`
- `/reports`
- `/reports/provider-risk`
- `/reports/questioned-cost`
- `/reports/case-aging`
- `/admin/providers`
- `/admin/procedure-codes`
- `/admin/security`

The UI should be HTML-first and accessible. USWDS wrappers should cover header, side navigation, breadcrumbs, alerts, summary boxes, tables, tags, buttons, form groups, and pagination.

Manual intake uses SQL-backed reference data for providers, states and territories, and procedure codes. Long provider names and procedure descriptions are rendered through searchable controls with wrapped detail text so the form remains readable on desktop and mobile layouts.

## AI Chat Assistant

The chat UI lives in Next.js at `/chat` and `/chat/[chatId]`. Next.js owns the Vercel AI SDK streaming route at `src/client/src/app/api/chat/[chatId]/route.ts`, validates AI SDK UI messages, calls `streamText`, and persists the stream with `toUIMessageStreamResponse({ originalMessages, onFinish })`.

Next.js also owns model provider configuration for the assistant. The route uses `@ai-sdk/google` with `GOOGLE_GENERATIVE_AI_API_KEY` and `GOOGLE_GENERATIVE_AI_MODEL`, defaulting to `gemini-3.1-flash-lite-preview`. The key is server-only and must not be exposed through `NEXT_PUBLIC_` variables. Missing keys return a sanitized route error. Stream abort and stream errors are consumed through `consumeSseStream: consumeStream` via the local wrapper so errors can be logged without leaking provider details to the browser.

The .NET API owns SQL persistence and the allowlisted read-only case query tools. Chat sessions, messages, tool calls, and pinned context items are stored in SQL Server. The assistant does not get arbitrary SQL access; case facts come through bounded endpoints for counts, case summaries, risk queue search, provider risk, and case aging.

AI SDK Agents, subagents, and ToolLoopAgent are not used in v1. The business case is a simple case-record assistant with a small tool surface, so `streamText` plus explicit tools is enough and easier to audit.

AI SDK Memory providers are also not used in v1. Conversation history and case context are SQL-backed so OIG demo context remains auditable and avoids provider-specific memory lock-in.

AI SDK Transcription is not implemented in v1. Chat is text-only because audio upload would add retention, privacy, and accessibility concerns beyond this demo scope.

Real web search is not implemented in v1. If the UI sends a web-search request flag, the assistant is instructed to say that web search is unavailable and to answer only from conversation history and read-only case tools.

## Database

SQL Server is the primary data store.

- EF Core: transactional data, case CRUD, notes, risk rules, claims, providers, authorizations.
- Dapper: dashboard, reporting, risk queue, case aging, questioned cost trend, export-ready datasets.
- SQL files: visible schema, seed data, views, and stored procedures for interview review.

## Reporting

Reporting is SQL-backed and fully reviewable through views, procedures, Dapper repositories, accessible charts, accessible tables, filtered report pages, CSV exports, and print-to-PDF output. Report pages share a common filter model for date range, workflow status, provider, provider type, state or territory, and provider search.

## Security Boundary

Mock authentication exists only to demonstrate security-aware design. It should never be described as production-ready identity management.

Server authorization should be policy-based and enforced on endpoints. The frontend role selector is convenience UI only and must not be the only authorization check.
