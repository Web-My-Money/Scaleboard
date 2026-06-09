import { NextResponse, type NextRequest } from "next/server";
import { getClientRepo } from "@/lib/repo";
import { requireApiPermission, jsonError } from "@/lib/api/guards";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;
  const gate = await requireApiPermission("client.view");
  if ("error" in gate) return gate.error;

  const safeFilename = filename.endsWith(".json") ? filename : `${filename}.json`;
  const data = await getClientRepo()
    .readArtifact(id, ["creative-requests", safeFilename], z.any())
    .catch(() => null);

  if (data === null) return jsonError("Creative request not found", 404);
  return NextResponse.json(data);
}
