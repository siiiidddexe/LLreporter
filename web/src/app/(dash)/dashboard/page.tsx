import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardHome() {
  const user = (await getSessionUser())!;
  const where = user.role === "SUPER_ADMIN" ? {} : { project: { memberships: { some: { userId: user.id } } } };

  const [openCount, progressCount, testingCount, resolvedCount, recent] = await Promise.all([
    prisma.bug.count({ where: { ...where, status: "OPEN" } }),
    prisma.bug.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.bug.count({ where: { ...where, status: "NEEDS_TESTING" } }),
    prisma.bug.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.bug.findMany({
      where,
      include: { project: true, reporter: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const Stat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
    <div className={`card p-5 ${accent ? "shadow-glow" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-white/50">Here's what's happening across your projects.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Open" value={openCount} accent />
        <Stat label="In progress" value={progressCount} />
        <Stat label="Needs testing" value={testingCount} />
        <Stat label="Resolved" value={resolvedCount} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="text-sm font-medium">Recent reports</div>
          <Link href="/projects" className="text-xs text-accent hover:underline">All projects →</Link>
        </div>
        <ul className="divide-y divide-line">
          {recent.length === 0 && <li className="p-4 text-sm text-white/50">No bugs reported yet.</li>}
          {recent.map((b) => (
            <li key={b.id} className="flex items-center justify-between p-4 hover:bg-white/[.02]">
              <div className="min-w-0">
                <Link href={`/projects/${b.project.id}/bugs/${b.id}`} className="block truncate text-sm font-medium hover:text-accent">
                  {b.title}
                </Link>
                <div className="mt-0.5 truncate text-xs text-white/50">
                  {b.project.name} · {b.reporter.name} · {new Date(b.createdAt).toLocaleString()}
                </div>
              </div>
              <span className="badge">{b.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
