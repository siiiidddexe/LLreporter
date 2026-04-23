# syntax=docker/dockerfile:1.6
# Multi-stage build for the Next.js web dashboard
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY web/package.json web/package.json
RUN npm install --no-audit --no-fund --workspaces --include-workspace-root --workspace=web || npm install --prefix web --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY . .
WORKDIR /app/web
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl wget
ENV NODE_ENV=production
ENV PORT=3000
# Copy full built web workspace (standalone would be leaner but we keep prisma runtime + seed script easily)
COPY --from=builder /app/web ./web
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
WORKDIR /app/web
EXPOSE 3000
# On first boot there are no migrations yet — `db push` syncs the schema.
# On subsequent boots `migrate deploy` is a no-op if no migrations are added.
# Seed is idempotent.
CMD sh -c "(npx prisma migrate deploy || npx prisma db push --accept-data-loss) && node prisma/seed.js && npm run start"
