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
  "status": "UnderReview",
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

Routine status changes through this edit endpoint require `CanChangeCaseStatus`. Setting `Referred` also requires
`CanReferCase`. Escalation and de-escalation are rejected here because they must use the dedicated workflow endpoints
below so a justification is saved with the record.

`POST /api/cases/{caseId}/delete` deletes the synthetic case from the active queue and records an audit event. The implementation uses soft deletion, so it does not physically remove the linked synthetic claim, findings, or notes.

```json
{
  "reason": "Duplicate manual intake entered during demonstration."
}
```

`DELETE /api/cases/{caseId}` is kept as a compatibility alias for soft deletion. `GET /api/cases/deleted` lists deleted case records available to the current demo user: Analysts and Investigators see their own deleted records, while Supervisors and Administrators see the broader deleted-record queue. `PUT /api/cases/{caseId}/restore` restores an allowed deleted case to the active queue.

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

Marking a case `Referred` requires `CanReferCase`.
Escalation and de-escalation must use the dedicated workflow endpoints below so a justification is persisted with the case.

## Escalate Case

```http
PUT /api/cases/{caseId}/escalate
```

Policy: `CanEscalateCase`

Request:

```json
{
  "justification": "Risk indicators require supervisory review before referral decision."
}
```

Updates the case status to `Escalated`, raises priority to `Critical`, adds the justification to case notes, and records an audit event.

## De-escalate Case

```http
PUT /api/cases/{caseId}/de-escalate
```

Policy: `CanEscalateCase`

Request:

```json
{
  "justification": "Additional review resolved the escalation concern; continue standard analyst review."
}
```

Moves an escalated case back to `UnderReview`, adds the justification to case notes, and records an audit event.

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
GET /api/reports/summary
GET /api/reports/provider-risk
GET /api/reports/questioned-cost-trend
GET /api/reports/case-aging
GET /api/reports/export/risk-queue.csv
GET /api/reports/export/provider-risk.csv
GET /api/reports/export/questioned-cost-trend.csv
GET /api/reports/export/case-aging.csv
```

Supported query parameters:

- `fromDate`
- `toDate`
- `status`
- `providerId`
- `providerType`
- `state`
- `search`

Policies:

- Report views: authorized demo users
- Exports: `CanExportReports`

## AI Chat Assistant

Next.js streaming route, served by the frontend app:

```http
POST /api/chat/{chatId}
```

Accepts AI SDK UI messages, validates them, persists the latest user message through the .NET API, streams a Google Gemini response, and persists the assistant message on finish. The Next server process requires `GOOGLE_GENERATIVE_AI_API_KEY`. The body may include `demoUserEmail` and `allowWebSearch`; v1 does not provide a real web-search tool.

.NET chat persistence endpoints:

```http
POST /api/chat/sessions
GET /api/chat/sessions
GET /api/chat/sessions/{chatId}
PATCH /api/chat/sessions/{chatId}
POST /api/chat/sessions/{chatId}/messages
POST /api/chat/sessions/{chatId}/tool-calls
POST /api/chat/sessions/{chatId}/context
DELETE /api/chat/sessions/{chatId}/context/{contextItemId}
```

Policy: `CanViewRiskQueue`

`POST /api/chat/sessions` creates a session and accepts an optional `firstMessage`. `GET /api/chat/sessions` lists the current demo user's non-deleted sessions. `GET /api/chat/sessions/{chatId}` returns session metadata, messages, recent tool calls, and pinned context. `PATCH /api/chat/sessions/{chatId}` renames a session with `title` or soft-deletes it with `isDeleted: true`.

Messages persist role, content, optional model metadata, token counts, finish reason, and `clientMessageId`. `clientMessageId` is an idempotency key within a chat session. Tool-call records capture the allowlisted surface, arguments, result summary, row count, duration, and sanitized errors. Context records pin auditable case context for the session.

Read-only tool endpoints used by the assistant:

```http
POST /api/chat/tools/case-counts
POST /api/chat/tools/risk-queue-search
GET /api/chat/tools/cases/{caseId}/summary
POST /api/chat/tools/provider-risk
POST /api/chat/tools/case-aging
```

Policies:

- Case counts and risk queue search: `CanViewRiskQueue`
- Case summary: `CanViewCaseDetail`
- Provider risk and case aging: `CanViewDashboard`

Tool surfaces are bounded and read-only:

- `case-counts`: grouped counts from active synthetic case records by status, risk level, priority, provider type, or assignee.
- `risk-queue-search`: paginated synthetic risk queue search with filters and risk-score sorting.
- `cases/{caseId}/summary`: compact summary for one active synthetic case record.
- `provider-risk`: provider-level claim volume, high/critical risk counts, and estimated questioned cost.
- `case-aging`: case aging buckets grouped by status.

The assistant tools do not create notes, change statuses, delete cases, update providers, export data, run arbitrary SQL, or determine fraud.

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
