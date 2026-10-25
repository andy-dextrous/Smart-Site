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

cp "$source_path" "$temp_env"

python3 - "$temp_env" "$public_url" "$deployment_id" <<'PY'
import pathlib
import sys

env_path = pathlib.Path(sys.argv[1])
public_url = sys.argv[2]
deployment_id = sys.argv[3]

updates = {
    "NODE_ENV": "production",
    "SMARTSITE_DEPLOYMENT_PROFILE": "self-hosted-mongo",
    "NEXT_PUBLIC_URL": public_url,
    "NEXT_PUBLIC_SITE_URL": public_url,
    "NEXT_PUBLIC_PRODUCTION_URL": public_url,
    "NEXT_DEPLOYMENT_ID": deployment_id,
}

lines = env_path.read_text().splitlines()
seen = set()
output = []

for raw in lines:
    if "=" not in raw or raw.lstrip().startswith("#"):
      output.append(raw)
      continue

    key, _ = raw.split("=", 1)
    key = key.strip()

    if key in updates:
      output.append(f"{key}={updates[key]}")
      seen.add(key)
    else:
      output.append(raw)

for key, value in updates.items():
    if key not in seen:
      output.append(f"{key}={value}")

env_path.write_text("\n".join(output) + "\n")
PY

echo "Building prebuilt SmartSite release image: $image_ref"
echo "Source env: $source_path"
echo "Public URL: $public_url"
echo "Deployment ID: $deployment_id"

if [ "${SMARTSITE_BUILD_USE_HOST_GATEWAY:-}" = "1" ]; then
  DOCKER_BUILDKIT=1 docker build \
    --add-host=host.docker.internal:host-gateway \
    --file "$project_dir/Dockerfile.prebuilt" \
    --secret id=smartsite_env,src="$temp_env" \
    --tag "$image_ref" \
    "$project_dir"
else
  DOCKER_BUILDKIT=1 docker build \
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
