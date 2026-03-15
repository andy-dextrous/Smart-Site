#!/bin/sh
set -eu

find /app/.next -mindepth 1 -maxdepth 1 -exec rm -rf {} +
pnpm build

mkdir -p /app/.next/standalone/.next
rm -rf /app/.next/standalone/.next/static
cp -R /app/.next/static /app/.next/standalone/.next/static

if [ -d /app/public ]; then
  rm -rf /app/.next/standalone/public
  cp -R /app/public /app/.next/standalone/public
fi
