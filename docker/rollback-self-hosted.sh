#!/bin/sh
set -eu

if [ "${1:-}" = "--" ]; then
  shift
fi

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
env_argument="${1:-.smartsite-self-hosted/generated/production.env}"
target_deployment_id="${2:-}"

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

current_deployment_id="$(get_env_value "NEXT_DEPLOYMENT_ID")"
runtime_env="$(get_env_value "SMARTSITE_RUNTIME_ENV")"
image_name="$(get_env_value "SMARTSITE_IMAGE_NAME")"
release_dir="$project_dir/.smartsite-self-hosted/releases/$runtime_env"
history_file="$release_dir/history.log"
current_file="$release_dir/current"

if [ ! -f "$history_file" ]; then
  echo "No release history found for $runtime_env"
  exit 1
fi

if [ -n "$target_deployment_id" ]; then
  target_line="$(grep "|$target_deployment_id|" "$history_file" | tail -n 1 || true)"
else
  target_line="$(awk -F '|' -v current="$current_deployment_id" '$2 != current { line = $0 } END { print line }' "$history_file")"
fi

if [ -z "$target_line" ]; then
  echo "No rollback target found for $runtime_env"
  exit 1
fi

target_timestamp="$(printf '%s' "$target_line" | cut -d '|' -f 1)"
target_id="$(printf '%s' "$target_line" | cut -d '|' -f 2)"
target_image="$(printf '%s' "$target_line" | cut -d '|' -f 3)"
target_mode="$(printf '%s' "$target_line" | cut -d '|' -f 4)"

if ! docker image inspect "$target_image" >/dev/null 2>&1; then
  echo "Missing rollback image: $target_image"
  exit 1
fi

docker tag "$target_image" "$image_name"
set_env_value "NEXT_DEPLOYMENT_ID" "$target_id"

echo "Rolling back SmartSite to NEXT_DEPLOYMENT_ID=$target_id"

compose up -d mongo

if [ "$target_mode" = "mode=prebuilt" ]; then
  compose up -d --force-recreate app proxy
else
  compose run --rm build
  compose up -d --force-recreate app proxy
fi

mkdir -p "$release_dir"
printf '%s\n' "$target_line" > "$current_file"
printf '%s|%s|%s|%s|rollback-to:%s\n' "$(date -u +%Y%m%d-%H%M%S)" "$target_id" "$target_image" "${target_mode:-mode=local-build}" "$target_timestamp" >> "$history_file"

compose ps
