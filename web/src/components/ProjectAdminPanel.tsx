"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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
    if (!confirm("Remove this user from the project?")) return;
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) router.refresh();
  }

  const masked = currentKey.slice(0, 10) + "…" + currentKey.slice(-4);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <motion.div layout className="card p-5">
        <div className="text-sm font-medium">API key</div>
        <p className="mt-1 text-xs text-white/50">Used by the VS Code / Claude connector. Treat as a secret.</p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border border-line bg-ink/60 px-3 py-2 font-mono text-xs">
            {revealed ? currentKey : masked}
          </code>
          <button className="btn" onClick={() => setRevealed((v) => !v)}>{revealed ? "Hide" : "Reveal"}</button>
          <button className="btn" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <div className="mt-3">
          <button className="btn-danger" onClick={rotate}>Rotate key</button>
        </div>
      </motion.div>

      <motion.div layout className="card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Team</div>
          <AddMember projectId={projectId} />
        </div>
        <ul className="mt-3 divide-y divide-line">
          {memberships.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm">{u.name} <span className="text-xs text-white/40">· {u.role}</span></div>
                <div className="text-xs text-white/50">{u.email}</div>
              </div>
              <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => remove(u.id)}>Remove</button>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

function AddMember({ projectId }: { projectId: string }) {
  const [userId, setUserId] = useState("");
  const router = useRouter();
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) { setUserId(""); router.refresh(); }
  }
  return (
    <form onSubmit={add} className="flex gap-2">
      <input className="input w-48" placeholder="user id" value={userId} onChange={(e) => setUserId(e.target.value)} />
      <button className="btn-primary">Add</button>
    </form>
  );
}
