#!/bin/sh
set -eu

if [ "${1:-}" = "--" ]; then
  shift
fi

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
env_argument="${1:-.env}"
output_argument="${2:-.smartsite-self-hosted/backups/manual/smart-site-starter.archive.gz}"

case "$env_argument" in
  /*) env_path="$env_argument" ;;
  *) env_path="$project_dir/$env_argument" ;;
esac

case "$output_argument" in
  /*) output_path="$output_argument" ;;
  *) output_path="$project_dir/$output_argument" ;;
esac

if [ ! -f "$env_path" ]; then
  echo "Missing env file: $env_path"
  exit 1
fi

database_url="$(grep '^DATABASE_URL=' "$env_path" | head -n 1 | cut -d '=' -f 2-)"
public_url="$(grep '^NEXT_PUBLIC_URL=' "$env_path" | head -n 1 | cut -d '=' -f 2-)"
runtime_env="$(grep '^SMARTSITE_RUNTIME_ENV=' "$env_path" | head -n 1 | cut -d '=' -f 2-)"
deployment_id="$(grep '^NEXT_DEPLOYMENT_ID=' "$env_path" | head -n 1 | cut -d '=' -f 2-)"

if [ -z "$database_url" ]; then
  echo "DATABASE_URL not found in $env_path"
  exit 1
fi

database_name="$(printf '%s' "$database_url" | sed -n 's#^.*/\([^?]*\).*$#\1#p')"

mkdir -p "$(dirname "$output_path")"
mongodump --uri="$database_url" --archive="$output_path" --gzip
(
  cd "$project_dir"
  node ./scripts/write-archive-metadata.mjs \
    --archive "$output_path" \
    --env-file "$env_path" \
    --runtime-env "${runtime_env:-local}" \
    --source-kind "manual-dump" \
    --database-name "$database_name" \
    --public-url "$public_url" \
    --deployment-id "$deployment_id"
)
echo "Wrote $output_path"
