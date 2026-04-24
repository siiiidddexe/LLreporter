import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { uploadDir } from "@/lib/uploads";

// Supported image MIME types.
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  // Guard against path traversal attacks.
  const filename = params.slug.join("/");
  if (filename.includes("..") || filename.includes("\0")) {
    return new NextResponse("not found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME[ext];
  if (!mime) return new NextResponse("not found", { status: 404 });

  const filePath = path.join(uploadDir(), filename);
  try {
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
