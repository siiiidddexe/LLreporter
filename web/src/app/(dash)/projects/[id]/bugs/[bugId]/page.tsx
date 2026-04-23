import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BugDetailClient } from "@/components/BugDetailClient";

export default async function BugPage({ params }: { params: { id: string; bugId: string } }) {
  const user = (await getSessionUser())!;
  const bug = await prisma.bug.findUnique({
    where: { id: params.bugId },
    include: {
      project: true,
      bugSet: true,
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });
  if (!bug || bug.projectId !== params.id) notFound();

  if (user.role !== "SUPER_ADMIN") {
    const m = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: bug.projectId } },
    });
    if (!m) notFound();
  }

  return (
    <div className="space-y-6">
      <div className="text-xs">
        <Link href={`/projects/${bug.project.id}`} className="text-white/50 hover:text-accent">← {bug.project.name}</Link>
      </div>
      <BugDetailClient bug={bug as any} />
    </div>
  );
}
