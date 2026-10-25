#!/bin/sh
set -eu

if [ "${1:-}" = "--" ]; then
  shift
fi

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
env_argument="${1:-.smartsite-self-hosted/generated/production.env}"

case "$env_argument" in
  /*) env_path="$env_argument" ;;
  *) env_path="$project_dir/$env_argument" ;;
esac

if [ ! -f "$env_path" ]; then
  echo "Missing env file: $env_path"
  exit 1
fi

compose() {
  SMARTSITE_ENV_FILE="$env_path" docker compose --project-directory "$project_dir" --env-file "$env_path" "$@"
}

get_env_value() {
  key="$1"
  value="$(grep "^$key=" "$env_path" | head -n 1 | cut -d '=' -f 2- || true)"
  printf '%s' "$value"
}

public_url="$(get_env_value "NEXT_PUBLIC_URL")"

if [ -z "$public_url" ]; then
  echo "NEXT_PUBLIC_URL not found in $env_path"
  exit 1
fi

compose ps >/dev/null

probe_url() {
  url="$1"
  response_headers="$(curl -k -I -L --max-time 20 -sS "$url" || true)"
  status_code="$(printf '%s\n' "$response_headers" | awk '/^HTTP\// { code = $2 } END { print code }')"

  case "$status_code" in
    2*|3*) return 0 ;;
    *)
      echo "Probe failed for $url"
      printf '%s\n' "$response_headers"
      return 1
      ;;
  esac
}

probe_url "$public_url"
probe_url "${public_url%/}/admin"

echo "Probe OK: $public_url"
