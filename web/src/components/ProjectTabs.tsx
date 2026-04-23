"use client";
import Link from "next/link";
import { FolderKanban, LayoutGrid, type LucideIcon } from "lucide-react";

const TABS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "bugsets", label: "Bug Sets", Icon: FolderKanban },
  { key: "kanban",  label: "Kanban",   Icon: LayoutGrid },
];

export function ProjectTabs({
  projectId,
  current,
}: {
  projectId: string;
  current: string;
}) {
  return (
    <div className="flex gap-1 border-b border-line">
      {TABS.map(({ key, label, Icon }) => (
        <Link
          key={key}
          href={`/projects/${projectId}?view=${key}`}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            current === key
              ? "border-accent text-accent"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <Icon size={14} />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}
