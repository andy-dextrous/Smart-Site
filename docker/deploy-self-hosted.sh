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

set_env_value() {
  key="$1"
  value="$2"
  temp_file="$(mktemp)"

  awk -v key="$key" -v value="$value" '
    BEGIN {
      found = 0
    }
    index($0, key "=") == 1 {
      print key "=" value
      found = 1
      next
    }
    {
      print
    }
    END {
      if (!found) {
        print key "=" value
      }
    }
  ' "$env_path" > "$temp_file"

  mv "$temp_file" "$env_path"
}

deployment_id="${SMARTSITE_DEPLOYMENT_ID_OVERRIDE:-deploy-$(date -u +%Y%m%d%H%M%S)}"
set_env_value "NEXT_DEPLOYMENT_ID" "$deployment_id"

echo "Deploying SmartSite with NEXT_DEPLOYMENT_ID=$deployment_id"

runtime_env="$(get_env_value "SMARTSITE_RUNTIME_ENV")"
image_name="$(get_env_value "SMARTSITE_IMAGE_NAME")"
release_dir="$project_dir/.smartsite-self-hosted/releases/$runtime_env"
history_file="$release_dir/history.log"
current_file="$release_dir/current"
release_tag="$image_name:release-$runtime_env-$deployment_id"

mkdir -p "$release_dir"

compose up -d mongo
compose build app build
compose run --rm build
compose up -d app proxy

docker tag "$image_name" "$release_tag"
printf '%s|%s|%s\n' "$(date -u +%Y%m%d-%H%M%S)" "$deployment_id" "$release_tag" >> "$history_file"
tail -n 1 "$history_file" > "$current_file"

compose ps
