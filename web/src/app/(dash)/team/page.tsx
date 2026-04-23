import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeamPanel } from "@/components/TeamPanel";

export default async function TeamPage() {
  const me = (await getSessionUser())!;
  if (me.role !== "SUPER_ADMIN") notFound();

  const [users, projects] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { memberships: { include: { project: { select: { id: true, name: true } } } } },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-white/50">Create accounts, assign to projects, or force sign them out.</p>
      </header>
      <TeamPanel
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          projects: u.memberships.map((m) => m.project),
        }))}
        projects={projects}
      />
    </div>
  );
}
