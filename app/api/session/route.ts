import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionProvider, getTeamRepo } from "@/lib/team";
import { jsonError } from "@/lib/api/guards";

export async function GET() {
  const user = await getSessionProvider().getCurrentUser();
  return NextResponse.json({ user });
}

const SwitchSchema = z.object({ userId: z.string().uuid().nullable() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SwitchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 400);
  await getTeamRepo().setActiveUserId(parsed.data.userId);
  const user = await getSessionProvider().getCurrentUser();
  return NextResponse.json({ user });
}
