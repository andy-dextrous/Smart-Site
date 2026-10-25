#!/bin/sh
set -eu

if [ "${1:-}" = "--" ]; then
  shift
fi

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
env_argument="${1:-.smartsite-self-hosted/generated/production.env}"
archive_argument="${2:-}"
release_image="${3:-}"
deployment_id="${4:-deploy-$(date -u +%Y%m%d%H%M%S)}"

case "$env_argument" in
  /*) env_path="$env_argument" ;;
  *) env_path="$project_dir/$env_argument" ;;
esac

if [ ! -f "$env_path" ]; then
  echo "Missing env file: $env_path"
  exit 1
fi

if [ -z "$archive_argument" ]; then
  echo "Usage: ./docker/deploy-prebuilt-self-hosted.sh <env-path> <image-archive.tar.gz> [release-image] [deployment-id]"
  exit 1
fi

case "$archive_argument" in
  /*) archive_path="$archive_argument" ;;
  *) archive_path="$project_dir/$archive_argument" ;;
esac

if [ ! -f "$archive_path" ]; then
  echo "Missing image archive: $archive_path"
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

load_output=""

if printf '%s' "$archive_path" | grep -Eq '\.gz$'; then
  load_output="$(gzip -dc "$archive_path" | docker load)"
else
  load_output="$(docker load -i "$archive_path")"
fi

printf '%s\n' "$load_output"

if [ -z "$release_image" ]; then
  release_image="$(printf '%s\n' "$load_output" | sed -n 's/^Loaded image: //p' | tail -n 1)"
fi

if [ -z "$release_image" ]; then
  echo "Unable to determine release image from docker load output"
  exit 1
fi

if ! docker image inspect "$release_image" >/dev/null 2>&1; then
  echo "Loaded image not found: $release_image"
  exit 1
fi

runtime_env="$(get_env_value "SMARTSITE_RUNTIME_ENV")"
image_name="$(get_env_value "SMARTSITE_IMAGE_NAME")"
release_dir="$project_dir/.smartsite-self-hosted/releases/$runtime_env"
history_file="$release_dir/history.log"
current_file="$release_dir/current"

mkdir -p "$release_dir"

docker tag "$release_image" "$image_name"
set_env_value "NEXT_DEPLOYMENT_ID" "$deployment_id"

echo "Deploying prebuilt SmartSite release with NEXT_DEPLOYMENT_ID=$deployment_id"
echo "Release image: $release_image"

compose up -d mongo
compose up -d --force-recreate app proxy

history_line="$(printf '%s|%s|%s|mode=prebuilt|transport=tarball\n' "$(date -u +%Y%m%d-%H%M%S)" "$deployment_id" "$release_image")"
printf '%s' "$history_line" >> "$history_file"
printf '%s' "$history_line" > "$current_file"

compose ps
