import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, hashPassword, requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return ok({ users });
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(6),
  role: z.enum(["SUPER_ADMIN", "MEMBER"]).default("MEMBER"),
  projectIds: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me) return fail("unauthorized", 401);
  const forbid = requireAdmin(me);
  if (forbid) return forbid;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");
  const data = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (exists) return fail("email already in use", 409);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      passwordHash: await hashPassword(data.password),
      memberships: {
        create: data.projectIds.map((projectId) => ({ projectId })),
      },
    },
    select: { id: true, email: true, name: true, role: true },
  });
  return ok({ user }, { status: 201 });
}

const delSchema = z.object({ userId: z.string() });

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me) return fail("unauthorized", 401);
  const forbid = requireAdmin(me);
  if (forbid) return forbid;
  const parsed = delSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");
  if (parsed.data.userId === me.id) return fail("cannot delete yourself", 400);
  await prisma.user.delete({ where: { id: parsed.data.userId } });
  return ok({ ok: true });
}
