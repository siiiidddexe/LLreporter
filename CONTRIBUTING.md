# Contributing / local dev notes

## Dev without Docker

```bash
# 1. start a local Postgres any way you like, then:
cd web
cp ../.env.example .env
# edit DATABASE_URL in .env to point to your local Postgres
npm install
npx prisma db push      # sync schema
node prisma/seed.js     # create super admin
npm run dev
```

Web app at http://localhost:3000. Default admin: `admin@logiclaunch.in` / `changeme`.

## Load the extension (dev)

1. `chrome://extensions` → Developer mode → **Load unpacked**.
2. Pick `extension/src/`.
3. Click the icon, set Dashboard URL to `http://localhost:3000`, sign in.
4. On any tab press **⌘K / Ctrl+K**.

## Connector (dev)

```bash
cd connector
npm install          # nothing to install really — pure ESM
LLREPORTER_BASE=http://localhost:3000 \
LLREPORTER_API_KEY=llr_live_xxx \
  ./bin/llreporter.mjs next
```

Create a project in the dashboard to get an API key.

## Pushing to GitHub (siiidddexe/LLreporter)

```bash
git init
git add .
git commit -m "feat: initial scaffold"
git branch -M main
git remote add origin https://github.com/siiidddexe/LLreporter.git
git push -u origin main
```

Then follow `DEPLOYMENT.md` to wire Dokploy.

## Project map

```
LLreporter/
├── web/                         Next.js 14 dashboard + REST API
│   ├── prisma/schema.prisma     Data model (User, Project, Membership, BugSet, Bug, Comment)
│   ├── prisma/seed.js           Idempotent super-admin seeder
│   └── src/
│       ├── app/                 App Router pages + /api routes
│       ├── components/          Dashboard UI (client components)
│       └── lib/                 db, auth (JWT, 100yr tokens), api helpers, uploads
├── extension/                   Chrome MV3 extension
│   └── src/
│       ├── manifest.json        Registers ⌘K/Ctrl+K command
│       ├── background.js        Service worker — commands, API, screenshots
│       ├── content.js           Injects the modal into every page
│       ├── modal.css            Dark / blue-accent UI matching the dashboard
│       └── popup.html / .js     Toolbar popup with login + sign-out
├── connector/                   VS Code + Claude drop-in
│   ├── bin/llreporter.mjs       CLI (next, list, show, patch, comment)
│   ├── DOCUMENTATION.md         Developer docs + Claude system prompt
│   └── .llreporterrc.example
├── docker-compose.yml           Postgres + web, Dokploy-friendly
├── Dockerfile                   Multi-stage build for the web service
├── dokploy.yml                  Dokploy v0.26.7 metadata
└── DEPLOYMENT.md                Step-by-step deploy on webaudit.logiclaunch.in
```
