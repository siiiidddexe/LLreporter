import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { project: true },
  });
  return ok({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    projects: memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      slug: m.project.slug,
    })),
  });
}
