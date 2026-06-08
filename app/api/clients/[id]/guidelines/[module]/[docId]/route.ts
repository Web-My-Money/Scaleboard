import { NextResponse, type NextRequest } from "next/server";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { getClientRepo } from "@/lib/repo";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

async function resolveSlug(id: string): Promise<string> {
  const client = await getClientRepo().getClient(id);
  return client.slug;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; module: string; docId: string }> },
) {
  const { id, module, docId } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const slug = await resolveSlug(id);
  const text = await getGuidelinesRepo().readClientGuideline(slug, module as never, docId);
  if (text === null) return jsonError("Not found", 404);
  return new NextResponse(text, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; module: string; docId: string }> },
) {
  const { id, module, docId } = await params;
  const gate = await requireApiPermission("brief.edit");
  if ("error" in gate) return gate.error;
  const slug = await resolveSlug(id);
  await getGuidelinesRepo().deleteClientGuideline(slug, module as never, docId);
  return new NextResponse(null, { status: 204 });
}
