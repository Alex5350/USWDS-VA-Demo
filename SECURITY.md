# Security Policy

## Demo Security Scope

This repository is a public, synthetic-data demo. It does not implement production identity management and must not be used with real veteran, patient, claim, provider, VA internal, PHI, PII, or sensitive government data.

## Supported Versions

This demo tracks the current `main` branch only. Security fixes should target `main`.

## Reporting a Vulnerability

For an interview or evaluation setting, report vulnerabilities directly to the repository owner or evaluator. Do not open a public issue that includes exploit instructions, secrets, or sensitive details.

## Security Design Principles

- Mock authentication is for demonstration only.
- Authorization should be policy-based and server-enforced.
- Local secrets belong in environment variables, user secrets, or ignored local `.env` files.
- `.env.example` may contain placeholder values only.
- SQL access should use EF Core LINQ or parameterized Dapper queries.
- Dynamic SQL string concatenation should not be used for user-controlled values.
- React output encoding should be preserved by avoiding unsafe HTML injection.
- CORS should be restricted to the local frontend origin during development.
- Reports and exports should include only synthetic data.
- Manual case record creation, case editing, case soft deletion, recycle-bin restoration, escalation, provider administration, procedure-code administration, permission changes, and audit review are demo-only workflows.

## Demo Authentication Warning

The mock `X-Demo-User` header is intentionally easy to switch for interview demonstrations. It is not production authentication and is not appropriate for deployment to a real environment.

Administrators can assign synthetic permission overrides to fake demo users and view audit events. This is not production user provisioning, governance, or immutable audit logging.

Analysts, Investigators, Supervisors, and Administrators can create, edit, delete, and restore synthetic case records. Deletion is implemented as soft deletion so linked synthetic claims, findings, and notes are retained. Analysts and Investigators can restore their own deleted case records; Supervisors and Administrators can review and restore the broader deleted-record queue. Investigators, Supervisors, and Administrators can manage synthetic providers. Supervisors and Administrators can manage procedure-code reference data. These permissions are intended to demonstrate policy-based authorization only.

## Synthetic Data Statement

This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.
