# SQL Server Docker Setup

This folder contains SQL Server initialization scripts for the VA OIG FWA Risk Triage demo.

## Local Container

Start SQL Server from the repository root:

```bash
docker compose up -d sqlserver
docker compose ps
```

The container exposes SQL Server on `localhost,1433` and uses the `sqlserver-data` Docker volume for persistent local data.

Default demo credentials are defined in `.env.example`:

```text
User Id=sa
Password=Your_strong_password123!
Database=VAOIG_FWA_Demo
```

Copy `.env.example` to `.env` for local work if you want Docker Compose to read the values automatically. Do not commit `.env`.

## Initialization Scripts

Run the scripts manually with `sqlcmd` after the container is healthy:

```bash
docker exec -it vaoig-fwa-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "Your_strong_password123!" \
  -C \
  -i /docker-entrypoint-initdb.d/001-create-database.sql
```

Repeat for:

```text
/docker-entrypoint-initdb.d/002-create-schema.sql
/docker-entrypoint-initdb.d/003-seed-demo-data.sql
```

The official SQL Server Linux container does not automatically execute files in `/docker-entrypoint-initdb.d` the way some other database images do. The folder is mounted so scripts are easy to run manually or from a future bootstrap script.

## Health Check

The Docker Compose health check uses:

```text
/opt/mssql-tools18/bin/sqlcmd
```

If a future SQL Server image changes the tools path, adjust the health check or treat container health as best-effort. Do not block application development on the health check if SQL Server is otherwise reachable.

## Apple Silicon Note

On Apple Silicon Macs, SQL Server Docker containers may run through x86_64 emulation. This setup is intended for local demo development only and should not be described as a production-supported SQL Server-on-ARM deployment.

## Data Safety

The seed scripts generate synthetic data only. They must not be replaced with real veteran, patient, claim, provider, VA internal, PHI, PII, or sensitive government data.
