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

get_env_value() {
  key="$1"
  value="$(grep "^$key=" "$env_path" | head -n 1 | cut -d '=' -f 2- || true)"
  printf '%s' "$value"
}

runtime_env="$(get_env_value "SMARTSITE_RUNTIME_ENV")"
release_dir="$project_dir/.smartsite-self-hosted/releases/$runtime_env"
history_file="$release_dir/history.log"
current_file="$release_dir/current"

echo "Release Environment: $runtime_env"
echo "Env File: $env_path"
echo

if [ -f "$current_file" ]; then
  echo "Current Release:"
  cat "$current_file"
  echo
fi

if [ ! -f "$history_file" ]; then
  echo "No release history recorded yet."
  exit 0
fi

echo "Recent Releases:"
    tail -n 10 "$history_file"
