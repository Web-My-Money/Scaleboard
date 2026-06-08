/**
 * GET    /api/guidelines/:module/:id  → read content
 * DELETE /api/guidelines/:module/:id  → delete
 */
import { NextResponse, type NextRequest } from "next/server";
import { getGuidelinesRepo } from "@/lib/guidelines";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ module: string; id: string }> },
) {
  const { module, id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const text = await getGuidelinesRepo().readAppGuideline(module as never, id);
  if (text === null) return jsonError("Not found", 404);
  return new NextResponse(text, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ module: string; id: string }> },
) {
  const { module, id } = await params;
  const gate = await requireApiPermission("settings.app");
  if ("error" in gate) return gate.error;
  await getGuidelinesRepo().deleteAppGuideline(module as never, id);
  return new NextResponse(null, { status: 204 });
}
