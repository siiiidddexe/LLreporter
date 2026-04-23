import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BugSetPage({ params }: { params: { id: string; bugSetId: string } }) {
  const user = (await getSessionUser())!;
  const bugSet = await prisma.bugSet.findUnique({
    where: { id: params.bugSetId },
    include: {
      project: true,
      bugs: {
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { name: true } },
          assignee: { select: { name: true } },
        },
      },
    },
  });
  if (!bugSet || bugSet.projectId !== params.id) notFound();

  if (user.role !== "SUPER_ADMIN") {
    const m = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: bugSet.projectId } },
    });
    if (!m) notFound();
  }

  return (
    <div className="space-y-6">
      <div className="text-xs">
        <Link href={`/projects/${bugSet.project.id}`} className="text-white/50 hover:text-accent">
          ← {bugSet.project.name}
        </Link>
      </div>
      <header>
        <h1 className="text-2xl font-semibold">{bugSet.title}</h1>
        <a href={bugSet.url} target="_blank" className="text-sm text-accent hover:underline">{bugSet.url}</a>
      </header>
      <section className="card">
        <ul className="divide-y divide-line">
          {bugSet.bugs.map((b) => (
            <li key={b.id} className="flex items-center justify-between p-4 hover:bg-white/[.02]">
              <div className="min-w-0">
                <Link
                  href={`/projects/${bugSet.project.id}/bugs/${b.id}`}
                  className="block truncate text-sm font-medium hover:text-accent"
                >
                  {b.title}
                </Link>
                <div className="mt-0.5 truncate text-xs text-white/50">
                  by {b.reporter.name} · {new Date(b.createdAt).toLocaleString()}
                  {b.assignee && <> · assigned {b.assignee.name}</>}
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
