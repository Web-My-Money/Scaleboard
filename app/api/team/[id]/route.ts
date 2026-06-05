import { NextResponse, type NextRequest } from "next/server";
import { getTeamRepo } from "@/lib/team";
import { MemberSchema } from "@/lib/schemas";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("team.manage");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const patch = MemberSchema.omit({ id: true, createdAt: true }).partial().safeParse(body);
  if (!patch.success) return jsonError(patch.error.message, 400);
  const m = await getTeamRepo().updateMember(id, patch.data);
  return NextResponse.json(m);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireApiPermission("team.manage");
  if ("error" in gate) return gate.error;
  await getTeamRepo().removeMember(id);
  return new NextResponse(null, { status: 204 });
}
