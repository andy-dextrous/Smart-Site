#!/bin/sh
set -eu

sync_prebuilt_release() {
  if [ ! -f /app/.smartsite-release/.next/standalone/server.js ]; then
    return
  fi

  release_id=""
  current_id=""

  if [ -f /app/.smartsite-release/deployment-id ]; then
    release_id="$(cat /app/.smartsite-release/deployment-id)"
  fi

  if [ -f /app/.next/.smartsite-deployment-id ]; then
    current_id="$(cat /app/.next/.smartsite-deployment-id)"
  fi

  if [ -f /app/.next/standalone/server.js ] && [ "$release_id" = "$current_id" ]; then
    return
  fi

  mkdir -p /app/.next
  find /app/.next -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -R /app/.smartsite-release/.next/. /app/.next/

  if [ -d /app/.smartsite-release/public ]; then
    mkdir -p /app/public
    cp -R /app/.smartsite-release/public/. /app/public/
  fi

  if [ -n "$release_id" ]; then
    printf '%s\n' "$release_id" > /app/.next/.smartsite-deployment-id
  fi
}

sync_prebuilt_release

if [ ! -f /app/.next/standalone/server.js ]; then
  echo "Missing SmartSite build artifacts. Run: docker compose --env-file .smartsite-self-hosted/generated/production.env run --rm build"
  echo "Or promote a prebuilt release image that contains /app/.smartsite-release."
  exit 1
fi

exec node .next/standalone/server.js
