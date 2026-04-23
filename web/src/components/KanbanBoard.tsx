"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const COLUMNS = [
  { key: "OPEN",           label: "Open",           color: "text-blue-300" },
  { key: "IN_PROGRESS",    label: "In Progress",    color: "text-yellow-300" },
  { key: "NEEDS_TESTING",  label: "Needs Testing",  color: "text-purple-300" },
  { key: "RESOLVED",       label: "Resolved",       color: "text-green-300" },
  { key: "UNRESOLVED",     label: "Unresolved",     color: "text-red-300" },
  { key: "CLOSED",         label: "Closed",         color: "text-white/30" },
] as const;

type Bug = {
  id: string;
  title: string;
  url: string;
  status: string;
  createdAt: string;
  reporter: { name: string };
  assignee?: { name: string } | null;
};

export function KanbanBoard({
  bugs,
  projectId,
}: {
  bugs: Bug[];
  projectId: string;
}) {
  const [localBugs, setLocalBugs] = useState<Bug[]>(bugs);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function bugsFor(status: string) {
    return localBugs.filter((b) => b.status === status);
  }

  async function moveToStatus(bugId: string, newStatus: string) {
    setLocalBugs((prev) =>
      prev.map((b) => (b.id === bugId ? { ...b, status: newStatus } : b))
    );
    await fetch(`/api/bugs/${bugId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  function onDragStart(e: React.DragEvent, bugId: string) {
    setDragging(bugId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    setOver(colKey);
  }

  function onDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    if (dragging) moveToStatus(dragging, colKey);
    setDragging(null);
    setOver(null);
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const colBugs = bugsFor(col.key);
          const isOver = over === col.key;
          return (
            <div
              key={col.key}
              className={`kanban-col transition-colors duration-150 ${
                isOver ? "border-accent/60 bg-accent/5" : ""
              }`}
              style={{ minWidth: 260, maxWidth: 300, flex: "0 0 auto" }}
              onDragOver={(e) => onDragOver(e, col.key)}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => onDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1 pb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                  {colBugs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colBugs.map((bug) => (
                  <motion.div
                    key={bug.id}
                    layout
                    draggable
                    onDragStart={(e) => onDragStart(e as any, bug.id)}
                    onDragEnd={() => { setDragging(null); setOver(null); }}
                    className={`kanban-card group ${dragging === bug.id ? "opacity-40" : ""}`}
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      href={`/projects/${projectId}/bugs/${bug.id}`}
                      className="block"
                      onClick={(e) => dragging && e.preventDefault()}
                    >
                      <div className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                        {bug.title}
                      </div>
                      <div className="mt-1.5 truncate text-[11px] text-white/40">{bug.url}</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                        <span>{bug.reporter.name}</span>
                        {bug.assignee && (
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5">
                            → {bug.assignee.name}
                          </span>
                        )}
                      </div>
                    </Link>
                    {/* Quick-move dropdown */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((c) => c.key !== bug.status).slice(0, 3).map((c) => (
                        <button
                          key={c.key}
                          onClick={() => moveToStatus(bug.id, c.key)}
                          className="rounded-full border border-line px-2 py-0.5 text-[10px] text-white/40 hover:border-white/30 hover:text-white/70 transition-colors"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {colBugs.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line/60 py-6 text-center text-xs text-white/20">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
