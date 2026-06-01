$ErrorActionPreference = "Stop"

docker compose down -v
docker compose up -d sqlserver
docker compose ps
