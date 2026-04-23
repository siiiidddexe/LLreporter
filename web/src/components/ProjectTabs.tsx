"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "bugsets", label: "🗂 Bug Sets" },
  { key: "kanban",  label: "📋 Kanban" },
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
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/projects/${projectId}?view=${tab.key}`}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            current === tab.key
              ? "border-accent text-accent"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
