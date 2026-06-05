import { NextResponse, type NextRequest } from "next/server";
import { getClientRepo, ClientNotFoundError } from "@/lib/repo";
import { ClientSchema } from "@/lib/schemas";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  try {
    const client = await getClientRepo().getClient(id);
    return NextResponse.json(client);
  } catch (err) {
    if (err instanceof ClientNotFoundError) return jsonError("Client not found", 404);
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.update");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const patch = ClientSchema.partial().safeParse(body);
  if (!patch.success) return jsonError(patch.error.message, 400);
  try {
    const updated = await getClientRepo().updateClient(id, patch.data);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ClientNotFoundError) return jsonError("Client not found", 404);
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("client.archive");
  if ("error" in gate) return gate.error;
  await getClientRepo().archiveClient(id);
  return new NextResponse(null, { status: 204 });
}
