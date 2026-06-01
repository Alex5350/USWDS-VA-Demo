# Open Source Notes

## Public Repository Posture

This repository is intended to be safe for public GitHub publishing as a synthetic-data demo and interview work sample.

Public-safe principles:

- Synthetic data only
- No secrets
- No real VA system integration
- No real veteran, patient, claim, provider, VA internal, PHI, PII, or sensitive government data
- No production identity claims
- No language implying confirmed fraud, waste, abuse, or misconduct

## License

The repository uses the MIT License for a simple demo-friendly open-source posture.

## Data

Seed data is generated from deterministic synthetic patterns. Fake provider names include examples such as:

- Demo Community Dental Group
- Sample Regional Imaging LLC
- Training Physical Therapy Partners
- Example Home Health Services
- Synthetic Mobility Supply Co

Fake anonymized identifiers use the pattern:

```text
VET-DEMO-00001
```

## Contribution Review

Review contributions for:

- Accidental real data
- Secrets
- Generated build artifacts
- Lockfiles that should not be committed
- Risk language that sounds accusatory
- Accessibility regressions
- Dynamic SQL or unsafe string concatenation
- Mock authentication being described as production-ready

## Files That Should Not Be Committed

- `.env`
- `.env.local`
- `node_modules`
- `.next`
- `out`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- Database backups
- Local IDE user settings
- Real screenshots containing sensitive data

## Interview Positioning

This demo is designed to support discussion of:

- ASP.NET Core Web API and C#
- SQL Server and SQL reporting
- EF Core for transactional data
- Dapper for report queries
- Bun and Next.js frontend development
- USWDS and Section 508 awareness
- Docker Compose cross-platform local development
- Mock policy-based authorization
- Explainable risk triage
- Public-demo data safety
