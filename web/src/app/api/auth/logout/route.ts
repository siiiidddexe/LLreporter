import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/api";

/** Sign out current device. For "force sign out everywhere" hit /api/auth/force-signout. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (user) {
    // We don't bump tokenVersion here — that would kill all devices. Just drop the cookie.
  }
  const res = ok({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
