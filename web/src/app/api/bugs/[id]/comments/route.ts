import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

type Ctx = { params: { id: string } };

const schema = z.object({ body: z.string().min(1).max(20000), kind: z.enum(["human", "claude"]).default("human") });

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);

  const bug = await prisma.bug.findUnique({ where: { id: params.id } });
  if (!bug) return fail("not found", 404);

  if (user.role !== "SUPER_ADMIN") {
    const m = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: bug.projectId } },
    });
    if (!m) return fail("forbidden", 403);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");

  const comment = await prisma.comment.create({
    data: {
      bugId: params.id,
      authorId: user.id,
      kind: parsed.data.kind,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return ok({ comment }, { status: 201 });
}
