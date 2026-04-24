"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug as BugIcon, Camera, X, Upload } from "lucide-react";

type Project = { id: string; name: string };

export function ReportBugButton({
  projects,
  defaultProjectId,
  pageUrl,
}: {
  projects: Project[];
  defaultProjectId?: string;
  /** Optional default URL — defaults to current page when the user opens the modal. */
  pageUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(pageUrl || (typeof window !== "undefined" ? window.location.href : ""));
      setError("");
      setDone(false);
      setTimeout(() => taRef.current?.focus(), 30);
    }
  }, [open, pageUrl]);

  // Paste-to-attach screenshot
  useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => setShot(reader.result as string);
          reader.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open]);

  function handleFile(f: File | null | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Only images are allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setShot(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function submit() {
    setError("");
    if (!projectId) { setError("Pick a project."); return; }
    if (!description.trim()) { setError("Please describe the bug."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          url: url || (typeof window !== "undefined" ? window.location.href : "https://dashboard"),
          description,
          screenshot: shot || undefined,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit");
        return;
      }
      setDone(true);
      // Reset and close after a brief flash.
      setTimeout(() => {
        setOpen(false);
        setShot(null);
        setDescription("");
      }, 700);
      // Soft refresh the route data.
      if (typeof window !== "undefined") setTimeout(() => window.location.reload(), 750);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent/90"
      >
        <BugIcon size={15} />
        <span>Report bug</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => { if (e.target === e.currentTarget && !submitting) setOpen(false); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 8, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 8, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0.9, 0.3, 1.2] }}
              className={`card w-full max-w-lg overflow-hidden ${done ? "ring-2 ring-green-500" : ""}`}
            >
              <div className="flex items-start justify-between border-b border-line px-5 py-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[.25em] text-accent">logiclaunch</div>
                  <div className="mt-1 text-base font-semibold">Report a bug</div>
                  <div className="mt-0.5 text-xs text-white/50">Just a screenshot &amp; a description.</div>
                </div>
                <button
                  onClick={() => !submitting && setOpen(false)}
                  className="rounded-md p-1 text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 p-5 max-h-[70vh] overflow-y-auto">
                {projects.length > 1 && (
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/55">Project</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full rounded-lg border border-line bg-ink/60 px-3 py-2 text-sm text-white outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {projects.length === 1 && (
                  <div className="rounded-lg border border-line bg-white/[.02] px-3 py-2 text-xs text-white/55">
                    <span className="text-[9px] uppercase tracking-[.15em] text-white/30">project</span>
                    <span className="ml-2 text-white/80">{projects[0].name}</span>
                  </div>
                )}

                {/* Screenshot */}
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/55">Screenshot</label>
                  {shot ? (
                    <div className="relative rounded-lg border border-line overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot} alt="Screenshot preview" className="block max-h-[280px] w-full object-contain bg-black/40" />
                      <div className="flex items-center justify-end gap-2 border-t border-line bg-panel/70 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="text-xs text-white/60 hover:text-white"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setShot(null)}
                          className="text-xs text-red-300/80 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line/80 bg-accent/5 px-4 py-6 text-xs text-white/50 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-white/80"
                    >
                      <Camera size={20} className="text-accent/70" />
                      <span>Click to upload — or paste an image (⌘V / Ctrl+V)</span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/55">Description</label>
                  <textarea
                    ref={taRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
                    }}
                    rows={5}
                    placeholder="What did you expect? What happened? Steps to reproduce…"
                    className="w-full rounded-lg border border-line bg-ink/60 px-3 py-2 text-sm text-white outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 font-mono"
                  />
                </div>

                {/* URL collapsed */}
                <details className="text-xs text-white/45">
                  <summary className="cursor-pointer select-none hover:text-white/70">Page URL (auto-filled)</summary>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-line bg-ink/60 px-3 py-2 text-xs text-white/80 outline-none focus:border-accent/60"
                  />
                </details>

                {error && <div className="text-sm text-red-300">{error}</div>}
              </div>

              <div className="flex items-center gap-2 border-t border-line px-5 py-3">
                <div className="flex-1 text-[11px] text-white/35">
                  ⌘↵ / Ctrl+↵ to submit
                </div>
                <button
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded-lg border border-line bg-white/[.03] px-3 py-1.5 text-sm text-white/80 hover:bg-white/[.07]"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={submitting || done}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                >
                  <Upload size={14} />
                  {done ? "Submitted" : submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
