# VA OIG FWA Risk Triage & Reporting Portal

Synthetic-data demo of a secure, accessible, SQL-driven Community Care fraud, waste, abuse, improper-payment, and oversight risk triage portal.

This application does not determine fraud. It helps analysts prioritize claims, providers, complaints, and case work that may deserve review based on transparent business rules and SQL-backed reporting.

## Synthetic Data Disclaimer

This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.

## Screenshots

Captured from the running client (real browser, keyboard-verified pages) with its
embedded offline dataset, the same interface you get from `bun run dev` alone:

| Executive dashboard | Risk queue with filters |
|:---:|:---:|
| ![Dashboard](docs/screenshots/shot-dashboard.png) | ![Risk queue](docs/screenshots/shot-risk-queue.png) |

| Case detail with explainable findings | Reporting command center |
|:---:|:---:|
| ![Case detail](docs/screenshots/shot-case.png) | ![Reports](docs/screenshots/shot-reports.png) |

| Case intake with searchable reference data | AI case assistant (read-only tools) |
|:---:|:---:|
| ![Case intake](docs/screenshots/shot-case-new.png) | ![Chat](docs/screenshots/shot-chat.png) |

| Risk rules administration | Security: demo auth, overrides, audit |
|:---:|:---:|
| ![Rules](docs/screenshots/shot-rules.png) | ![Admin](docs/screenshots/shot-admin.png) |

<p align="center"><img src="docs/screenshots/shot-home.png" alt="Portal landing page" width="72%"></p>

## Architecture at a glance

![Request flow: the USWDS client prefers the ASP.NET Core API and falls back to an embedded offline dataset; demo auth maps X-Demo-User to roles and policies; services run over a zero-dependency domain; EF Core and Dapper persist to SQL Server; the Gemini assistant streams through read-only case tools](docs/diagrams/request-flow.svg)

Full architecture detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); decisions and
their reasoning in the [ADRs](docs/adr/); the accessibility contract in
[docs/ACCESSIBILITY-508.md](docs/ACCESSIBILITY-508.md); and the build narrative
(centered on the accessibility and USWDS challenges that only surfaced at runtime) in
[docs/PROCESS-AND-CHALLENGES.md](docs/PROCESS-AND-CHALLENGES.md).

## Tech Stack

- Backend: ASP.NET Core Web API, C#, Entity Framework Core, Dapper, Swagger/OpenAPI
- Runtime policy: .NET 10 SDK `10.0.201` as pinned by `src/server/global.json`
- Frontend: Bun `1.3.10`, Next.js, React, TypeScript, Sass, USWDS 3.x
- Database: SQL Server 2022-compatible SQL
- Reporting: SQL views, Dapper reporting queries, filtered dashboards, accessible charts and tables, CSV export, print-to-PDF output
- Local database: SQL Server 2022 in Docker Compose
- Tests: xUnit or NUnit for backend tests

Use latest LTS or stable production packages only. Do not use preview, alpha, beta, canary, release-candidate, or nightly packages unless a future change explicitly documents the reason.

## Repository Structure

```text
.
|-- .github/
|-- database/
|   |-- schema/
|   |-- seed/
|   |-- views/
|   `-- procedures/
|-- docker/
|   `-- mssql/
|-- docs/
|-- scripts/
|-- src/
|   |-- server/
|   `-- client/
`-- tests/
```

## Prerequisites

- .NET 10 SDK `10.0.201`
- Bun `1.3.10`
- Docker Desktop
- Git
- Optional SQL tools: Azure Data Studio, SQL Server Management Studio, JetBrains DataGrip, Rider database tools, or WebStorm database tools

## Windows Setup

1. Install the .NET 10 SDK.
2. Install Bun for Windows.
3. Install Docker Desktop. Use the WSL2 backend when available.
4. Optional: install SQL Server Developer, SQL Server Express, or LocalDB if you do not want to use Docker for local SQL Server.
5. Start SQL Server:

```powershell
.\scripts\dev-up.ps1
```

Manual equivalent:

```powershell
docker compose up -d sqlserver
docker compose ps
```

## macOS Setup

1. Install the .NET 10 SDK.
2. Install Bun `1.3.10`.
3. Install Docker Desktop.
4. Start SQL Server:

