import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectAdminPanel } from "@/components/ProjectAdminPanel";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = (await getSessionUser())!;
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      bugSets: {
        include: {
          _count: { select: { bugs: true } },
          bugs: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, createdAt: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  if (user.role !== "SUPER_ADMIN") {
    const m = project.memberships.find((x) => x.user.id === user.id);
    if (!m) notFound();
  }

  const isAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-white/50">Project</div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        {project.description && <p className="mt-1 text-sm text-white/50">{project.description}</p>}
      </header>

      {isAdmin && <ProjectAdminPanel projectId={project.id} apiKey={project.apiKey} memberships={project.memberships.map((m) => m.user)} />}

      <section className="card">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="text-sm font-medium">Bug sets <span className="text-white/40">(grouped by URL)</span></div>
          <span className="text-xs text-white/50">{project.bugSets.length} sets</span>
        </div>
        <ul className="divide-y divide-line">
          {project.bugSets.map((bs) => (
            <li key={bs.id} className="flex items-center justify-between p-4 hover:bg-white/[.02]">
              <div className="min-w-0">
                <Link
                  href={`/projects/${project.id}/bugsets/${bs.id}`}
                  className="block truncate text-sm font-medium hover:text-accent"
                >
                  {bs.title}
                </Link>
                <div className="mt-0.5 truncate text-xs text-white/50">{bs.url}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge">{bs._count.bugs} reports</span>
                {bs.bugs[0] && <span className="badge">{bs.bugs[0].status}</span>}
              </div>
            </li>
          ))}
          {project.bugSets.length === 0 && <li className="p-4 text-sm text-white/50">No bugs reported yet.</li>}
        </ul>
      </section>
    </div>
  );
}
