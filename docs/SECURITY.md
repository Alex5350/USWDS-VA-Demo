# Security

## Scope

This project is a public, synthetic-data demo. It demonstrates security-aware design patterns but does not implement production identity, production authorization, or real VA system integration.

Do not use this repository with real veteran, patient, claim, provider, VA internal, PHI, PII, or sensitive government data.

## Mock Authentication

Preferred backend behavior:

- Authentication scheme: `DemoAuth`
- Header: `X-Demo-User`
- Default user: `demo.readonly@local`
- Server maps demo users to roles and permissions

Demo users:

| Email | Display name | Role |
| --- | --- | --- |
| `demo.readonly@local` | Demo Read Only | ReadOnly |
| `demo.analyst@local` | Demo Analyst | Analyst |
| `demo.investigator@local` | Demo Investigator | Investigator |
| `demo.supervisor@local` | Demo Supervisor | Supervisor |
| `demo.admin@local` | Demo Administrator | Administrator |

The `X-Demo-User` header is intentionally easy to switch for demonstrations. It is not production authentication.

## Role Matrix

| Capability | ReadOnly | Analyst | Investigator | Supervisor | Administrator |
| --- | --- | --- | --- | --- | --- |
| View dashboard | Yes | Yes | Yes | Yes | Yes |
| View risk queue | Yes | Yes | Yes | Yes | Yes |
| View case detail | Yes | Yes | Yes | Yes | Yes |
| Edit case detail | No | Yes | Yes | Yes | Yes |
| Delete and restore case detail | No | Own deleted cases | Own deleted cases | Yes | Yes |
| Add case note | No | Yes | Yes | Yes | Yes |
| Change case status | No | Yes | Yes | Yes | Yes |
| Mark case referred | No | No | Yes | Yes | Yes |
| Create case record | No | Yes | Yes | Yes | Yes |
| Escalate/de-escalate case with justification | No | Yes | Yes | Yes | Yes |
| Manage providers | No | No | Yes | Yes | Yes |
| Manage procedure codes | No | No | No | Yes | Yes |
| Edit risk rules | No | No | No | No | Yes |
| Export reports | No | Yes | Yes | Yes | Yes |
| View admin/security page | No | No | No | No | Yes |
| Manage demo permissions | No | No | No | No | Yes |
| View audit events | No | No | No | No | Yes |

## Authorization Policies

Required policies:

- `CanViewDashboard`
- `CanViewRiskQueue`
- `CanViewCaseDetail`
- `CanEditCase`
- `CanDeleteCase`
- `CanAddCaseNote`
- `CanChangeCaseStatus`
- `CanReferCase`
- `CanCreateCaseRecord`
- `CanEscalateCase`
- `CanManageProviders`
- `CanManageProcedureCodes`
- `CanEditRiskRules`
- `CanExportReports`
- `CanViewAdmin`
- `CanManageDemoPermissions`
- `CanViewAudit`

The API should enforce policies server-side. Frontend role-aware navigation is a usability layer only.

## Demo Permission Overrides and Audit

Administrators can assign effective permissions to fake demo users from `/admin/security`. The API stores permission overrides in `DemoUserPermissionOverrides` and records changes in `AuditEvents`.

Audit events are written for:

- Manual case record creation
- Case record updates and deletions
- Case escalation and de-escalation with justification
- Provider administration changes
- Procedure-code administration changes
- Demo permission updates

This is a security-awareness demo. It is not production identity governance, real user provisioning, or an immutable audit subsystem.

## Secrets

- Do not commit `.env`, `.env.local`, user secrets, API keys, or database backups.
- Commit `.env.example` only.
- Use environment variables or .NET user secrets for local secret values.
- Use an approved secret store for real deployments.

## SQL Injection Prevention

- Use EF Core LINQ for transactional operations.
- Use Dapper with parameters for reporting queries.
- Do not concatenate user-controlled input into SQL.
- Keep stored procedure filters parameterized.
- Validate and bound pagination values.

## Frontend Safety

- Rely on React output encoding.
- Avoid unsafe HTML injection.
- Keep role selector clearly labeled as demo-only.
- Ensure export controls are hidden or disabled for roles without export permission, but still enforce authorization on the API.

## CORS

Development CORS should be restricted to:

```text
http://localhost:3000
http://localhost:3001
```

Do not use permissive wildcard CORS in a production-like environment.

## Production Identity Out of Scope

The following are intentionally not implemented:

- Real VA SSO
- Login.gov
- PIV/CAC
- Entra ID tenant setup
- Real OAuth issuer
- Password login
- User provisioning

A real implementation would integrate with approved federal identity infrastructure and apply production security review.

## Synthetic Data Statement

This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.
