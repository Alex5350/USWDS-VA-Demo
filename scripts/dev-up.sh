#!/usr/bin/env bash
set -euo pipefail

docker compose up -d sqlserver
docker compose ps
