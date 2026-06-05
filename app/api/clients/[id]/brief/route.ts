import { NextResponse, type NextRequest } from "next/server";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { BriefDraftSchema, BriefSchema } from "@/lib/schemas";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  try {
    const committed = await getClientRepo().getBrief(id);
    if (committed) return NextResponse.json({ kind: "committed", brief: committed });
    const draft = await getClientRepo().getBriefDraft(id);
    if (draft) return NextResponse.json({ kind: "draft", draft });
    return NextResponse.json({ kind: "none" });
  } catch (err) {
    if (err instanceof ClientNotFoundError) return jsonError("Client not found", 404);
    throw err;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("brief.edit");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const parsed = BriefDraftSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 400);
  await getClientRepo().saveBriefDraft(id, parsed.data);
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("brief.commit");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const parsed = BriefSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 400);
  await getClientRepo().commitBrief(id, parsed.data);
  return new NextResponse(null, { status: 204 });
}
