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
        <button className="btn-primary" onClick={() => setOpen(true)}>+ New user</button>
      </div>
      <div className="card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Projects</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-b-0 hover:bg-white/[.02]">
                <td className="p-4">{u.name}</td>
                <td className="p-4 text-white/70">{u.email}</td>
                <td className="p-4"><span className="badge">{u.role}</span></td>
                <td className="p-4 text-white/70">{u.projects.map((p) => p.name).join(", ") || "—"}</td>
                <td className="p-4 text-right">
                  <button className="btn !px-2 !py-1 text-xs" onClick={() => forceOut(u.id)}>Force sign-out</button>
                  <button className="btn-danger ml-2 !px-2 !py-1 text-xs" onClick={() => del(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {open && <NewUserModal projects={projects} onClose={() => { setOpen(false); router.refresh(); }} />}
      </AnimatePresence>
    </>
  );
}

function NewUserModal({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" as "MEMBER" | "SUPER_ADMIN" });
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
      setErr(d.error || "failed");
      return;
    }
    onClose();
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
        className="card w-full max-w-lg p-6"
      >
        <h2 className="text-lg font-semibold">New user</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" type="email" placeholder="email@logiclaunch.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Temp password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
            <option value="MEMBER">Member (dev / tester)</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-xs text-white/60">Assign to projects</div>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => {
              const active = selected.includes(p.id);
              return (
                <button
                  key={p.id} type="button"
                  onClick={() => setSelected((s) => active ? s.filter((x) => x !== p.id) : [...s, p.id])}
                  className={active ? "rounded-full border border-accent bg-accent/20 px-3 py-1 text-xs text-accent" : "rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-white/70"}
                >
                  {p.name}
                </button>
              );
            })}
            {projects.length === 0 && <span className="text-xs text-white/40">No projects yet.</span>}
          </div>
        </div>
        {err && <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{err}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? "Creating…" : "Create"}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
