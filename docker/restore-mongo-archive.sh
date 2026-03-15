#!/bin/sh
set -eu

if [ "${1:-}" = "--" ]; then
  shift
fi

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
yes_flag="0"
archive_path=".smartsite-self-hosted/backups/manual/smart-site-starter.archive.gz"
env_argument=".smartsite-self-hosted/generated/production.env"
force_flag="0"

for arg in "$@"; do
  case "$arg" in
    --yes)
      yes_flag="1"
      ;;
    --force)
      force_flag="1"
      ;;
    --env=*)
      env_argument="${arg#--env=}"
      ;;
    *)
      archive_path="$arg"
      ;;
  esac
done

case "$env_argument" in
  /*) env_path="$env_argument" ;;
  *) env_path="$project_dir/$env_argument" ;;
esac

case "$archive_path" in
  /*) ;;
  *) archive_path="$project_dir/$archive_path" ;;
esac

if [ ! -f "$env_path" ]; then
  echo "Missing env file: $env_path"
  exit 1
fi

if [ ! -f "$archive_path" ]; then
  echo "Missing archive: $archive_path"
  exit 1
fi

if [ "$yes_flag" != "1" ] && [ "${SELF_HOSTED_RESTORE_CONFIRM:-}" != "overwrite" ]; then
  echo "Refusing to restore without confirmation. Re-run with --yes or SELF_HOSTED_RESTORE_CONFIRM=overwrite"
  exit 1
fi

runtime_env="$(grep '^SMARTSITE_RUNTIME_ENV=' "$env_path" | head -n 1 | cut -d '=' -f 2- || true)"

if [ "$runtime_env" = "production" ]; then
  "$project_dir/docker/backup-self-hosted.sh" "$env_path"
fi

if [ "$force_flag" = "1" ]; then
  (
    cd "$project_dir"
    node ./scripts/check-restore-guard.mjs --archive "$archive_path" --env-file "$env_path" --force
  )
else
  (
    cd "$project_dir"
    node ./scripts/check-restore-guard.mjs --archive "$archive_path" --env-file "$env_path"
  )
fi

SMARTSITE_ENV_FILE="$env_path" docker compose --project-directory "$project_dir" --env-file "$env_path" exec -T mongo sh -lc '
  mongorestore \
    --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/$MONGO_INITDB_DATABASE?authSource=admin" \
    --archive \
    --gzip \
    --drop
' < "$archive_path"

echo "Restored $archive_path"
