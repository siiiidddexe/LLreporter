import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewProjectButton } from "@/components/NewProjectButton";

export default async function ProjectsPage() {
  const user = (await getSessionUser())!;
  const projects = await prisma.project.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { memberships: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { bugs: true, bugSets: true, memberships: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-white/50">Each project has its own API key and its own team.</p>
        </div>
        {user.role === "SUPER_ADMIN" && <NewProjectButton />}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="card press group block p-5 hover:border-accent/40 hover:shadow-glow"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold group-hover:text-accent">{p.name}</div>
              <span className="badge">{p._count.bugs} bugs</span>
            </div>
            {p.description && <p className="mt-2 line-clamp-2 text-sm text-white/50">{p.description}</p>}
            <div className="mt-4 flex gap-3 text-xs text-white/50">
              <span>{p._count.memberships} members</span>
              <span>·</span>
              <span>{p._count.bugSets} bug sets</span>
            </div>
          </Link>
        ))}
        {projects.length === 0 && <div className="text-sm text-white/50">No projects yet.</div>}
      </div>
    </div>
  );
}
