"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Project = { id: string; name: string };
type User = { id: string; name: string; email: string; role: string; projects: Project[] };

export function TeamPanel({ users, projects }: { users: User[]; projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function forceOut(id: string) {
    if (!confirm("Force sign-out this user on every device?")) return;
    await fetch("/api/auth/force-signout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    router.refresh();
  }

  async function del(id: string) {
    if (!confirm("Delete user? This cannot be undone.")) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Invite user</button>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Projects</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[.02]">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-white/60">{u.email}</td>
                <td className="p-4">
                  <span className={`badge ${u.role === "SUPER_ADMIN" ? "!border-accent/40 !text-accent" : ""}`}>
                    {u.role === "SUPER_ADMIN" ? "Admin" : "Member"}
                  </span>
                </td>
                <td className="p-4 text-white/60 max-w-xs truncate">
                  {u.projects.map((p) => p.name).join(", ") || "—"}
                </td>
                <td className="p-4 text-right whitespace-nowrap">
                  <button className="btn !px-2 !py-1 text-xs" onClick={() => forceOut(u.id)}>Sign out all</button>
                  <button className="btn-danger ml-2 !px-2 !py-1 text-xs" onClick={() => del(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="grid gap-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{u.name}</div>
                <div className="text-xs text-white/50">{u.email}</div>
              </div>
              <span className={`badge shrink-0 ${u.role === "SUPER_ADMIN" ? "!border-accent/40 !text-accent" : ""}`}>
                {u.role === "SUPER_ADMIN" ? "Admin" : "Member"}
              </span>
            </div>
            {u.projects.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {u.projects.map((p) => (
                  <span key={p.id} className="badge">{p.name}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button className="btn !px-2.5 !py-1 text-xs flex-1" onClick={() => forceOut(u.id)}>Sign out all</button>
              <button className="btn-danger !px-2.5 !py-1 text-xs" onClick={() => del(u.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <p className="text-sm text-white/40 text-center py-8">No team members yet.</p>
      )}

      <AnimatePresence>
        {open && (
          <NewUserModal
            projects={projects}
            onClose={() => { setOpen(false); router.refresh(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function NewUserModal({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "MEMBER" as "MEMBER" | "SUPER_ADMIN",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectIds: selected }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Failed to create user");
      return;
    }
    onClose();
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="modal-box p-6 w-full max-w-lg"
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Invite team member</h2>
          <button type="button" className="text-white/40 hover:text-white transition-colors" onClick={onClose}>✕</button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="email@example.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Temporary password (min 6)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className="input" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "MEMBER" | "SUPER_ADMIN" })}>
            <option value="MEMBER">Member (dev / tester)</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </div>

        {projects.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs text-white/50">Assign to projects (optional)</div>
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => {
                const active = selected.includes(p.id);
                return (
                  <button
                    key={p.id} type="button"
                    onClick={() => setSelected((s) => active ? s.filter((x) => x !== p.id) : [...s, p.id])}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-line bg-white/5 text-white/60 hover:border-white/30"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {err}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
