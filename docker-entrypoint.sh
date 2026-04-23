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

echo "[entrypoint] running: prisma db push …"
npx prisma db push --accept-data-loss --skip-generate

echo "[entrypoint] running: seed …"
node prisma/seed.js

echo "[entrypoint] starting Next.js …"
exec npm run start
