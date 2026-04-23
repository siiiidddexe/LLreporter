#!/bin/sh
# LLReporter container entrypoint.
# Runs AFTER volume mounts, so it can prep dirs the volume just exposed.

set -e

DATA_DIR="/app/web/data"
UPLOAD_DIR="/app/web/public/uploads"

echo "[entrypoint] preparing data dirs…"
mkdir -p "$DATA_DIR" "$UPLOAD_DIR"
chmod -R 0777 "$DATA_DIR" "$UPLOAD_DIR" || true

echo "[entrypoint] DATABASE_URL=$DATABASE_URL"
echo "[entrypoint] data dir contents:"
ls -la "$DATA_DIR" || true

cd /app/web

echo "[entrypoint] syncing prisma schema → sqlite…"
npx prisma db push --accept-data-loss --skip-generate

echo "[entrypoint] seeding super-admin…"
node prisma/seed.js

echo "[entrypoint] starting Next.js on port ${PORT:-3000}…"
exec npm run start
