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

echo "SmartSite Profile: $(get_env_value "SMARTSITE_DEPLOYMENT_PROFILE")"
echo "Runtime Environment: $(get_env_value "SMARTSITE_RUNTIME_ENV")"
echo "Stack Name: $(get_env_value "SMARTSITE_STACK_NAME")"
echo "Public URL: $(get_env_value "NEXT_PUBLIC_URL")"
echo "Deployment ID: $(get_env_value "NEXT_DEPLOYMENT_ID")"
echo "Backup Directory: $(get_env_value "SMARTSITE_BACKUP_DIR")"
echo "Env File: $env_path"
echo

compose ps

stack_name="$(get_env_value "SMARTSITE_STACK_NAME")"
if [ -z "$stack_name" ]; then
  stack_name="smartsite-self-hosted"
fi

mongo_volume="${stack_name}_mongo-data"
if docker volume inspect "$mongo_volume" >/dev/null 2>&1; then
  mongo_mountpoint="$(docker volume inspect "$mongo_volume" --format '{{ .Mountpoint }}')"
  if [ -n "$mongo_mountpoint" ] && [ -d "$mongo_mountpoint" ]; then
    echo
    echo "Mongo Volume Usage:"
    du -sh "$mongo_mountpoint"
  fi
fi

backup_root="$(get_env_value "SMARTSITE_BACKUP_DIR")"
case "$backup_root" in
  /*) ;;
  *) backup_root="$project_dir/$backup_root" ;;
esac

runtime_env="$(get_env_value "SMARTSITE_RUNTIME_ENV")"
release_dir="$project_dir/.smartsite-self-hosted/releases/$runtime_env"
current_release_file="$release_dir/current"
release_history_file="$release_dir/history.log"

if [ -n "$backup_root" ] && [ -d "$backup_root" ]; then
  echo
  echo "Recent Backups:"
  find "$backup_root" -maxdepth 1 -type f -name '*.archive.gz' | sort -r | sed -n '1,5p'
fi

if [ -f "$current_release_file" ]; then
  echo
  echo "Current Release:"
  cat "$current_release_file"
fi

if [ -f "$release_history_file" ]; then
  echo
  echo "Recent Release History:"
  tail -n 5 "$release_history_file"
fi
