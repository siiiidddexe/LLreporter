import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getProjectByApiKey } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { absScreenshot } from "@/lib/url";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const project = await getProjectByApiKey(req);
  if (!project) return fail("invalid api key", 401);

  const bug = await prisma.bug.findFirst({
    where: { id: params.id, projectId: project.id },
    include: {
      bugSet: true,
      reporter: { select: { name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });
  if (!bug) return fail("not found", 404);

  return ok({
    bug: { ...bug, screenshotUrl: absScreenshot(req, bug.screenshot) },
  });
}

const patchSchema = z.object({
  status: z
    .enum(["OPEN", "IN_PROGRESS", "NEEDS_TESTING", "RESOLVED", "UNRESOLVED", "CLOSED"])
    .optional(),
  note: z.string().max(20000).optional(),
});

/**
 * Called by Claude after making a patch.
 * Status update is MANDATORY when marking for testing/resolved — enforced in the connector too.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const project = await getProjectByApiKey(req);
  if (!project) return fail("invalid api key", 401);

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid body");
  const { status, note } = parsed.data;

  const bug = await prisma.bug.findFirst({
    where: { id: params.id, projectId: project.id },
  });
  if (!bug) return fail("not found", 404);

  // Find a "bot" user to attribute claude comments to — fall back to the reporter.
  const authorId = bug.reporterId;

  const updated = await prisma.bug.update({
    where: { id: bug.id },
    data: {
      ...(status ? { status } : {}),
    },
  });

  if (note) {
    await prisma.comment.create({
      data: { bugId: bug.id, authorId, kind: "claude", body: note },
    });
  }

  return ok({ bug: updated });
}
