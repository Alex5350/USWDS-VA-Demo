# Specification Summary

## Project

VA OIG FWA Risk Triage & Reporting Portal.

## Purpose

Build a public, synthetic-data demo showing how an analyst-facing system can prioritize Community Care claims, providers, complaints, and case work for review using transparent business rules, SQL-backed reporting, ASP.NET Core, Next.js, Bun, USWDS, and mock authorization.

The system must not determine or imply confirmed fraud. It should use careful triage language such as:

- Potential risk
- Risk indicator
- Review candidate
- Analyst review recommended
- Estimated questioned cost

## Scope

Included:

- Risk-scored triage queue
- Dashboard metrics
- Case detail workflow
- Explainable risk rules
- SQL Server schema, seed data, views, and procedures
- SQL-backed reporting views and filtered report workspaces
- CSV export and print-to-PDF paths
- USWDS-based accessible frontend
- Mock authentication and policy-based authorization
- Windows and macOS local development through Docker Compose

Out of scope:

- Real VA integrations
- Real PHI, PII, claim, patient, veteran, provider, or government data
- Production identity
- Password login
- Machine learning
- Enforcement or accusation workflows

## Runtime Policy

- .NET SDK: `10.0.201` as pinned by `src/server/global.json`
- Bun: `1.3.10`
- SQL Server: 2022-compatible SQL
- Next.js and React: latest stable versions compatible with Bun
- USWDS: latest stable 3.x release

No preview, nightly, beta, alpha, canary, or release-candidate packages should be used without explicit documentation.

## Synthetic Data Disclaimer

This demo uses synthetic data only. It does not contain real veteran, patient, claim, provider, VA, PHI, PII, or government data. Risk indicators are for demonstration purposes only and do not represent confirmed fraud, waste, or abuse.
