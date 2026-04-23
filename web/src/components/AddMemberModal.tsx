"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; role: string };

export function AddMemberModal({
  projectId,
  existingIds,
}: {
  projectId: string;
  existingIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function fetchUsers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const { users } = await res.json();
      setUsers(users);
    }
  }

  useEffect(() => {
    if (open) {
      fetchUsers();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  const filtered = users
    .filter((u) => !existingIds.includes(u.id))
    .filter(
      (u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
    );

  async function add(userId: string) {
    setAdding(userId);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setAdding(null);
    if (res.ok) {
      router.refresh();
      // Remove from local list immediately
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }

  return (
    <>
      <button className="btn-primary text-xs !px-3 !py-1.5" onClick={() => setOpen(true)}>
        + Add member
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-sm font-semibold">Add team member</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                <input
                  ref={inputRef}
                  className="input"
                  placeholder="Search by name or email…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <ul className="max-h-72 overflow-y-auto divide-y divide-line px-2 pb-3">
                {filtered.length === 0 && (
                  <li className="py-6 text-center text-sm text-white/40">
                    {query ? "No users match your search" : "All team members already added"}
                  </li>
                )}
                {filtered.map((u) => (
                  <motion.li
                    key={u.id}
                    layout
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/[.03]"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-xs text-white/40 truncate">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-white/30">
                        {u.role === "SUPER_ADMIN" ? "Admin" : "Member"}
                      </span>
                      <button
                        className="btn-primary !px-3 !py-1 text-xs"
                        disabled={adding === u.id}
                        onClick={() => add(u.id)}
                      >
                        {adding === u.id ? "Adding…" : "Add"}
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
