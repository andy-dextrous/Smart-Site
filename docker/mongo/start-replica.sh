#!/usr/bin/env bash
set -euo pipefail
: "${MONGO_REPLICA_KEY:?Generate and retain a private MONGO_REPLICA_KEY before starting Mongo}"
umask 077
key=/data/configdb/smartsite-key
if [ -f "$key" ]; then
  if [ "$(cat "$key")" != "$MONGO_REPLICA_KEY" ]; then
    echo 'Replica key mismatch: preserve the existing key and inspect environment configuration.' >&2
    exit 1
  fi
else
  printf '%s' "$MONGO_REPLICA_KEY" > "$key"
fi
chown mongodb:mongodb "$key"
chmod 400 "$key"
exec /usr/local/bin/docker-entrypoint.sh mongod --bind_ip_all --auth --replSet smartsite-rs --keyFile "$key"
