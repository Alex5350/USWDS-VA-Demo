# Contributing

Thank you for improving this synthetic-data demo. This repository is designed for interview and learning use, so contributions should prioritize clarity, maintainability, accessibility, and public safety.

## Ground Rules

- Use synthetic data only.
- Do not add real veteran, patient, claim, provider, VA internal, PHI, PII, or sensitive government data.
- Describe records as potential risk indicators, review candidates, or triage items.
- Do not describe any person or provider as having committed confirmed fraud, waste, abuse, or misconduct.
- Keep mock authentication clearly labeled as demo-only.
- Do not commit secrets, local `.env` files, database backups, or generated build output.

## Development Expectations

- Backend changes should use ASP.NET Core, C#, EF Core for transactional data, and Dapper for reporting queries.
- Frontend changes should use Bun, Next.js, TypeScript, and USWDS patterns.
- SQL changes should remain SQL Server 2022-compatible and Azure SQL-compatible where practical.
- Documentation should be plain, public-demo safe, and accessible.
- UI changes should preserve Section 508 and WCAG AA accessibility goals.

## Local Setup

See [README.md](README.md) for Windows and macOS setup. The default database path is SQL Server 2022 through Docker Compose.

## Pull Request Checklist

- No secrets or real data are included.
- Synthetic-data disclaimer remains visible where data is displayed.
- Risk language is careful and non-accusatory.
- SQL queries are parameterized when implemented in code.
- New or changed forms, tables, and reports are accessible.
- `dotnet test` passes for backend changes.
- `bun run lint`, `bun run typecheck`, and `bun run build` pass for frontend changes.

## Reporting Security Issues

See [SECURITY.md](SECURITY.md). Do not publish suspected vulnerabilities with exploit details in a public issue.
