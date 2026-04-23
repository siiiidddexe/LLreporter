#!/bin/sh
# LLReporter entrypoint — runs AFTER docker volume mounts.
# SQLite lives at /data/llreporter.db (top-level, outside the app tree).
set -e

echo "[entrypoint] ============================================"
echo "[entrypoint] DATABASE_URL = $DATABASE_URL"
echo "[entrypoint] NODE_ENV     = $NODE_ENV"
echo "[entrypoint] PORT         = ${PORT:-3000}"
echo "[entrypoint] ============================================"

# Ensure the data dir exists and is writable regardless of volume ownership.
mkdir -p /data /app/web/public/uploads
chmod 0777 /data /app/web/public/uploads

echo "[entrypoint] /data contents:"
ls -la /data || true

cd /app/web

# ---------------------------------------------------------------
# Schema-aware DB sync: only run `prisma db push` when the schema
# has actually changed (or when the DB file does not yet exist).
# This preserves user data across redeploys.
#
# We hash prisma/schema.prisma and store the hash next to the DB.
# `--accept-data-loss` is intentionally NOT used: if a destructive
# migration is ever required we want the deploy to fail loudly so
# we can review it instead of silently wiping bugs / projects.
# ---------------------------------------------------------------
SCHEMA_HASH=$(sha256sum prisma/schema.prisma | awk '{print $1}')
STORED_HASH_FILE="/data/.schema-hash"
PREV_HASH=""
if [ -f "$STORED_HASH_FILE" ]; then
  PREV_HASH=$(cat "$STORED_HASH_FILE" 2>/dev/null || echo "")
fi

if [ ! -f /data/llreporter.db ]; then
  echo "[entrypoint] no DB found — initial prisma db push"
  npx prisma db push --skip-generate
  echo "$SCHEMA_HASH" > "$STORED_HASH_FILE"
elif [ "$PREV_HASH" != "$SCHEMA_HASH" ]; then
  echo "[entrypoint] schema changed (hash $PREV_HASH -> $SCHEMA_HASH) — running prisma db push"
  npx prisma db push --skip-generate
  echo "$SCHEMA_HASH" > "$STORED_HASH_FILE"
else
  echo "[entrypoint] schema unchanged — preserving DB as-is (no push)"
fi

echo "[entrypoint] running: seed (idempotent upserts) …"
node prisma/seed.js

echo "[entrypoint] starting Next.js …"
exec npm run start
