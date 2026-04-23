# Deployment — Dokploy v0.26.7

LLReporter ships as a **single container** with SQLite embedded. No database service, no manual migrations, no required env vars.

## 1. Connect the repo

1. Open Dokploy → **Create Service** → **Compose**.
2. **Provider**: GitHub.
3. **Repository**: `siiidddexe/LLreporter`.
4. **Branch**: `main`.
5. **Compose file path**: `docker-compose.yml`.

## 2. (Optional) environment

All env vars have sane defaults. You *should* override:

| Var | Recommended | Why |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | long random string | JWT signing key |
| `PUBLIC_URL` | `https://webaudit.logiclaunch.in` | absolute URLs in API responses |
| `SEED_ADMIN_EMAIL` | your email | super-admin bootstrap |
| `SEED_ADMIN_PASSWORD` | strong password | super-admin bootstrap |

`DATABASE_URL` defaults to `file:/app/web/data/llreporter.db` — leave it.

## 3. Domain

1. **Domains** tab → add `webaudit.logiclaunch.in`.
2. **Service**: `app`. **Port**: `3000`.
3. Enable **HTTPS (Let's Encrypt)**.

## 4. Volumes

`docker-compose.yml` already declares two named volumes:

- `data` → `/app/web/data` (SQLite file)
- `uploads` → `/app/web/uploads` (screenshots)

Dokploy will provision these automatically. Back them up together if you want to preserve bugs + screenshots.

## 5. Deploy

Hit **Deploy**. On first boot the container:

1. Runs `prisma db push` (auto-creates the schema).
2. Seeds the super-admin (idempotent).
3. Starts Next.js on port 3000.

Log in at `https://webaudit.logiclaunch.in` with your seed credentials. **Change the password immediately** from the dashboard.

## 6. Updating

Push to `main` → Dokploy auto-rebuilds. SQLite schema is re-pushed on every boot — additive changes are safe. For destructive migrations, back up `/app/web/data/llreporter.db` first.

## 7. Backup

```bash
docker compose exec app sh -c 'sqlite3 /app/web/data/llreporter.db ".backup /app/web/data/backup.db"'
docker compose cp app:/app/web/data/backup.db ./backup-$(date +%F).db
```

## 8. Force-signout all users

Bump `tokenVersion` on every user (kills all their 100-year tokens):

```bash
docker compose exec app sh -c 'sqlite3 /app/web/data/llreporter.db "UPDATE User SET tokenVersion = tokenVersion + 1"'
```

Or target one user via the dashboard UI.
