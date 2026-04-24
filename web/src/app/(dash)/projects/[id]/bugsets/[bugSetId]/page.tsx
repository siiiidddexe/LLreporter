import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReportBugButton } from "@/components/ReportBugButton";
import { ChevronLeft, ExternalLink, Camera } from "lucide-react";

export default async function BugSetPage({ params }: { params: { id: string; bugSetId: string } }) {
  const user = (await getSessionUser())!;
  const bugSet = await prisma.bugSet.findUnique({
    where: { id: params.bugSetId },
    include: {
      project: true,
      bugs: {
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { name: true, email: true } },
          assignee: { select: { name: true, email: true } },
          comments: {
            select: { id: true, body: true, kind: true, createdAt: true, author: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!bugSet || bugSet.projectId !== params.id) notFound();

  if (user.role !== "SUPER_ADMIN") {
    const m = await prisma.membership.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: bugSet.projectId } },
    });
    if (!m) notFound();
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    IN_PROGRESS: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    NEEDS_TESTING: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    RESOLVED: "bg-green-500/15 text-green-300 border-green-500/30",
    UNRESOLVED: "bg-red-500/15 text-red-300 border-red-500/30",
    CLOSED: "bg-white/10 text-white/40 border-white/15",
  };

  return (
    <div className="space-y-6">
      <div className="text-xs">
        <Link href={`/projects/${bugSet.project.id}`} className="inline-flex items-center gap-1 text-white/50 hover:text-accent transition-colors">
          <ChevronLeft size={14} />
          <span>{bugSet.project.name}</span>
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[.25em] text-accent">bug set</div>
          <h1 className="mt-1 text-2xl font-semibold">{bugSet.title}</h1>
          <a
            href={bugSet.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-accent hover:underline break-all"
          >
            <span className="truncate">{bugSet.url}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="badge">{bugSet.bugs.length} reports</span>
          <ReportBugButton
            projects={[{ id: bugSet.project.id, name: bugSet.project.name }]}
            defaultProjectId={bugSet.project.id}
            pageUrl={bugSet.url}
          />
        </div>
      </header>

      {/* Inline expanded list — every bug shows its screenshot + description directly. */}
      <section className="space-y-4">
        {bugSet.bugs.length === 0 && (
          <div className="card p-8 text-center text-sm text-white/40">
            No reports yet. Click <strong>Report bug</strong> above or use the Chrome extension.
          </div>
        )}
        {bugSet.bugs.map((b: {
          id: string;
          title: string;
          description: string;
          status: string;
          screenshot: string | null;
          createdAt: Date;
          reporter: { name: string; email: string };
          assignee: { name: string; email: string } | null;
          comments: { id: string; body: string; kind: string; createdAt: Date; author: { name: string } }[];
        }) => (
          <article key={b.id} className="card overflow-hidden">
            {/* Header row */}
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4">
              <div className="min-w-0">
                <Link
                  href={`/projects/${bugSet.project.id}/bugs/${b.id}`}
                  className="block text-sm font-medium hover:text-accent transition-colors"
                >
                  {b.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">
                  <span>by <span className="text-white/70">{b.reporter.name}</span></span>
                  <span>{new Date(b.createdAt).toLocaleString()}</span>
                  {b.assignee && <span>assignee: <span className="text-white/70">{b.assignee.name}</span></span>}
                  {b.comments.length > 0 && <span>{b.comments.length} comment{b.comments.length === 1 ? "" : "s"}</span>}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[b.status] || "bg-white/10 text-white/60 border-white/15"}`}>
                {b.status.replace("_", " ")}
              </span>
            </header>

            {/* Screenshot + description side-by-side on wide screens, stacked on mobile */}
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* Screenshot column */}
              <div className="border-b border-line bg-black/40 md:border-b-0 md:border-r">
                {b.screenshot ? (
                  <a
                    href={b.screenshot}
                    target="_blank"
                    rel="noreferrer"
                    className="block group"
                    title="Open full-size screenshot"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.screenshot}
                      alt={`Screenshot for ${b.title}`}
                      className="block max-h-[420px] w-full object-contain transition-opacity group-hover:opacity-90"
                    />
                  </a>
                ) : (
                  <div className="flex h-full min-h-[120px] items-center justify-center p-6 text-xs text-white/35">
                    <Camera size={14} className="mr-1.5" />
                    No screenshot
                  </div>
                )}
              </div>

              {/* Description column */}
              <div className="p-4 text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                {b.description}
                {b.comments.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-line pt-3">
                    {b.comments.slice(0, 3).map((c) => (
                      <div key={c.id} className="rounded-md border border-line/60 bg-white/[.02] p-2 text-xs">
                        <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">
                          {c.kind === "claude" ? "Claude" : c.author.name}
                        </div>
                        <div className="text-white/70 whitespace-pre-wrap">{c.body}</div>
                      </div>
                    ))}
                    {b.comments.length > 3 && (
                      <Link
                        href={`/projects/${bugSet.project.id}/bugs/${b.id}`}
                        className="block text-xs text-accent hover:underline"
                      >
                        +{b.comments.length - 3} more comments →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
