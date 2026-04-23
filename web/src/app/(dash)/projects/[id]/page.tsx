import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProjectAdminPanel } from "@/components/ProjectAdminPanel";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ProjectTabs } from "@/components/ProjectTabs";

export default async function ProjectPage({ params, searchParams }: {
  params: { id: string };
  searchParams: { view?: string };
}) {
  const user = (await getSessionUser())!;
  const view = searchParams.view ?? "bugsets";

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      bugSets: {
        include: {
          _count: { select: { bugs: true } },
          bugs: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, createdAt: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      bugs: {
        include: {
          reporter: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) notFound();

  if (user.role !== "SUPER_ADMIN") {
    const m = project.memberships.find((x) => x.user.id === user.id);
    if (!m) notFound();
  }

  const isAdmin = user.role === "SUPER_ADMIN";
  const members = project.memberships.map((m) => m.user);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40">Project</div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && <p className="mt-1 text-sm text-white/50">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <span className="badge">{project.bugs.length} bugs</span>
          <span className="badge">{project.bugSets.length} sets</span>
        </div>
      </header>

      {isAdmin && (
        <ProjectAdminPanel
          projectId={project.id}
          apiKey={project.apiKey}
          memberships={members}
        />
      )}

      {/* View tabs */}
      <ProjectTabs projectId={project.id} current={view} />

      {/* Bug Sets view */}
      {view !== "kanban" && (
        <section className="card">
          <div className="flex items-center justify-between border-b border-line p-4">
            <div className="text-sm font-medium">
              Bug sets <span className="text-white/40">(grouped by URL)</span>
            </div>
            <span className="text-xs text-white/40">{project.bugSets.length} sets</span>
          </div>
          <ul className="divide-y divide-line">
            {project.bugSets.map((bs) => (
              <li key={bs.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[.02]">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${project.id}/bugsets/${bs.id}`}
                    className="block truncate text-sm font-medium hover:text-accent transition-colors"
                  >
                    {bs.title}
                  </Link>
                  <div className="mt-0.5 truncate text-xs text-white/40">{bs.url}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="badge">{bs._count.bugs} reports</span>
                  {bs.bugs[0] && (
                    <span className={`badge status-${bs.bugs[0].status}`}>
                      {bs.bugs[0].status}
                    </span>
                  )}
                </div>
              </li>
            ))}
            {project.bugSets.length === 0 && (
              <li className="p-6 text-center text-sm text-white/40">
                No bugs reported yet. Install the Chrome extension to start capturing.
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <KanbanBoard
          bugs={project.bugs as any}
          projectId={project.id}
        />
      )}
    </div>
  );
}
