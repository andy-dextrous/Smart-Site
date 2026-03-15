#!/bin/sh
set -eu

if [ ! -f /app/.next/standalone/server.js ]; then
  echo "Missing SmartSite build artifacts. Run: docker compose --env-file .smartsite-self-hosted/generated/production.env run --rm build"
  exit 1
fi

pnpm generate:sitemap
exec node .next/standalone/server.js
