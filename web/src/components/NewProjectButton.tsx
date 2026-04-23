"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setLoading(false);
    if (res.ok) {
      const { project } = await res.json();
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/projects/${project.id}`);
      router.refresh();
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ New project</button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.form
              onClick={(e) => e.stopPropagation()}
              onSubmit={submit}
              initial={{ y: 10, opacity: 0, scale: .98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: .98 }}
              className="card w-full max-w-md p-6"
            >
              <h2 className="text-lg font-semibold">New project</h2>
              <p className="text-sm text-white/50">An API key will be generated automatically.</p>
              <div className="mt-4 space-y-3">
                <input className="input" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
                <textarea className="input min-h-24" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn-primary" disabled={loading}>{loading ? "Creating…" : "Create"}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
