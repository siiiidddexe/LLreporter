import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

type Ctx = { params: { id: string } };

const addSchema = z.object({ userId: z.string() });

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");
  const m = await prisma.membership.upsert({
    where: { userId_projectId: { userId: parsed.data.userId, projectId: params.id } },
    update: {},
    create: { userId: parsed.data.userId, projectId: params.id },
  });
  return ok({ membership: m }, { status: 201 });
}

const delSchema = z.object({ userId: z.string() });

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;
  const body = await req.json().catch(() => null);
  const parsed = delSchema.safeParse(body);
  if (!parsed.success) return fail("invalid body");
  await prisma.membership.delete({
    where: { userId_projectId: { userId: parsed.data.userId, projectId: params.id } },
  });
  return ok({ ok: true });
}
