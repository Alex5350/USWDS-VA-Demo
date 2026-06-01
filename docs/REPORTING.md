# Reporting

## Purpose

The reporting layer supports executive summary metrics, analyst drill-down, export-ready datasets, and a future Power BI Embedded integration.

Demo reporting must not present risk indicators as confirmed fraud, waste, abuse, or misconduct. Reports should use triage language such as potential risk, review candidate, estimated questioned cost, and analyst review recommended.

## SQL-Backed Reporting Assets

Views:

- `dbo.vw_DashboardSummary`
- `dbo.vw_ProviderRiskSummary`
- `dbo.vw_CaseAging`
- `dbo.vw_QuestionedCostByMonth`

Procedures:

- `dbo.sp_GetRiskQueue`
- `dbo.sp_GetProviderRiskReport`

These files live under `database/views` and `database/procedures`. The Docker schema script also includes them so a local SQL Server database can be set up with one schema command after database creation.

## Dashboard Summary

`vw_DashboardSummary` returns:

- Total claims reviewed
- High-risk claims
- Critical-risk claims
- Estimated questioned cost
- Duplicate-payment candidates
- Providers with abnormal patterns
- Open cases
- Average case age

## Provider Risk Report

`vw_ProviderRiskSummary` and `sp_GetProviderRiskReport` return:

- Provider name
- Provider type
- State
- Number of claims
- Total paid amount
- High-risk claim count
- Critical-risk claim count
- Estimated questioned cost
- Average risk score

Filters:

- State
- Provider type

## Questioned Cost Trend

`vw_QuestionedCostByMonth` groups by service month and returns:

- Total paid amount
- Estimated questioned cost
- High-risk claim count
- Case count

Charts built from this data must include an accessible text summary and table alternative.

## Case Aging

`vw_CaseAging` returns case counts by status and aging bucket:

- 0 to 15 days
- 16 to 30 days
- 31 to 60 days
- 61 or more days

## Risk Queue Export

`sp_GetRiskQueue` returns a paginated dataset that can support:

- Risk queue UI table
- Drill-down links to case detail
- CSV export for authorized demo users
- Print-friendly report pages

The stored procedure uses parameters for filters. Application code should pass parameters through Dapper and should not concatenate user input into SQL strings.

## Power BI-Ready Design

The API should expose:

```http
GET /api/powerbi/embed-config
```

Demo mode response:

```json
{
  "enabled": false,
  "mode": "demo-placeholder",
  "message": "Power BI embedding is not configured. Displaying SQL-backed reporting dashboard instead."
}
```

Configuration keys for a future real integration:

```text
PowerBi:Enabled
PowerBi:TenantId
PowerBi:ClientId
PowerBi:ClientSecret
PowerBi:WorkspaceId
PowerBi:ReportId
PowerBi:DatasetId
```

Secrets must be stored in user secrets, environment variables, or approved secret stores. Do not commit real Power BI credentials.

## Frontend Fallback

The frontend `PowerBiReportFrame` component should:

1. Call `/api/powerbi/embed-config`.
2. Render an embedded report only when enabled and configured.
3. Render SQL-backed fallback reports when disabled.
4. Keep all tables accessible with captions and scoped headers.
5. Provide export controls only for roles with `CanExportReports`.
