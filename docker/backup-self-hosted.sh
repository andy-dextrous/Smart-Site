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

checksum_file() {
  target="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$target" > "${target}.sha256"
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$target" > "${target}.sha256"
  fi
}

write_metadata() {
  archive_path="$1"
  runtime_env="$2"
  database_name="$3"
  public_url="$4"
  deployment_id="$5"

  if ! command -v node >/dev/null 2>&1; then
    echo "Skipping backup metadata write because node is not installed on the host."
    return
  fi

  (
    cd "$project_dir"
    node ./scripts/write-archive-metadata.mjs \
      --archive "$archive_path" \
      --env-file "$env_path" \
      --runtime-env "$runtime_env" \
      --source-kind "self-hosted-backup" \
      --database-name "$database_name" \
      --public-url "$public_url" \
      --deployment-id "$deployment_id"
  )
}

prune_old_backups() {
  backup_root="$1"
  retention="$2"

  if [ ! -d "$backup_root" ]; then
    return
  fi

  archived_files="$(find "$backup_root" -maxdepth 1 -type f -name '*.archive.gz' | sort -r)"

  if [ -z "$archived_files" ]; then
    return
  fi

  index=0
  printf '%s\n' "$archived_files" | while IFS= read -r file; do
    index=$((index + 1))

    if [ "$index" -le "$retention" ]; then
      continue
    fi

    rm -f "$file" "${file}.sha256" "${file%.archive.gz}.meta.json"
  done
}

database_name="$(get_env_value "MONGO_INITDB_DATABASE")"
runtime_env="$(get_env_value "SMARTSITE_RUNTIME_ENV")"
backup_root="$(get_env_value "SMARTSITE_BACKUP_DIR")"
retention="$(get_env_value "SMARTSITE_BACKUP_RETENTION")"
post_command="$(get_env_value "SMARTSITE_BACKUP_POST_COMMAND")"
public_url="$(get_env_value "NEXT_PUBLIC_URL")"
deployment_id="$(get_env_value "NEXT_DEPLOYMENT_ID")"

if [ -z "$database_name" ]; then
  echo "MONGO_INITDB_DATABASE not found in $env_path"
  exit 1
fi

if [ -z "$runtime_env" ]; then
  runtime_env="production"
fi

if [ -z "$backup_root" ]; then
  backup_root=".smartsite-self-hosted/backups/$runtime_env"
fi

case "$backup_root" in
  /*) ;;
  *) backup_root="$project_dir/$backup_root" ;;
esac

if [ -z "$retention" ]; then
  retention="7"
fi

mkdir -p "$backup_root"

timestamp="$(date -u +%Y%m%d-%H%M%S)"
archive_path="$backup_root/${timestamp}-${runtime_env}-${database_name}.archive.gz"

compose exec -T mongo sh -lc '
  mongodump \
    --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@127.0.0.1:27017/$MONGO_INITDB_DATABASE?authSource=admin" \
    --archive \
    --gzip
' > "$archive_path"

checksum_file "$archive_path"
write_metadata "$archive_path" "$runtime_env" "$database_name" "$public_url" "$deployment_id"
prune_old_backups "$backup_root" "$retention"

if [ -n "$post_command" ]; then
  SMARTSITE_BACKUP_FILE="$archive_path" SMARTSITE_BACKUP_ENV="$runtime_env" sh -lc "$post_command"
fi

echo "Wrote $archive_path"
