import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, requireAdmin, SESSION_COOKIE } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

const schema = z.object({ userId: z.string().optional() });

/**
 * Force-signout:
 *  - a user can force-signout themselves everywhere (no body)
 *  - a super-admin can force-signout anyone (body: {userId})
 * Implementation: bump tokenVersion → every outstanding JWT becomes invalid.
 */
export async function POST(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!me) return fail("unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const targetId = parsed.success && parsed.data.userId ? parsed.data.userId : me.id;

  if (targetId !== me.id) {
    const forbid = requireAdmin(me);
    if (forbid) return forbid;
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { tokenVersion: { increment: 1 } },
  });

  const res = ok({ ok: true, userId: targetId });
  if (targetId === me.id) res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
