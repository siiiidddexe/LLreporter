import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { fail, ok, newApiKey } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;
  const project = await prisma.project.update({
    where: { id: params.id },
    data: { apiKey: newApiKey() },
  });
  return ok({ apiKey: project.apiKey });
}
