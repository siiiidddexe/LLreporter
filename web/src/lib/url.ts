import { NextRequest } from "next/server";

/**
 * Resolve the public origin from the request, honoring proxy headers
 * (Dokploy / Traefik set x-forwarded-* in front of Next.js).
 */
export function originFrom(req: NextRequest) {
  const xfHost = req.headers.get("x-forwarded-host");
  const xfProto = req.headers.get("x-forwarded-proto") || "https";
  if (xfHost) return `${xfProto}://${xfHost}`;
  try {
    return new URL(req.url).origin;
  } catch {
    return process.env.PUBLIC_URL || "https://webaudit.logiclaunch.in";
  }
}

/** Convert a stored screenshot path ("/uploads/foo.png") into an absolute URL. */
export function absScreenshot(req: NextRequest, screenshot: string | null | undefined) {
  if (!screenshot) return null;
  if (screenshot.startsWith("http")) return screenshot;
  return `${originFrom(req)}${screenshot}`;
}
