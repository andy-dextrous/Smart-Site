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

SMARTSITE_PUBLIC_URL="$public_url" node <<'EOF'
const baseUrl = process.env.SMARTSITE_PUBLIC_URL

async function check(url) {
  const response = await fetch(url, { redirect: "manual" })

  if (response.status >= 200 && response.status < 400) {
    return
  }

  throw new Error(`${url} returned ${response.status}`)
}

async function main() {
  await check(baseUrl)
  await check(`${baseUrl.replace(/\/$/, "")}/admin`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
EOF

echo "Probe OK: $public_url"
