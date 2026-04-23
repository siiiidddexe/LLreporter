# Contributing

## Local dev

```bash
# Option A — run in Docker (matches prod exactly)
docker compose up --build

# Option B — run the web app natively
cd web
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

SQLite file lives at `web/data/llreporter.db` (option B) or inside the `data` volume (option A).

## Extension dev

```bash
# chrome://extensions → Load unpacked → ./extension
```

Edit files, click the reload icon on the extension card. Point it at `http://localhost:3000` by setting the dashboard URL on the extension's popup.

## Connector dev

```bash
cd connector
npm link       # exposes `llreporter` CLI globally
llreporter --help
```

## Conventions

- **TypeScript** for `web/`; plain ESM JS for `connector/` and `extension/`.
- **Prisma SQLite** — no native enums, no `@db.Text`. Validate roles/statuses with Zod at the API boundary.
- **Auth**: 100-year JWT, invalidated only by bumping `User.tokenVersion`.
- **UI**: Tailwind + Framer Motion. Black bg, white text, blue accents (`#3B82F6` / `blue-500`).
- **Bug grouping**: canonicalize URL (origin + pathname, no query/hash) before lookup.

## PRs

1. Fork, branch off `main`.
2. Keep diffs focused.
3. Run `npm run build` inside `web/` before opening a PR.
