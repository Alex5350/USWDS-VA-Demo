# Demo Script

## Opening

This demo is a synthetic-data fraud, waste, and abuse risk triage portal. It does not determine fraud. It helps analysts prioritize claims and providers that may deserve review based on transparent, explainable rules and SQL-backed reporting.

## 1. Business Case

VA OIG analysts may need to review large volumes of Community Care claim, authorization, provider, complaint, and case data. This demo shows one way to prioritize records for analyst review using deterministic risk indicators.

Use careful language:

- Potential risk
- Risk indicator
- Review candidate
- Analyst review recommended
- Estimated questioned cost

Do not describe any record as confirmed misconduct.

## 2. Architecture

Walk through the repository:

- ASP.NET Core Web API backend
- Application and domain projects for testable business logic
- Infrastructure project for EF Core, Dapper, SQL Server, and reporting queries
- Next.js frontend using Bun, TypeScript, Sass, and USWDS
- SQL scripts for schema, seed data, views, and stored procedures

## 3. Windows and macOS Setup

Explain that the local database uses Docker Compose so Windows and macOS developers have the same SQL Server path.

Mention:

- .NET 10 SDK `10.0.201`
- Bun `1.3.10`
- Docker Desktop
- PowerShell scripts for Windows
- Shell scripts for macOS/Linux
- Optional SQL Server Developer, Express, or LocalDB on Windows
- Apple Silicon x86_64 emulation caveat

## 4. SQL Server Docker Setup

Show:

```bash
docker compose up -d sqlserver
docker compose ps
```

Then explain the manual SQL setup scripts:

```text
001-create-database.sql
002-create-schema.sql
003-seed-demo-data.sql
```

The seed script creates synthetic data only, including:

- Duplicate claim candidates
- Missing authorization
- Expired authorization
- High-dollar outliers
- Provider repeat patterns
- Hotline matches
- Service after synthetic death date
- Rapid resubmission patterns

## 5. Mock Authentication

Show the demo role selector.

Explain:

- API reads `X-Demo-User`
- No passwords are stored
- No production identity provider is configured
- Server-side policies protect endpoints
- Role switching is for interview/demo use only

Roles:

- ReadOnly
- Analyst
- Investigator
- Supervisor
- Administrator

## 6. Dashboard

Show executive metrics:

- Total claims reviewed
- High-risk claims
- Critical-risk claims
- Estimated questioned cost
- Duplicate-payment candidates
- Providers with abnormal patterns
- Open cases
- Average case age

Call out the synthetic-data disclaimer.

## 7. Risk Queue

Show filters:

- Risk level
- Status
- Date range
- Provider type
- Provider search

Explain that the queue sorts by risk score and provides drill-down to case detail.

Open **Create case record** from the risk queue section. Show that manual intake uses searchable existing provider names, all seeded U.S. states and territories, meaningful procedure codes, fractional U.S. dollar amounts, and explainable risk indicators. Emphasize that creating a case record captures potential risk indicators only and does not determine fraud, waste, or abuse.

## 8. Case Detail

Show:

- Case summary
- Claim details
- Provider details
- Authorization details
- Risk findings
- Related synthetic hotline complaints
- Analyst notes
- Status update
- Escalate and de-escalate actions that require a persisted justification

Emphasize explainability: every score contribution has a human-readable explanation.

## 9. Explainable Rules

Show the rules page:

- Rule code
- Rule name
- Weight
- Enabled state
- Description

Only Administrator can edit rule weights or enabled state.

Also show provider administration and procedure-code administration:

- Investigators, Supervisors, and Administrators can add, update, or disable synthetic providers.
- Supervisors and Administrators can maintain procedure-code descriptions and default amounts.
- Administrators can review audit events for administrative actions.

## 10. Reporting

Show the reports page:

- SQL-backed reporting command center
- Provider risk concentration report
- Questioned cost trend report
- Case aging and workflow load report
- Shared filters for date range, status, provider, provider type, state or territory, and provider search
- CSV exports and print-to-PDF output using the active filter set

## 11. SQL Reporting Views

Open the SQL files:

- `vw_DashboardSummary`
- `vw_ProviderRiskSummary`
- `vw_CaseAging`
- `vw_QuestionedCostByMonth`
- `sp_GetRiskQueue`
- `sp_GetProviderRiskReport`

Explain that Dapper is intended for reporting queries and EF Core for transactional workflows.

## 12. Accessibility Choices

Call out:

- USWDS
- Skip link
- Semantic landmarks
- Labeled forms
- Table captions and scoped headers
- Text alternatives for charts
- Keyboard navigation
- Color is not the only status indicator

## 13. VA OIG Office of Data and Analytics Fit

Close by mapping the demo to the mission:

- Prioritizes analyst review workload
- Uses SQL-backed evidence trails
- Separates triage from conclusions
- Supports repeatable reporting
- Avoids real sensitive data
- Demonstrates security-aware and accessibility-aware engineering
