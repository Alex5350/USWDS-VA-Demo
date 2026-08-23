# Data Dictionary

All data is synthetic and created for demonstration only.

## VeteranProfiles

Synthetic anonymized veteran profile.

| Column | Type | Notes |
| --- | --- | --- |
| VeteranId | int | Primary key |
| AnonymizedIdentifier | nvarchar(50) | Example: `VET-DEMO-00001` |
| DateOfBirth | date null | Synthetic date |
| DateOfDeath | date null | Synthetic date for service-after-date triage pattern |
| State | nvarchar(2) | Synthetic state |
| VISN | nvarchar(20) | Synthetic VISN value |
| CreatedAt | datetime2 | UTC creation timestamp |

## Providers

Synthetic Community Care provider.

| Column | Type | Notes |
| --- | --- | --- |
| ProviderId | int | Primary key |
| ProviderName | nvarchar(200) | Fake provider name |
| NPI | nvarchar(20) | Synthetic NPI-like value |
| ProviderType | nvarchar(100) | Dental, imaging, home health, and other demo types |
| State | nvarchar(2) | Synthetic state |
| RiskTier | nvarchar(20) | Standard, Medium, Elevated, or High demo tier |
| IsEnabled | bit | Disabled providers remain historical but cannot be selected for new manual intake |
| UpdatedAt | datetime2 null | Last provider administration update timestamp |
| UpdatedBy | nvarchar(200) null | Demo user that last updated the provider |
| CreatedAt | datetime2 | UTC creation timestamp |

## StateTerritories

Reference table for U.S. states, District of Columbia, and U.S. territories.

| Column | Type | Notes |
| --- | --- | --- |
| Code | nvarchar(2) | Primary key, for example `VA`, `DC`, or `PR` |
| Name | nvarchar(100) | Display name |
| Type | nvarchar(50) | State, District, Territory, or Outlying Area |
| IsEnabled | bit | Enabled values are available for intake |

## ProcedureCodes

Synthetic procedure-code reference data used by manual triage intake.

| Column | Type | Notes |
| --- | --- | --- |
| ProcedureCodeId | int | Primary key |
| Code | nvarchar(20) | Synthetic procedure code, for example `D2740` |
| Description | nvarchar(300) | Human-readable meaning shown in dropdowns |
| Category | nvarchar(100) | Dental, imaging, home health, and other demo categories |
| DefaultAmount | decimal(18,2) null | Optional default paid amount for intake |
| IsEnabled | bit | Disabled codes remain historical but cannot be selected for new manual intake |
| CreatedAt | datetime2 | UTC creation timestamp |
| UpdatedAt | datetime2 null | Last procedure-code administration update timestamp |
| UpdatedBy | nvarchar(200) null | Demo user that last updated the procedure code |

## Authorizations

Synthetic Community Care authorization.

| Column | Type | Notes |
| --- | --- | --- |
| AuthorizationId | int | Primary key |
| VeteranId | int | FK to VeteranProfiles |
| ProviderId | int | FK to Providers |
| ProcedureCode | nvarchar(20) | Synthetic procedure code |
| StartDate | date | Authorization start |
| EndDate | date | Authorization end |
| AuthorizedAmount | decimal(18,2) | Authorized amount |
| Status | nvarchar(50) | Active or expired demo status |
| CreatedAt | datetime2 | UTC creation timestamp |

## Claims

Synthetic claim record.

| Column | Type | Notes |
| --- | --- | --- |
| ClaimId | int | Primary key |
| VeteranId | int | FK to VeteranProfiles |
| ProviderId | int | FK to Providers |
| AuthorizationId | int null | FK to Authorizations |
| ProcedureCode | nvarchar(20) | Synthetic procedure code |
| ServiceDate | date | Synthetic service date |
| SubmittedDate | date | Synthetic submitted date |
| PaidDate | date null | Null for non-paid statuses |
| ClaimAmount | decimal(18,2) | Submitted amount |
| PaidAmount | decimal(18,2) | Paid amount |
| ClaimStatus | nvarchar(50) | Paid, submitted, or denied demo status |
| CreatedAt | datetime2 | UTC creation timestamp |

## HotlineComplaints

Synthetic hotline complaint summary.

| Column | Type | Notes |
| --- | --- | --- |
| ComplaintId | int | Primary key |
| ReceivedDate | date | Synthetic received date |
| ComplaintType | nvarchar(100) | Demo category |
| ProviderId | int null | Optional FK to Providers |
| VeteranId | int null | Optional FK to VeteranProfiles |
| NarrativeSummary | nvarchar(max) | Synthetic summary only |
| Status | nvarchar(50) | Open or closed |
| CreatedAt | datetime2 | UTC creation timestamp |

## RiskRules

Explainable scoring rule.

| Column | Type | Notes |
| --- | --- | --- |
| RiskRuleId | int | Primary key |
| RuleCode | nvarchar(50) | Stable code |
| RuleName | nvarchar(200) | Human-readable name |
| Description | nvarchar(1000) | Rule explanation |
| Weight | int | Score contribution |
| IsEnabled | bit | Disabled rules should not contribute |
| CreatedAt | datetime2 | UTC creation timestamp |

Initial rules include duplicate claim candidate, missing authorization, expired authorization, high-dollar outlier, hotline match, service after synthetic death date, provider repeat pattern, prior case history, and rapid resubmission.

## RiskFindings

Rule contribution applied to a claim.

