/**
 * App-level guidelines for a module (or "general").
 * GET  /api/guidelines/:module        → list
 * POST /api/guidelines/:module        → upload (multipart or JSON text)
 */
import { NextResponse, type NextRequest } from "next/server";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { extractFromBuffer } from "@/lib/extract/extract-text";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const { module } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const docs = await getGuidelinesRepo().listAppGuidelines(module as never);
  return NextResponse.json(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const { module } = await params;
  const gate = await requireApiPermission("settings.app");
  if ("error" in gate) return gate.error;

  const contentType = req.headers.get("content-type") ?? "";

  // Multipart upload (PDF, DOCX, etc.)
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return jsonError("Missing 'file' field", 400);
    if (file.size > MAX_BYTES) return jsonError("File too large (max 15 MB)", 413);
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractFromBuffer(file.name, file.type, buffer).catch((e: Error) =>
      jsonError(e.message, 415),
    );
    if (extracted instanceof Response) return extracted;
    const doc = await getGuidelinesRepo().saveAppGuideline(
      module as never,
      file.name,
      extracted.text,
    );
    return NextResponse.json(doc, { status: 201 });
  }

  // JSON upload (already-markdown text, e.g. pasted)
  const body = await req.json().catch(() => null);
  if (!body?.filename || !body?.content) return jsonError("Missing filename or content", 400);
  const doc = await getGuidelinesRepo().saveAppGuideline(module as never, body.filename, body.content);
  return NextResponse.json(doc, { status: 201 });
}
