import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectByApiKey } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { absScreenshot } from "@/lib/url";

export async function GET(req: NextRequest) {
  const project = await getProjectByApiKey(req);
  if (!project) return fail("invalid api key", 401);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;

  const bugs = await prisma.bug.findMany({
    where: { projectId: project.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      bugSet: { select: { id: true, url: true, title: true } },
      reporter: { select: { name: true, email: true } },
    },
  });
  return ok({
    bugs: bugs.map((b: { screenshot: string | null }) => ({
      ...b,
      screenshotUrl: absScreenshot(req, b.screenshot),
    })),
  });
}
