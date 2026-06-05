import { NextResponse, type NextRequest } from "next/server";
import { getTeamRepo } from "@/lib/team";
import { InviteInputSchema } from "@/lib/schemas";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function GET() {
  // Allow listing during first-run bootstrap (no members yet → no active user yet).
  const repo = getTeamRepo();
  const existing = await repo.listMembers();
  if (existing.length === 0) return NextResponse.json([]);

  const gate = await requireApiPermission("team.view");
  if ("error" in gate) return gate.error;
  return NextResponse.json(existing);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = InviteInputSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 400);

  const repo = getTeamRepo();
  const existing = await repo.listMembers();

  // First-run bootstrap: when no members exist, the first invite must be allowed
  // (no one is logged in yet). Force role=admin so the bootstrap can't create a viewer.
  if (existing.length === 0) {
    const member = await repo.inviteMember({ ...parsed.data, role: "admin" });
    return NextResponse.json(member, { status: 201 });
  }

  const gate = await requireApiPermission("team.manage");
  if ("error" in gate) return gate.error;
  const member = await repo.inviteMember(parsed.data);
  return NextResponse.json(member, { status: 201 });
}
