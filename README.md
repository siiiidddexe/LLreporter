# LLReporter

An end-to-end bug reporting platform for the LogicLaunch team.

It has **three parts** that share a single account system:

| Part | Path | Purpose |
| ---- | ---- | ------- |
| 🧩 Chrome Extension | `extension/` | Press **⌘K / Ctrl+K** on any page to open a modal, paste a screenshot (⌘V/Ctrl+V), auto-capture the URL, describe the bug, hit **Enter** to submit. |
| 🖥️ Web Dashboard | `web/` | Super-admin + employees (developers & testers) manage projects, users, API keys, and bug sets. Modern dark-black / white-text / blue-accent UI with micro-animations. Hosted at **webaudit.logiclaunch.in**. |
| 🤖 VS Code / Claude Connector | `connector/` | A drop-in connector file + API docs a developer can feed to Claude inside VS Code so it pulls bugs one-by-one, fixes them, updates status, and hands off to testers. |

Single sign-on: logging into `webaudit.logiclaunch.in` also logs in the Chrome extension (tokens live 100 years unless force-signed-out).

---

## Architecture

```
┌─────────────────────┐      ┌───────────────────────────┐
│  Chrome Extension   │◄────►│                           │
│  (⌘K modal)         │      │   Next.js Web Dashboard   │
└─────────────────────┘      │   + REST API              │◄──┐
                             │   webaudit.logiclaunch.in │   │
┌─────────────────────┐      │                           │   │
│  VS Code + Claude   │◄────►│   PostgreSQL + Prisma     │   │
│  (connector.md)     │      └───────────────────────────┘   │
└─────────────────────┘                                       │
                                                              │
                      Bugs grouped by URL = "Bug Set" ────────┘
```

* Bugs reported against the same `url` (origin + path) are automatically grouped into the same **Bug Set**.
* Every project has its own **API key**. Give the key to Claude/VS Code and it can pull issues, patch code, post back fixes + test notes.
* Testers re-test and either **Resolve** or send back to **Unresolved** with new notes. Developers & testers share permissions.

---

## Quick start (local dev)

```bash
# 1. start Postgres + the web app
docker compose up -d

# 2. run migrations + seed a super-admin
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run seed

# 3. open
open http://localhost:3000
# login:  admin@logiclaunch.in / changeme
```

Then load the extension:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and pick `./extension`
4. Pin it, sign in, press **⌘K / Ctrl+K** on any page.

---

## Deployment — Dokploy v0.26.7

This repo is already Dokploy compliant. In Dokploy:

1. Create a new **Compose** service.
2. Provider → GitHub → `siiidddexe/LLreporter` (branch `main`).
3. Compose file: `docker-compose.yml` (default).
4. Set the env vars from `.env.example` (DATABASE_URL, NEXTAUTH_SECRET, PUBLIC_URL=`https://webaudit.logiclaunch.in`).
5. Attach the domain `webaudit.logiclaunch.in` to the `web` service, port `3000`, enable HTTPS (Let's Encrypt).
6. Deploy.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full walk-through.

---

## Repository layout

```
LLreporter/
├── web/              Next.js 14 dashboard + API (Prisma, Tailwind, Framer Motion)
├── extension/        Chrome MV3 extension (⌘K modal)
├── connector/        Claude/VS Code connector + DOCUMENTATION.md
├── docker-compose.yml
├── Dockerfile        (builds the web app)
├── dokploy.yml       (Dokploy v0.26.7 metadata)
└── .env.example
```

Read the detailed docs:

* [`connector/DOCUMENTATION.md`](./connector/DOCUMENTATION.md) — for developers plugging Claude into the dashboard.
* [`web/README.md`](./web/README.md) — dashboard API reference.
* [`extension/README.md`](./extension/README.md) — extension behaviour & shortcuts.
* [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Dokploy v0.26.7 deployment.
