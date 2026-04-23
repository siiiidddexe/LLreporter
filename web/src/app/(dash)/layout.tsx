import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/SignOutButton";
import { MobileNav } from "@/components/MobileNav";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const projects = await prisma.project.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { memberships: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const sidebar = (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-line bg-panel/95 p-4 backdrop-blur-md">
      <Link href="/dashboard" className="mb-6 block">
        <div className="text-xs uppercase tracking-[.25em] text-accent">logiclaunch</div>
        <div className="text-lg font-semibold"><span className="shimmer-text">LLReporter</span></div>
      </Link>

      <nav className="space-y-0.5 text-sm">
        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 transition-colors">
          <span>📊</span> Dashboard
        </Link>
        <Link href="/projects" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 transition-colors">
          <span>🗂</span> Projects
        </Link>
        {user.role === "SUPER_ADMIN" && (
          <Link href="/team" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 transition-colors">
            <span>👥</span> Team
          </Link>
        )}
        <Link href="/downloads" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 transition-colors">
          <span>📥</span> Downloads
        </Link>
      </nav>

      <div className="mt-6 text-[10px] uppercase tracking-wider text-white/30">My Projects</div>
      <div className="mt-2 flex-1 overflow-y-auto space-y-0.5">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
          >
            <span className="text-accent/60">·</span>
            <span className="truncate">{p.name}</span>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="px-2 py-1 text-xs text-white/30">No projects yet</p>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-line">
        <div className="truncate text-sm font-medium">{user.name}</div>
        <div className="truncate text-xs text-white/40">{user.email}</div>
        <div className="mt-1 inline-block text-[10px] uppercase tracking-wider text-accent">{user.role}</div>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Desktop: sticky sidebar */}
      <div className="sticky top-0 hidden h-screen md:flex">
        {sidebar}
      </div>

      {/* Mobile: drawer */}
      <MobileNav>
        {sidebar}
      </MobileNav>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-4 pt-16 md:p-8 md:pt-8">{children}</main>
    </div>
  );
}
