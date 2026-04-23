import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkPassword, signToken, cookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("invalid body");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return fail("invalid credentials", 401);
  const match = await checkPassword(parsed.data.password, user.passwordHash);
  if (!match) return fail("invalid credentials", 401);

  const token = signToken(user);
  const res = ok({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions());
  return res;
}
