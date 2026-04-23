import { ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  return ok({ status: "ok", service: "llreporter-web", time: new Date().toISOString() });
}
