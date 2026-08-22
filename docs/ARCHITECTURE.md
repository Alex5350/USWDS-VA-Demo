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
- `/admin/providers`
- `/admin/procedure-codes`
- `/admin/security`

The UI should be HTML-first and accessible. USWDS wrappers should cover header, side navigation, breadcrumbs, alerts, summary boxes, tables, tags, buttons, form groups, and pagination.

Manual intake uses SQL-backed reference data for providers, states and territories, and procedure codes. Long provider names and procedure descriptions are rendered through searchable controls with wrapped detail text so the form remains readable on desktop and mobile layouts.

## Database

SQL Server is the primary data store.

- EF Core: transactional data, case CRUD, notes, risk rules, claims, providers, authorizations.
- Dapper: dashboard, reporting, risk queue, case aging, questioned cost trend, export-ready datasets.
- SQL files: visible schema, seed data, views, and stored procedures for interview review.

## Reporting

Power BI embedding is represented by an abstraction and disabled placeholder endpoint in demo mode. SQL-backed reporting is the fallback and is fully reviewable through views and procedures.

## Security Boundary

Mock authentication exists only to demonstrate security-aware design. It should never be described as production-ready identity management.

Server authorization should be policy-based and enforced on endpoints. The frontend role selector is convenience UI only and must not be the only authorization check.
