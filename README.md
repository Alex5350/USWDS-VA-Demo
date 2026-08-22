# VA OIG FWA Risk Triage & Reporting Portal

Synthetic-data demo of a secure, accessible, SQL-driven Community Care fraud, waste, abuse, improper-payment, and oversight risk triage portal.

This application does not determine fraud. It helps analysts prioritize claims, providers, complaints, and case work that may deserve review based on transparent business rules and SQL-backed reporting.

## Synthetic Data Disclaimer

This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.

## Screenshots

Screenshot placeholders for the public demo:

- Dashboard executive summary
- Risk queue with filters
- Create case record intake with searchable reference data
- Case detail with explainable risk findings
- Reports page with Power BI placeholder and SQL-backed fallback
- Provider/procedure-code administration pages
- Admin security page showing mock authorization, permission overrides, and audit events

## Tech Stack

- Backend: ASP.NET Core Web API, C#, Entity Framework Core, Dapper, Swagger/OpenAPI
- Runtime policy: .NET 10 SDK `10.0.201` as pinned by `src/server/global.json`
- Frontend: Bun `1.3.10`, Next.js, React, TypeScript, Sass, USWDS 3.x
- Database: SQL Server 2022-compatible SQL
- Reporting: SQL views, Dapper reporting queries, CSV export, Power BI-ready placeholder
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

Analyst, Investigator, Supervisor, and Administrator can create manual synthetic case records, edit case and claim fields from a separate edit page, escalate cases for supervisory review, and soft-delete cases into a recycle bin. Deleted cases are hidden from the active queue and can be restored. Administrators can assign effective demo permissions to fake users and review audit events for case creation, updates, soft deletion, restoration, escalation, and permission updates.

Investigators, Supervisors, and Administrators can add, update, or disable synthetic providers. Supervisors and Administrators can maintain procedure-code meanings and default amounts. Manual intake uses searchable provider, state/territory, and procedure-code controls instead of free-text provider and code fields.

Real VA SSO, Login.gov, PIV/CAC, Entra ID, password login, and production user provisioning are out of scope.

## Reporting

The reporting layer is designed for Power BI embedding later, with SQL-backed fallback reporting now.

Included SQL assets:

- `database/views/vw_DashboardSummary.sql`
- `database/views/vw_ProviderRiskSummary.sql`
- `database/views/vw_CaseAging.sql`
- `database/views/vw_QuestionedCostByMonth.sql`
- `database/procedures/sp_GetRiskQueue.sql`
- `database/procedures/sp_GetProviderRiskReport.sql`

The Power BI endpoint should return a disabled placeholder unless real credentials are configured through user secrets or environment variables.

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
