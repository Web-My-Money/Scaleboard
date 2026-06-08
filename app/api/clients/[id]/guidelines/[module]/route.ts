/**
 * Client-level guidelines for a module.
 * GET  /api/clients/:id/guidelines/:module
 * POST /api/clients/:id/guidelines/:module
 */
import { NextResponse, type NextRequest } from "next/server";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { getClientRepo } from "@/lib/repo";
import { extractFromBuffer } from "@/lib/extract/extract-text";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 15 * 1024 * 1024;

async function resolveSlug(id: string): Promise<string> {
  const client = await getClientRepo().getClient(id);
  return client.slug;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; module: string }> },
) {
  const { id, module } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const slug = await resolveSlug(id);
  const docs = await getGuidelinesRepo().listClientGuidelines(slug, module as never);
  return NextResponse.json(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; module: string }> },
) {
  const { id, module } = await params;
  const gate = await requireApiPermission("brief.edit");
  if ("error" in gate) return gate.error;
  const slug = await resolveSlug(id);
  const contentType = req.headers.get("content-type") ?? "";

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
    const doc = await getGuidelinesRepo().saveClientGuideline(slug, module as never, file.name, extracted.text);
    return NextResponse.json(doc, { status: 201 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.filename || !body?.content) return jsonError("Missing filename or content", 400);
  const doc = await getGuidelinesRepo().saveClientGuideline(slug, module as never, body.filename, body.content);
  return NextResponse.json(doc, { status: 201 });
}