```bash
chmod +x scripts/*.sh
./scripts/dev-up.sh
```

Manual equivalent:

```bash
docker compose up -d sqlserver
docker compose ps
```

On Apple Silicon Macs, SQL Server Docker containers may run through x86_64 emulation. This setup is intended for local demo development only and should not be described as a production-supported SQL Server-on-ARM deployment.

## Environment

Copy the placeholder environment file if you want local Docker Compose and shell sessions to use the same values:

```bash
cp .env.example .env
```

Do not commit `.env`.

Default development connection string:

```text
Server=localhost,1433;Database=VAOIG_FWA_Demo;User Id=sa;Password=Your_strong_password123!;TrustServerCertificate=True;Encrypt=True;
```

## SQL Server Docker

Start:

```bash
docker compose up -d sqlserver
docker compose ps
```

Stop:

```bash
docker compose down
```

Reset the database volume:

```bash
docker compose down -v
docker compose up -d sqlserver
```

The SQL Server image is `mcr.microsoft.com/mssql/server:2022-latest` and the container name is `vaoig-fwa-sqlserver`.

The health check uses `/opt/mssql-tools18/bin/sqlcmd`. If a future image changes that path, treat the health check as best-effort and verify connectivity manually.

## Database Setup

Create the database:

```bash
docker exec -it vaoig-fwa-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "Your_strong_password123!" \
  -C \
  -i /docker-entrypoint-initdb.d/001-create-database.sql
```

Create schema, views, and procedures:

```bash
docker exec -it vaoig-fwa-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "Your_strong_password123!" \
  -C \
  -i /docker-entrypoint-initdb.d/002-create-schema.sql
```

Seed demo data:

```bash
docker exec -it vaoig-fwa-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "Your_strong_password123!" \
  -C \
  -i /docker-entrypoint-initdb.d/003-seed-demo-data.sql
```

The official SQL Server Linux image does not automatically run `/docker-entrypoint-initdb.d` files. Run them manually or through a future bootstrap command.

EF Core migration path:

```bash
cd src/server
dotnet tool restore
dotnet ef database update \
  --project VAOIG.FwaRiskTriage.Infrastructure \
  --startup-project VAOIG.FwaRiskTriage.Api
```

## Backend

From `src/server`:

```bash
dotnet restore
dotnet build
dotnet test
dotnet run --project VAOIG.FwaRiskTriage.Api
```

Expected local URLs:

```text
http://localhost:5000
https://localhost:5001
```

The API reads the SQL Server connection string from:

```text
ConnectionStrings:DefaultConnection
```

## Frontend

From `src/client`:

```bash
bun install
bun run dev
bun run lint
bun run typecheck
bun run build
bun run start
```

The frontend should run at:

```text
http://localhost:3000
```

The frontend API base URL is:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Use Bun for frontend package management and scripts. Commit `src/client/bun.lock`. Do not commit `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`.

## AI Chat Assistant

The case assistant is available at `/chat`. Saved sessions reopen at `/chat/{guid}`. It answers questions about synthetic case records, risk queue rows, provider risk, and case aging through read-only tools.

The streaming route runs in Next.js and uses the Vercel AI SDK with the direct Google Gemini provider. Set the Google key only for the Next server process; it must not use a `NEXT_PUBLIC_` prefix or be exposed to browser code.

```text
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_GENERATIVE_AI_MODEL=gemini-3.1-flash-lite-preview
```

`GOOGLE_GENERATIVE_AI_MODEL` is optional unless you want to override the code default.

Local run flow:

1. Start SQL Server and apply the database schema or EF migrations.
2. Start the .NET API from `src/server` with `dotnet run --project VAOIG.FwaRiskTriage.Api`.
3. Start the frontend from `src/client` with `bun run dev`, making the Google variables available to that process. `src/client/.env.local` is ignored by git if you prefer a frontend-local env file.
4. Open `http://localhost:3000/chat` and select a demo user role with risk queue access.

The assistant uses synthetic data only. It does not determine fraud, does not write case records, does not run arbitrary SQL, and does not implement real web search in v1. The web-search checkbox records the request context but the assistant will answer from the conversation and allowlisted case tools only.

