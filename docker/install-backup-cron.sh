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

get_env_value() {
  key="$1"
  value="$(grep "^$key=" "$env_path" | head -n 1 | cut -d '=' -f 2- || true)"
  printf '%s' "$value"
}

env_name="$(basename "$env_path" | tr '.' '-')"
schedule="${SMARTSITE_BACKUP_CRON_SCHEDULE:-$(get_env_value "SMARTSITE_BACKUP_CRON_SCHEDULE")}"
log_root="$project_dir/.smartsite-self-hosted/logs"
log_file="$log_root/${env_name}-backup-cron.log"
cron_tag="# smartsite-self-hosted-backup:$env_name"

if [ -z "$schedule" ]; then
  schedule="30 2 * * *"
fi

mkdir -p "$log_root"

if ! command -v crontab >/dev/null 2>&1; then
  echo "crontab is not available on this machine"
  exit 1
fi

cron_command="$schedule cd '$project_dir' && ./docker/backup-self-hosted.sh '$env_path' >> '$log_file' 2>&1 $cron_tag"
current_crontab="$(crontab -l 2>/dev/null || true)"
filtered_crontab="$(printf '%s\n' "$current_crontab" | grep -v "$cron_tag" || true)"

{
  printf '%s\n' "$filtered_crontab"
  printf '%s\n' "$cron_command"
} | crontab -

echo "Installed backup cron: $schedule"