| Column | Type | Notes |
| --- | --- | --- |
| RiskFindingId | int | Primary key |
| ClaimId | int | FK to Claims |
| RiskRuleId | int | FK to RiskRules |
| ScoreContribution | int | Applied score contribution |
| Explanation | nvarchar(1000) | Human-readable reason |
| CreatedAt | datetime2 | UTC creation timestamp |

## CaseFiles

Analyst review case.

| Column | Type | Notes |
| --- | --- | --- |
| CaseId | int | Primary key |
| ClaimId | int | FK to Claims |
| AssignedTo | nvarchar(100) null | Demo assignee |
| Status | nvarchar(50) | New, UnderReview, Escalated, Referred, Closed |
| Priority | nvarchar(50) | Demo priority |
| RiskScore | int | 0 to 100 |
| RiskLevel | nvarchar(50) | Low, Medium, High, Critical |
| EstimatedQuestionedCost | decimal(18,2) | Estimate for review prioritization |
| CreatedDate | datetime2 | Case created timestamp |
| ClosedDate | datetime2 null | Closed timestamp |

## CaseNotes

Analyst note.

| Column | Type | Notes |
| --- | --- | --- |
| NoteId | int | Primary key |
| CaseId | int | FK to CaseFiles |
| CreatedBy | nvarchar(100) | Demo user display name |
| CreatedDate | datetime2 | Note timestamp |
| NoteText | nvarchar(max) | Synthetic note text |

## ChatSessions

Synthetic AI assistant conversation owned by one demo user.

| Column | Type | Notes |
| --- | --- | --- |
| ChatSessionId | int | Primary key |
| PublicId | uniqueidentifier | Public chat GUID used by `/chat/{guid}` and API routes |
| UserEmail | nvarchar(200) | Demo user that owns the session |
| Title | nvarchar(200) null | Optional display title, usually derived from the first message |
| CreatedAt | datetime2 | UTC creation timestamp |
| LastMessageAt | datetime2 null | Last persisted message timestamp |
| IsDeleted | bit | Soft-delete flag for hiding a session from chat history |

## ChatMessages

Persisted chat message for a synthetic assistant session.

| Column | Type | Notes |
| --- | --- | --- |
| ChatMessageId | int | Primary key |
| ChatSessionId | int | FK to ChatSessions |
| Role | nvarchar(20) | AI SDK role such as user or assistant |
| Content | nvarchar(max) | Message text persisted from AI SDK UI message parts |
| ClientMessageId | nvarchar(200) null | Idempotency key from the client; unique within a ChatSession |
| Model | nvarchar(100) null | Provider model recorded for assistant messages |
| PromptTokens | int null | Prompt/input token count when provided by the provider |
| CompletionTokens | int null | Completion/output token count when provided by the provider |
| FinishReason | nvarchar(50) null | AI SDK finish reason when available |
| CreatedAt | datetime2 | UTC message timestamp |

## ChatToolCalls

Audit record for an allowlisted read-only assistant tool call.

| Column | Type | Notes |
| --- | --- | --- |
| ChatToolCallId | int | Primary key |
| ChatSessionId | int | FK to ChatSessions |
| ChatMessageId | int null | Optional FK to ChatMessages in the same session |
| ToolName | nvarchar(100) | Tool identifier, for example getCaseCounts or searchRiskQueue |
| AllowedSurface | nvarchar(100) | Bounded data surface such as CaseFiles, RiskQueue, or Reports |
| ArgumentsJson | nvarchar(max) | Serialized tool arguments |
| ResultSummary | nvarchar(2000) null | Compact result summary for audit and UI display |
| RowCount | int null | Number of rows returned when applicable |
| DurationMs | int null | Tool execution duration in milliseconds |
| Succeeded | bit | Whether the read-only tool call succeeded |
| ErrorMessage | nvarchar(1000) null | Sanitized error message for failed tool calls |
| CreatedAt | datetime2 | UTC tool-call timestamp |

## ChatContextItems

Pinned auditable context item for a synthetic assistant session.

| Column | Type | Notes |
| --- | --- | --- |
| ChatContextItemId | int | Primary key |
| ChatSessionId | int | FK to ChatSessions |
| ChatMessageId | int null | Optional FK to ChatMessages in the same session |
| ContextType | nvarchar(50) | Context category, such as pinned case context |
| EntityType | nvarchar(50) | Source entity type, such as CaseFile or Provider |
| EntityId | nvarchar(100) null | Source entity identifier when available |
| Label | nvarchar(200) null | Short UI label for the context item |
| SnapshotJson | nvarchar(max) null | Serialized synthetic data snapshot retained for auditability |
| CreatedAt | datetime2 | UTC context-item timestamp |

## DemoUserPermissionOverrides

Synthetic admin-managed permission overrides for fake demo users.

| Column | Type | Notes |
| --- | --- | --- |
| DemoUserPermissionOverrideId | int | Primary key |
| Email | nvarchar(200) | Demo user email |
| Permission | nvarchar(100) | Policy name |
| IsGranted | bit | Grants or removes permission relative to role baseline |
| UpdatedBy | nvarchar(200) | Demo administrator email |
| UpdatedAt | datetime2 | Update timestamp |

## AuditEvents

Synthetic audit trail for demo administration and manual triage workflows.

| Column | Type | Notes |
| --- | --- | --- |
| AuditEventId | int | Primary key |
| ActorEmail | nvarchar(200) | Demo actor email |
| Action | nvarchar(100) | Event type |
| TargetType | nvarchar(100) | CaseFile, DemoUser, or other demo target |
| TargetId | nvarchar(100) | Target identifier |
| Summary | nvarchar(1000) | Human-readable audit summary |
| CreatedAt | datetime2 | Event timestamp |
