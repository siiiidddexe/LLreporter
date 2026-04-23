import { NextResponse } from "next/server";

export const ok = <T>(data: T, init: ResponseInit = {}) => NextResponse.json(data, init);

export const fail = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: message, ...extra }, { status });

/** Canonicalize a URL so different query strings/hashes still collapse into the same BugSet. */
export function canonicalUrl(raw: string) {
  try {
    const u = new URL(raw);
    u.hash = "";
    // Strip tracking params
    const drop = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"];
    drop.forEach((k) => u.searchParams.delete(k));
    return `${u.origin}${u.pathname}${u.search ? `?${u.searchParams.toString()}` : ""}`;
  } catch {
    return raw;
  }
}

/** Short title derived from the URL — "example.com /checkout" */
export function titleFromUrl(raw: string) {
  try {
    const u = new URL(raw);
    return `${u.hostname}${u.pathname === "/" ? "" : ` ${u.pathname}`}`;
  } catch {
    return raw.slice(0, 80);
  }
}

export function newApiKey() {
  // 32 url-safe bytes
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const b64 = Buffer.from(bytes).toString("base64url");
  return `llr_live_${b64}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || `p-${Date.now().toString(36)}`;
}
