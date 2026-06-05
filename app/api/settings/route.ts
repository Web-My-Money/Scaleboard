import { NextResponse, type NextRequest } from "next/server";
import { AppSettingsSchema } from "@/lib/schemas";
import { readAppSettings, writeAppSettings } from "@/lib/i18n/app-settings-store";
import { requireApiPermission, jsonError } from "@/lib/api/guards";

export async function GET() {
  const settings = await readAppSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const gate = await requireApiPermission("settings.app");
  if ("error" in gate) return gate.error;
  const body = await req.json().catch(() => null);
  const patch = AppSettingsSchema.partial().omit({ updatedAt: true }).safeParse(body);
  if (!patch.success) return jsonError(patch.error.message, 400);
  const updated = await writeAppSettings(patch.data);
  return NextResponse.json(updated);
}