## Mock Authentication

The demo uses lightweight mock authentication only. It is not production identity management.

Preferred backend behavior:

- Authentication scheme: `DemoAuth`
- Request header: `X-Demo-User`
- Default user when no header is present: `demo.readonly@local`
- Demo roles: `ReadOnly`, `Analyst`, `Investigator`, `Supervisor`, `Administrator`

Preferred frontend behavior:

- Header role selector
- Session storage for the selected demo user
- `X-Demo-User` sent with API requests
- Visible notice that authentication is mocked

Analyst, Investigator, Supervisor, and Administrator can create manual synthetic case records, edit case status and claim fields from a separate edit page, escalate or de-escalate cases with required justification, and delete cases into a restore-capable recycle bin. Escalation and de-escalation justifications are persisted as case notes and audit events. Analysts and Investigators see and restore their own deleted records; Supervisors and Administrators can review the broader deleted-record queue. Deleted cases are hidden from the active queue until restored. Administrators can assign effective demo permissions to fake users and review audit events for case creation, updates, deletion, restoration, escalation, de-escalation, and permission updates.

Investigators, Supervisors, and Administrators can add, update, or disable synthetic providers. Supervisors and Administrators can maintain procedure-code meanings and default amounts. Manual intake uses searchable provider, state/territory, and procedure-code controls instead of free-text provider and code fields.

Real VA SSO, Login.gov, PIV/CAC, Entra ID, password login, and production user provisioning are out of scope.

## Reporting

The reporting layer is SQL-backed. Dapper queries read reporting views and stored procedures for executive metrics, provider risk summaries, case aging, questioned cost trend data, filtered report workspaces, and CSV exports.

Included report pages:

- `/reports`: reporting command center with cross-report filters and export controls
- `/reports/provider-risk`: provider concentration, questioned cost, and average risk score analysis
- `/reports/questioned-cost`: monthly paid amount and estimated questioned cost trend analysis
- `/reports/case-aging`: workflow status and case aging bucket analysis

Report filters support date range, case status, provider, provider type, state or territory, and provider search. CSV exports and print-to-PDF output use the active filter set.

Included SQL assets:

- `database/views/vw_DashboardSummary.sql`
- `database/views/vw_ProviderRiskSummary.sql`
- `database/views/vw_CaseAging.sql`
- `database/views/vw_QuestionedCostByMonth.sql`
- `database/procedures/sp_GetRiskQueue.sql`
- `database/procedures/sp_GetProviderRiskReport.sql`

## Accessibility

The frontend should follow USWDS patterns and Section 508 expectations:

- Skip-to-main-content link
- Semantic landmarks
- Labeled forms
- Accessible tables with captions and scoped headers
- Visible focus states
- WCAG AA color contrast
- Text summaries and table alternatives for charts
- Keyboard-accessible controls

See [docs/ACCESSIBILITY-508.md](docs/ACCESSIBILITY-508.md).

## Security

This is a demo, but it should show good habits:

- No secrets in source control
- `.env.example` only
- Mock auth clearly labeled
- CORS restricted to local frontend origin
- EF Core LINQ for transactional data
- Dapper with parameterized SQL for reports
- No dynamic SQL concatenation for user-controlled values
- No real data

See [SECURITY.md](SECURITY.md) and [docs/SECURITY.md](docs/SECURITY.md).

## Interview Demo

Use [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md) to walk through:

1. Business case
2. Architecture
3. SQL Server Docker setup
4. Mock authentication
5. Dashboard
6. Risk queue
7. Case detail
8. Explainable rules
9. Reporting
10. Accessibility and security choices

## Troubleshooting

If SQL Server is not healthy:

- Check `docker compose logs -f sqlserver`.
- Confirm port `1433` is not already in use.
- Confirm the SA password meets SQL Server complexity requirements.
- On Apple Silicon, allow time for x86_64 emulation startup.
- If `/opt/mssql-tools18/bin/sqlcmd` is unavailable in the image, connect from a host SQL tool or adjust the health check.

If the frontend cannot call the API:

- Confirm the API is running on `http://localhost:5000`.
- Confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`.
- Confirm CORS allows `http://localhost:3000`.

## License

MIT. See [LICENSE](LICENSE).
