"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AddMemberModal } from "./AddMemberModal";

type U = { id: string; name: string; email: string; role: string };

export function ProjectAdminPanel({
  projectId,
  apiKey,
  memberships,
}: {
  projectId: string;
  apiKey: string;
  memberships: U[];
}) {
  const [revealed, setRevealed] = useState(false);
  const [currentKey, setCurrentKey] = useState(apiKey);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function rotate() {
    if (!confirm("Rotate API key? Claude / VS Code integrations using the old key will break.")) return;
    const res = await fetch(`/api/projects/${projectId}/api-key/rotate`, { method: "POST" });
    if (res.ok) {
      const { apiKey: k } = await res.json();
      setCurrentKey(k);
      setRevealed(true);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove(userId: string) {
    if (!confirm("Remove this member from the project?")) return;
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) router.refresh();
  }

  const masked = currentKey.slice(0, 10) + "…" + currentKey.slice(-4);

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {/* API Key card */}
      <motion.div layout className="card p-5">
        <div className="text-sm font-medium">API key</div>
        <p className="mt-1 text-xs text-white/50">
          Used by the VS Code / Claude connector. Treat as a secret.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-ink/60 px-3 py-2 font-mono text-xs">
            {revealed ? currentKey : masked}
          </code>
          <div className="flex gap-2">
            <button className="btn !text-xs !px-2.5 !py-1.5" onClick={() => setRevealed((v) => !v)}>
              {revealed ? "Hide" : "Reveal"}
            </button>
            <button className="btn !text-xs !px-2.5 !py-1.5" onClick={copy}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <button className="btn-danger !text-xs" onClick={rotate}>Rotate key</button>
        </div>
      </motion.div>

      {/* Team card */}
      <motion.div layout className="card p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm font-medium">
            Team <span className="text-white/40 text-xs">({memberships.length})</span>
          </div>
          {/* Super-admin only — enforced server-side too */}
          <AddMemberModal
            projectId={projectId}
            existingIds={memberships.map((m) => m.id)}
          />
        </div>
        <ul className="mt-3 divide-y divide-line">
          {memberships.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <div className="text-sm truncate">
                  {u.name}
                  <span className="ml-1.5 text-xs text-white/40">
                    {u.role === "SUPER_ADMIN" ? "· Admin" : "· Member"}
                  </span>
                </div>
                <div className="text-xs text-white/40 truncate">{u.email}</div>
              </div>
              <button
                className="btn-danger !px-2 !py-1 !text-xs shrink-0"
                onClick={() => remove(u.id)}
              >
                Remove
              </button>
            </li>
          ))}
          {memberships.length === 0 && (
            <li className="py-3 text-sm text-white/40">No members yet.</li>
          )}
        </ul>
      </motion.div>
    </section>
  );
}
