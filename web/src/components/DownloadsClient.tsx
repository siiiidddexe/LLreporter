"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chrome, Bot, Code2, Settings, Download, LayoutGrid,
  type LucideIcon,
} from "lucide-react";

type Section = "extension" | "connector" | "api" | "admin";

const TABS: { key: Section; label: string; Icon: LucideIcon; adminOnly?: boolean }[] = [
  { key: "extension", label: "Chrome Extension", Icon: Chrome },
  { key: "connector", label: "Claude Connector", Icon: Bot },
  { key: "api",       label: "API Reference",    Icon: Code2 },
  { key: "admin",     label: "Admin Guide",      Icon: Settings, adminOnly: true },
];

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-3">
      <pre className="overflow-x-auto rounded-lg border border-line bg-ink/80 p-4 text-xs text-white/80 leading-relaxed">
        <code>{children}</code>
      </pre>
      <button
        className="absolute right-2 top-2 rounded border border-line bg-panel/80 px-2 py-0.5 text-[10px] text-white/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function H2({ Icon, children }: { Icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-2 flex items-center gap-2 text-base font-semibold text-white/90">
      {Icon && <Icon size={18} className="text-accent" />}
      <span>{children}</span>
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 mb-1.5 text-sm font-medium text-white/70">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/60 leading-relaxed">{children}</p>;
}
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mt-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">{n}</span>
      <div className="text-sm text-white/70 leading-relaxed">{children}</div>
    </div>
  );
}
function Callout({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warn" }) {
  return (
    <div className={`my-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${type === "warn" ? "border-yellow-400/30 bg-yellow-400/5 text-yellow-200" : "border-accent/30 bg-accent/5 text-accent/80"}`}>
      {children}
    </div>
  );
}

function ExtensionGuide() {
  return (
    <div>
      <H2 Icon={Chrome}>Chrome Extension — How it works</H2>
      <P>The LLReporter extension lets anyone on your team capture a bug in seconds — without leaving the browser.</P>

      {/* Prominent download CTA */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Download the packaged extension</div>
          <div className="mt-1 text-xs text-white/60">
            ZIP contains <code className="text-accent">manifest.json</code>, content + background scripts, icons, and styles.
            Already pre-configured for <code className="text-accent">webaudit.logiclaunch.in</code>.
          </div>
        </div>
        <a
          href="/llreporter-extension.zip"
          download="llreporter-extension.zip"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
        >
          <Download size={16} />
          <span>Download ZIP</span>
        </a>
      </div>

      <H3>Installation</H3>
      <Step n={1}>Download the ZIP above and <strong>unzip it</strong> anywhere on your machine.</Step>
      <Step n={2}>Open Chrome and go to <strong>chrome://extensions</strong></Step>
      <Step n={3}>Toggle <strong>Developer mode</strong> on (top-right corner)</Step>
      <Step n={4}>Click <strong>Load unpacked</strong> and pick the unzipped <code className="text-accent">llreporter-extension/</code> folder</Step>
      <Step n={5}>Pin the LLReporter icon to your toolbar</Step>

      <H3>First sign-in</H3>
      <Step n={1}>Click the extension icon → confirm the dashboard URL is <code className="text-accent">https://webaudit.logiclaunch.in</code> and enter your email + password</Step>
      <Step n={2}>You&apos;re logged in — your session lasts 100 years, so you only do this once per device</Step>

      <H3>Reporting a bug (the easy way)</H3>
      <Callout>Press <strong>⌘K</strong> (Mac) or <strong>Ctrl+K</strong> (Windows/Linux) on any page to open the bug-capture modal.</Callout>
      <Step n={1}>A modal pops up. The <strong>URL is filled in</strong> automatically.</Step>
      <Step n={2}><strong>Pick the project</strong> from the dropdown (super-admins see every project).</Step>
      <Step n={3}><strong>Paste a screenshot</strong> with ⌘V/Ctrl+V — or click <em>Capture visible tab</em> to grab the page (the modal hides itself during capture so it isn&apos;t in the shot).</Step>
      <Step n={4}>Type a short description of what went wrong.</Step>
      <Step n={5}>Hit <strong>⌘↵ / Ctrl+↵</strong> or click Submit. Done — the bug appears on the dashboard instantly.</Step>

      <H3>What happens next</H3>
      <P>Bugs submitted against the same URL are automatically grouped into a <strong>Bug Set</strong>. A developer picks it up, investigates with Claude, and updates the status. You&apos;ll see it move through: <em>Open → In Progress → Needs Testing → Resolved</em>.</P>

      <H3>Tips</H3>
      <Step n={1}>You don&apos;t need to write code — just describe what you saw in plain English.</Step>
      <Step n={2}>Screenshots are optional but massively helpful.</Step>
      <Step n={3}>If the same bug happens on multiple pages, submit once per page — they&apos;ll group automatically.</Step>
      <Step n={4}>Press <strong>Esc</strong> to dismiss the modal at any time.</Step>
    </div>
  );
}

function ConnectorGuide() {
  return (
    <div>
      <H2 Icon={Bot}>Claude Connector — Developer Guide</H2>
      <P>The connector lets Claude (inside VS Code) pull bugs from the dashboard, fix them in your codebase, post patch notes, and mark each bug <em>Needs Testing</em> — automatically.</P>

      <H3>1. Get your API key</H3>
      <P>Super-admin → project page → <strong>Reveal → Copy</strong>. Treat it like a password.</P>

      <H3>2. Create .llreporterrc in your project root</H3>
      <Code>{`{
  "base": "https://webaudit.logiclaunch.in",
  "apiKey": "llr_live_xxxxxxxxxxxxxxxxxxxxxxxx"
}`}</Code>
      <Callout type="warn">Add <code>.llreporterrc</code> to your <code>.gitignore</code> — never commit the key.</Callout>

      <H3>3. Smoke-test</H3>
      <Code>{`npx llreporter next`}</Code>
      <P>You should see a JSON description of the next open bug. If you see <em>&quot;No open bugs&quot;</em> — all clear.</P>

      <H3>4. Paste this system prompt into VS Code Chat</H3>
      <P>Open VS Code → Claude chat → click the system-prompt gear → paste:</P>
      <Code>{`You are a developer working through a bug queue pulled from LLReporter.

Workflow for each bug:
1. Run: npx llreporter next          → get the next bug (JSON)
2. Read bug.description + bug.url
3. Investigate the relevant files in this codebase
4. Fix the bug
5. Run: npx llreporter update <id> IN_PROGRESS  → mark in progress
6. Write a concise patch note (what you changed and why)
7. Run: npx llreporter comment <id> "<patch note>"
8. Run: npx llreporter update <id> NEEDS_TESTING → hand off to QA
9. Move to the next bug: repeat from step 1

Rules:
- Never skip marking NEEDS_TESTING — testers rely on this.
- Keep patch notes factual: file changed, what changed, why.
- If a bug can't be reproduced, comment with findings and mark CLOSED.
- One bug at a time. Finish before starting the next.`}</Code>

      <H3>5. Say &quot;go&quot; in VS Code Chat</H3>
      <P>Claude will pull the first bug, investigate your code, apply a fix, and update the dashboard. You watch it happen live.</P>

      <H3>CLI reference</H3>
      <Code>{`npx llreporter next                        # next open bug
npx llreporter list                       # all open bugs
npx llreporter get <bugId>                # one bug
npx llreporter update <bugId> <STATUS>    # change status
npx llreporter comment <bugId> "text"     # add comment`}</Code>
    </div>
  );
}

function ApiReference() {
  return (
    <div>
      <H2 Icon={Code2}>API Reference</H2>
      <P>All API requests must include your project&apos;s API key in the <code className="text-accent">X-API-Key</code> header.</P>

      <H3>Authentication</H3>
      <Code>{`X-API-Key: llr_live_xxxxxxxxxxxxxxxxxxxxxxxx`}</Code>

      <H3>GET /api/v1/next</H3>
      <P>Returns the next <em>OPEN</em> bug in the project.</P>
      <Code>{`curl https://webaudit.logiclaunch.in/api/v1/next \\
  -H "X-API-Key: llr_live_xxx"`}</Code>

      <H3>GET /api/v1/bugs</H3>
      <P>List all bugs. Optional query params: <code className="text-accent">status</code>, <code className="text-accent">bugSetId</code></P>
      <Code>{`curl "https://webaudit.logiclaunch.in/api/v1/bugs?status=OPEN"`}</Code>

      <H3>GET /api/v1/bugs/:id</H3>
      <P>Get a single bug with all comments.</P>

      <H3>PATCH /api/v1/bugs/:id</H3>
      <P>Update status or assignee.</P>
      <Code>{`curl -X PATCH https://webaudit.logiclaunch.in/api/v1/bugs/clxxx \\
  -H "X-API-Key: llr_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "IN_PROGRESS"}'`}</Code>

      <H3>POST /api/v1/bugs/:id/comments</H3>
      <P>Add a comment. Set <code className="text-accent">kind: &quot;claude&quot;</code> to badge it as an AI comment.</P>
      <Code>{`curl -X POST https://webaudit.logiclaunch.in/api/v1/bugs/clxxx/comments \\
  -H "X-API-Key: llr_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"body": "Fixed null-check in CartService.ts", "kind": "claude"}'`}</Code>

      <H3>Status values</H3>
      <Code>{`OPEN | IN_PROGRESS | NEEDS_TESTING | RESOLVED | UNRESOLVED | CLOSED`}</Code>
    </div>
  );
}

function AdminGuide() {
  return (
    <div>
      <H2 Icon={Settings}>Super-Admin Guide</H2>
      <Callout>Only Super Admins can see this section.</Callout>

      <H3>Creating a project</H3>
      <Step n={1}>Go to <strong>Projects</strong> → <strong>New project</strong></Step>
      <Step n={2}>Give it a name and optional description</Step>
      <Step n={3}>An API key (<code className="text-accent">llr_live_…</code>) is generated automatically</Step>

      <H3>Adding team members to a project</H3>
      <Step n={1}>Open the project page</Step>
      <Step n={2}>In the <strong>Team</strong> card, click <strong>Add member</strong></Step>
      <Step n={3}>Search by name or email, click <strong>Add</strong></Step>
      <Step n={4}>They immediately gain access to that project&apos;s bugs</Step>

      <H3>Creating user accounts</H3>
      <Step n={1}>Go to <strong>Team</strong> in the sidebar</Step>
      <Step n={2}>Click <strong>Invite user</strong> and fill in their details</Step>
      <Step n={3}>Share the credentials with them — they log in at <code className="text-accent">webaudit.logiclaunch.in</code></Step>

      <H3>Force sign-out</H3>
      <P>If a team member leaves or a device is compromised, bump their <code className="text-accent">tokenVersion</code> from the Team page → their account → <strong>Force sign-out</strong>. All their existing sessions are invalidated instantly.</P>

      <H3>Rotating an API key</H3>
      <Step n={1}>Project page → API key card → <strong>Rotate key</strong></Step>
      <Step n={2}>Update <code className="text-accent">.llreporterrc</code> in every developer&apos;s repo</Step>
      <Callout type="warn">The old key stops working immediately — all Claude integrations using it will fail until updated.</Callout>

      <H3>Managing the Kanban</H3>
      <P>
        Project page → <span className="inline-flex items-center gap-1"><LayoutGrid size={12} className="text-accent" /><strong>Kanban</strong></span> tab.
        Drag cards between columns to update status instantly. You can also click any card to open the full bug detail.
      </P>
    </div>
  );
}

export function DownloadsClient({ role }: { role: string }) {
  const isAdmin = role === "SUPER_ADMIN";
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  const [active, setActive] = useState<Section>("extension");

  const CONTENT: Record<Section, React.ReactNode> = {
    extension: <ExtensionGuide />,
    connector: <ConnectorGuide />,
    api: <ApiReference />,
    admin: <AdminGuide />,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Download size={22} className="text-accent" />
          <span>Downloads &amp; Guides</span>
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Everything you need to get up and running — extension, connector, API reference.
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-2">
        {visibleTabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active === key
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-white/50 hover:text-white/80 border border-transparent"
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="card p-6 max-w-3xl"
        >
          {CONTENT[active]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
