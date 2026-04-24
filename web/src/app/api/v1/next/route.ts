import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectByApiKey } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { absScreenshot } from "@/lib/url";

/** Returns the next bug to work on for this project. Priority: UNRESOLVED → OPEN → IN_PROGRESS. */
export async function GET(req: NextRequest) {
  const project = await getProjectByApiKey(req);
  if (!project) return fail("invalid api key", 401);

  for (const status of ["UNRESOLVED", "OPEN", "IN_PROGRESS"] as const) {
    const bug = await prisma.bug.findFirst({
      where: { projectId: project.id, status },
      orderBy: { createdAt: "asc" },
      include: {
        bugSet: true,
        reporter: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { name: true, email: true } } },
        },
      },
    });
    if (bug) {
      return ok({
        bug: { ...bug, screenshotUrl: absScreenshot(req, bug.screenshot) },
        project: { id: project.id, name: project.name },
      });
    }
  }
  return ok({ bug: null, project: { id: project.id, name: project.name } });
}
