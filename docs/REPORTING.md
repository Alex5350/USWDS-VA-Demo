# Reporting

## Purpose

The reporting layer supports executive summary metrics, analyst drill-down, export-ready datasets, accessible tables, charted trend summaries, filtered report pages, CSV exports, and print-to-PDF output.

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
- Date range
- Case status
- Provider
- Provider search

## Questioned Cost Trend

`vw_QuestionedCostByMonth` groups by service month and returns:

- Total paid amount
- Estimated questioned cost
- High-risk claim count
- Case count

Charts built from this data must include an accessible text summary and table alternative.

Filters:

- Date range
- Case status
- Provider
- Provider type
- State or territory
- Provider search

## Case Aging

`vw_CaseAging` returns case counts by status and aging bucket:

- 0 to 15 days
- 16 to 30 days
- 31 to 60 days
- 61 or more days

Filters:

- Date range
- Case status
- Provider
- Provider type
- State or territory
- Provider search

## Risk Queue Export

`sp_GetRiskQueue` returns a paginated dataset that can support:

- Risk queue UI table
- Drill-down links to case detail
- CSV export for authorized demo users
- Print-friendly report pages

The stored procedure uses parameters for filters. Application code should pass parameters through Dapper and should not concatenate user input into SQL strings.

## Report Pages

The frontend exposes focused report workspaces:

- `/reports`: reporting command center with filtered executive metrics, questioned cost trend, provider concentration, case status distribution, case aging, and risk queue CSV export.
- `/reports/provider-risk`: provider concentration report with provider-level claim volume, paid amount, high-risk and critical-risk counts, estimated questioned cost, and average risk score.
- `/reports/questioned-cost`: monthly financial trend report with total paid amount, estimated questioned cost, high-risk claims, and case count.
- `/reports/case-aging`: workload aging report by workflow status and age bucket.

Each report page supports the same filter vocabulary:

- From date
- To date
- Case status
- Provider
- Provider type
- State or territory
- Provider search

CSV and PDF exports must use the active filter set. PDF output is produced through a print-ready report layout and browser Save as PDF behavior.

## Frontend Reporting

The frontend reports page should:

1. Render SQL-backed command-center, provider risk, questioned cost trend, and case aging reports.
2. Keep all tables accessible with captions and scoped headers.
3. Include text summaries for chart-like trend displays.
4. Provide export controls only for roles with `CanExportReports`.
5. Avoid external reporting-service dependencies for local demo readiness.
