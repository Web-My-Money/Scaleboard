import { NextResponse, type NextRequest } from "next/server";
import { getClientRepo } from "@/lib/repo";
import { CreateClientInputSchema } from "@/lib/schemas";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function GET() {
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;
  const list = await getClientRepo().listClients();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const gate = await requireApiPermission("client.create");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const parsed = CreateClientInputSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 400);
  const created = await getClientRepo().createClient(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
