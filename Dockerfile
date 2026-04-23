# syntax=docker/dockerfile:1.6
# LLReporter — single image, embedded SQLite, zero setup.
# Run:  docker compose up -d    then visit http://localhost:3000

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY package.json ./
COPY web/package.json web/package.json
RUN npm install --prefix web --no-audit --no-fund

COPY . .
WORKDIR /app/web
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate && npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app/web
RUN apk add --no-cache libc6-compat openssl wget sqlite

ENV NODE_ENV=production
ENV PORT=3000
# Absolute SQLite path — the parent dir is a docker volume mount.
ENV DATABASE_URL="file:/app/web/data/llreporter.db"
ENV NEXTAUTH_SECRET="llreporter-default-secret-please-override-in-production-aZbYcXdWeVfUgThSiRjQkPlOmN"
ENV PUBLIC_URL="https://webaudit.logiclaunch.in"
ENV SEED_ADMIN_EMAIL="admin@logiclaunch.in"
ENV SEED_ADMIN_PASSWORD="changeme"
ENV SEED_ADMIN_NAME="Super Admin"

COPY --from=builder /app /app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
 && mkdir -p /app/web/data /app/web/public/uploads \
 && chmod -R 0777 /app/web/data /app/web/public/uploads

EXPOSE 3000

# Entrypoint runs AFTER docker mounts the volumes, so it can re-create dirs
# that named-volume mounts have masked, and runs db push + seed loudly.
CMD ["/usr/local/bin/docker-entrypoint.sh"]
