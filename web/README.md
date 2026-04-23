# LLReporter — Web Dashboard

Next.js 14 (App Router) + Prisma + Postgres.

## Dev

```bash
cp ../.env.example .env
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

Visit <http://localhost:3000>.

## API surface

All endpoints return JSON. Two auth modes:

* **Session cookie** (`llr_session`, JWT) — used by the dashboard + Chrome extension.
* **Project API key** (`X-API-Key: llr_<...>`) — used by the VS Code / Claude connector.

### Session endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST   | `/api/auth/login`           | `{email,password}` → sets cookie, returns `{token,user}` |
| POST   | `/api/auth/logout`          | Force sign out current session |
| GET    | `/api/auth/me`              | Current user + their projects |
| POST   | `/api/auth/force-signout`   | (admin) revoke a user's sessions |

### Dashboard endpoints (session required)

| Method | Path |
| ------ | ---- |
| GET / POST | `/api/projects` |
| GET / PATCH / DELETE | `/api/projects/:id` |
| POST / DELETE | `/api/projects/:id/members` |
| POST   | `/api/projects/:id/api-key/rotate` |
| POST / DELETE | `/api/users` *(admin only)* |
| POST   | `/api/bugs`                 | Create a bug (Chrome extension). |
| GET    | `/api/bugs?projectId=…`     | List bugs. |
| GET / PATCH | `/api/bugs/:id`        | Update status / assignment. |
| POST   | `/api/bugs/:id/comments`    | Testers/devs comment. |

### Connector endpoints (API key required)

Used by the VS Code / Claude connector. See `connector/DOCUMENTATION.md`.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET    | `/api/v1/next`                 | Next open/unresolved bug assigned to this project. |
| GET    | `/api/v1/bugs`                 | List bugs (supports `?status=open`). |
| GET    | `/api/v1/bugs/:id`             | Full detail incl. screenshot URL. |
| PATCH  | `/api/v1/bugs/:id`             | `{status, note}` — update. Mandatory on fix. |
| POST   | `/api/v1/bugs/:id/comments`    | Claude replies with a patch summary for the tester. |
