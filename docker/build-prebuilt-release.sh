#!/bin/sh
set -eu

if [ "${1:-}" = "--" ]; then
  shift
fi

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
source_argument="${1:-.env.local}"
image_ref="${2:-smartsite-prebuilt:dev}"
archive_argument="${3:-}"
public_url="${4:-http://localhost:3000}"
deployment_id="${5:-deploy-$(date -u +%Y%m%d%H%M%S)}"

case "$source_argument" in
  /*) source_path="$source_argument" ;;
  *) source_path="$project_dir/$source_argument" ;;
esac

if [ ! -f "$source_path" ]; then
  echo "Missing source env file: $source_path"
  exit 1
fi

archive_path=""

if [ -n "$archive_argument" ]; then
  case "$archive_argument" in
    /*) archive_path="$archive_argument" ;;
    *) archive_path="$project_dir/$archive_argument" ;;
  esac
fi

temp_env="$(mktemp)"
trap 'rm -f "$temp_env"' EXIT HUP INT TERM

# Normalize dotenv input (or the generated stage-one shell file) and apply all
# release overrides through the same literal serializer before Docker sources it.
node "$project_dir/scripts/create-self-hosted-build-env.mjs" \
  --source "$source_path" \
  --output "$temp_env" \
  --public-url "$public_url" \
  --deployment-id "$deployment_id"

# BuildKit secret contents do not invalidate a cached build. Rebuild the builder
# stage so public URL/deployment settings always match this release environment.
echo "Building prebuilt SmartSite release image: $image_ref"
echo "Source env: $source_path"

if [ "${SMARTSITE_BUILD_USE_HOST_GATEWAY:-}" = "1" ]; then
  DOCKER_BUILDKIT=1 docker build \
    --no-cache-filter builder \
    --add-host=host.docker.internal:host-gateway \
    --file "$project_dir/Dockerfile.prebuilt" \
    --secret id=smartsite_env,src="$temp_env" \
    --tag "$image_ref" \
    "$project_dir"
else
  DOCKER_BUILDKIT=1 docker build \
    --no-cache-filter builder \
    --file "$project_dir/Dockerfile.prebuilt" \
    --secret id=smartsite_env,src="$temp_env" \
    --tag "$image_ref" \
    "$project_dir"
fi

if [ -n "$archive_path" ]; then
  mkdir -p "$(dirname "$archive_path")"
  docker save "$image_ref" | gzip -1 > "$archive_path"
  echo "Wrote $archive_path"
fi
