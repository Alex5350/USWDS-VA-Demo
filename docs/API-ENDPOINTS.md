# API Endpoints

Base local URL:

```text
http://localhost:5000
```

Demo authentication header:

```http
X-Demo-User: demo.analyst@local
```

If the header is absent, the API should default to `demo.readonly@local`.

## Dashboard

```http
GET /api/dashboard/summary
```

Policy: `CanViewDashboard`

Returns executive metrics:

- Total claims reviewed
- High-risk claims
- Critical-risk claims
- Estimated questioned cost
- Duplicate-payment candidates
- Providers with abnormal patterns
- Open cases
- Average case age

## Risk Queue

```http
GET /api/risk-queue?riskLevel=High&status=New&fromDate=2026-01-01&toDate=2026-05-31&page=1&pageSize=25
```

Policy: `CanViewRiskQueue`

Returns paginated review candidates with case ID, claim ID, provider, procedure code, service date, paid amount, risk score, risk level, risk flags, estimated questioned cost, and case status.

## Create Case Record

```http
POST /api/cases
```

Policy: `CanCreateCaseRecord`

Creates a manual synthetic case record. The API creates a synthetic claim, case file, selected risk findings, and optional analyst note. This is triage intake only and does not represent confirmed fraud, waste, or abuse.

Request:

```json
{
  "providerId": 2,
  "stateCode": "VA",
  "procedureCodeId": 1,
  "serviceDate": "2026-05-31",
  "paidAmount": 1275.50,
  "riskRuleIds": [2, 4, 5],
  "narrativeSummary": "Synthetic manual case record created from analyst intake.",
  "assignedTo": "Demo Analyst"
}
```

The frontend resolves `providerId`, `stateCode`, and `procedureCodeId` through searchable reference-data controls so long provider names and procedure descriptions do not distort the intake layout.

`POST /api/risk-records` remains available as a backwards-compatible legacy alias for the first demo build, but new code should use `POST /api/cases`.

## Reference Data

```http
GET /api/reference/states
GET /api/providers?search=dental&activeOnly=true
POST /api/providers
PUT /api/providers/{providerId}
GET /api/procedure-codes?search=D2740&activeOnly=true
POST /api/procedure-codes
PUT /api/procedure-codes/{procedureCodeId}
```

Policies:

- State, provider, and procedure-code lookups: `CanViewRiskQueue`
- Provider administration: `CanManageProviders`
- Procedure-code administration: `CanManageProcedureCodes`

Provider administration is available to Investigator, Supervisor, and Administrator. Procedure-code administration is available to Supervisor and Administrator.

## Case Detail

```http
GET /api/cases/{caseId}
PUT /api/cases/{caseId}
DELETE /api/cases/{caseId}
POST /api/cases/{caseId}/delete
GET /api/cases/deleted
PUT /api/cases/{caseId}/restore
```

Policies:

- `GET`: `CanViewCaseDetail`
- `PUT`: `CanEditCase`
- `DELETE`, `POST /delete`, `GET /deleted`, `PUT /restore`: `CanDeleteCase`

Returns claim, provider, authorization, risk findings, related hotline complaints, notes, and workflow history.

`PUT /api/cases/{caseId}` updates editable case and claim fields. Provider and procedure-code reference data are managed through their administration endpoints.

```json
{
  "assignedTo": "Demo Investigator",
  "priority": "Critical",
  "estimatedQuestionedCost": 1384.00,
  "procedureCode": "73721",
  "serviceDate": "2026-04-15",
  "submittedDate": "2026-04-21",
  "paidDate": "2026-04-28",
  "claimAmount": 1384.00,
  "paidAmount": 1384.00,
  "claimStatus": "Paid"
}
```

`POST /api/cases/{caseId}/delete` soft-deletes the synthetic case into the recycle bin and records an audit event. It does not physically remove the linked synthetic claim, findings, or notes.

```json
{
  "reason": "Duplicate manual intake entered during demonstration."
}
```

`DELETE /api/cases/{caseId}` is kept as a compatibility alias for soft deletion. `GET /api/cases/deleted` lists soft-deleted case records. `PUT /api/cases/{caseId}/restore` restores a soft-deleted case to the active queue.

## Add Case Note

```http
POST /api/cases/{caseId}/notes
```

Policy: `CanAddCaseNote`

Request:

```json
{
  "noteText": "Reviewed authorization history. Claim requires additional validation.",
  "createdBy": "Demo Analyst"
}
```

## Update Case Status

```http
PUT /api/cases/{caseId}/status
```

Policy: `CanChangeCaseStatus`

Request:

```json
{
  "status": "UnderReview"
}
```

Marking a case `Referred` should require `CanReferCase`.
Marking a case `Escalated` should require `CanEscalateCase`.

## Escalate Case

```http
PUT /api/cases/{caseId}/escalate
```

Policy: `CanEscalateCase`

Updates the case status to `Escalated`, raises priority to `Critical`, and records an audit event.

## Risk Rules

```http
GET /api/rules
PUT /api/rules/{riskRuleId}
```

Policies:

- `GET`: authenticated demo users that can view risk rules
- `PUT`: `CanEditRiskRules`

Only Administrator should edit rule weights or enabled state.

## Reports

```http
GET /api/reports/provider-risk
GET /api/reports/questioned-cost-trend
GET /api/reports/case-aging
GET /api/reports/export/risk-queue.csv
```

Policies:

- Report views: authorized demo users
- Exports: `CanExportReports`

## Power BI

```http
GET /api/powerbi/embed-config
```

Demo response when embedding is not configured:

```json
{
  "enabled": false,
  "mode": "demo-placeholder",
  "message": "Power BI embedding is not configured. Displaying SQL-backed reporting dashboard instead."
}
```

## Security Context

```http
GET /api/security/me
```

Returns current demo user, roles, and effective permissions.

## Demo Permission Administration

```http
GET /api/security/users
PUT /api/security/users/{email}/permissions
GET /api/security/audit?limit=75
```

Policies:

- `GET /api/security/users`: `CanManageDemoPermissions`
- `PUT /api/security/users/{email}/permissions`: `CanManageDemoPermissions`
- `GET /api/security/audit`: `CanViewAudit`

Administrators can assign effective permissions to fake demo users. Overrides are synthetic demo state, not production user provisioning.

## Health

```http
GET /api/health
```

Returns service health status.
