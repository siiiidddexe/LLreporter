import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getProjectByApiKey } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

type Ctx = { params: { id: string } };

const schema = z.object({ body: z.string().min(1).max(20000) });

export async function POST(req: NextRequest, { params }: Ctx) {
  const project = await getProjectByApiKey(req);
  if (!project) return fail("invalid api key", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");

  const bug = await prisma.bug.findFirst({ where: { id: params.id, projectId: project.id } });
  if (!bug) return fail("not found", 404);

  const comment = await prisma.comment.create({
    data: { bugId: bug.id, authorId: bug.reporterId, kind: "claude", body: parsed.data.body },
  });
  return ok({ comment }, { status: 201 });
}
