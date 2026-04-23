"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const STATUSES = ["OPEN", "IN_PROGRESS", "NEEDS_TESTING", "RESOLVED", "UNRESOLVED", "CLOSED"] as const;

export function BugDetailClient({ bug }: { bug: any }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(bug.status);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function changeStatus(next: string) {
    setBusy(true);
    const res = await fetch(`/api/bugs/${bug.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (res.ok) { setStatus(next); router.refresh(); }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    await fetch(`/api/bugs/${bug.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment }),
    });
    setBusy(false);
    setComment("");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">{bug.title}</h1>
          <a href={bug.url} target="_blank" className="text-sm text-accent hover:underline">{bug.url}</a>
          <div className="mt-2 text-xs text-white/50">
            Reported by {bug.reporter.name} · {new Date(bug.createdAt).toLocaleString()}
          </div>
        </header>

        {bug.screenshot && (
          <motion.a
            href={bug.screenshot} target="_blank"
            whileHover={{ scale: 1.01 }}
            className="block overflow-hidden rounded-xl border border-line"
          >
            <img src={bug.screenshot} alt="screenshot" className="w-full" />
          </motion.a>
        )}

        <div className="card p-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-white/50">Description</div>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-white/90">{bug.description}</pre>
        </div>

        <div className="card">
          <div className="border-b border-line p-4 text-sm font-medium">Conversation</div>
          <ul className="max-h-[500px] overflow-auto divide-y divide-line">
            {bug.comments.map((c: any) => (
              <li key={c.id} className="p-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-white/50">
                  <span className="font-medium text-white/80">{c.author.name}</span>
                  {c.kind === "claude" && <span className="badge !border-accent/50 !text-accent">Claude</span>}
                  <span>· {new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-white/90">{c.body}</pre>
              </li>
            ))}
            {bug.comments.length === 0 && <li className="p-4 text-sm text-white/50">No messages yet.</li>}
          </ul>
          <form onSubmit={submitComment} className="border-t border-line p-4">
            <textarea
              className="input min-h-20"
              placeholder="Reply to the team…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button className="btn-primary" disabled={busy || !comment.trim()}>Send</button>
            </div>
          </form>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="card p-5">
          <div className="mb-2 text-xs uppercase tracking-wider text-white/50">Status</div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={busy}
                className={
                  s === status
                    ? "rounded-full border border-accent/60 bg-accent/20 px-3 py-1 text-xs font-medium text-accent"
                    : "rounded-full border border-line bg-white/5 px-3 py-1 text-xs text-white/70 hover:border-white/30"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-5 text-xs">
          <div className="mb-2 uppercase tracking-wider text-white/50">Metadata</div>
          <div className="text-white/70">Bug set: {bug.bugSet.title}</div>
          <div className="mt-1 break-all text-white/50">ID: {bug.id}</div>
          {bug.userAgent && <div className="mt-2 break-words text-white/40">UA: {bug.userAgent}</div>}
        </div>
      </aside>
    </div>
  );
}
