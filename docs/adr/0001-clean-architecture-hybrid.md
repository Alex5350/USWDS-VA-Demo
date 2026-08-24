# ADR 0001: Clean Architecture / vertical-slice hybrid on .NET 10

**Status:** Accepted

## Context

The portal is an interview-grade demo of a federal workflow: it must show real engineering
discipline (testable business rules, clear boundaries) while staying *readable* in a
walkthrough. Pure Clean Architecture adds mapping ceremony; pure vertical slices scatter
domain rules across features.

## Decision

A hybrid. Four backend projects with strict reference directions:

```
Api -> Application, Infrastructure
Application -> Domain
Infrastructure -> Application, Domain
Tests -> everything
```

The domain layer is free of EF Core, ASP.NET Core and Dapper. Use cases live in
Application as services + DTOs; EF Core repositories and Dapper reporting repositories
both sit in Infrastructure behind Application-defined interfaces.

## Consequences

- Domain rules (risk scoring, case workflow transitions) unit-test with zero infrastructure.
- Reporting reads take the Dapper path (SQL-shaped, close to the SQL views that back the
  reports) while transactional writes stay on EF Core, each tool where it fits.
- The extra project ceremony is accepted deliberately: for a portfolio demo, the
  boundaries *are* part of the product being demonstrated.
