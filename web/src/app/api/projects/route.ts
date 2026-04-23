import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { fail, ok, newApiKey, slugify } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);

  const where =
    user.role === "SUPER_ADMIN"
      ? {}
      : { memberships: { some: { userId: user.id } } };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bugs: true, memberships: true, bugSets: true } } },
  });

  return ok({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      createdAt: p.createdAt,
      counts: p._count,
      // Only admins see the raw API key in the list
      apiKey: user.role === "SUPER_ADMIN" ? p.apiKey : undefined,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const forbid = requireAdmin(user);
  if (forbid) return forbid;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");

  let slug = slugify(parsed.data.name);
  // ensure unique
  let n = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${slugify(parsed.data.name)}-${++n}`;
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      slug,
      apiKey: newApiKey(),
      memberships: { create: { userId: user.id } },
    },
  });

  return ok({ project }, { status: 201 });
}
