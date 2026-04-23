# Deployment — Dokploy v0.26.7

## 1. Push to GitHub

```bash
git init
git remote add origin https://github.com/siiidddexe/LLreporter.git
git add .
git commit -m "feat: initial LLReporter scaffold"
git branch -M main
git push -u origin main
```

## 2. Create a Dokploy Compose service

1. In Dokploy (v0.26.7) → **Projects → New → Compose**.
2. **Source:** GitHub → `siiidddexe/LLreporter` → branch `main`.
3. **Compose path:** `docker-compose.yml`.
4. **Environment variables** (from `.env.example`):
   - `NEXTAUTH_SECRET` → `openssl rand -base64 32`
   - `DATABASE_URL` → leave default, or point to managed Postgres
   - `PUBLIC_URL` → `https://webaudit.logiclaunch.in`
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` → first-boot admin
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` → for the bundled Postgres
5. **Domains:** add `webaudit.logiclaunch.in` → service `web`, port `3000`, HTTPS (Let's Encrypt).
6. **Deploy.**

On first boot the web container runs `prisma migrate deploy` and seeds the super-admin.
Subsequent deploys skip seeding (it's idempotent).

## 3. Post-deploy

1. Log in at `https://webaudit.logiclaunch.in` with the seed admin.
2. Change your password (Profile → Security).
3. Create a project; copy its API key.
4. Invite employees (Team → Add member). They will get an email/temp password.
5. Publish the Chrome extension (see `extension/README.md`) — or sideload it to team members.
6. Hand `connector/DOCUMENTATION.md` + API key to developers for Claude/VS Code.

## 4. Updating

```bash
git pull && git push
```

Dokploy auto-redeploys on push (enable the webhook in Dokploy → the service → **Auto Deploy**).
