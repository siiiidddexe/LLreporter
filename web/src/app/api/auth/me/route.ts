import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);

  // Super admins see every project; members see only the projects they belong to.
  const projects =
    user.role === "SUPER_ADMIN"
      ? await prisma.project.findMany({
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, slug: true },
        })
      : (
          await prisma.membership.findMany({
            where: { userId: user.id },
            include: { project: { select: { id: true, name: true, slug: true } } },
            orderBy: { project: { updatedAt: "desc" } },
          })
        ).map((m: { project: { id: string; name: string; slug: string } }) => m.project);

  return ok({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    projects,
  });
}
