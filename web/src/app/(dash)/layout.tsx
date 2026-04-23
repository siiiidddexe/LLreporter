import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const projects = await prisma.project.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { memberships: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-panel/40 p-4">
        <Link href="/dashboard" className="mb-6 block">
          <div className="text-xs uppercase tracking-[.25em] text-accent">logiclaunch</div>
          <div className="text-lg font-semibold"><span className="shimmer-text">LLReporter</span></div>
        </Link>

        <nav className="space-y-1 text-sm">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-white/80 hover:bg-white/5">Dashboard</Link>
          <Link href="/projects" className="block rounded-lg px-3 py-2 text-white/80 hover:bg-white/5">Projects</Link>
          {user.role === "SUPER_ADMIN" && (
            <Link href="/team" className="block rounded-lg px-3 py-2 text-white/80 hover:bg-white/5">Team</Link>
          )}
        </nav>

        <div className="mt-6 text-[11px] uppercase tracking-wider text-white/40">My Projects</div>
        <div className="mt-2 space-y-1">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block truncate rounded-md px-2 py-1.5 text-sm text-white/70 hover:bg-white/5"
            >
              • {p.name}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <div className="truncate text-sm font-medium">{user.name}</div>
          <div className="truncate text-xs text-white/50">{user.email}</div>
          <div className="mt-1 inline-block text-[10px] uppercase tracking-wider text-accent">{user.role}</div>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
