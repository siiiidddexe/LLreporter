import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import type { User } from "@prisma/client";

const SECRET = process.env.NEXTAUTH_SECRET || "dev-only-insecure-secret-change-me";
export const SESSION_COOKIE = "llr_session";
// 100 years — tokens are only invalidated via tokenVersion bump.
const HUNDRED_YEARS = 60 * 60 * 24 * 365 * 100;

export type SessionPayload = { uid: string; v: number; role: string };

export function signToken(user: Pick<User, "id" | "tokenVersion" | "role">) {
  return jwt.sign({ uid: user.id, v: user.tokenVersion, role: user.role } satisfies SessionPayload, SECRET, {
    expiresIn: HUNDRED_YEARS,
  });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function checkPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

/** Resolve the current user from the cookie OR from `Authorization: Bearer <token>` header. */
export async function getSessionUser(req?: NextRequest) {
  let token: string | undefined;
  if (req) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    if (!token) token = req.cookies.get(SESSION_COOKIE)?.value;
  } else {
    token = cookies().get(SESSION_COOKIE)?.value;
  }
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  if (user.tokenVersion !== payload.v) return null; // force-signed-out
  return user;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HUNDRED_YEARS,
  };
}

/** Project API-key auth used by the VS Code/Claude connector. */
export async function getProjectByApiKey(req: NextRequest) {
  const key = req.headers.get("x-api-key") ?? "";
  if (!key.startsWith("llr_")) return null;
  return prisma.project.findUnique({ where: { apiKey: key } });
}

export function requireAdmin(user: User | null) {
  if (!user || user.role !== "SUPER_ADMIN") {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  return null;
}
