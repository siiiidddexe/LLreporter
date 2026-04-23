import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

type Ctx = { params: { id: string } };

async function canSee(userId: string, role: string, bugId: string) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) return { bug: null, ok: false };
  if (role === "SUPER_ADMIN") return { bug, ok: true };
  const m = await prisma.membership.findUnique({
    where: { userId_projectId: { userId, projectId: bug.projectId } },
  });
  return { bug, ok: !!m };
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const check = await canSee(user.id, user.role, params.id);
  if (!check.bug) return fail("not found", 404);
  if (!check.ok) return fail("forbidden", 403);

  const bug = await prisma.bug.findUnique({
    where: { id: params.id },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      bugSet: true,
    },
  });
  return ok({ bug });
}

const patchSchema = z.object({
  status: z
    .enum(["OPEN", "IN_PROGRESS", "NEEDS_TESTING", "RESOLVED", "UNRESOLVED", "CLOSED"])
    .optional(),
  assigneeId: z.string().nullable().optional(),
  title: z.string().max(120).optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const check = await canSee(user.id, user.role, params.id);
  if (!check.bug) return fail("not found", 404);
  if (!check.ok) return fail("forbidden", 403);

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");
  const bug = await prisma.bug.update({ where: { id: params.id }, data: parsed.data });
  return ok({ bug });
}
