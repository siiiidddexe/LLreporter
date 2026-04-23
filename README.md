# LLReporter

End-to-end bug reporting platform for the LogicLaunch team. **Zero-setup. Single container. SQLite built-in.**

Three parts sharing one account system:

| Part | Path | Purpose |
| ---- | ---- | ------- |
| 🧩 Chrome Extension | `extension/` | Press **⌘K / Ctrl+K** on any page → paste screenshot (⌘V), auto-captured URL, describe bug, Enter to submit. |
| 🖥️ Web Dashboard | `web/` | Super-admin + employees manage projects, users, API keys, bug sets. Dark UI with blue accents. Hosted at `webaudit.logiclaunch.in`. |
| 🤖 VS Code / Claude Connector | `connector/` | Drop-in connector + API docs so Claude in VS Code pulls bugs, fixes them, updates status, hands off to testers. |

Single sign-on across all three. Tokens live 100 years; invalidated via server-side `tokenVersion` bump.

---

## Quick start — truly zero setup

```bash
docker compose up -d
open http://localhost:3000
# login: admin@logiclaunch.in / changeme
```

That's it. SQLite is embedded, schema is auto-pushed on boot, super-admin is auto-seeded, all env vars have safe defaults. Data persists in the `data` Docker volume, uploads in `uploads`.

### Load the Chrome extension

1. Open `chrome://extensions`
2. Enable **Developer mode** → **Load unpacked** → pick `./extension`
3. Pin it, sign in, press **⌘K / Ctrl+K** on any page.

---

## Architecture

```
┌─────────────────────┐      ┌───────────────────────────┐
│  Chrome Extension   │◄────►│   Next.js Web Dashboard   │
│  (⌘K modal)         │      │   + REST API              │
└─────────────────────┘      │   SQLite (embedded)       │◄──┐
                             │   webaudit.logiclaunch.in │   │
┌─────────────────────┐      └───────────────────────────┘   │
│  VS Code + Claude   │◄────────────────────────────────────┘
│  (connector)        │   Bugs grouped by URL = "Bug Set"
└─────────────────────┘
```

- Bugs reported against the same URL (origin + path) auto-group into a **Bug Set**.
- Every project has its own **API key**. Give it to Claude/VS Code to pull issues, patch, post back fixes + test notes.
- Testers re-test → **Resolve** or send back to **Unresolved** with notes.

---

## Deployment — Dokploy v0.26.7

1. Dokploy → new **Compose** service.
2. Provider → GitHub → `siiidddexe/LLreporter` (branch `main`).
3. Compose file: `docker-compose.yml`.
4. **No env vars required.** Optionally override `NEXTAUTH_SECRET`, `PUBLIC_URL=https://webaudit.logiclaunch.in`, `SEED_ADMIN_PASSWORD`.
5. Attach domain `webaudit.logiclaunch.in` → service `app`, port `3000`, enable HTTPS.
6. Deploy.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Repo layout

```
LLreporter/
├── web/              Next.js 14 + Prisma (SQLite) + Tailwind + Framer Motion
├── extension/        Chrome MV3 extension (⌘K modal)
├── connector/        Claude / VS Code connector + DOCUMENTATION.md
├── docker-compose.yml
├── Dockerfile        (single image: build + run, embeds SQLite)
├── dokploy.yml       (Dokploy v0.26.7 metadata)
└── .env.example      (all optional)
```

More docs:
- [`connector/DOCUMENTATION.md`](./connector/DOCUMENTATION.md) — Claude integration.
- [`web/README.md`](./web/README.md) — API reference.
- [`extension/README.md`](./extension/README.md) — extension usage.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — full Dokploy walkthrough.
