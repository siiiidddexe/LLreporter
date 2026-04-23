# LLReporter ↔ Claude / VS Code — Connector Documentation

Drop-in instructions for a developer to plug **Claude inside VS Code** into the LLReporter dashboard and have it **fix bugs one by one**, **post patch notes**, and **mark each bug for re-testing** — all via the project's API key.

> TL;DR: install the connector, put your API key in `.llreporterrc`, paste the **Claude system prompt** below into VS Code Chat, and say *"go"*.

---

## 1. What you need

| Thing | Where to get it |
| ----- | --------------- |
| Dashboard URL | `https://webaudit.logiclaunch.in` (or your self-hosted Dokploy URL) |
| Project API key | Super-admin → project page → **Reveal / Copy** |
| VS Code + Claude | [Claude for VS Code](https://claude.ai/) with tool / terminal access |
| Node 20+ | `node -v` |

---

## 2. Install the connector

From your project root (the codebase Claude will edit):

```bash
# Option A — npx directly from GitHub
npm i --save-dev github:siiidddexe/LLreporter#main:connector

# Option B — copy the connector folder in yourself
cp -r /path/to/LLreporter/connector ./llreporter-connector
(cd llreporter-connector && npm install)
```

Create `.llreporterrc` at the repo root (or use env vars — see below):

```json
{
  "base": "https://webaudit.logiclaunch.in",
  "apiKey": "llr_live_xxxxxxxxxxxxxxxxxxxxxxxx"
}
```

Add `.llreporterrc` to `.gitignore` — it's a secret.

Alternatively in your shell:

```bash
export LLREPORTER_BASE="https://webaudit.logiclaunch.in"
export LLREPORTER_API_KEY="llr_live_xxx"
```

Smoke-test:

```bash
npx llreporter next
```

You should see a JSON blob describing the next bug — or `"No open bugs … 🎉"`.

---

## 3. The connector commands

All commands talk to the project identified by the API key. Developers and testers share one account system, but the connector only needs the **project** key.

| Command | Purpose |
| ------- | ------- |
| `llreporter next` | Next bug to fix. Priority: `UNRESOLVED` → `OPEN` → `IN_PROGRESS`. |
| `llreporter list [--status OPEN]` | List bugs, optionally filtered. |
| `llreporter show <bugId>` | Full detail including screenshot URL + conversation. |
| `llreporter patch <bugId> --status NEEDS_TESTING --note "…"` | **Mandatory** status update after a fix. `--note` is the patch summary shown to the tester. |
| `llreporter comment <bugId> "text"` | Post a reply to the tester without changing status. |

Valid statuses: `OPEN`, `IN_PROGRESS`, `NEEDS_TESTING`, `RESOLVED`, `UNRESOLVED`, `CLOSED`.

The connector **refuses** a `patch` call without `--status`, which enforces the "mandatorily update a status and mark for testing" rule from the spec.

---

## 4. Workflow: fix bugs one by one with Claude

The workflow is intentionally simple for the dev:

1. Open the repo in VS Code.
2. Open Claude Chat.
3. Paste the **system prompt** below *once*.
4. Say **"continue"** (or **"next bug"**) each time you want Claude to pull and fix the next bug.

Claude will:

1. Run `npx llreporter next` and read the bug JSON.
2. Set it to `IN_PROGRESS`: `npx llreporter patch <id> --status IN_PROGRESS --note "picked up"`.
3. Download the screenshot (URL in the JSON) if useful and locate the affected code.
4. Make the fix in the editor.
5. Run tests/build.
6. Post `npx llreporter patch <id> --status NEEDS_TESTING --note "<summary of the fix, what to retest>"`.
7. Stop and wait — you move on by saying **"next"**.

When a tester marks a bug `UNRESOLVED` with a new note, `llreporter next` will surface it again (unresolved has the highest priority).

---

## 5. Claude system prompt (copy this into VS Code Chat)

```
You are an autonomous bug-fixing agent integrated with LLReporter via the
`llreporter` CLI (already installed; config is at .llreporterrc).

For each bug you will:
1. Run `npx llreporter next` and read the JSON bug.
   - If the output says no bugs are open, stop and report "queue clear 🎉".
2. Immediately claim it: `npx llreporter patch <bugId> --status IN_PROGRESS --note "picking up"`.
3. Study the bug:
   - Read `description`, all `comments` (including tester replies on UNRESOLVED).
   - If `screenshotUrl` is set, download it to `.llreporter/cache/<bugId>.png` for reference.
   - Navigate to the affected files using the URL, stack traces, or clues.
4. Make the smallest safe fix. Run the project's test/build script if one exists.
5. ALWAYS finish with a status update — this is mandatory:
   `npx llreporter patch <bugId> --status NEEDS_TESTING --note "<what you changed, files touched, how to retest, any caveats>"`
   - Use `--status CLOSED` only if the bug is invalid, and explain why in --note.
6. Summarize to me in chat what you did and wait for me to say "next" or
   "continue" before pulling another bug. Never batch-process silently.

Rules:
- Never commit or push automatically — let me review.
- Do not edit `.llreporterrc` or expose the API key in logs, comments, or diffs.
- Never set status to RESOLVED — only testers do that from the dashboard.
- If a bug is ambiguous, post a comment with `npx llreporter comment <bugId> "question"` and stop.
```

---

## 6. Raw API reference (if you want to call it yourself)

All endpoints are under `/api/v1` and require the `X-API-Key` header. Base URL is whatever the dashboard is served from (e.g. `https://webaudit.logiclaunch.in`).

### `GET /api/v1/next`
Returns the next bug to work on.
```json
{ "bug": { "id": "clx…", "title": "…", "status": "OPEN", "url": "…", "description": "…", "screenshotUrl": "…", "comments": [...] }, "project": { "id": "…", "name": "…" } }
```

### `GET /api/v1/bugs?status=OPEN`
Filter by status (optional). Returns `{ "bugs": [...] }`.

### `GET /api/v1/bugs/:id`
Full bug detail including `screenshotUrl` (absolute).

### `PATCH /api/v1/bugs/:id`
```json
{ "status": "NEEDS_TESTING", "note": "fixed X by doing Y; retest on /checkout" }
```
`status` is optional server-side but the CLI enforces it. `note` becomes a `kind: "claude"` comment on the bug.

### `POST /api/v1/bugs/:id/comments`
```json
{ "body": "Tester: can you also share the network tab HAR?" }
```
Creates a Claude-attributed comment without changing status.

Errors always look like: `{ "error": "invalid api key" }` with a 4xx code.

---

## 7. FAQ

**Q: My project has multiple devs. Can they all use the same connector?**
Yes. Give each dev the same project API key (or rotate per-dev — then each dev's `.llreporterrc` differs). All actions appear as "Claude" comments on the dashboard so testers can see the trail.

**Q: Can Claude post partial progress without moving status?**
Yes: `npx llreporter comment <bugId> "WIP: repro'd, investigating auth middleware"`.

**Q: Can we hook this into CI?**
Yes — the CLI is idempotent and exits non-zero on errors. Good for a nightly "triage" run that picks the oldest OPEN bug and assigns it to a human.

**Q: How do testers get notified?**
Right now they see the bug move to `NEEDS_TESTING` on the dashboard (and the Claude comment on it). Slack/email webhooks are a roadmap item.

**Q: What if the API key leaks?**
Super-admin → project → **Rotate key**. The old key is dead instantly; update every dev's `.llreporterrc`.
