# syntax=docker/dockerfile:1.6
# LLReporter — single image, embedded SQLite, zero setup.
# SQLite is stored at /data/llreporter.db (top-level volume, not inside /app).

# ─── build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY package.json ./
COPY web/package.json web/package.json
RUN npm install --prefix web --no-audit --no-fund

COPY . .

WORKDIR /app/web
# Use a temp path during build so prisma generate works without a real DB.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate && npm run build

# ─── runtime stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget sqlite

# Copy app from builder.
COPY --from=builder /app /app

# Copy and wire up entrypoint.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Pre-create dirs in the image layer (volumes will mount on top but dirs
# will still be available if no volume is attached, e.g. local dev).
RUN mkdir -p /data /app/web/public/uploads \
 && chmod 0777 /data /app/web/public/uploads

# ── env defaults (all overridable at runtime) ─────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000
# SQLite at /data — a clean top-level path that docker volumes mount cleanly.
ENV DATABASE_URL="file:/data/llreporter.db"
ENV NEXTAUTH_SECRET="llreporter-default-secret-please-override-in-production-aZbYcXdWeVfUgThSiRjQkPlOmN"
ENV PUBLIC_URL="https://webaudit.logiclaunch.in"
ENV SEED_ADMIN_EMAIL="admin@logiclaunch.in"
ENV SEED_ADMIN_PASSWORD="changeme"
ENV SEED_ADMIN_NAME="Super Admin"

WORKDIR /app/web
EXPOSE 3000

# Entrypoint: mkdir /data, chmod, db push, seed, then exec next start.
CMD ["/usr/local/bin/docker-entrypoint.sh"]
