import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { fail, ok, canonicalUrl, titleFromUrl } from "@/lib/api";
import { saveDataUrl } from "@/lib/uploads";

/** Create a bug from the Chrome extension or the web. */
const createSchema = z.object({
  projectId: z.string(),
  url: z.string().url(),
  description: z.string().min(1).max(20000),
  // data URL from the extension
  screenshot: z.string().optional(),
  userAgent: z.string().optional(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body", 400, { issues: parsed.error.issues });
  const data = parsed.data;

  // Must be a member of the project (admins: always allowed)
  if (user.role !== "SUPER_ADMIN") {
    const m = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: data.projectId } },
    });
    if (!m) return fail("forbidden", 403);
  }

  const canonical = canonicalUrl(data.url);
  const bugSet = await prisma.bugSet.upsert({
    where: { projectId_url: { projectId: data.projectId, url: canonical } },
    update: {},
    create: {
      projectId: data.projectId,
      url: canonical,
      title: titleFromUrl(canonical),
    },
  });

  let screenshotPath: string | null = null;
  if (data.screenshot) screenshotPath = await saveDataUrl(data.screenshot);

  const bug = await prisma.bug.create({
    data: {
      projectId: data.projectId,
      bugSetId: bugSet.id,
      reporterId: user.id,
      url: canonical,
      title: data.title?.slice(0, 120) || data.description.slice(0, 80),
      description: data.description,
      screenshot: screenshotPath || undefined,
      userAgent: data.userAgent,
    },
  });

  return ok({ bug, bugSet }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return fail("unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status") as any;
  if (!projectId) return fail("projectId required");

  if (user.role !== "SUPER_ADMIN") {
    const m = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (!m) return fail("forbidden", 403);
  }

  const bugs = await prisma.bug.findMany({
    where: { projectId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      bugSet: { select: { id: true, url: true, title: true } },
    },
  });
  return ok({ bugs });
}
