# LLReporter — Copilot / AI Assistant Rules

These rules apply to **all** AI-generated code in this repository (Copilot, Claude, Cursor, etc.).

## 1. No emojis in UI code — ever

- **Never** use emoji characters (📊 🗂 👥 📥 🤖 ⚙️ 🧩 📋 ✓ ✗ 🎉 etc.) in:
  - JSX / TSX files
  - Component code, button labels, headings, badges, tabs, nav items
  - Toast messages, error messages, placeholder text
  - Any user-facing string anywhere in the app
- **Always** use icons from `lucide-react` (already a dependency) instead.
- Standard sizing: `size={14}` for inline tab/button icons, `size={16}–18` for nav/header icons.
- Use `currentColor` (lucide default) so icons inherit text color.
- For status indicators, use a colored lucide icon + text — never an emoji.

### Mapping cheat-sheet
| Old emoji | Use |
|-----------|-----|
| 📊 Dashboard | `LayoutDashboard` |
| 🗂 Projects / Bug Sets | `FolderKanban` |
| 📋 Kanban / List | `LayoutGrid` |
| 👥 Team | `Users` |
| 📥 Downloads | `Download` |
| 🧩 Extension | `Chrome` (or `Puzzle`) |
| 🤖 Claude / AI | `Bot` |
| 📡 API | `Code2` |
| ⚙️ Settings / Admin | `Settings` |
| ✓ / ✗ | `Check` / `X` |
| 🎉 Success | `PartyPopper` (sparingly) or `CheckCircle2` |

### Allowed exceptions
- Markdown documentation outside of `web/src/**` (e.g. `README.md`, this file).
- Code comments where an emoji clarifies intent for a human reader.
- Strings the **user** literally types (bug titles, comments) — those are user data, not UI chrome.

## 2. Database safety

- **Never** add `--accept-data-loss` to any `prisma db push` invocation.
- The deploy entrypoint (`docker-entrypoint.sh` and `nixpacks.toml`) is **schema-hash-aware**: it only runs `prisma db push` when `prisma/schema.prisma` has changed or the DB doesn't exist. Do not weaken this.
- Seeds (`web/prisma/seed.js`) must be idempotent (use `upsert`, never `create` for default data).
- The SQLite DB lives at `/data/llreporter.db` (mounted volume) — never write it inside `/app`.

## 3. Imports & icon usage example

```tsx
import { LayoutDashboard, Users, Download } from "lucide-react";

<button className="flex items-center gap-2">
  <Download size={16} />
  <span>Download</span>
</button>
```

If you find yourself reaching for an emoji, stop and pick an icon from
[lucide.dev/icons](https://lucide.dev/icons) instead.
