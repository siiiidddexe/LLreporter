import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

type Ctx = { params: { id: string } };

async function assertAccess(userId: string, role: string, projectId: string) {
  if (role === "SUPER_ADMIN") return true;
  const m = await prisma.membership.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return !!m;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  if (!(await assertAccess(user.id, user.role, params.id))) return fail("forbidden", 403);

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { user: { select: { id: true, email: true, name: true, role: true } } } },
      bugSets: {
        include: { _count: { select: { bugs: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!project) return fail("not found", 404);

  return ok({
    project: {
      ...project,
      apiKey: user.role === "SUPER_ADMIN" ? project.apiKey : undefined,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");
  const project = await prisma.project.update({ where: { id: params.id }, data: parsed.data });
  return ok({ project });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;
  await prisma.project.delete({ where: { id: params.id } });
  return ok({ ok: true });
}
